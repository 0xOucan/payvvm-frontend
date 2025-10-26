/**
 * EIP-191 signature validation for EVVM payments
 */

import { verifyMessage } from 'viem';
import type { PaymentData } from './types';

const EVVM_ID = 1000n; // Your EVVM ID
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

/**
 * Construct payment message for EIP-191 verification
 * Format: {evvmID},pay,{recipient},{token},{amount},{priorityFee},{nonce},{priorityFlag},{executor}
 */
export function constructPaymentMessage(payment: PaymentData): string {
  const recipient = payment.to_address.toLowerCase();
  const token = payment.token.toLowerCase();
  const executor = payment.executor.toLowerCase();
  const priorityFlag = payment.priorityFlag ? 'true' : 'false';

  const message = `${EVVM_ID},pay,${recipient},${token},${payment.amount},${payment.priorityFee},${payment.nonce},${priorityFlag},${executor}`;

  return message;
}

/**
 * Validate EIP-191 signature for payment
 * Returns true if signature is valid and from the claimed sender
 */
export async function validatePaymentSignature(payment: PaymentData): Promise<boolean> {
  try {
    // Construct the message that should have been signed
    const message = constructPaymentMessage(payment);

    console.log('Validating signature for message:', message);

    // Verify the signature and recover the signer
    const isValid = await verifyMessage({
      address: payment.from as `0x${string}`,
      message,
      signature: payment.signature as `0x${string}`,
    });

    if (!isValid) {
      console.log('❌ Invalid signature: signer mismatch');
      return false;
    }

    console.log('✓ Signature valid');
    return true;
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}
