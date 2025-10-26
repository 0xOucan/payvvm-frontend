"use client";

import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMateFaucet } from '~~/hooks/payvvm/useMateFaucet';
import { useMateBalance } from '~~/hooks/payvvm/useMatePayment';

const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e';

export const MateFaucet = () => {
  const { address, isConnected } = useAccount();
  const faucet = useMateFaucet();
  const balance = useMateBalance();

  // Refetch balance after successful claim
  useEffect(() => {
    if (faucet.isSuccess) {
      // Add delay to ensure blockchain state has propagated
      const timer = setTimeout(() => {
        balance.refetch();
      }, 500);

      // Auto-reset after 5 seconds
      const resetTimer = setTimeout(() => {
        faucet.reset();
      }, 5000);

      return () => {
        clearTimeout(timer);
        clearTimeout(resetTimer);
      };
    }
  }, [faucet.isSuccess, faucet, balance]);

  const handleClaim = () => {
    try {
      faucet.claimTokens();
    } catch (error) {
      console.error('Faucet error:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">MATE Token Faucet</h2>
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
            <span>Please connect your wallet to claim MATE tokens</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">
          🎰 MATE Token Faucet
        </h2>

        {/* Current Balance */}
        <div className="stat bg-base-200 rounded-lg mb-4">
          <div className="stat-title">Your EVVM Balance</div>
          <div className="stat-value text-2xl">
            {balance.isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              `${parseFloat(balance.formatted).toFixed(4)} MATE`
            )}
          </div>
          <div className="stat-desc">Current balance in EVVM</div>
        </div>

        {/* Faucet Info */}
        <div className="alert alert-info mb-4">
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
          <div className="text-sm">
            <p className="font-bold mb-2">How the faucet works:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Reward formula: 2.5 MATE × random(1-5083)</li>
              <li>Expected reward: <strong>2.5 to 12,707.5 MATE tokens</strong></li>
              <li>More than enough for username registration (500 MATE)</li>
              <li>Testnet only - claim as many times as you need!</li>
            </ul>
          </div>
        </div>

        {/* Claim Button */}
        <button
          className="btn btn-primary btn-lg w-full mb-4"
          onClick={handleClaim}
          disabled={faucet.isPending || faucet.isConfirming}
        >
          {faucet.isPending ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Waiting for confirmation...
            </>
          ) : faucet.isConfirming ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Confirming transaction...
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Claim MATE Tokens
            </>
          )}
        </button>

        {/* Success Message */}
        {faucet.isSuccess && (
          <div className="alert alert-success">
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex flex-col">
              <span className="font-bold">MATE tokens claimed successfully!</span>
              <span className="text-xs">Your balance will update automatically in ~1 second</span>
              {faucet.hash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${faucet.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link link-primary text-xs mt-1"
                >
                  View transaction on Etherscan →
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {faucet.error && (
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
            <div className="flex flex-col">
              <span className="font-bold">Claim failed</span>
              <span className="text-xs">{faucet.error.message}</span>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-info shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <div className="text-sm">
            <p className="font-bold">What can you do with MATE tokens?</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Send gasless payments within EVVM</li>
              <li>Register usernames (costs 500 MATE)</li>
              <li>Pay for EVVM services</li>
              <li>Use as priority fees for faster transaction execution</li>
            </ul>
          </div>
        </div>

        {/* Contract Info */}
        <div className="divider">Contract Info</div>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div>
            <span className="font-bold">MATE Token:</span>{' '}
            <span className="font-mono">0x0000...0001 (Protocol Constant)</span>
          </div>
          <div>
            <span className="font-bold">EVVM Contract:</span>{' '}
            <a
              href={`https://sepolia.etherscan.io/address/${EVVM_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary font-mono"
            >
              {EVVM_ADDRESS.slice(0, 6)}...{EVVM_ADDRESS.slice(-4)}
            </a>
          </div>
          <div>
            <span className="font-bold">Network:</span>{' '}
            <span>Ethereum Sepolia Testnet</span>
          </div>
        </div>
      </div>
    </div>
  );
};
