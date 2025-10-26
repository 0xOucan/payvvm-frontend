"use client";

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { isAddress } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, CheckCircle2, AlertCircle, ExternalLink, Info, ChevronDown } from 'lucide-react';
import { useEvvmPayment } from '@/hooks/payvvm/useEvvmPayment';
import { usePyusdEvvmBalance, PYUSD_ADDRESS } from '@/hooks/payvvm/usePyusdTreasury';

export const PyusdPayment = () => {
  const { isConnected } = useAccount();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [priorityFee, setPriorityFee] = useState('0');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const evvmBalance = usePyusdEvvmBalance();
  const payment = useEvvmPayment();

  // Auto-submit to fishing pool after signature is obtained
  useEffect(() => {
    if (payment.signature && !payment.hash && !payment.isExecuting) {
      payment.submitToFishers().then(() => {
        console.log('✅ Payment submitted to fishing pool - fishers will execute it');
      }).catch((error) => {
        console.error('❌ Failed to submit to fishing pool:', error);
        // Do NOT execute directly - fisher bot should handle this
      });
    }
  }, [payment]);

  // Reset form after successful payment
  useEffect(() => {
    if (payment.isSuccess) {
      const refetchTimer = setTimeout(() => {
        evvmBalance.refetch();
      }, 500);

      setRecipient('');
      setAmount('');
      setPriorityFee('0');

      const resetTimer = setTimeout(() => {
        payment.reset();
      }, 3000);

      return () => {
        clearTimeout(refetchTimer);
        clearTimeout(resetTimer);
      };
    }
  }, [payment.isSuccess, payment, evvmBalance]);

  const handleSendPayment = async () => {
    if (!recipient || !isAddress(recipient)) {
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(evvmBalance.formatted);

    if (amountNum > balanceNum) {
      return;
    }

    try {
      await payment.initiatePayment(recipient, amount, priorityFee);
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  if (!isConnected) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardHeader>
          <CardTitle className="font-mono">Send PYUSD Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription>
              Please connect your wallet to send payments
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Balance Display */}
      <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/50 pixel-border">
        <CardHeader>
          <CardTitle className="text-sm font-mono text-muted-foreground">Your EVVM Balance</CardTitle>
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
                  <span className="text-xs text-muted-foreground">Available to send</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardHeader>
          <CardTitle className="font-mono">Send PYUSD Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Loading EVVM Metadata */}
          {(payment.isLoadingMetadata || payment.isLoadingNonce) && (
            <Alert className="border-primary/30 bg-primary/5">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription className="text-xs">
                Loading EVVM data...
              </AlertDescription>
            </Alert>
          )}

          {/* Token Selector (Fixed to PYUSD) */}
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <div className="flex items-center gap-2">
              <Input id="token" value="PYUSD" disabled className="flex-1" />
              <Badge variant="outline" className="font-mono text-xs">
                6 decimals
              </Badge>
            </div>
          </div>

          {/* Recipient */}
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient</Label>
            <Input
              id="recipient"
              placeholder="0x... or name.eth"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className={`font-mono ${recipient && !isAddress(recipient) ? 'border-red-500' : ''}`}
            />
            {recipient && !isAddress(recipient) && (
              <p className="text-xs text-red-500">Invalid address format</p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 font-mono"
              />
              <Button
                variant="outline"
                onClick={() => setAmount(evvmBalance.formatted)}
              >
                MAX
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Max: {parseFloat(evvmBalance.formatted).toFixed(2)} PYUSD
            </p>
          </div>

          {/* Advanced Options */}
          <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between font-mono text-sm">
                Advanced Options
                <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="priority-fee">Priority Fee (PYUSD)</Label>
                <Input
                  id="priority-fee"
                  type="number"
                  step="0.000001"
                  placeholder="0.00"
                  value={priorityFee}
                  onChange={(e) => setPriorityFee(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Optional reward for fishers who execute your transaction
                </p>
              </div>

              <Alert className="border-primary/30 bg-primary/5">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Current Nonce: <span className="font-mono">{payment.currentNonce?.toString() || 'Loading...'}</span>
                </AlertDescription>
              </Alert>
            </CollapsibleContent>
          </Collapsible>

          {/* Send Button */}
          <div className="space-y-3">
            <Button
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
              className="w-full font-mono glitch-hover"
            >
              {payment.isLoadingMetadata || payment.isLoadingNonce ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading EVVM Data...
                </>
              ) : payment.isSigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sign Payment...
                </>
              ) : payment.isExecuting || payment.isConfirming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {payment.isExecuting ? 'Sending Payment...' : 'Confirming...'}
                </>
              ) : (
                'Send (Gasless)'
              )}
            </Button>

            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                Gasless
              </Badge>
              <Badge variant="outline" className="font-mono text-xs">
                EVVM EIP-191
              </Badge>
            </div>
          </div>

          {/* Transaction Status */}
          {payment.signature && !payment.hash && (
            <Alert className="border-primary/30 bg-primary/5">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription className="space-y-1">
                <p className="font-bold">Signature submitted to fishing pool!</p>
                <p className="text-xs">Waiting for fisher bot to execute transaction...</p>
              </AlertDescription>
            </Alert>
          )}

          {payment.isSuccess && (
            <Alert className="border-green-500/50 bg-green-500/10">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertDescription className="space-y-1">
                <p className="font-bold">Payment successful!</p>
                {payment.hash && (
                  <a
                    href={`https://sepolia.etherscan.io/tx/${payment.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View on Etherscan
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </AlertDescription>
            </Alert>
          )}

          {(payment.signError || payment.executeError) && (
            <Alert className="border-red-500/50 bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <AlertDescription className="space-y-1">
                <p className="font-bold">Transaction failed</p>
                <p className="text-xs">
                  {payment.signError?.message || payment.executeError?.message}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* How it Works */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <p className="font-bold mb-2">How gasless EVVM payments work:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Sign payment message with your wallet (EIP-191)</li>
                <li>Signature submitted to fishing pool API</li>
                <li>Fisher bot picks up and executes on-chain (pays gas)</li>
                <li>PYUSD transfers within EVVM instantly</li>
                <li>You pay ZERO gas fees!</li>
              </ol>
            </AlertDescription>
          </Alert>

          {/* Contract Info */}
          <div className="pt-6 border-t border-primary/20">
            <p className="text-xs font-mono text-muted-foreground mb-3">Contract Info</p>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">PYUSD Token:</span>
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">EVVM ID:</span>
                <span className="font-mono">{payment.evvmId?.toString() || 'Loading...'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
