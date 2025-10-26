/**
 * Custom hook for MATE token payments within EVVM
 * Uses EIP-191 signature-based gasless payments
 */

import { useState } from 'react';
import { useAccount, useSignMessage, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits, zeroAddress } from 'viem';
import { useEvvmId } from './useEvvmState';

// Contract addresses
const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e' as const;
const MATE_TOKEN = '0x0000000000000000000000000000000000000001' as const;

// EVVM ABI for payment execution
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
  {
    name: 'getNextCurrentSyncNonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
] as const;

/**
 * Construct MATE payment message for EIP-191 signing
 * Format: {evvmID},pay,{recipient},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}
 */
export function constructMatePaymentMessage(
  evvmId: bigint,
  recipient: string,
  amount: string,
  priorityFee: string,
  nonce: string,
  priorityFlag: boolean,
  executor: string
): string {
  const formattedRecipient = recipient.toLowerCase();
  const formattedToken = MATE_TOKEN.toLowerCase();
  const formattedExecutor = executor.toLowerCase();
  const formattedPriorityFlag = priorityFlag ? 'true' : 'false';

  const message = `${evvmId},pay,${formattedRecipient},${formattedToken},${amount},${priorityFee},${nonce},${formattedPriorityFlag},${formattedExecutor}`;

  return message;
}

/**
 * Hook for MATE token payments
 */
export function useMatePayment() {
  const { address } = useAccount();
  const [paymentData, setPaymentData] = useState<{
    to: string;
    amount: string;
    priorityFee: string;
  } | null>(null);

  // Get EVVM ID
  const { data: evvmId, isLoading: isLoadingMetadata } = useEvvmId();

  // Get user nonce
  const { data: userNonce, isLoading: isLoadingNonce } = useReadContract({
    address: EVVM_ADDRESS,
    abi: EVVM_ABI,
    functionName: 'getNextCurrentSyncNonce',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  });

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
      // Convert amounts to wei (MATE has 18 decimals like ETH)
      const amountWei = parseUnits(amount, 18).toString();
      const priorityFeeWei = parseUnits(priorityFee || '0', 18).toString();
      const nonceStr = userNonce.toString();

      // Construct message with REAL EVVM ID from contract
      const message = constructMatePaymentMessage(
        evvmId, // Real EVVM ID from contract
        to, // recipient address
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
      const amountWei = parseUnits(paymentData.amount, 18).toString();
      const priorityFeeWei = parseUnits(paymentData.priorityFee || '0', 18).toString();

      const response = await fetch('/api/fishing/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: address,
          to: paymentData.to,
          token: MATE_TOKEN,
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

      console.log('✅ Submitted MATE payment to fishing pool:', data);
      return data;

    } catch (err) {
      console.error('Error submitting MATE payment to fishing pool:', err);
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
      const amountWei = parseUnits(paymentData.amount, 18);
      const priorityFeeWei = parseUnits(paymentData.priorityFee || '0', 18);

      writeContract({
        address: EVVM_ADDRESS,
        abi: EVVM_ABI,
        functionName: 'pay',
        args: [
          address, // from
          paymentData.to as `0x${string}`, // to_address
          '', // to_identity (empty string = use to_address)
          MATE_TOKEN, // token
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
    // State
    signature,
    hash,
    currentNonce: userNonce,
    evvmId,
    paymentData,

    // Status
    isSigning,
    isExecuting,
    isConfirming,
    isSuccess,
    isLoadingMetadata,
    isLoadingNonce,

    // Errors
    signError,
    executeError,

    // Actions
    initiatePayment,
    executePayment,
    submitToFishers,
    reset,
  };
}

/**
 * Hook to get MATE balance in EVVM
 */
export function useMateBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: EVVM_ADDRESS,
    abi: EVVM_ABI,
    functionName: 'getBalance',
    args: address ? [address, MATE_TOKEN] : undefined,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  });

  return {
    balance: balance || 0n,
    formatted: balance ? (Number(balance) / 1e18).toFixed(4) : '0', // MATE has 18 decimals
    isLoading,
    refetch,
  };
}
