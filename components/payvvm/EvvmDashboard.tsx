"use client";

import { formatEther } from 'viem';
import { useEvvmMetadata, useCurrentReward, useEvvmAdmin } from '~~/hooks/payvvm/useEvvmState';

export const EvvmDashboard = () => {
  const { data: metadata, isLoading: metadataLoading, refetch: refetchMetadata } = useEvvmMetadata();
  const { data: reward, refetch: refetchReward } = useCurrentReward();
  const { data: admin, refetch: refetchAdmin } = useEvvmAdmin();

  const handleRefresh = () => {
    refetchMetadata();
    refetchReward();
    refetchAdmin();
  };

  if (metadataLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-3">Loading EVVM state...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title text-2xl">EVVM System Status</h2>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={handleRefresh}
            title="Refresh data"
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

        <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
          <div className="stat">
            <div className="stat-title">Total Supply</div>
            <div className="stat-value text-primary text-2xl">
              {metadata?.totalSupply.toString() || '0'}
            </div>
            <div className="stat-desc">EVVM tokens in circulation</div>
          </div>

          <div className="stat">
            <div className="stat-title">Era Tokens</div>
            <div className="stat-value text-secondary text-2xl">
              {metadata?.eraTokens.toString() || '0'}
            </div>
            <div className="stat-desc">Tokens per era</div>
          </div>

          <div className="stat">
            <div className="stat-title">Current Reward</div>
            <div className="stat-value text-accent text-2xl">
              {reward ? formatEther(reward) : '0'}
            </div>
            <div className="stat-desc">MATE per transaction</div>
          </div>
        </div>

        <div className="divider"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm opacity-70">Principal Token Address</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-base-200 px-3 py-2 rounded-lg flex-1 break-all">
                {metadata?.principalTokenAddress || 'N/A'}
              </code>
              <button
                onClick={() =>
                  metadata?.principalTokenAddress &&
                  navigator.clipboard.writeText(metadata.principalTokenAddress)
                }
                className="btn btn-sm btn-ghost btn-square"
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm opacity-70">Admin Address</p>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-base-200 px-3 py-2 rounded-lg flex-1 break-all">
                {admin || 'N/A'}
              </code>
              <button
                onClick={() => admin && navigator.clipboard.writeText(admin)}
                className="btn btn-sm btn-ghost btn-square"
                title="Copy address"
              >
                📋
              </button>
            </div>
          </div>
        </div>

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
            This data is read directly from the EVVM contract on Ethereum Sepolia
          </span>
        </div>
      </div>
    </div>
  );
};
