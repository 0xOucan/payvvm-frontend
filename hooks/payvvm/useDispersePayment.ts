/**
 * Custom hook for EVVM dispersePay (Payroll Distribution)
 * Implements EIP-191 signature-based gasless batch payments
 */

import { useAccount, useSignMessage, useReadContract } from 'wagmi';
import { parseUnits, zeroAddress, sha256, toBytes, encodeAbiParameters } from 'viem';
import { useState } from 'react';
import { useUserAccount, useEvvmId } from './useEvvmState';

export const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e' as const;
export const PYUSD_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9' as const;

// EVVM ABI for dispersePay
const EVVM_ABI = [
  {
    name: 'dispersePay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'toData', type: 'tuple[]', components: [
        { name: 'amount', type: 'uint256' },
        { name: 'to_address', type: 'address' },
        { name: 'to_identity', type: 'string' },
      ]},
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'priorityFee', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'priorityFlag', type: 'bool' },
      { name: 'executor', type: 'address' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

export interface DisperseRecipient {
  address: string;
  amount: string;
  name: string;
}

export interface DispersePayMetadata {
  amount: string;
  to_address: string;
  to_identity: string;
}

/**
 * Construct dispersePay signature message according to EVVM spec
 * Format: "{evvmID},dispersePay,{hashList},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}"
 */
export function constructDispersePayMessage(
  evvmId: bigint,
  recipients: DispersePayMetadata[],
  token: string,
  totalAmount: string,
  priorityFee: string,
  nonce: string,
  priorityFlag: boolean,
  executor: string
): string {
  // Calculate hash of recipient data using ABI encoding (same as Solidity's sha256(abi.encode(toData)))
  // Each recipient is a tuple of (uint256 amount, address to_address, string to_identity)
  // IMPORTANT: Must lowercase addresses to match contract's AdvancedStrings.addressToString() output
  const recipientTuples = recipients.map(r => ({
    amount: BigInt(r.amount),
    to_address: r.to_address.toLowerCase() as `0x${string}`,
    to_identity: r.to_identity || '',
  }));

  // Encode the array of tuples using ABI encoding
  const encodedRecipients = encodeAbiParameters(
    [
      {
        type: 'tuple[]',
        components: [
          { name: 'amount', type: 'uint256' },
          { name: 'to_address', type: 'address' },
          { name: 'to_identity', type: 'string' },
        ],
      },
    ],
    [recipientTuples]
  );

  // Hash the ABI-encoded data using SHA256 (as per EVVM spec)
  const hashList = sha256(encodedRecipients);

  // Convert addresses to lowercase with 0x prefix
  const formattedToken = token.toLowerCase();
  const formattedExecutor = executor.toLowerCase();
  const formattedPriorityFlag = priorityFlag ? 'true' : 'false';

  const message = `${evvmId},dispersePay,${hashList},${formattedToken},${totalAmount},${priorityFee},${nonce},${formattedPriorityFlag},${formattedExecutor}`;

  console.log('=== dispersePay Signature Construction ===');
  console.log('Recipients input:', JSON.stringify(recipients, null, 2));
  console.log('Recipients tuples:', JSON.stringify(recipientTuples.map(r => ({
    amount: r.amount.toString(),
    to_address: r.to_address,
    to_identity: r.to_identity
  })), null, 2));
  console.log('Encoded recipients (hex):', encodedRecipients);
  console.log('Recipients hash (SHA256):', hashList);
  console.log('Full message:', message);
  console.log('==========================================');
  return message;
}

/**
 * Hook to send batch PYUSD payments using dispersePay
 */
export function useDispersePayment() {
  const { address } = useAccount();
  const [disperseData, setDisperseData] = useState<{
    recipients: DisperseRecipient[];
    totalAmount: string;
    priorityFee: string;
  } | null>(null);

  // Fetch EVVM ID
  const { data: evvmId, isLoading: isLoadingEvvmId } = useEvvmId();

  // Fetch user account data (includes nonce)
  const { data: userData, isLoading: isLoadingUserData } = useUserAccount(address);

  // Step 1: Sign the message
  const {
    signMessage,
    data: signature,
    isPending: isSigning,
    error: signError,
    reset: resetSign,
  } = useSignMessage();

  // Extract nonce from user data (index 3 = getNextCurrentSyncNonce)
  const userNonce = userData?.[3]?.result as bigint | undefined;

  /**
   * Initiate dispersePay: construct signature and sign
   */
  const initiateDisperse = async (
    recipients: DisperseRecipient[],
    priorityFee: string = '0'
  ) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (typeof userNonce !== 'bigint') {
      throw new Error('User nonce not loaded. Please wait a moment and try again.');
    }

    if (!evvmId) {
      throw new Error('EVVM ID not loaded. Please wait a moment and try again.');
    }

    if (recipients.length === 0) {
      throw new Error('No recipients provided');
    }

    // Validate recipients
    for (const recipient of recipients) {
      if (!recipient.address || !recipient.amount) {
        throw new Error('All recipients must have an address and amount');
      }
      if (parseFloat(recipient.amount) <= 0) {
        throw new Error('All amounts must be greater than 0');
      }
    }

    try {
      // Convert recipients to DispersePayMetadata format
      const recipientsMetadata: DispersePayMetadata[] = recipients.map(r => ({
        amount: parseUnits(r.amount, 6).toString(), // PYUSD has 6 decimals
        to_address: r.address,
        to_identity: r.name || '', // Use name as identity, empty string if not provided
      }));

      // Calculate total amount
      const totalAmount = recipientsMetadata.reduce(
        (sum, r) => sum + BigInt(r.amount),
        0n
      ).toString();

      // Store disperse data for later execution
      setDisperseData({
        recipients,
        totalAmount: (Number(totalAmount) / 1e6).toString(),
        priorityFee,
      });

      const priorityFeeWei = parseUnits(priorityFee || '0', 6).toString();
      const nonceStr = userNonce.toString();

      // Construct message with REAL EVVM ID from contract
      const message = constructDispersePayMessage(
        evvmId,
        recipientsMetadata,
        PYUSD_ADDRESS,
        totalAmount,
        priorityFeeWei,
        nonceStr,
        false, // priorityFlag (false = synchronous)
        zeroAddress // executor (0x0 = anyone can execute)
      );

      // Sign message (EIP-191)
      signMessage({ message });
    } catch (err) {
      console.error('dispersePay initiation error:', err);
      throw err;
    }
  };

  /**
   * Submit signed dispersePay to fishing pool (for fishers to execute)
   */
  const submitToFishers = async () => {
    if (!signature || !disperseData || !address || typeof userNonce !== 'bigint') {
      console.error('Missing signature or disperse data');
      return;
    }

    try {
      // Convert recipients to metadata format
      const recipientsMetadata: DispersePayMetadata[] = disperseData.recipients.map(r => ({
        amount: parseUnits(r.amount, 6).toString(),
        to_address: r.address,
        to_identity: r.name || '',
      }));

      const totalAmount = recipientsMetadata.reduce(
        (sum, r) => sum + BigInt(r.amount),
        0n
      ).toString();

      const priorityFeeWei = parseUnits(disperseData.priorityFee || '0', 6).toString();

      const response = await fetch('/api/fishing/submit-disperse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: address,
          recipients: recipientsMetadata,
          token: PYUSD_ADDRESS,
          amount: totalAmount,
          priorityFee: priorityFeeWei,
          nonce: userNonce.toString(),
          signature,
          executor: zeroAddress,
          priorityFlag: false,
          evvmId: evvmId?.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit to fishing pool');
      }

      console.log('✅ Submitted dispersePay to fishing pool:', data);
      return data;

    } catch (err) {
      console.error('Error submitting dispersePay to fishing pool:', err);
      throw err;
    }
  };

  /**
   * Reset state for new dispersePay
   */
  const reset = () => {
    setDisperseData(null);
    resetSign();
  };

  return {
    initiateDisperse,
    submitToFishers,
    reset,
    signature,
    isSigning,
    signError,
    disperseData,
    currentNonce: userNonce,
    evvmId: evvmId,
    isLoadingMetadata: isLoadingEvvmId || isLoadingUserData,
    isLoadingNonce: isLoadingUserData,
  };
}
