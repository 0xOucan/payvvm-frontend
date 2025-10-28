/**
 * Test script to verify dispersePay signature construction
 * Compares our frontend encoding with expected Solidity behavior
 */

import { encodeAbiParameters, sha256, parseUnits } from 'viem';

// Test data - 4 recipients, 0.05 PYUSD each
const recipients = [
  { address: '0x1111111111111111111111111111111111111111', amount: '0.05', name: '' },
  { address: '0x2222222222222222222222222222222222222222', amount: '0.05', name: '' },
  { address: '0x3333333333333333333333333333333333333333', amount: '0.05', name: '' },
  { address: '0x4444444444444444444444444444444444444444', amount: '0.05', name: '' },
];

// Convert to metadata format
const recipientsMetadata = recipients.map(r => ({
  amount: parseUnits(r.amount, 6), // PYUSD has 6 decimals
  to_address: r.address.toLowerCase() as `0x${string}`,
  to_identity: r.name || '',
}));

console.log('Recipients metadata:', JSON.stringify(recipientsMetadata, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
, 2));

// Encode as we do in the frontend
const encodedRecipients = encodeAbiParameters(
  [
    {
      type: 'tuple[]',
      components: [
        { name: 'amount', type: 'uint256' },
        { name: 'to_address', type: 'address' },
        { name: 'to_identity', type: 'string' },
      ],
    },
  ],
  [recipientsMetadata]
);

console.log('\nABI Encoded (hex):');
console.log(encodedRecipients);

// Calculate SHA256 hash
const hashList = sha256(encodedRecipients);

console.log('\nSHA256 Hash:');
console.log(hashList);

// Construct full message
const evvmId = 1000n;
const token = '0xcac524bca292aaade2df8a05cc58f0a65b1b3bb9';
const totalAmount = BigInt(200000); // 0.20 PYUSD in smallest units
const priorityFee = '0';
const nonce = '24';
const priorityFlag = false;
const executor = '0x0000000000000000000000000000000000000000';

const message = `${evvmId},dispersePay,${hashList},${token},${totalAmount},${priorityFee},${nonce},${priorityFlag ? 'true' : 'false'},${executor}`;

console.log('\nFull signature message:');
console.log(message);

console.log('\n=== Verification ===');
console.log('Total amount:', totalAmount.toString(), '(should be sum of all amounts)');
const sum = recipientsMetadata.reduce((acc, r) => acc + r.amount, 0n);
console.log('Sum of amounts:', sum.toString());
console.log('Match:', sum === totalAmount);
