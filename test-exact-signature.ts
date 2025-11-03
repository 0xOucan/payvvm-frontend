/**
 * Test the EXACT signature from the failed transaction
 */

import { recoverMessageAddress, encodeAbiParameters, sha256 } from 'viem';

// Exact data from server logs
const toData = [
  {
    amount: 10000n,
    to_address: '0xc095c7ca2b56b0f0dc572d5d4a9eb1b37f4306a0' as `0x${string}`,
    to_identity: '',
  },
  {
    amount: 10000n,
    to_address: '0x464ca22abb21f014f816107e1d5104d2cc4da03e' as `0x${string}`,
    to_identity: '',
  },
  {
    amount: 10000n,
    to_address: '0x843914e5bbdbe92296f2c3d895d424301b3517fc' as `0x${string}`,
    to_identity: '',
  },
];

const token = '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9';
const amount = '30000';
const priorityFee = '0';
const nonce = '26';
const priorityFlag = true;
const executor = '0x0000000000000000000000000000000000000000';
const signature = '0x1c74b83d016162426ff60fcf25590bfa8c6462e409e93a24d2aedfd6c307687c164a179528f159ce68248587924eb4967f15c212f458fc4016b334c8c4c377b01b' as `0x${string}`;
const expectedSigner = '0x9c77c6fafc1eb0821F1De12972Ef0199C97C6e45';

async function testSignature() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('       TEST EXACT SIGNATURE FROM TRANSACTION');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Calculate hash exactly as browser did
  const encoded = encodeAbiParameters(
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

  const hashList = sha256(encoded);

  console.log('Hash:', hashList);
  console.log();

  // Construct message exactly as browser did
  const message = `1000,dispersePay,${hashList},${token},${amount},${priorityFee},${nonce},${priorityFlag ? 'true' : 'false'},${executor}`;

  console.log('Message:');
  console.log(message);
  console.log();
  console.log('Message length (chars):', message.length);
  console.log('Message length (bytes):', Buffer.from(message).length);
  console.log();

  // Verify signature
  try {
    const recovered = await recoverMessageAddress({
      message,
      signature,
    });

    console.log('Expected signer:', expectedSigner);
    console.log('Recovered signer:', recovered);
    console.log('Match:', recovered.toLowerCase() === expectedSigner.toLowerCase());
    console.log();

    if (recovered.toLowerCase() === expectedSigner.toLowerCase()) {
      console.log('✅ SIGNATURE IS VALID!');
      console.log('\nThe signature mathematically verifies correctly.');
      console.log('If contract still rejects it, there must be a difference');
      console.log('in how the contract is constructing or verifying the message.');
    } else {
      console.log('❌ SIGNATURE IS INVALID!');
      console.log('\nThe recovered signer does not match the expected signer.');
    }
  } catch (e: any) {
    console.log('❌ Error:', e.message);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

testSignature().catch(console.error);
