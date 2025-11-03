/**
 * Check user's EVVM balance for PYUSD
 */

import { createPublicClient, http } from 'viem';
import { sepolia } from './lib/chains';

const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e';
const FROM_ADDRESS = '0x9c77c6fafc1eb0821F1De12972Ef0199C97C6e45';
const PYUSD_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';

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

async function main() {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('           EVVM BALANCE CHECK');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('User:', FROM_ADDRESS);
  console.log('Token (PYUSD):', PYUSD_ADDRESS);
  console.log();

  try {
    const balance = await publicClient.readContract({
      address: EVVM_ADDRESS,
      abi: EVVM_ABI,
      functionName: 'getBalance',
      args: [FROM_ADDRESS as `0x${string}`, PYUSD_ADDRESS as `0x${string}`],
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('💰 BALANCE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Raw balance:', balance.toString(), 'smallest units');
    console.log('PYUSD balance:', (Number(balance) / 1000000).toFixed(6), 'PYUSD');
    console.log('USD value: $' + (Number(balance) / 1000000).toFixed(2));

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 TRANSACTION REQUIREMENTS');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Transaction needs: 60000 smallest units');
    console.log('Transaction needs: 0.06 PYUSD');
    console.log('Transaction needs: $0.06');

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ VALIDATION');
    console.log('═══════════════════════════════════════════════════════════');

    if (balance >= 60000n) {
      console.log('✅ SUFFICIENT BALANCE');
      console.log('User has enough PYUSD for this transaction.');
      console.log(`Available: ${balance} >= Required: 60000`);
    } else {
      console.log('❌ INSUFFICIENT BALANCE!');
      console.log('User does NOT have enough PYUSD for this transaction.');
      console.log(`Available: ${balance} < Required: 60000`);
      console.log(`Shortfall: ${60000n - balance} smallest units`);
    }

  } catch (error: any) {
    console.error('\n❌ Error checking balance:', error.message);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
