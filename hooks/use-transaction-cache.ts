/**
 * Transaction Cache Hook
 *
 * Scans and caches all PayVVM transactions for connected address
 * Stores in localStorage with TTL (expires after 5 minutes)
 */

import { useState, useEffect, useCallback } from 'react';

interface Transaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  token: string;
  amount: string;
  type: 'send' | 'receive';
  executedBy: string;
  txType: 'payment' | 'faucet_claim' | 'staking' | 'treasury' | 'unknown';
  functionName: string;
  gasUsed?: string;
}

interface CachedData {
  transactions: Transaction[];
  metadata: {
    totalTransactions: number;
    chunksScanned: number;
    totalBlocks: number;
    fromBlock: number;
    toBlock: number;
    scannedAt: number;
  };
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_KEY_PREFIX = 'payvvm_tx_cache_';
const CACHE_SESSION_KEY = 'payvvm_cache_session';

export function useTransactionCache(address: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<CachedData['metadata'] | null>(null);

  // Get cache key for address
  const getCacheKey = (addr: string) => `${CACHE_KEY_PREFIX}${addr.toLowerCase()}`;

  // Load from cache
  const loadFromCache = useCallback((addr: string): CachedData | null => {
    try {
      const cached = localStorage.getItem(getCacheKey(addr));
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);

      // Check if cache is expired
      const age = Date.now() - data.metadata.scannedAt;
      if (age > CACHE_TTL) {
        console.log('[Transaction Cache] Cache expired, clearing...');
        localStorage.removeItem(getCacheKey(addr));
        return null;
      }

      // Sort transactions by block number (newest first) when loading from cache
      data.transactions.sort((a, b) => b.blockNumber - a.blockNumber);

      console.log(
        `[Transaction Cache] Loaded ${data.transactions.length} txs from cache (age: ${Math.floor(age / 1000)}s)`
      );
      return data;
    } catch (err) {
      console.error('[Transaction Cache] Error loading from cache:', err);
      return null;
    }
  }, []);

  // Save to cache
  const saveToCache = useCallback((addr: string, data: CachedData) => {
    try {
      localStorage.setItem(getCacheKey(addr), JSON.stringify(data));
      console.log(`[Transaction Cache] Saved ${data.transactions.length} txs to cache`);
    } catch (err) {
      console.error('[Transaction Cache] Error saving to cache:', err);
    }
  }, []);

  // Scan blockchain for transactions
  const scanTransactions = useCallback(async (addr: string, force: boolean = false) => {
    // Check cache first
    if (!force) {
      const cached = loadFromCache(addr);
      if (cached) {
        setTransactions(cached.transactions);
        setMetadata(cached.metadata);
        return cached.transactions;
      }
    }

    // No cache or force refresh - scan blockchain
    setIsScanning(true);
    setError(null);

    try {
      console.log(`[Transaction Cache] Starting blockchain scan for ${addr}`);

      const response = await fetch('/api/transactions/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr }),
      });

      if (!response.ok) {
        throw new Error(`Scan failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Scan failed');
      }

      // Sort transactions by block number (newest first)
      const sortedTransactions = data.transactions.sort((a, b) => b.blockNumber - a.blockNumber);

      // Update state
      setTransactions(sortedTransactions);
      setMetadata(data.metadata);

      // Save to cache
      saveToCache(addr, {
        transactions: sortedTransactions,
        metadata: data.metadata,
      });

      console.log(
        `[Transaction Cache] Scan complete! Found ${sortedTransactions.length} transactions`
      );

      return sortedTransactions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan transactions';
      console.error('[Transaction Cache] Scan error:', errorMessage);
      setError(errorMessage);
      return [];
    } finally {
      setIsScanning(false);
    }
  }, [loadFromCache, saveToCache]);

  // Clear cache on page refresh (detect new session)
  useEffect(() => {
    const sessionId = sessionStorage.getItem(CACHE_SESSION_KEY);
    if (!sessionId) {
      // New session detected - clear all transaction caches
      console.log('[Transaction Cache] New session detected, clearing all caches');
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(CACHE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      // Mark this session
      sessionStorage.setItem(CACHE_SESSION_KEY, Date.now().toString());
    }
  }, []);

  // Auto-load on address change
  useEffect(() => {
    if (!address) {
      setTransactions([]);
      setMetadata(null);
      return;
    }

    setIsLoading(true);

    // Try to load from cache
    const cached = loadFromCache(address);
    if (cached) {
      setTransactions(cached.transactions);
      setMetadata(cached.metadata);
      setIsLoading(false);
    } else {
      // Trigger scan
      scanTransactions(address).finally(() => setIsLoading(false));
    }
  }, [address, loadFromCache, scanTransactions]);

  // Manual refresh function
  const refresh = useCallback(() => {
    if (address) {
      return scanTransactions(address, true);
    }
  }, [address, scanTransactions]);

  // Clear cache function
  const clearCache = useCallback(() => {
    if (address) {
      localStorage.removeItem(getCacheKey(address));
      setTransactions([]);
      setMetadata(null);
      console.log('[Transaction Cache] Cache cleared');
    }
  }, [address]);

  return {
    transactions,
    isLoading: isLoading || isScanning,
    isScanning,
    error,
    metadata,
    refresh,
    clearCache,
  };
}
