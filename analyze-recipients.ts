/**
 * Analyze dispersePay recipients and check if amounts add up
 * Usage: npx tsx analyze-recipients.ts <tx-hash>
 */

import { createPublicClient, http, decodeFunctionData } from 'viem';
import { sepolia } from './lib/chains';

const EVVM_ABI = [
  {
    name: 'dispersePay',
    type: 'function',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'toData', type: 'tuple[]', components: [
        { name: 'amount', type: 'uint256' },
        { name: 'to_address', type: 'address' },
        { name: 'to_identity', type: 'string' },
      ]},
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'priorityFee', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'priorityFlag', type: 'bool' },
      { name: 'executor', type: 'address' },
      { name: 'signature', type: 'bytes' },
    ],
  },
] as const;

async function analyzeRecipients(txHash: string) {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('        RECIPIENT AMOUNT ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');

  const tx = await publicClient.getTransaction({ hash: txHash as `0x${string}` });

  const decoded = decodeFunctionData({
    abi: EVVM_ABI,
    data: tx.input,
  });

  if (decoded.functionName !== 'dispersePay') {
    console.log('❌ Not a dispersePay transaction');
    return;
  }

  const [from, toData, token, amount, priorityFee, nonce, priorityFlag, executor, signature] = decoded.args;

  console.log('📊 TRANSACTION DETAILS');
  console.log('───────────────────────────────────────────────────────────');
  console.log('From:', from);
  console.log('Token:', token);
  console.log('Declared Total Amount:', amount.toString());
  console.log('Priority Fee:', priorityFee.toString());
  console.log('Recipients:', toData.length);
  console.log();

  console.log('👥 RECIPIENT BREAKDOWN');
  console.log('───────────────────────────────────────────────────────────');

  let calculatedTotal = 0n;
  toData.forEach((recipient, index) => {
    console.log(`\nRecipient ${index + 1}:`);
    console.log(`  Address: ${recipient.to_address}`);
    console.log(`  Identity: "${recipient.to_identity}"`);
    console.log(`  Amount: ${recipient.amount.toString()}`);
    calculatedTotal += recipient.amount;
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('💰 AMOUNT VALIDATION');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Declared Amount:  ', amount.toString());
  console.log('Calculated Total: ', calculatedTotal.toString());
  console.log('Difference:       ', (Number(amount) - Number(calculatedTotal)).toString());

  if (calculatedTotal === amount) {
    console.log('\n✅ AMOUNTS MATCH! Sum of recipient amounts equals declared total.');
  } else {
    console.log('\n❌ AMOUNTS MISMATCH!');
    console.log('This will cause the transaction to revert with InvalidAmount error.');
    console.log('\nContract will reject because:');
    console.log('  sum(toData[i].amount) != amount');
    console.log(`  ${calculatedTotal} != ${amount}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

const txHash = process.argv[2];
if (!txHash) {
  console.log('Usage: npx tsx analyze-recipients.ts <tx-hash>');
  process.exit(1);
}

analyzeRecipients(txHash).catch(console.error);
