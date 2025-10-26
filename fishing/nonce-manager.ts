/**
 * Nonce manager for tracking user nonces and preventing replay attacks
 */

import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e';

// EVVM ABI for nonce checking
const EVVM_ABI = [
  {
    name: 'getNextCurrentSyncNonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

/**
 * Check if a nonce is valid for a user
 * For synchronous payments, nonce must equal the user's current sync nonce
 */
export async function isNonceValid(
  userAddress: string,
  nonce: bigint,
  priorityFlag: boolean,
  rpcUrl: string
): Promise<boolean> {
  try {
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    // Get user's current nonce from contract
    const currentNonce = await publicClient.readContract({
      address: EVVM_ADDRESS,
      abi: EVVM_ABI,
      functionName: 'getNextCurrentSyncNonce',
      args: [userAddress as `0x${string}`],
    });

    console.log(`User ${userAddress.slice(0, 6)}... nonce:`, {
      provided: nonce.toString(),
      expected: currentNonce.toString(),
    });

    if (priorityFlag) {
      // Asynchronous: nonce just needs to not have been used
      // For now, we'll accept any nonce >= current nonce
      // In production, you'd track used async nonces in a database
      return nonce >= currentNonce;
    } else {
      // Synchronous: nonce must exactly match current nonce
      return nonce === currentNonce;
    }
  } catch (error) {
    console.error('Error checking nonce:', error);
    return false;
  }
}

/**
 * Get the current nonce for a user
 */
export async function getCurrentNonce(userAddress: string, rpcUrl: string): Promise<bigint> {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(rpcUrl),
  });

  const nonce = await publicClient.readContract({
    address: EVVM_ADDRESS,
    abi: EVVM_ABI,
    functionName: 'getNextCurrentSyncNonce',
    args: [userAddress as `0x${string}`],
  });

  return nonce;
}
