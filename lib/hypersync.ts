/**
 * HyperSync Utility for PAYVVM Explorer
 *
 * Fetches transaction history from HyperSync without needing events
 */

import { HypersyncClient, TransactionField, BlockField } from '@envio-dev/hypersync-client';

// PAYVVM Contract Addresses on Sepolia
export const PAYVVM_CONTRACTS = {
  Evvm: '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e',
  Staking: '0x64A47d84dE05B9Efda4F63Fbca2Fc8cEb96E6816',
  NameService: '0xa4ba4e9270bde8fbbf4328925959287a72ba0a55',
  Treasury: '0x3d6cb29a1f97a2cff7a48af96f7ed3a02f6aa38e',
} as const;

export interface PayvvmTransaction {
  hash: string;
  blockNumber: number;
  timestamp?: number;
  from: string;
  to: string;
  value: string;
  input: string;
  gasUsed?: string;
  contractName: string;
}

/**
 * Create HyperSync client for Sepolia
 */
export function createHyperSyncClient() {
  return HypersyncClient.new({
    url: 'https://sepolia.hypersync.xyz',
  });
}

/**
 * Fetch recent transactions to PAYVVM contracts
 */
export async function fetchRecentTransactions(
  fromBlock: number,
  toBlock: number,
  limit = 50
): Promise<PayvvmTransaction[]> {
  const client = createHyperSyncClient();

  const query = {
    fromBlock,
    toBlock,
    transactions: [
      {
        to: Object.values(PAYVVM_CONTRACTS).map(addr => addr.toLowerCase()),
      },
    ],
    fieldSelection: {
      block: [
        BlockField.Number,
        BlockField.Timestamp,
        BlockField.Hash,
      ],
      transaction: [
        TransactionField.BlockNumber,
        TransactionField.TransactionIndex,
        TransactionField.Hash,
        TransactionField.From,
        TransactionField.To,
        TransactionField.Value,
        TransactionField.Input,
        TransactionField.GasUsed,
      ],
    },
  };

  try {
    const response = await client.get(query);

    // Map transactions to our interface
    const transactions: PayvvmTransaction[] = response.data.transactions.slice(0, limit).map((tx: any) => {
      // Find corresponding block for timestamp
      const block = response.data.blocks.find((b: any) => b.number === tx.blockNumber);

      // Determine which contract was called
      const contractEntry = Object.entries(PAYVVM_CONTRACTS).find(
        ([_, addr]) => addr.toLowerCase() === tx.to.toLowerCase()
      );
      const contractName = contractEntry?.[0] || 'Unknown';

      return {
        hash: tx.hash,
        blockNumber: typeof tx.blockNumber === 'bigint' ? Number(tx.blockNumber) : tx.blockNumber,
        timestamp: block?.timestamp ? (typeof block.timestamp === 'bigint' ? Number(block.timestamp) : block.timestamp) : undefined,
        from: tx.from,
        to: tx.to,
        value: typeof tx.value === 'bigint' ? tx.value.toString() : tx.value,
        input: tx.input,
        gasUsed: tx.gasUsed ? (typeof tx.gasUsed === 'bigint' ? tx.gasUsed.toString() : tx.gasUsed) : undefined,
        contractName,
      };
    });

    return transactions;
  } catch (error) {
    console.error('HyperSync query failed:', error);
    return [];
  }
}

/**
 * Fetch transactions for a specific address (sent or received)
 */
export async function fetchAddressTransactions(
  address: string,
  fromBlock: number,
  toBlock: number,
  limit = 50
): Promise<PayvvmTransaction[]> {
  const client = createHyperSyncClient();

  const query = {
    fromBlock,
    toBlock,
    transactions: [
      {
        // Transactions FROM this address to PAYVVM contracts
        from: [address.toLowerCase()],
        to: Object.values(PAYVVM_CONTRACTS).map(addr => addr.toLowerCase()),
      },
    ],
    fieldSelection: {
      block: [
        BlockField.Number,
        BlockField.Timestamp,
        BlockField.Hash,
      ],
      transaction: [
        TransactionField.BlockNumber,
        TransactionField.TransactionIndex,
        TransactionField.Hash,
        TransactionField.From,
        TransactionField.To,
        TransactionField.Value,
        TransactionField.Input,
        TransactionField.GasUsed,
      ],
    },
  };

  try {
    const response = await client.get(query);

    const transactions: PayvvmTransaction[] = response.data.transactions.slice(0, limit).map((tx: any) => {
      const block = response.data.blocks.find((b: any) => b.number === tx.blockNumber);

      const contractEntry = Object.entries(PAYVVM_CONTRACTS).find(
        ([_, addr]) => addr.toLowerCase() === tx.to.toLowerCase()
      );
      const contractName = contractEntry?.[0] || 'Unknown';

      return {
        hash: tx.hash,
        blockNumber: typeof tx.blockNumber === 'bigint' ? Number(tx.blockNumber) : tx.blockNumber,
        timestamp: block?.timestamp ? (typeof block.timestamp === 'bigint' ? Number(block.timestamp) : block.timestamp) : undefined,
        from: tx.from,
        to: tx.to,
        value: typeof tx.value === 'bigint' ? tx.value.toString() : tx.value,
        input: tx.input,
        gasUsed: tx.gasUsed ? (typeof tx.gasUsed === 'bigint' ? tx.gasUsed.toString() : tx.gasUsed) : undefined,
        contractName,
      };
    });

    return transactions;
  } catch (error) {
    console.error('HyperSync query failed:', error);
    return [];
  }
}

/**
 * Get current block number from RPC
 * (You'll need to import this from your RPC client)
 */
export async function getCurrentBlock(): Promise<number> {
  // This should use your existing RPC client
  // For now, return a reasonable estimate
  return 9483000; // Update this with actual RPC call
}
