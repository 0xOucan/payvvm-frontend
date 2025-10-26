"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Info } from 'lucide-react';
import {
  usePyusdWalletBalance,
  usePyusdEvvmBalance,
  usePyusdAllowance,
  useApprovePyusd,
  useDepositPyusd,
  useWithdrawPyusd,
  PYUSD_ADDRESS,
  TREASURY_ADDRESS,
} from '@/hooks/payvvm/usePyusdTreasury';

export const PyusdTreasury = () => {
  const { address, isConnected } = useAccount();
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  // Balances
  const walletBalance = usePyusdWalletBalance();
  const evvmBalance = usePyusdEvvmBalance();
  const allowance = usePyusdAllowance();

  // Actions
  const approve = useApprovePyusd();
  const deposit = useDepositPyusd();
  const withdraw = useWithdrawPyusd();

  // Refetch balances after successful transactions
  useEffect(() => {
    if (approve.isSuccess) {
      const timer = setTimeout(() => {
        allowance.refetch();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [approve.isSuccess, allowance]);

  useEffect(() => {
    if (deposit.isSuccess) {
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
      return;
    }
    approve.approve(depositAmount);
  };

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      return;
    }
    deposit.deposit(depositAmount);
  };

  const handleWithdraw = () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
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
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardHeader>
          <CardTitle className="font-mono">PYUSD Treasury</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              Please connect your wallet to use the Treasury
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-card/50 backdrop-blur border-primary/50">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-muted-foreground">Wallet Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {walletBalance.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold font-mono">{parseFloat(walletBalance.formatted).toFixed(2)}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">PYUSD</Badge>
                    <span className="text-xs text-muted-foreground">Available to deposit</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 pixel-border">
          <CardHeader>
            <CardTitle className="text-sm font-mono text-muted-foreground">EVVM Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evvmBalance.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Loading...</span>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold font-mono">{parseFloat(evvmBalance.formatted).toFixed(2)}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs bg-background/50">PYUSD</Badge>
                    <span className="text-xs text-muted-foreground">In PayVVM</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Deposit/Withdraw */}
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardHeader>
          <CardTitle className="font-mono">PYUSD Treasury</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="deposit" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="deposit" className="font-mono">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw" className="font-mono">Withdraw</TabsTrigger>
            </TabsList>

            {/* Deposit Tab */}
            <TabsContent value="deposit" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount to Deposit</Label>
                <div className="flex gap-2">
                  <Input
                    id="deposit-amount"
                    type="number"
                    step="0.000001"
                    placeholder="0.00"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    className="flex-1 font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setDepositAmount(walletBalance.formatted)}
                  >
                    MAX
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Max: {parseFloat(walletBalance.formatted).toFixed(2)} PYUSD
                </p>
              </div>

              {/* Allowance Info */}
              <Alert className="border-primary/30 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Current Allowance: <span className="font-mono">{parseFloat(allowance.formatted).toFixed(2)} PYUSD</span>
                </AlertDescription>
              </Alert>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {needsApproval(depositAmount) && (
                  <Button
                    variant="secondary"
                    onClick={handleApprove}
                    disabled={approve.isPending || approve.isConfirming}
                    className="flex-1 font-mono"
                  >
                    {approve.isPending || approve.isConfirming ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {approve.isPending ? 'Approving...' : 'Confirming...'}
                      </>
                    ) : (
                      '1. Approve PYUSD'
                    )}
                  </Button>
                )}

                <Button
                  onClick={handleDeposit}
                  disabled={
                    needsApproval(depositAmount) ||
                    deposit.isPending ||
                    deposit.isConfirming ||
                    !depositAmount ||
                    parseFloat(depositAmount) <= 0
                  }
                  className="flex-1 font-mono glitch-hover"
                >
                  {deposit.isPending || deposit.isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {deposit.isPending ? 'Depositing...' : 'Confirming...'}
                    </>
                  ) : needsApproval(depositAmount) ? (
                    '2. Deposit to Treasury'
                  ) : (
                    'Deposit to Treasury'
                  )}
                </Button>
              </div>

              {/* Transaction Status */}
              {approve.isSuccess && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Approval successful! Now you can deposit.
                  </AlertDescription>
                </Alert>
              )}

              {deposit.isSuccess && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Deposit successful!
                  </AlertDescription>
                </Alert>
              )}

              {(approve.error || deposit.error) && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-xs">
                    {approve.error?.message || deposit.error?.message || 'Transaction failed'}
                  </AlertDescription>
                </Alert>
              )}

              {/* Info Box */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <p className="font-bold mb-2">How deposits work:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Approve the Treasury contract to spend your PYUSD</li>
                    <li>Deposit PYUSD to the Treasury</li>
                    <li>Your PYUSD balance appears in EVVM immediately</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Withdraw Tab */}
            <TabsContent value="withdraw" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount to Withdraw</Label>
                <div className="flex gap-2">
                  <Input
                    id="withdraw-amount"
                    type="number"
                    step="0.000001"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="flex-1 font-mono"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setWithdrawAmount(evvmBalance.formatted)}
                  >
                    MAX
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Max: {parseFloat(evvmBalance.formatted).toFixed(2)} PYUSD
                </p>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={
                  withdraw.isPending ||
                  withdraw.isConfirming ||
                  !withdrawAmount ||
                  parseFloat(withdrawAmount) <= 0 ||
                  parseFloat(withdrawAmount) > parseFloat(evvmBalance.formatted)
                }
                className="w-full font-mono glitch-hover"
              >
                {withdraw.isPending || withdraw.isConfirming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {withdraw.isPending ? 'Withdrawing...' : 'Confirming...'}
                  </>
                ) : (
                  'Withdraw from Treasury'
                )}
              </Button>

              {withdraw.isSuccess && (
                <Alert className="border-green-500/50 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <AlertDescription>
                    Withdrawal successful!
                  </AlertDescription>
                </Alert>
              )}

              {withdraw.error && (
                <Alert className="border-red-500/50 bg-red-500/10">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-xs">
                    {withdraw.error.message || 'Transaction failed'}
                  </AlertDescription>
                </Alert>
              )}

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <p className="font-bold mb-2">How withdrawals work:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Enter the amount you want to withdraw</li>
                    <li>Confirm the transaction</li>
                    <li>PYUSD will be transferred to your wallet</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>

          {/* Contract Addresses */}
          <div className="mt-6 pt-6 border-t border-primary/20">
            <p className="text-xs font-mono text-muted-foreground mb-3">Contract Addresses</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">PYUSD:</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${PYUSD_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                >
                  {PYUSD_ADDRESS.slice(0, 6)}...{PYUSD_ADDRESS.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Treasury:</span>
                <a
                  href={`https://sepolia.etherscan.io/address/${TREASURY_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                >
                  {TREASURY_ADDRESS.slice(0, 6)}...{TREASURY_ADDRESS.slice(-4)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
