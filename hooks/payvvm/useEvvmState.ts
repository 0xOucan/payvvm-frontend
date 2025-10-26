import { useReadContract, useReadContracts } from 'wagmi';

// EVVM ABI - Only the view functions we need for reading state
const EVVM_ABI = [
  {
    name: 'getEvvmMetadata',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{
      type: 'tuple',
      components: [
        { name: 'EvvmName', type: 'string' },
        { name: 'EvvmID', type: 'uint256' },
        { name: 'principalTokenName', type: 'string' },
        { name: 'principalTokenSymbol', type: 'string' },
        { name: 'principalTokenAddress', type: 'address' },
        { name: 'totalSupply', type: 'uint256' },
        { name: 'eraTokens', type: 'uint256' },
        { name: 'reward', type: 'uint256' }
      ]
    }]
  },
  {
    name: 'getBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'isAddressStaker',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'getNextCurrentSyncNonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'getCurrentAdmin',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    name: 'getRewardAmount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'getEvvmID',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }
] as const;

const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e' as `0x${string}`;
const MATE_TOKEN = '0x0000000000000000000000000000000000000001' as `0x${string}`;

/**
 * Hook to get EVVM system metadata
 * Returns: { principalTokenAddress, reward, totalSupply, eraTokens }
 */
export function useEvvmMetadata() {
  return useReadContract({
    address: EVVM_ADDRESS,
    abi: EVVM_ABI,
    functionName: 'getEvvmMetadata',
  });
}

/**
 * Hook to get user account state
 * Returns: [balance, isStaker, nonce]
 */
export function useUserAccount(address?: `0x${string}`) {
  return useReadContracts({
    contracts: [
      {
        address: EVVM_ADDRESS,
        abi: EVVM_ABI,
        functionName: 'getBalance',
        args: address ? [address, MATE_TOKEN] : undefined,
      },
      {
        address: EVVM_ADDRESS,
        abi: EVVM_ABI,
        functionName: 'isAddressStaker',
        args: address ? [address] : undefined,
      },
      {
        address: EVVM_ADDRESS,
        abi: EVVM_ABI,
        functionName: 'getNextCurrentSyncNonce',
        args: address ? [address] : undefined,
      }
    ],
    query: {
      enabled: !!address,
      refetchOnWindowFocus: true,
      staleTime: 0, // Always consider data stale for immediate refetch
    }
  });
}

/**
 * Hook to get current reward amount
 */
export function useCurrentReward() {
  return useReadContract({
    address: EVVM_ADDRESS,
    abi: EVVM_ABI,
    functionName: 'getRewardAmount',
  });
}

/**
 * Hook to get EVVM admin address
 */
export function useEvvmAdmin() {
  return useReadContract({
    address: EVVM_ADDRESS,
    abi: EVVM_ABI,
    functionName: 'getCurrentAdmin',
  });
}

/**
 * Hook to get user balance for a specific token
 */
export function useUserBalance(address?: `0x${string}`, token?: `0x${string}`) {
  return useReadContract({
    address: EVVM_ADDRESS,
    abi: EVVM_ABI,
    functionName: 'getBalance',
    args: address && token ? [address, token] : undefined,
    query: {
      enabled: !!(address && token),
    }
  });
}

/**
 * Hook to get EVVM ID
 */
export function useEvvmId() {
  return useReadContract({
    address: EVVM_ADDRESS,
    abi: EVVM_ABI,
    functionName: 'getEvvmID',
  });
}
