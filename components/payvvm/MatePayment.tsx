"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { useMatePayment, useMateBalance } from '~~/hooks/payvvm/useMatePayment';

const EVVM_ADDRESS = '0x9486f6C9d28ECdd95aba5bfa6188Bbc104d89C3e';

export const MatePayment = () => {
  const { isConnected } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [priorityFee, setPriorityFee] = useState('0');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const mateBalance = useMateBalance();
  const payment = useMatePayment();

  // Auto-submit to fishing pool after signature is obtained
  useEffect(() => {
    if (payment.signature && !payment.hash && !payment.isExecuting) {
      // Submit to fishing pool for fishers to execute
      payment.submitToFishers().then(() => {
        console.log('✅ MATE payment submitted to fishing pool - fishers will execute it');
      }).catch((error) => {
        console.error('Failed to submit MATE payment to fishing pool, executing directly:', error);
        // Fallback to direct execution if fishing pool fails
        payment.executePayment();
      });
    }
  }, [payment]);

  // Reset form after successful payment with auto-refresh
  useEffect(() => {
    if (payment.isSuccess) {
      // Add delay to ensure blockchain state has propagated before refetching
      const refetchTimer = setTimeout(() => {
        mateBalance.refetch();
      }, 500);

      setRecipient('');
      setAmount('');
      setPriorityFee('0');

      // Auto-reset after 3 seconds
      const resetTimer = setTimeout(() => {
        payment.reset();
      }, 3000);

      return () => {
        clearTimeout(refetchTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [payment.isSuccess, payment, mateBalance]);

  const handleSendPayment = async () => {
    // Validation
    if (!recipient || !isAddress(recipient)) {
      alert('Please enter a valid recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(mateBalance.formatted);

    if (amountNum > balanceNum) {
      alert('Insufficient MATE balance in EVVM');
      return;
    }

    try {
      // Initiate payment (will sign and then auto-execute)
      await payment.initiatePayment(recipient, amount, priorityFee);
    } catch (error) {
      // Error will be shown in the error alert below
      console.error('Payment error:', error);
    }
  };

  if (!isConnected) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">Send MATE Payment</h2>
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
            <span>Please connect your wallet to send payments</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">Send MATE Payment</h2>

        {/* Balance Display */}
        <div className="stat bg-base-200 rounded-lg mb-4">
          <div className="stat-title">Your EVVM Balance</div>
          <div className="stat-value text-2xl">
            {mateBalance.isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              `${parseFloat(mateBalance.formatted).toFixed(4)} MATE`
            )}
          </div>
          <div className="stat-desc">Available to send</div>
        </div>

        {/* Debug Info */}
        <div className="alert alert-info">
          <div className="text-xs space-y-1">
            <div className="font-bold">Payment System Status:</div>
            <div>✓ EVVM ID: {payment.evvmId?.toString()}</div>
            <div>
              {payment.isLoadingNonce ? (
                <>⏳ Loading nonce...</>
              ) : payment.currentNonce !== undefined ? (
                <>✓ Nonce: {payment.currentNonce?.toString()}</>
              ) : (
                <>❌ Nonce not loaded</>
              )}
            </div>
            <div>
              {recipient && isAddress(recipient) ? (
                <>✓ Valid recipient</>
              ) : recipient ? (
                <>❌ Invalid address</>
              ) : (
                <>⏹ No recipient</>
              )}
            </div>
            <div>
              {amount && parseFloat(amount) > 0 ? (
                <>✓ Valid amount: {amount} MATE</>
              ) : (
                <>⏹ No amount</>
              )}
            </div>
          </div>
        </div>

        {/* Loading EVVM Metadata */}
        {(payment.isLoadingMetadata || payment.isLoadingNonce) && (
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
            <span className="flex items-center gap-2">
              <span className="loading loading-spinner loading-sm"></span>
              Loading EVVM data...
            </span>
          </div>
        )}

        {/* Payment Form */}
        <div className="space-y-4">
          {/* Recipient Address */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Recipient Address</span>
            </label>
            <input
              type="text"
              placeholder="0x..."
              className={`input input-bordered ${
                recipient && !isAddress(recipient) ? 'input-error' : ''
              }`}
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            {recipient && !isAddress(recipient) && (
              <label className="label">
                <span className="label-text-alt text-error">Invalid address format</span>
              </label>
            )}
          </div>

          {/* Amount */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Amount (MATE)</span>
              <span className="label-text-alt">
                Max: {parseFloat(mateBalance.formatted).toFixed(4)}
              </span>
            </label>
            <div className="join">
              <input
                type="number"
                placeholder="0.00"
                className="input input-bordered join-item flex-1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
              />
              <button
                className="btn join-item"
                onClick={() => setAmount(mateBalance.formatted)}
              >
                MAX
              </button>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="collapse collapse-arrow bg-base-200">
            <input
              type="checkbox"
              checked={showAdvanced}
              onChange={(e) => setShowAdvanced(e.target.checked)}
            />
            <div className="collapse-title font-medium">Advanced Options</div>
            <div className="collapse-content">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Priority Fee (MATE)</span>
                  <span className="label-text-alt">Optional fisher reward</span>
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  className="input input-bordered input-sm"
                  value={priorityFee}
                  onChange={(e) => setPriorityFee(e.target.value)}
                  step="0.01"
                  min="0"
                />
                <label className="label">
                  <span className="label-text-alt">
                    Reward for stakers who execute your transaction
                  </span>
                </label>
              </div>

              <div className="alert alert-info mt-2">
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
                <span className="text-xs">
                  Current Nonce: {payment.currentNonce?.toString() || 'Loading...'}
                </span>
              </div>
            </div>
          </div>

          {/* Send Button */}
          <button
            className="btn btn-primary w-full"
            onClick={handleSendPayment}
            disabled={
              !recipient ||
              !isAddress(recipient) ||
              !amount ||
              parseFloat(amount) <= 0 ||
              payment.isSigning ||
              payment.isExecuting ||
              payment.isConfirming ||
              payment.isLoadingMetadata ||
              payment.isLoadingNonce ||
              !payment.evvmId ||
              payment.currentNonce === undefined
            }
          >
            {payment.isLoadingMetadata || payment.isLoadingNonce ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Loading EVVM Data...
              </>
            ) : payment.isSigning ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Sign Payment...
              </>
            ) : payment.isExecuting || payment.isConfirming ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                {payment.isExecuting ? 'Sending Payment...' : 'Confirming...'}
              </>
            ) : (
              'Send Payment'
            )}
          </button>

          {/* Transaction Status */}
          {payment.signature && !payment.hash && (
            <div className="alert alert-info">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Signature obtained! Executing payment...</span>
            </div>
          )}

          {payment.isSuccess && (
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
                <span className="font-bold">Payment successful!</span>
                {payment.hash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${payment.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary text-xs mt-1"
                  >
                    View on Etherscan →
                  </a>
                )}
              </div>
            </div>
          )}

          {(payment.signError || payment.executeError) && (
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
                <span className="font-bold">Transaction failed</span>
                <span className="text-xs">
                  {payment.signError?.message || payment.executeError?.message}
                </span>
              </div>
            </div>
          )}

          {/* How it Works */}
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
              <p className="font-bold">How EVVM MATE payments work:</p>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Sign payment message with your wallet (EIP-191)</li>
                <li>Submit signed payment to EVVM contract</li>
                <li>MATE transfers within EVVM instantly</li>
                <li>No gas fees for the recipient!</li>
              </ol>
            </div>
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
            <span className="font-bold">EVVM ID:</span>{' '}
            <span className="font-mono">{payment.evvmId?.toString() || 'Loading...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
