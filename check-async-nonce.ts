/**
 * Check if async nonce 26 is already used
 */

import { createPublicClient, http } from 'viem';
import { sepolia } from './lib/chains';

const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e';
const FROM_ADDRESS = '0x9c77c6fafc1eb0821F1De12972Ef0199C97C6e45';
const NONCE = 26n;

// Check if a specific async nonce is used
const EVVM_ABI = [
  {
    name: 'getIfUsedAsyncNonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'nonce', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'getNextCurrentSyncNonce',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

async function main() {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  console.log('=== Async Nonce Check ===\n');
  console.log('User:', FROM_ADDRESS);
  console.log('Nonce:', NONCE.toString());

  try {
    const isUsed = await publicClient.readContract({
      address: EVVM_ADDRESS,
      abi: EVVM_ABI,
      functionName: 'getIfUsedAsyncNonce',
      args: [FROM_ADDRESS as `0x${string}`, NONCE],
    });

    console.log('\n=== Result ===');
    console.log('getIfUsedAsyncNonce(user, 26):', isUsed);

    if (isUsed) {
      console.log('\n❌ NONCE ALREADY USED!');
      console.log('Async nonce 26 has already been used in a previous transaction.');
      console.log('This would cause InvalidSignature() if the signature is being re-used.');
      console.log('\nSolution: Use a different nonce (try 27, 28, etc.)');
    } else {
      console.log('\n✅ Nonce is available');
      console.log('Async nonce 26 has NOT been used yet.');
    }

    // Also check sync nonce for reference
    const syncNonce = await publicClient.readContract({
      address: EVVM_ADDRESS,
      abi: EVVM_ABI,
      functionName: 'getNextCurrentSyncNonce',
      args: [FROM_ADDRESS as `0x${string}`],
    });

    console.log('\nFor reference:');
    console.log('Current sync nonce:', syncNonce.toString());

  } catch (error: any) {
    console.error('\n❌ Error checking nonce:', error.message);
  }
}

main().catch(console.error);
