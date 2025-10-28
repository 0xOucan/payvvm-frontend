/**
 * Mock KV storage for local development
 * Uses JSON file instead of Vercel KV
 */

import fs from 'fs';
import path from 'path';
import { StoredTransaction } from './kv';

const DB_PATH = path.join(process.cwd(), '.data', 'payvvm-transactions.json');

interface MockDB {
  transactions: Record<string, StoredTransaction>;
  userTxs: Record<string, Array<{ timestamp: number; hash: string }>>;
  txsByBlock: Array<{ blockNumber: number; hash: string }>;
  syncProgress: { lastBlock: number; lastSync: number };
}

// Initialize DB
function initDB(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const emptyDB: MockDB = {
      transactions: {},
      userTxs: {},
      txsByBlock: [],
      syncProgress: { lastBlock: 9455840, lastSync: 0 },
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(emptyDB, null, 2));
  }
}

function readDB(): MockDB {
  initDB();
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function writeDB(db: MockDB): void {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/**
 * Store a transaction
 */
export async function storeTx(tx: StoredTransaction): Promise<void> {
  const db = readDB();

  // Store transaction
  db.transactions[tx.hash.toLowerCase()] = tx;

  // Add to user's transactions
  const fromKey = tx.from.toLowerCase();
  const toKey = tx.to.toLowerCase();

  if (!db.userTxs[fromKey]) db.userTxs[fromKey] = [];
  if (!db.userTxs[toKey]) db.userTxs[toKey] = [];

  // Add if not already present
  if (!db.userTxs[fromKey].some(t => t.hash === tx.hash)) {
    db.userTxs[fromKey].push({ timestamp: tx.timestamp, hash: tx.hash });
  }
  if (!db.userTxs[toKey].some(t => t.hash === tx.hash)) {
    db.userTxs[toKey].push({ timestamp: tx.timestamp, hash: tx.hash });
  }

  // Add to global transactions by block
  if (!db.txsByBlock.some(t => t.hash === tx.hash)) {
    db.txsByBlock.push({ blockNumber: tx.blockNumber, hash: tx.hash });
  }

  writeDB(db);
}

/**
 * Get user's transactions (paginated)
 */
export async function getUserTxs(
  address: string,
  limit: number = 50,
  offset: number = 0
): Promise<StoredTransaction[]> {
  const db = readDB();
  const userKey = address.toLowerCase();
  const userTxList = db.userTxs[userKey] || [];

  // Sort by timestamp DESC
  const sorted = [...userTxList].sort((a, b) => b.timestamp - a.timestamp);

  // Paginate
  const page = sorted.slice(offset, offset + limit);

  // Fetch full transaction data
  return page.map(item => db.transactions[item.hash]).filter(Boolean);
}

/**
 * Get transactions by block range
 */
export async function getTxsByBlockRange(
  fromBlock: number,
  toBlock: number,
  limit: number = 100
): Promise<StoredTransaction[]> {
  const db = readDB();

  // Filter by block range
  const filtered = db.txsByBlock.filter(
    item => item.blockNumber >= fromBlock && item.blockNumber <= toBlock
  );

  // Sort by block DESC
  const sorted = [...filtered].sort((a, b) => b.blockNumber - a.blockNumber);

  // Limit and fetch
  return sorted
    .slice(0, limit)
    .map(item => db.transactions[item.hash])
    .filter(Boolean);
}

/**
 * Get sync progress
 */
export async function getSyncProgress(): Promise<{ lastBlock: number; lastSync: number }> {
  const db = readDB();
  return db.syncProgress;
}

/**
 * Update sync progress
 */
export async function updateSyncProgress(lastBlock: number): Promise<void> {
  const db = readDB();
  db.syncProgress = {
    lastBlock,
    lastSync: Date.now(),
  };
  writeDB(db);
}

/**
 * Get total transaction count for address
 */
export async function getUserTxCount(address: string): Promise<number> {
  const db = readDB();
  const userKey = address.toLowerCase();
  return (db.userTxs[userKey] || []).length;
}

/**
 * Get stats for admin dashboard
 */
export async function getStats(): Promise<{
  totalTransactions: number;
  totalUsers: number;
  lastSyncedBlock: number;
  dbSizeKB: number;
}> {
  const db = readDB();
  const stats = fs.statSync(DB_PATH);

  return {
    totalTransactions: Object.keys(db.transactions).length,
    totalUsers: Object.keys(db.userTxs).length,
    lastSyncedBlock: db.syncProgress.lastBlock,
    dbSizeKB: Math.round(stats.size / 1024),
  };
}
