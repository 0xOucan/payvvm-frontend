/**
 * Fisher Executor - Serverless-compatible execution utilities
 *
 * This module provides functions to execute EVVM transactions immediately
 * when users submit signed messages. Designed for Vercel serverless environment.
 */

import { createPublicClient, createWalletClient, http, fallback } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from '../lib/chains';

// Contract addresses
const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e' as const;
const PYUSD_FAUCET_ADDRESS = '0x74F7A28aF1241cfBeC7c6DBf5e585Afc18832a9a' as const;
const MATE_FAUCET_ADDRESS = '0x068E9091e430786133439258C4BeeD696939405e' as const;

// EVVM ABI
const EVVM_ABI = [
  {
    name: 'pay',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to_address', type: 'address' },
      { name: 'to_identity', type: 'string' },
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'priorityFee', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'priorityFlag', type: 'bool' },
      { name: 'executor', type: 'address' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'dispersePay',
    type: 'function',
    stateMutability: 'nonpayable',
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
    outputs: [],
  },
] as const;

// PYUSD Faucet ABI
const PYUSD_FAUCET_ABI = [
  {
    name: 'claimPyusd',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'claimer', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

// MATE Faucet ABI
const MATE_FAUCET_ABI = [
  {
    name: 'claimMate',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'claimer', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

export interface ExecutionResult {
  success: boolean;
  txHash?: string;
  error?: string;
  gasUsed?: string;
}

/**
 * Get fisher wallet client (cached per serverless invocation)
 */
let cachedClients: {
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
} | null = null;

function getFisherClients() {
  if (cachedClients) {
    return cachedClients;
  }

  const privateKey = process.env.FISHER_PRIVATE_KEY;
  if (!privateKey || !privateKey.startsWith('0x')) {
    throw new Error('FISHER_PRIVATE_KEY not configured');
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const gasLimit = Number(process.env.FISHER_GAS_LIMIT || 500000);

  // Create clients with fallback RPC configuration
  const rpcTransport = fallback(
    sepolia.rpcUrls.default.http.map((url) => http(url))
  );

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: rpcTransport,
  });

  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: rpcTransport,
  });

  cachedClients = { publicClient, walletClient };
  return cachedClients;
}

/**
 * Execute a payment transaction immediately
 */
export async function executePayment(tx: {
  from: string;
  to: string;
  token: string;
  amount: string;
  priorityFee: string;
  nonce: string;
  signature: string;
  executor: string;
  priorityFlag: boolean;
}): Promise<ExecutionResult> {
  try {
    const { publicClient, walletClient } = getFisherClients();
    const gasLimit = BigInt(process.env.FISHER_GAS_LIMIT || 500000);

    console.log('🎣 Executing payment transaction...');
    console.log(`   From: ${tx.from}`);
    console.log(`   To: ${tx.to}`);
    console.log(`   Amount: ${tx.amount}`);
    console.log(`   Priority Fee: ${tx.priorityFee}`);

    // Execute the payment
    // IMPORTANT: Lowercase to, token, and executor addresses to match signature construction
    const hash = await walletClient.writeContract({
      address: EVVM_ADDRESS,
      abi: EVVM_ABI,
      functionName: 'pay',
      args: [
        tx.from as `0x${string}`,
        tx.to.toLowerCase() as `0x${string}`,
        '', // to_identity
        tx.token.toLowerCase() as `0x${string}`,
        BigInt(tx.amount),
        BigInt(tx.priorityFee),
        BigInt(tx.nonce),
        tx.priorityFlag !== undefined ? tx.priorityFlag : false,
        (tx.executor || '0x0000000000000000000000000000000000000000').toLowerCase() as `0x${string}`,
        tx.signature as `0x${string}`,
      ],
      gas: gasLimit,
    });

    console.log(`⏳ Transaction submitted: ${hash}`);
    console.log(`   Waiting for confirmation...`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ Payment executed successfully!`);
      console.log(`   Gas used: ${receipt.gasUsed}`);
      console.log(`   Block: ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } else {
      console.log(`❌ Transaction failed`);
      return {
        success: false,
        error: 'Transaction reverted',
      };
    }
  } catch (error: any) {
    console.error(`❌ Error executing payment:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Execute a PYUSD faucet claim immediately
 */
export async function executePyusdFaucetClaim(claim: {
  claimer: string;
  nonce: string;
  signature: string;
}): Promise<ExecutionResult> {
  try {
    const { publicClient, walletClient } = getFisherClients();
    const gasLimit = BigInt(process.env.FISHER_GAS_LIMIT || 500000);

    console.log('💧 Executing PYUSD faucet claim...');
    console.log(`   Claimer: ${claim.claimer}`);
    console.log(`   Nonce: ${claim.nonce}`);

    // Execute the claim
    const hash = await walletClient.writeContract({
      address: PYUSD_FAUCET_ADDRESS,
      abi: PYUSD_FAUCET_ABI,
      functionName: 'claimPyusd',
      args: [
        claim.claimer as `0x${string}`,
        BigInt(claim.nonce),
        claim.signature as `0x${string}`,
      ],
      gas: gasLimit,
    });

    console.log(`⏳ Faucet claim submitted: ${hash}`);
    console.log(`   Waiting for confirmation...`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ PYUSD faucet claim successful!`);
      console.log(`   Gas used: ${receipt.gasUsed}`);
      console.log(`   Block: ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } else {
      console.log(`❌ Faucet claim failed`);
      return {
        success: false,
        error: 'Transaction reverted',
      };
    }
  } catch (error: any) {
    console.error(`❌ Error executing PYUSD faucet claim:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Execute a MATE faucet claim immediately
 */
export async function executeMateFaucetClaim(claim: {
  claimer: string;
  nonce: string;
  signature: string;
}): Promise<ExecutionResult> {
  try {
    const { publicClient, walletClient } = getFisherClients();
    const gasLimit = BigInt(process.env.FISHER_GAS_LIMIT || 500000);

    console.log('🍯 Executing MATE faucet claim...');
    console.log(`   Claimer: ${claim.claimer}`);
    console.log(`   Nonce: ${claim.nonce}`);

    // Execute the claim
    const hash = await walletClient.writeContract({
      address: MATE_FAUCET_ADDRESS,
      abi: MATE_FAUCET_ABI,
      functionName: 'claimMate',
      args: [
        claim.claimer as `0x${string}`,
        BigInt(claim.nonce),
        claim.signature as `0x${string}`,
      ],
      gas: gasLimit,
    });

    console.log(`⏳ MATE faucet claim submitted: ${hash}`);
    console.log(`   Waiting for confirmation...`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ MATE faucet claim successful!`);
      console.log(`   Gas used: ${receipt.gasUsed}`);
      console.log(`   Block: ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } else {
      console.log(`❌ MATE faucet claim failed`);
      return {
        success: false,
        error: 'Transaction reverted',
      };
    }
  } catch (error: any) {
    console.error(`❌ Error executing MATE faucet claim:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Execute a dispersePay transaction (payroll distribution) immediately
 */
export async function executeDispersePay(tx: {
  from: string;
  recipients: Array<{
    amount: string;
    to_address: string;
    to_identity: string;
  }>;
  token: string;
  amount: string;
  priorityFee: string;
  nonce: string;
  signature: string;
  executor: string;
  priorityFlag: boolean;
}): Promise<ExecutionResult> {
  try {
    const { publicClient, walletClient } = getFisherClients();
    const gasLimit = BigInt(process.env.FISHER_GAS_LIMIT || 500000);

    console.log('💸 Executing dispersePay transaction...');
    console.log(`   From: ${tx.from}`);
    console.log(`   Recipients: ${tx.recipients.length}`);
    console.log(`   Total Amount: ${tx.amount}`);
    console.log(`   Priority Fee: ${tx.priorityFee}`);

    // Convert recipients to proper format with lowercase addresses (must match signature)
    const recipientsData = tx.recipients.map(r => ({
      amount: BigInt(r.amount),
      to_address: r.to_address.toLowerCase() as `0x${string}`,
      to_identity: r.to_identity || '',
    }));

    // Execute the dispersePay
    // IMPORTANT: Lowercase token and executor addresses to match signature construction
    const hash = await walletClient.writeContract({
      address: EVVM_ADDRESS,
      abi: EVVM_ABI,
      functionName: 'dispersePay',
      args: [
        tx.from as `0x${string}`,
        recipientsData,
        tx.token.toLowerCase() as `0x${string}`,
        BigInt(tx.amount),
        BigInt(tx.priorityFee),
        BigInt(tx.nonce),
        tx.priorityFlag !== undefined ? tx.priorityFlag : false,
        (tx.executor || '0x0000000000000000000000000000000000000000').toLowerCase() as `0x${string}`,
        tx.signature as `0x${string}`,
      ],
      gas: gasLimit,
    });

    console.log(`⏳ dispersePay submitted: ${hash}`);
    console.log(`   Waiting for confirmation...`);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    if (receipt.status === 'success') {
      console.log(`✅ dispersePay executed successfully!`);
      console.log(`   Gas used: ${receipt.gasUsed}`);
      console.log(`   Block: ${receipt.blockNumber}`);

      return {
        success: true,
        txHash: hash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } else {
      console.log(`❌ dispersePay failed`);
      return {
        success: false,
        error: 'Transaction reverted',
      };
    }
  } catch (error: any) {
    console.error(`❌ Error executing dispersePay:`, error);
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}

/**
 * Check if fisher is enabled
 */
export function isFisherEnabled(): boolean {
  return process.env.FISHER_ENABLED === 'true' && !!process.env.FISHER_PRIVATE_KEY;
}
