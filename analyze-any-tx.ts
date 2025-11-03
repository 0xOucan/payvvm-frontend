/**
 * Universal transaction analyzer
 * Usage: npx tsx analyze-any-tx.ts <tx-hash>
 */

import { createPublicClient, http, decodeFunctionData, recoverMessageAddress, encodeAbiParameters, sha256 } from 'viem';
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

async function analyzeTx(txHash: string) {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('           TRANSACTION ANALYZER');
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

  console.log('📊 TRANSACTION PARAMETERS');
  console.log('───────────────────────────────────────────────────────────');
  console.log('From:', from);
  console.log('Token:', token);
  console.log('Amount:', amount.toString());
  console.log('Priority Fee:', priorityFee.toString());
  console.log('Nonce:', nonce.toString());
  console.log('Priority Flag:', priorityFlag);
  console.log('Executor:', executor);
  console.log('Recipients:', toData.length);
  console.log();

  // Calculate hash
  const encodedRecipients = encodeAbiParameters(
    [{ type: 'tuple[]', components: [
      { name: 'amount', type: 'uint256' },
      { name: 'to_address', type: 'address' },
      { name: 'to_identity', type: 'string' },
    ]}],
    [toData]
  );

  const hashList = sha256(encodedRecipients);

  console.log('🔐 SIGNATURE VERIFICATION');
  console.log('───────────────────────────────────────────────────────────');
  console.log('Calculated hash:', hashList);

  // Construct message
  const message = `1000,dispersePay,${hashList},${token.toLowerCase()},${amount},${priorityFee},${nonce},${priorityFlag ? 'true' : 'false'},${executor.toLowerCase()}`;

  console.log('\nMessage to verify:');
  console.log(message);

  // Recover signer
  try {
    const recovered = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });

    console.log('\nRecovered signer:', recovered);
    console.log('Expected signer:', from);
    console.log('Match:', recovered.toLowerCase() === from.toLowerCase());

    if (recovered.toLowerCase() === from.toLowerCase()) {
      console.log('\n✅ SIGNATURE IS VALID!');
      console.log('\nThis means:');
      console.log('  • Message construction is correct');
      console.log('  • Signature matches the signer');
      console.log('  • Frontend code is working correctly');
      console.log('\n🔍 If transaction failed, possible causes:');
      console.log('  1. Async nonce already used (check previous txs)');
      console.log('  2. Insufficient balance');
      console.log('  3. Contract bug (unlikely)');
      console.log('  4. Gas limit too low');
    } else {
      console.log('\n❌ SIGNATURE MISMATCH!');
      console.log('\nPossible causes:');
      console.log('  1. Message was signed with different parameters');
      console.log('  2. Browser cached old code');
      console.log('  3. priorityFlag mismatch (old vs new code)');
    }

  } catch (e: any) {
    console.log('\n❌ Error recovering signature:', e.message);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

const txHash = process.argv[2];
if (!txHash) {
  console.log('Usage: npx tsx analyze-any-tx.ts <tx-hash>');
  process.exit(1);
}

analyzeTx(txHash).catch(console.error);
