/**
 * Custom hooks for PYUSD Treasury interactions
 * Handles deposits and withdrawals of PYUSD tokens
 */

import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useState } from 'react';

// Contract addresses on Sepolia
export const PYUSD_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9' as const;
export const TREASURY_ADDRESS = '0x3d6cb29a1f97a2cff7a48af96f7ed3a02f6aa38e' as const;
export const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e' as const;

// ERC20 ABI for token interactions
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

// Treasury ABI
const TREASURY_ABI = [
  {
    name: 'deposit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

// EVVM ABI for balance checks
const EVVM_ABI = [
  {
    name: 'getBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

/**
 * Hook to get PYUSD balance in wallet
 */
export function usePyusdWalletBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: true,
      staleTime: 0, // Always consider data stale for immediate refetch
    },
  });

  return {
    balance: balance || 0n,
    formatted: balance ? formatUnits(balance, 6) : '0', // PYUSD has 6 decimals
    isLoading,
    refetch,
  };
}

/**
 * Hook to get PYUSD balance in EVVM
 */
export function usePyusdEvvmBalance() {
  const { address } = useAccount();

  const { data: balance, isLoading, refetch } = useReadContract({
    address: EVVM_ADDRESS,
    abi: EVVM_ABI,
    functionName: 'getBalance',
    args: address ? [address, PYUSD_ADDRESS] : undefined,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: true,
      staleTime: 0, // Always consider data stale for immediate refetch
    },
  });

  return {
    balance: balance || 0n,
    formatted: balance ? formatUnits(balance, 6) : '0',
    isLoading,
    refetch,
  };
}

/**
 * Hook to get PYUSD allowance for Treasury
 */
export function usePyusdAllowance() {
  const { address } = useAccount();

  const { data: allowance, isLoading, refetch } = useReadContract({
    address: PYUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, TREASURY_ADDRESS] : undefined,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: true,
      staleTime: 0, // Always consider data stale for immediate refetch
    },
  });

  return {
    allowance: allowance || 0n,
    formatted: allowance ? formatUnits(allowance, 6) : '0',
    isLoading,
    refetch,
  };
}

/**
 * Hook to approve PYUSD for Treasury
 */
export function useApprovePyusd() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const approve = (amount: string) => {
    try {
      const amountWei = parseUnits(amount, 6);
      writeContract({
        address: PYUSD_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [TREASURY_ADDRESS, amountWei],
      });
    } catch (err) {
      console.error('Approve error:', err);
    }
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to deposit PYUSD to Treasury
 */
export function useDepositPyusd() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const deposit = (amount: string) => {
    try {
      const amountWei = parseUnits(amount, 6);
      writeContract({
        address: TREASURY_ADDRESS,
        abi: TREASURY_ABI,
        functionName: 'deposit',
        args: [PYUSD_ADDRESS, amountWei],
      });
    } catch (err) {
      console.error('Deposit error:', err);
    }
  };

  return {
    deposit,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

/**
 * Hook to withdraw PYUSD from Treasury
 */
export function useWithdrawPyusd() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const withdraw = (amount: string) => {
    try {
      const amountWei = parseUnits(amount, 6);
      writeContract({
        address: TREASURY_ADDRESS,
        abi: TREASURY_ABI,
        functionName: 'withdraw',
        args: [PYUSD_ADDRESS, amountWei],
      });
    } catch (err) {
      console.error('Withdraw error:', err);
    }
  };

  return {
    withdraw,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}
