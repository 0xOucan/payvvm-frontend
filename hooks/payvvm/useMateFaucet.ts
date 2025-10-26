/**
 * Custom hook for MATE token faucet
 * Claims MATE tokens via recalculateReward() function
 */

import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Contract addresses
const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e' as const;

// EVVM ABI for faucet function
const EVVM_ABI = [
  {
    name: 'recalculateReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
] as const;

/**
 * Hook for claiming MATE tokens from faucet
 */
export function useMateFaucet() {
  const { address, isConnected } = useAccount();

  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  /**
   * Claim MATE tokens
   * Reward formula: 2.5 MATE × random(1-5083)
   * Expected reward: 2.5 to 12,707.5 MATE tokens
   */
  const claimTokens = () => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      writeContract({
        address: EVVM_ADDRESS,
        abi: EVVM_ABI,
        functionName: 'recalculateReward',
      });
    } catch (err) {
      console.error('Faucet claim error:', err);
      throw err;
    }
  };

  return {
    // Actions
    claimTokens,
    reset,

    // State
    hash,

    // Status
    isPending,
    isConfirming,
    isSuccess,

    // Errors
    error,
  };
}
