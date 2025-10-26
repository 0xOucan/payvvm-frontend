"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import {
  usePyusdWalletBalance,
  usePyusdEvvmBalance,
  usePyusdAllowance,
  useApprovePyusd,
  useDepositPyusd,
  useWithdrawPyusd,
  PYUSD_ADDRESS,
  TREASURY_ADDRESS,
} from '~~/hooks/payvvm/usePyusdTreasury';

export const PyusdTreasury = () => {
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');

  // Balances
  const walletBalance = usePyusdWalletBalance();
  const evvmBalance = usePyusdEvvmBalance();
  const allowance = usePyusdAllowance();

  // Actions
  const approve = useApprovePyusd();
  const deposit = useDepositPyusd();
  const withdraw = useWithdrawPyusd();

  // Refetch balances after successful transactions with delay to ensure blockchain state is updated
  useEffect(() => {
    if (approve.isSuccess) {
      // Add delay to ensure blockchain state has propagated
      const timer = setTimeout(() => {
        allowance.refetch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [approve.isSuccess, allowance]);

  useEffect(() => {
    if (deposit.isSuccess) {
      // Add delay to ensure blockchain state has propagated
      const timer = setTimeout(() => {
        walletBalance.refetch();
        evvmBalance.refetch();
        allowance.refetch();
        setDepositAmount('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [deposit.isSuccess, walletBalance, evvmBalance, allowance]);

  useEffect(() => {
    if (withdraw.isSuccess) {
      // Add delay to ensure blockchain state has propagated
      const timer = setTimeout(() => {
        walletBalance.refetch();
        evvmBalance.refetch();
        setWithdrawAmount('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [withdraw.isSuccess, walletBalance, evvmBalance]);

  const handleApprove = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    approve.approve(depositAmount);
  };

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    deposit.deposit(depositAmount);
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    withdraw.withdraw(withdrawAmount);
  };

  const needsApproval = (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) return false;
    try {
      const amountNum = parseFloat(amount);
      const allowanceNum = parseFloat(allowance.formatted);
      return amountNum > allowanceNum;
    } catch {
      return false;
    }
  };

  if (!isConnected) {
    return (
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl">PYUSD Treasury</h2>
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
            <span>Please connect your wallet to use the Treasury</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl mb-4">PYUSD Treasury</h2>

        {/* Balance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">Wallet Balance</div>
            <div className="stat-value text-2xl">
              {walletBalance.isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                `${parseFloat(walletBalance.formatted).toFixed(2)} PYUSD`
              )}
            </div>
            <div className="stat-desc">Available to deposit</div>
          </div>

          <div className="stat bg-base-200 rounded-lg">
            <div className="stat-title">EVVM Balance</div>
            <div className="stat-value text-2xl">
              {evvmBalance.isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                `${parseFloat(evvmBalance.formatted).toFixed(2)} PYUSD`
              )}
            </div>
            <div className="stat-desc">In PayVVM</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-boxed mb-4">
          <a
            className={`tab ${activeTab === 'deposit' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('deposit')}
          >
            Deposit
          </a>
          <a
            className={`tab ${activeTab === 'withdraw' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('withdraw')}
          >
            Withdraw
          </a>
        </div>

        {/* Deposit Tab */}
        {activeTab === 'deposit' && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Amount to Deposit</span>
                <span className="label-text-alt">
                  Max: {parseFloat(walletBalance.formatted).toFixed(2)} PYUSD
                </span>
              </label>
              <div className="join">
                <input
                  type="number"
                  placeholder="0.00"
                  className="input input-bordered join-item flex-1"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  step="0.01"
                  min="0"
                />
                <button
                  className="btn join-item"
                  onClick={() => setDepositAmount(walletBalance.formatted)}
                >
                  MAX
                </button>
              </div>
            </div>

            {/* Allowance Info */}
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
              <span className="text-sm">
                Current Allowance: {parseFloat(allowance.formatted).toFixed(2)} PYUSD
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {needsApproval(depositAmount) && (
                <button
                  className="btn btn-secondary flex-1"
                  onClick={handleApprove}
                  disabled={approve.isPending || approve.isConfirming}
                >
                  {approve.isPending || approve.isConfirming ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {approve.isPending ? 'Approving...' : 'Confirming...'}
                    </>
                  ) : (
                    '1. Approve PYUSD'
                  )}
                </button>
              )}

              <button
                className="btn btn-primary flex-1"
                onClick={handleDeposit}
                disabled={
                  needsApproval(depositAmount) ||
                  deposit.isPending ||
                  deposit.isConfirming ||
                  !depositAmount ||
                  parseFloat(depositAmount) <= 0
                }
              >
                {deposit.isPending || deposit.isConfirming ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    {deposit.isPending ? 'Depositing...' : 'Confirming...'}
                  </>
                ) : needsApproval(depositAmount) ? (
                  '2. Deposit to Treasury'
                ) : (
                  'Deposit to Treasury'
                )}
              </button>
            </div>

            {/* Transaction Status */}
            {approve.isSuccess && (
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
                <span>Approval successful! Now you can deposit.</span>
              </div>
            )}

            {deposit.isSuccess && (
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
                <span>Deposit successful!</span>
              </div>
            )}

            {(approve.error || deposit.error) && (
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
                <span>
                  {approve.error?.message || deposit.error?.message || 'Transaction failed'}
                </span>
              </div>
            )}

            {/* Info Box */}
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
                <p className="font-bold">How deposits work:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Approve the Treasury contract to spend your PYUSD</li>
                  <li>Deposit PYUSD to the Treasury</li>
                  <li>Your PYUSD balance appears in EVVM immediately</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <div className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Amount to Withdraw</span>
                <span className="label-text-alt">
                  Max: {parseFloat(evvmBalance.formatted).toFixed(2)} PYUSD
                </span>
              </label>
              <div className="join">
                <input
                  type="number"
                  placeholder="0.00"
                  className="input input-bordered join-item flex-1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  step="0.01"
                  min="0"
                />
                <button
                  className="btn join-item"
                  onClick={() => setWithdrawAmount(evvmBalance.formatted)}
                >
                  MAX
                </button>
              </div>
            </div>

            <button
              className="btn btn-primary w-full"
              onClick={handleWithdraw}
              disabled={
                withdraw.isPending ||
                withdraw.isConfirming ||
                !withdrawAmount ||
                parseFloat(withdrawAmount) <= 0 ||
                parseFloat(withdrawAmount) > parseFloat(evvmBalance.formatted)
              }
            >
              {withdraw.isPending || withdraw.isConfirming ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  {withdraw.isPending ? 'Withdrawing...' : 'Confirming...'}
                </>
              ) : (
                'Withdraw from Treasury'
              )}
            </button>

            {withdraw.isSuccess && (
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
                <span>Withdrawal successful!</span>
              </div>
            )}

            {withdraw.error && (
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
                <span>{withdraw.error.message || 'Transaction failed'}</span>
              </div>
            )}

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
                <p className="font-bold">How withdrawals work:</p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Enter the amount you want to withdraw</li>
                  <li>Confirm the transaction</li>
                  <li>PYUSD will be transferred to your wallet</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Contract Addresses */}
        <div className="divider">Contract Addresses</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="font-bold">PYUSD:</span>{' '}
            <a
              href={`https://sepolia.etherscan.io/address/${PYUSD_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary font-mono"
            >
              {PYUSD_ADDRESS.slice(0, 6)}...{PYUSD_ADDRESS.slice(-4)}
            </a>
          </div>
          <div>
            <span className="font-bold">Treasury:</span>{' '}
            <a
              href={`https://sepolia.etherscan.io/address/${TREASURY_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link link-primary font-mono"
            >
              {TREASURY_ADDRESS.slice(0, 6)}...{TREASURY_ADDRESS.slice(-4)}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
