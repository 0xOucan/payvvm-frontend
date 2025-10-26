/**
 * Custom hook for MATE Faucet Service claims
 * Uses EIP-191 signature-based gasless claims (510 MATE per claim)
 */

import { useState } from 'react';
import { useAccount, useSignMessage, useReadContract } from 'wagmi';
import { useEvvmId } from './useEvvmState';

// Contract addresses
const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e' as const;
const MATE_FAUCET_ADDRESS = '0x068E9091e430786133439258C4BeeD696939405e' as const;
const MATE_TOKEN = '0x0000000000000000000000000000000000000001' as const;

// MATE Faucet ABI
const FAUCET_ABI = [
  {
    name: 'claimMate',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'claimer', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'canClaim',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'eligible', type: 'bool' },
      { name: 'remainingTime', type: 'uint256' },
    ],
  },
  {
    name: 'getFaucetBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'claimAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'cooldownPeriod',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'lastClaimTime',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'isNonceUsed',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'nonce', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

// EVVM ABI for balance check
const EVVM_ABI = [
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
 * Construct faucet claim message for EIP-191 signing
 * Format: {evvmID},claimMate,{claimer},{nonce}
 */
export function constructClaimMessage(
  evvmId: bigint,
  claimer: string,
  nonce: string
): string {
  const formattedClaimer = claimer.toLowerCase();
  const message = `${evvmId},claimMate,${formattedClaimer},${nonce}`;
  return message;
}

/**
 * Hook for MATE faucet service claims
 */
export function useMateFaucetService() {
  const { address } = useAccount();
  const [claimNonce, setClaimNonce] = useState<string | null>(null);

  // Get EVVM ID
  const { data: evvmId, isLoading: isLoadingMetadata } = useEvvmId();

  // Check if user can claim
  const {
    data: canClaimData,
    isLoading: isCheckingEligibility,
    refetch: refetchEligibility,
  } = useReadContract({
    address: MATE_FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'canClaim',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  });

  // Get faucet balance
  const {
    data: faucetBalance,
    isLoading: isLoadingFaucetBalance,
    refetch: refetchFaucetBalance,
  } = useReadContract({
    address: MATE_FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'getFaucetBalance',
    query: {
      enabled: true,
      refetchOnWindowFocus: true,
      staleTime: 0,
    },
  });

  // Get claim amount
  const {
    data: claimAmount,
    isLoading: isLoadingClaimAmount,
  } = useReadContract({
    address: MATE_FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'claimAmount',
    query: {
      enabled: true,
    },
  });

  // Get cooldown period
  const {
    data: cooldownPeriod,
    isLoading: isLoadingCooldown,
  } = useReadContract({
    address: MATE_FAUCET_ADDRESS,
    abi: FAUCET_ABI,
    functionName: 'cooldownPeriod',
    query: {
      enabled: true,
    },
  });

  // Get user's MATE balance in EVVM
  const {
    data: userMateBalance,
    refetch: refetchUserBalance,
  } = useReadContract({
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

  // Sign the claim message
  const {
    signMessage,
    data: signature,
    isPending: isSigning,
    error: signError,
    reset: resetSign,
  } = useSignMessage();

  /**
   * Initiate claim: construct signature and sign
   */
  const initiateClaim = async () => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (!evvmId) {
      throw new Error('EVVM ID not loaded. Please wait a moment and try again.');
    }

    if (!canClaimData || !canClaimData[0]) {
      const remainingTime = canClaimData ? canClaimData[1] : 0n;
      const hours = Number(remainingTime) / 3600;
      throw new Error(`You must wait ${hours.toFixed(1)} hours before claiming again`);
    }

    try {
      // Generate unique nonce (timestamp)
      const nonce = Date.now().toString();
      setClaimNonce(nonce);

      // Construct message with REAL EVVM ID from contract
      const message = constructClaimMessage(
        evvmId, // Real EVVM ID from contract
        address, // claimer address
        nonce // unique nonce
      );

      // Sign message (EIP-191)
      signMessage({ message });
    } catch (err) {
      console.error('Claim initiation error:', err);
      throw err;
    }
  };

  /**
   * Submit signed claim to fishing pool (for fishers to execute)
   */
  const submitToFishers = async () => {
    if (!signature || !claimNonce || !address) {
      console.error('Missing signature or claim data');
      return;
    }

    try {
      const response = await fetch('/api/fishing/submit-mate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimer: address,
          nonce: claimNonce,
          signature,
          evvmId: evvmId?.toString(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit claim to fishing pool');
      }

      console.log('✅ Submitted MATE faucet claim to fishing pool:', data);
      return data;

    } catch (err) {
      console.error('Error submitting claim to fishing pool:', err);
      throw err;
    }
  };

  /**
   * Reset state for new claim
   */
  const reset = () => {
    setClaimNonce(null);
    resetSign();
  };

  // Parse claim eligibility
  const canClaim = canClaimData ? canClaimData[0] : false;
  const remainingCooldown = canClaimData ? canClaimData[1] : 0n;

  return {
    // State
    signature,
    claimNonce,
    evvmId,
    canClaim,
    remainingCooldown,
    faucetBalance: faucetBalance || 0n,
    claimAmount: claimAmount || 0n,
    cooldownPeriod: cooldownPeriod || 0n,
    userMateBalance: userMateBalance || 0n,

    // Status
    isSigning,
    isCheckingEligibility,
    isLoadingMetadata,
    isLoadingFaucetBalance,
    isLoadingClaimAmount,
    isLoadingCooldown,

    // Errors
    signError,

    // Actions
    initiateClaim,
    submitToFishers,
    reset,
    refetchEligibility,
    refetchFaucetBalance,
    refetchUserBalance,
  };
}
