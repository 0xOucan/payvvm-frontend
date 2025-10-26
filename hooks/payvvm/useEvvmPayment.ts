/**
 * Custom hooks for EVVM Payment System
 * Implements EIP-191 signature-based payments within EVVM
 */

import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSignMessage } from 'wagmi';
import { parseUnits, zeroAddress } from 'viem';
import { useState } from 'react';
import { useUserAccount, useEvvmId } from './useEvvmState';

export const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e' as const;
export const PYUSD_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9' as const;

// EVVM ABI for payment operations
const EVVM_ABI = [
  {
    name: 'pay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to_address', type: 'address' },
      { name: 'to_identity', type: 'string' },
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

/**
 * Construct payment signature message according to EVVM spec
 * Format: "{evvmID},pay,{recipient},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}"
 */
export function constructPaymentMessage(
  evvmId: bigint,
  recipient: string,
  token: string,
  amount: string,
  priorityFee: string,
  nonce: string,
  priorityFlag: boolean,
  executor: string
): string {
  // Convert addresses to lowercase with 0x prefix
  const formattedRecipient = recipient.toLowerCase();
  const formattedToken = token.toLowerCase();
  const formattedExecutor = executor.toLowerCase();
  const formattedPriorityFlag = priorityFlag ? 'true' : 'false';

  const message = `${evvmId},pay,${formattedRecipient},${formattedToken},${amount},${priorityFee},${nonce},${formattedPriorityFlag},${formattedExecutor}`;

  console.log('Constructed message:', message);
  return message;
}

/**
 * Hook to send PYUSD payment within EVVM
 */
export function useEvvmPayment() {
  const { address } = useAccount();
  const [paymentData, setPaymentData] = useState<{
    to: string;
    amount: string;
    priorityFee: string;
  } | null>(null);

  // Fetch EVVM ID directly using dedicated function
  const { data: evvmId, isLoading: isLoadingEvvmId } = useEvvmId();

  // Use existing hook that already works
  const { data: userData, isLoading: isLoadingUserData } = useUserAccount(address);

  // Step 1: Sign the message
  const {
    signMessage,
    data: signature,
    isPending: isSigning,
    error: signError,
    reset: resetSign,
  } = useSignMessage();

  // Step 2: Execute the payment
  const {
    writeContract,
    data: hash,
    isPending: isExecuting,
    error: executeError,
    reset: resetExecute,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  // Extract nonce from user data
  const userNonce = userData?.[2]?.result as bigint | undefined;

  /**
   * Initiate payment: construct signature and sign
   */
  const initiatePayment = async (to: string, amount: string, priorityFee: string = '0') => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (typeof userNonce !== 'bigint') {
      throw new Error('User nonce not loaded. Please wait a moment and try again.');
    }

    if (!evvmId) {
      throw new Error('EVVM ID not loaded. Please wait a moment and try again.');
    }

    // Store payment data for later execution
    setPaymentData({ to, amount, priorityFee });

    try {
      // Convert amounts to wei (PYUSD has 6 decimals)
      const amountWei = parseUnits(amount, 6).toString();
      const priorityFeeWei = parseUnits(priorityFee || '0', 6).toString();
      const nonceStr = userNonce.toString();

      // Construct message with REAL EVVM ID from contract
      const message = constructPaymentMessage(
        evvmId, // Real EVVM ID from contract
        to, // recipient address
        PYUSD_ADDRESS, // token
        amountWei, // amount in wei
        priorityFeeWei, // priority fee in wei
        nonceStr, // nonce
        false, // priorityFlag (false = synchronous)
        zeroAddress // executor (0x0 = anyone can execute)
      );

      // Sign message (EIP-191)
      signMessage({ message });
    } catch (err) {
      console.error('Payment initiation error:', err);
      throw err;
    }
  };

  /**
   * Submit signed payment to fishing pool (for fishers to execute)
   */
  const submitToFishers = async () => {
    if (!signature || !paymentData || !address || typeof userNonce !== 'bigint') {
      console.error('Missing signature or payment data');
      return;
    }

    try {
      const amountWei = parseUnits(paymentData.amount, 6).toString();
      const priorityFeeWei = parseUnits(paymentData.priorityFee || '0', 6).toString();

      const response = await fetch('/api/fishing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: address,
          to: paymentData.to,
          token: PYUSD_ADDRESS,
          amount: amountWei,
          priorityFee: priorityFeeWei,
          nonce: userNonce.toString(),
          signature,
          executor: zeroAddress, // Include executor used in signature
          priorityFlag: false, // Include priorityFlag used in signature
          evvmId: evvmId?.toString(), // Include EVVM ID for debugging
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit to fishing pool');
      }

      console.log('✅ Submitted to fishing pool:', data);
      return data;

    } catch (err) {
      console.error('Error submitting to fishing pool:', err);
      throw err;
    }
  };

  /**
   * Execute payment after signature is obtained (direct execution)
   */
  const executePayment = () => {
    if (!signature || !paymentData || !address || typeof userNonce !== 'bigint') {
      console.error('Missing signature or payment data');
      return;
    }

    try {
      const amountWei = parseUnits(paymentData.amount, 6);
      const priorityFeeWei = parseUnits(paymentData.priorityFee || '0', 6);

      writeContract({
        address: EVVM_ADDRESS,
        abi: EVVM_ABI,
        functionName: 'pay',
        args: [
          address, // from
          paymentData.to as `0x${string}`, // to_address
          '', // to_identity (empty string = use to_address)
          PYUSD_ADDRESS, // token
          amountWei, // amount
          priorityFeeWei, // priorityFee
          userNonce, // nonce
          false, // priorityFlag (synchronous)
          zeroAddress, // executor (anyone can execute)
          signature, // signature
        ],
      });
    } catch (err) {
      console.error('Payment execution error:', err);
    }
  };

  /**
   * Reset state for new payment
   */
  const reset = () => {
    setPaymentData(null);
    resetSign();
    resetExecute();
  };

  return {
    initiatePayment,
    executePayment,
    submitToFishers,
    reset,
    signature,
    hash,
    isSigning,
    isExecuting,
    isConfirming,
    isSuccess,
    signError,
    executeError,
    paymentData,
    currentNonce: userNonce,
    evvmId: evvmId,
    isLoadingMetadata: isLoadingEvvmId || isLoadingUserData,
    isLoadingNonce: isLoadingUserData,
  };
}
