/**
 * Check the actual EVVM ID from the contract
 */

import { createPublicClient, http } from 'viem';
import { sepolia } from './lib/chains';

const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e';

const EVVM_ABI = [
  {
    name: 'getEvvmID',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

async function main() {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  console.log('=== EVVM ID Check ===\n');
  console.log('EVVM Contract:', EVVM_ADDRESS);

  try {
    const evvmId = await publicClient.readContract({
      address: EVVM_ADDRESS,
      abi: EVVM_ABI,
      functionName: 'getEvvmID',
    });

    console.log('\n=== Result ===');
    console.log('Actual EVVM ID:', evvmId.toString());
    console.log('Expected EVVM ID:', '1000');
    console.log('Match:', evvmId.toString() === '1000');

    if (evvmId.toString() !== '1000') {
      console.log('\n❌ EVVM ID MISMATCH!');
      console.log('The frontend is using EVVM ID 1000 in signatures');
      console.log('but the actual contract EVVM ID is', evvmId.toString());
      console.log('\nThis would cause InvalidSignature errors!');
    } else {
      console.log('\n✅ EVVM ID matches');
    }
  } catch (error: any) {
    console.log('\n⚠️ Could not read EVVM ID using getEvvmID()');
    console.log('Error:', error.message);
    console.log('\nTrying alternative method...');
  }
}

main().catch(console.error);
