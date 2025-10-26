"use client";

import { formatEther } from 'viem';
import { useAccount } from 'wagmi';
import { Address } from '~~/components/scaffold-eth';
import { useUserAccount } from '~~/hooks/payvvm/useEvvmState';

export const AccountViewer = ({ address }: { address?: `0x${string}` }) => {
  const { address: connectedAddress } = useAccount();
  const targetAddress = address || connectedAddress;

  const { data, isLoading, refetch } = useUserAccount(targetAddress);

  if (!targetAddress) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="alert alert-warning">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>Connect your wallet or search for an address to view account state</span>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
            <span className="ml-3">Loading account state...</span>
          </div>
        </div>
      </div>
    );
  }

  const [balance, isStaker, nonce] = data || [];

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between mb-4">
          <h2 className="card-title text-2xl">Account State</h2>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={() => refetch()}
            title="Refresh account data"
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

        <div className="space-y-6">
          {/* Address */}
          <div className="bg-base-200 p-4 rounded-lg">
            <p className="text-sm opacity-70 mb-2">Address</p>
            <div className="flex items-center gap-2">
              <Address address={targetAddress} />
            </div>
          </div>

          {/* MATE Balance */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg">
            <p className="text-sm opacity-70 mb-2">MATE Balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-bold">
                {balance?.result ? parseFloat(formatEther(balance.result)).toFixed(4) : '0.0000'}
              </p>
              <span className="text-lg opacity-70">MATE</span>
            </div>
            <p className="text-xs opacity-60 mt-2">
              Raw: {balance?.result?.toString() || '0'}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Staker Status */}
            <div className="bg-base-200 p-4 rounded-lg">
              <p className="text-sm opacity-70 mb-3">Staker Status</p>
              <div className="flex items-center gap-2">
                {isStaker?.result ? (
                  <>
                    <div className="badge badge-success gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        className="inline-block w-4 h-4 stroke-current"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                      Active Staker
                    </div>
                    <span className="text-2xl">🌟</span>
                  </>
                ) : (
                  <div className="badge badge-ghost gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      className="inline-block w-4 h-4 stroke-current"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      ></path>
                    </svg>
                    Not Staking
                  </div>
                )}
              </div>
            </div>

            {/* Sync Nonce */}
            <div className="bg-base-200 p-4 rounded-lg">
              <p className="text-sm opacity-70 mb-3">Sync Nonce</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold font-mono">
                  {nonce?.result?.toString() || '0'}
                </p>
                <span className="text-sm opacity-60">transactions</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm flex-1"
              onClick={() => refetch()}
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
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              Refresh
            </button>
            <a
              href={`https://sepolia.etherscan.io/address/${targetAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm flex-1"
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
              View on Etherscan
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
