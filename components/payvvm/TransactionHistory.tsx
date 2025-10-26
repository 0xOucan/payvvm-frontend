"use client";

import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';

interface PayvvmTransaction {
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

interface TransactionHistoryProps {
  address?: `0x${string}`;
  limit?: number;
}

export const TransactionHistory = ({ address, limit = 20 }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<PayvvmTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const publicClient = usePublicClient();

  const loadTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current block number
      const currentBlock = await publicClient?.getBlockNumber();
      if (!currentBlock) {
        throw new Error('Failed to get current block number');
      }

      // Query last 10,000 blocks
      const fromBlock = Number(currentBlock) - 10000;
      const toBlock = Number(currentBlock);

      // Call our API route instead of HyperSync directly (HyperSync runs server-side only)
      const params = new URLSearchParams({
        fromBlock: fromBlock.toString(),
        toBlock: toBlock.toString(),
        limit: limit.toString(),
      });

      if (address) {
        params.append('address', address);
      }

      const response = await fetch(`/api/transactions?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch transactions');
      }

      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Error loading transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [address, limit]);

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">
            {address ? 'Account Transactions' : 'Recent Transactions'}
          </h2>
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-3">Loading transactions from HyperSync...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Transaction History</h2>
          <div className="alert alert-error">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
          <button className="btn btn-primary mt-4" onClick={loadTransactions}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title text-2xl">
            {address ? `Transactions for ${formatAddress(address)}` : 'Recent PAYVVM Transactions'}
          </h2>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={loadTransactions}
            title="Refresh transactions"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <div className="badge badge-primary">HyperSync Powered</div>
          <div className="badge badge-secondary">Last 10,000 blocks</div>
          <div className="badge badge-accent">{transactions.length} transactions</div>
        </div>

        {transactions.length === 0 ? (
          <div className="alert alert-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="stroke-current shrink-0 w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
            <span>No transactions found in the last 10,000 blocks</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Tx Hash</th>
                  <th>Block</th>
                  <th>Time</th>
                  <th>From</th>
                  <th>Contract</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.hash} className="hover">
                    <td>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-primary font-mono text-xs"
                      >
                        {formatAddress(tx.hash)}
                      </a>
                    </td>
                    <td className="font-mono text-sm">{tx.blockNumber.toLocaleString()}</td>
                    <td className="text-xs opacity-70">{formatTimestamp(tx.timestamp)}</td>
                    <td>
                      <a
                        href={`https://sepolia.etherscan.io/address/${tx.from}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link link-secondary font-mono text-xs"
                      >
                        {formatAddress(tx.from)}
                      </a>
                    </td>
                    <td>
                      <span className="badge badge-outline">{tx.contractName}</span>
                    </td>
                    <td>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-xs btn-ghost"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="alert alert-info mt-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span className="text-sm">
            Transactions fetched from HyperSync (2000x faster than RPC!) - No events needed!
          </span>
        </div>
      </div>
    </div>
  );
};
