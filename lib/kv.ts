/**
 * Vercel KV client for PayVVM transaction storage
 *
 * Stores EVVM internal transactions (MATE and PYUSD) executed via fisher network
 */

import { kv } from '@vercel/kv';

export interface StoredTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;  // Original signer (extracted from signature)
  to: string;    // Recipient
  token: string; // MATE (0x0...01) or PYUSD (0xCaC524...)
  amount: string;
  executedBy: string; // Fisher address (0x121c631B7aEa24316bD90B22C989Ca008a84E5Ed)
  txType: 'payment' | 'faucet_claim' | 'staking' | 'treasury' | 'unknown';
  functionName: string;
  gasUsed?: string;
  indexed_at: number; // Unix timestamp when indexed
}

// KV Key patterns
export const KV_KEYS = {
  // Individual transaction: payvvm:tx:{hash}
  tx: (hash: string) => `payvvm:tx:${hash.toLowerCase()}`,

  // User transactions sorted set: payvvm:txs:user:{address}
  // Score = timestamp, allows range queries by time
  userTxs: (address: string) => `payvvm:txs:user:${address.toLowerCase()}`,

  // All transactions sorted by block number
  txsByBlock: () => `payvvm:txs:by-block`,

  // Sync progress tracker
  syncProgress: () => `payvvm:sync:progress`,
};

/**
 * Store a transaction in KV
 */
export async function storeTx(tx: StoredTransaction): Promise<void> {
  const pipeline = kv.pipeline();

  // Store transaction data
  pipeline.set(KV_KEYS.tx(tx.hash), tx);

  // Add to user's transaction list (sorted by timestamp)
  pipeline.zadd(KV_KEYS.userTxs(tx.from), { score: tx.timestamp, member: tx.hash });
  pipeline.zadd(KV_KEYS.userTxs(tx.to), { score: tx.timestamp, member: tx.hash });

  // Add to global transactions (sorted by block)
  pipeline.zadd(KV_KEYS.txsByBlock(), { score: tx.blockNumber, member: tx.hash });

  await pipeline.exec();
}

/**
 * Get user's transactions (paginated)
 */
export async function getUserTxs(
  address: string,
  limit: number = 50,
  offset: number = 0
): Promise<StoredTransaction[]> {
  // Get transaction hashes sorted by timestamp (newest first)
  const hashes = await kv.zrange(
    KV_KEYS.userTxs(address),
    offset,
    offset + limit - 1,
    { rev: true }
  );

  if (!hashes || hashes.length === 0) return [];

  // Fetch full transaction data
  const pipeline = kv.pipeline();
  for (const hash of hashes) {
    pipeline.get<StoredTransaction>(KV_KEYS.tx(hash as string));
  }

  const results = await pipeline.exec();
  return results.filter(Boolean) as StoredTransaction[];
}

/**
 * Get transactions by block range
 */
export async function getTxsByBlockRange(
  fromBlock: number,
  toBlock: number,
  limit: number = 100
): Promise<StoredTransaction[]> {
  // Get transaction hashes in block range
  const hashes = await kv.zrange(
    KV_KEYS.txsByBlock(),
    fromBlock,
    toBlock,
    { byScore: true, rev: true }
  );

  if (!hashes || hashes.length === 0) return [];

  // Limit results
  const limitedHashes = hashes.slice(0, limit);

  // Fetch full transaction data
  const pipeline = kv.pipeline();
  for (const hash of limitedHashes) {
    pipeline.get<StoredTransaction>(KV_KEYS.tx(hash as string));
  }

  const results = await pipeline.exec();
  return results.filter(Boolean) as StoredTransaction[];
}

/**
 * Get sync progress (last synced block)
 */
export async function getSyncProgress(): Promise<{ lastBlock: number; lastSync: number }> {
  const progress = await kv.get<{ lastBlock: number; lastSync: number }>(KV_KEYS.syncProgress());
  return progress || { lastBlock: 9455840, lastSync: 0 }; // Start from EVVM creation - 1
}

/**
 * Update sync progress
 */
export async function updateSyncProgress(lastBlock: number): Promise<void> {
  await kv.set(KV_KEYS.syncProgress(), {
    lastBlock,
    lastSync: Date.now(),
  });
}

/**
 * Get total transaction count for address
 */
export async function getUserTxCount(address: string): Promise<number> {
  return await kv.zcard(KV_KEYS.userTxs(address)) || 0;
}
