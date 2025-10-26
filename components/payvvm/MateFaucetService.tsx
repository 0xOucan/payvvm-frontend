"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useMateFaucetService } from '~~/hooks/payvvm/useMateFaucetService';

export const MateFaucetService = () => {
  const { isConnected } = useAccount();
  const faucet = useMateFaucetService();
  const [claiming, setClaiming] = useState(false);

  // Auto-submit to fishing pool after signature is obtained
  useEffect(() => {
    if (faucet.signature && !claiming) {
      setClaiming(true);
      // Submit to fishing pool for fishers to execute
      faucet.submitToFishers().then(() => {
        console.log('✅ MATE faucet claim submitted to fishing pool - fishers will execute it');
        // Refresh balances after successful submission
        setTimeout(() => {
          faucet.refetchEligibility();
          faucet.refetchFaucetBalance();
          faucet.refetchUserBalance();
          setClaiming(false);
          faucet.reset();
        }, 3000);
      }).catch((error) => {
        console.error('Failed to submit claim to fishing pool:', error);
        setClaiming(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faucet.signature]);

  const handleClaim = async () => {
    try {
      await faucet.initiateClaim();
    } catch (error: any) {
      alert(error.message || 'Failed to initiate claim');
      console.error('Claim error:', error);
    }
  };

  // Format time remaining
  const formatTimeRemaining = (seconds: bigint): string => {
    const totalSeconds = Number(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  if (!isConnected) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">MATE Faucet (510 MATE)</h2>
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
            <span>Please connect your wallet to claim MATE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">MATE Faucet</h2>

        {/* Faucet Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Faucet Balance</div>
            <div className="stat-value text-2xl">
              {faucet.isLoadingFaucetBalance ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                `${(Number(faucet.faucetBalance) / 1e18).toFixed(2)} MATE`
              )}
            </div>
            <div className="stat-desc">Available to distribute</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Claim Amount</div>
            <div className="stat-value text-2xl">
              {faucet.isLoadingClaimAmount ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                `${(Number(faucet.claimAmount) / 1e18).toFixed(2)} MATE`
              )}
            </div>
            <div className="stat-desc">Per claim</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Your MATE Balance</div>
            <div className="stat-value text-2xl">
              {`${(Number(faucet.userMateBalance) / 1e18).toFixed(2)} MATE`}
            </div>
            <div className="stat-desc">In EVVM</div>
          </div>
        </div>

        {/* Eligibility Status */}
        <div className="alert alert-info mb-4">
          <div className="text-sm space-y-1">
            <div className="font-bold">Claim Status:</div>
            {faucet.isCheckingEligibility ? (
              <div className="flex items-center gap-2">
                <span className="loading loading-spinner loading-sm"></span>
                <span>Checking eligibility...</span>
              </div>
            ) : faucet.canClaim ? (
              <div className="text-success font-bold">✅ You can claim MATE now!</div>
            ) : (
              <div>
                <div className="text-warning font-bold">⏳ Cooldown active</div>
                <div className="text-xs mt-1">
                  Next claim available in: {formatTimeRemaining(faucet.remainingCooldown)}
                </div>
              </div>
            )}
            <div className="text-xs">
              Cooldown Period: {Number(faucet.cooldownPeriod) / 3600} hours
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="alert alert-info mb-4">
          <div className="text-xs space-y-1">
            <div className="font-bold">Faucet System Status:</div>
            <div>✓ EVVM ID: {faucet.evvmId?.toString()}</div>
            <div>
              {faucet.signature ? (
                <>✓ Signature obtained</>
              ) : faucet.isSigning ? (
                <>⏳ Waiting for signature...</>
              ) : (
                <>⏹ No signature</>
              )}
            </div>
            <div>
              {faucet.canClaim ? (
                <>✓ Eligible to claim</>
              ) : (
                <>❌ Cooldown active</>
              )}
            </div>
          </div>
        </div>

        {/* Claim Button */}
        <button
          className="btn btn-primary w-full"
          onClick={handleClaim}
          disabled={
            !faucet.canClaim ||
            faucet.isSigning ||
            claiming ||
            faucet.isLoadingMetadata ||
            !faucet.evvmId ||
            Number(faucet.faucetBalance) < Number(faucet.claimAmount)
          }
        >
          {faucet.isLoadingMetadata ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Loading EVVM Data...
            </>
          ) : Number(faucet.faucetBalance) < Number(faucet.claimAmount) ? (
            'Faucet Empty'
          ) : faucet.isSigning ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Sign Claim...
            </>
          ) : claiming ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Submitting to Fishers...
            </>
          ) : !faucet.canClaim ? (
            <>Wait {formatTimeRemaining(faucet.remainingCooldown)}</>
          ) : (
            'Claim MATE'
          )}
        </button>

        {/* Transaction Status */}
        {faucet.signature && !claiming && (
          <div className="alert alert-success mt-4">
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
            <span>Claim submitted to fishing pool! Fishers will execute it shortly.</span>
          </div>
        )}

        {faucet.signError && (
          <div className="alert alert-error mt-4">
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
              <span className="text-xs">
                {faucet.signError?.message}
              </span>
            </div>
          </div>
        )}

        {/* How it Works */}
        <div className="alert mt-4">
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
            <p className="font-bold">How the MATE faucet works:</p>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Sign claim message with your wallet (EIP-191)</li>
              <li>Submit signed claim to fishing pool</li>
              <li>Fisher executes your claim and pays gas</li>
              <li>Receive {(Number(faucet.claimAmount) / 1e18).toFixed(2)} MATE in your EVVM balance</li>
              <li>Wait {Number(faucet.cooldownPeriod) / 3600} hours before next claim</li>
            </ol>
          </div>
        </div>

        {/* Faucet Info */}
        <div className="divider">Faucet Info</div>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div>
            <span className="font-bold">MATE Token:</span>{' '}
            <span className="font-mono">0x0000...0001 (Protocol Constant)</span>
          </div>
          <div>
            <span className="font-bold">Faucet Contract:</span>{' '}
            <a
              href="https://sepolia.etherscan.io/address/0x068E9091e430786133439258C4BeeD696939405e"
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary font-mono"
            >
              0x068E...405e
            </a>
          </div>
          <div>
            <span className="font-bold">EVVM ID:</span>{' '}
            <span className="font-mono">{faucet.evvmId?.toString() || 'Loading...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
