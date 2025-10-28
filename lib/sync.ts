/**
 * Shared sync logic for batch operations
 */

import { fetchPayVVMTransactions } from '@/utils/hypersync';
import { storeTx, StoredTransaction } from '@/lib/kv';

export async function syncBatch(fromBlock: number, toBlock: number): Promise<{
  transactionsFound: number;
  transactionsStored: number;
}> {
  console.log(`[Sync Batch] Syncing blocks ${fromBlock} to ${toBlock}`);

  // Fetch transactions using existing HyperSync logic
  const transactions = await fetchPayVVMTransactions(
    '', // Empty address = fetch all transactions
    fromBlock,
    toBlock,
    1000 // Large limit since we're storing all
  );

  console.log(`[Sync Batch] Found ${transactions.length} transactions`);

  // Store each transaction in KV
  let storedCount = 0;
  for (const tx of transactions) {
    const storedTx: StoredTransaction = {
      hash: tx.hash,
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
      from: tx.from,
      to: tx.to,
      token: tx.token,
      amount: tx.amount,
      executedBy: tx.executedBy,
      txType: tx.txType,
      functionName: tx.functionName || 'unknown',
      gasUsed: tx.gasUsed,
      indexed_at: Date.now(),
    };

    await storeTx(storedTx);
    storedCount++;
  }

  console.log(`[Sync Batch] Stored ${storedCount} transactions`);

  return {
    transactionsFound: transactions.length,
    transactionsStored: storedCount,
  };
}
