/**
 * Simulate EXACTLY what the contract does during signature verification
 */

import { createPublicClient, http, decodeFunctionData, encodeAbiParameters, sha256, recoverMessageAddress } from 'viem';
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

async function simulateContractVerification(txHash: string) {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(),
  });

  console.log('═══════════════════════════════════════════════════════════');
  console.log('    SIMULATE CONTRACT SIGNATURE VERIFICATION');
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

  console.log('📊 TRANSACTION PARAMETERS (what contract receives)');
  console.log('───────────────────────────────────────────────────────────');
  console.log('From:', from);
  console.log('Token:', token);
  console.log('Amount:', amount.toString());
  console.log('Priority Fee:', priorityFee.toString());
  console.log('Nonce:', nonce.toString());
  console.log('Priority Flag:', priorityFlag);
  console.log('Executor:', executor);
  console.log('\nRecipients (toData):');
  toData.forEach((r, i) => {
    console.log(`  [${i}]:`, {
      amount: r.amount.toString(),
      to_address: r.to_address,
      to_identity: r.to_identity
    });
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔄 STEP 1: Contract calculates sha256(abi.encode(toData))');
  console.log('═══════════════════════════════════════════════════════════');

  // Contract does: sha256(abi.encode(toData))
  // toData is already decoded as tuple[] from transaction
  const encodedToData = encodeAbiParameters(
    [{
      type: 'tuple[]',
      components: [
        { name: 'amount', type: 'uint256' },
        { name: 'to_address', type: 'address' },
        { name: 'to_identity', type: 'string' },
      ],
    }],
    [toData]
  );

  const hashList = sha256(encodedToData);

  console.log('Encoded toData:', encodedToData);
  console.log('Hash (sha256):', hashList);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔄 STEP 2: Contract constructs message');
  console.log('═══════════════════════════════════════════════════════════');

  // Contract uses AdvancedStrings.addressToString() which produces lowercase
  const message = `1000,dispersePay,${hashList},${token.toLowerCase()},${amount},${priorityFee},${nonce},${priorityFlag ? 'true' : 'false'},${executor.toLowerCase()}`;

  console.log('Message:', message);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔄 STEP 3: Contract recovers signer from signature');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    const recovered = await recoverMessageAddress({
      message,
      signature: signature as `0x${string}`,
    });

    console.log('Recovered signer:', recovered);
    console.log('Expected signer (from):', from);
    console.log('Match:', recovered.toLowerCase() === from.toLowerCase());

    if (recovered.toLowerCase() === from.toLowerCase()) {
      console.log('\n✅ SIGNATURE VERIFICATION PASSES!');
      console.log('\nThis means the contract signature check should succeed.');
      console.log('If transaction still reverts, the issue is in a later check:');
      console.log('  - Executor validation (line 618-620)');
      console.log('  - Async nonce check (line 624-625)');
      console.log('  - Balance check (line 628-629)');
      console.log('  - Amount validation (line 654-655)');
    } else {
      console.log('\n❌ SIGNATURE VERIFICATION FAILS!');
      console.log('\nThe recovered signer does not match the expected signer.');
      console.log('This would cause InvalidSignature() revert.');
    }

  } catch (e: any) {
    console.log('\n❌ Error recovering signature:', e.message);
    console.log('\nThis would cause InvalidSignature() revert.');
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

const txHash = process.argv[2];
if (!txHash) {
  console.log('Usage: npx tsx simulate-contract-verification.ts <tx-hash>');
  process.exit(1);
}

simulateContractVerification(txHash).catch(console.error);
