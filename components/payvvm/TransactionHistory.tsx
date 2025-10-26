"use client";

import { useState, useEffect } from 'react';
import { formatUnits } from 'viem';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ExternalLink, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import {
  fetchPayVVMTransactions,
  fetchETHTransfers,
  fetchPYUSDTransfers,
  type PayVVMTransaction,
  type ETHTransfer,
  type PYUSDTransfer,
  PYUSD_TOKEN,
} from '@/services/hypersync';

interface TransactionHistoryProps {
  address: string | null;
  limit?: number;
}

export function TransactionHistory({ address, limit = 50 }: TransactionHistoryProps) {
  const [payvvmTxs, setPayvvmTxs] = useState<PayVVMTransaction[]>([]);
  const [ethTxs, setEthTxs] = useState<ETHTransfer[]>([]);
  const [pyusdTxs, setPyusdTxs] = useState<PYUSDTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('payvvm');

  useEffect(() => {
    async function loadTransactions() {
      if (!address) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [payvvm, eth, pyusd] = await Promise.all([
          fetchPayVVMTransactions(address, limit),
          fetchETHTransfers(address, limit),
          fetchPYUSDTransfers(address, limit),
        ]);

        setPayvvmTxs(payvvm);
        setEthTxs(eth);
        setPyusdTxs(pyusd);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTransactions();
  }, [address, limit]);

  if (!address) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardContent className="p-8">
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="font-mono">
              Please connect your wallet to view transaction history
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-mono">
              Loading transactions from HyperSync...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="payvvm" className="font-mono">
          PayVVM ({payvvmTxs.length})
        </TabsTrigger>
        <TabsTrigger value="eth" className="font-mono">
          ETH ({ethTxs.length})
        </TabsTrigger>
        <TabsTrigger value="pyusd" className="font-mono">
          PYUSD ({pyusdTxs.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="payvvm">
        <PayVVMTransactionList transactions={payvvmTxs} userAddress={address} />
      </TabsContent>

      <TabsContent value="eth">
        <ETHTransactionList transactions={ethTxs} userAddress={address} />
      </TabsContent>

      <TabsContent value="pyusd">
        <PYUSDTransactionList transactions={pyusdTxs} userAddress={address} />
      </TabsContent>
    </Tabs>
  );
}

function PayVVMTransactionList({ transactions, userAddress }: { transactions: PayVVMTransaction[], userAddress: string }) {
  if (transactions.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardContent className="p-8">
          <Alert className="border-primary/30 bg-primary/5">
            <Activity className="h-4 w-4" />
            <AlertDescription className="font-mono">
              No PayVVM transactions found for this address
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const isSender = tx.from.toLowerCase() === userAddress.toLowerCase();
        const isReceiver = tx.to.toLowerCase() === userAddress.toLowerCase();

        return (
          <Card key={tx.hash} className="bg-card/50 backdrop-blur border-primary/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Left: Type and addresses */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {isSender ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    )}
                    <Badge variant="outline" className="font-mono text-xs border-primary/50">
                      {isSender ? 'SENT' : 'RECEIVED'}
                    </Badge>
                    <Badge
                      variant={tx.status === 'success' ? 'default' : 'destructive'}
                      className="font-mono text-xs"
                    >
                      {tx.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <p className="text-muted-foreground">
                      From: <span className="text-foreground">{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      To: <span className="text-foreground">{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Token: <span className="text-foreground">
                        {tx.token.toLowerCase() === PYUSD_TOKEN.toLowerCase() ? 'PYUSD' : 'MATE'}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Center: Amount */}
                <div className="text-right">
                  <p className="text-lg font-bold font-mono">
                    {isSender && '-'}
                    {formatUnits(tx.amount, tx.token.toLowerCase() === PYUSD_TOKEN.toLowerCase() ? 6 : 18)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {tx.token.toLowerCase() === PYUSD_TOKEN.toLowerCase() ? 'PYUSD' : 'MATE'}
                  </p>
                  {tx.priorityFee > 0n && (
                    <p className="text-xs text-primary font-mono">
                      +{formatUnits(tx.priorityFee, 6)} fee
                    </p>
                  )}
                </div>

                {/* Right: Link and timestamp */}
                <div className="text-right space-y-2">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground font-mono">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ETHTransactionList({ transactions, userAddress }: { transactions: ETHTransfer[], userAddress: string }) {
  if (transactions.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardContent className="p-8">
          <Alert className="border-primary/30 bg-primary/5">
            <Activity className="h-4 w-4" />
            <AlertDescription className="font-mono">
              No ETH transfers found for this address
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx) => {
        const isSender = tx.from.toLowerCase() === userAddress.toLowerCase();

        return (
          <Card key={tx.hash} className="bg-card/50 backdrop-blur border-primary/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {isSender ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    )}
                    <Badge variant="outline" className="font-mono text-xs border-primary/50">
                      {isSender ? 'SENT' : 'RECEIVED'}
                    </Badge>
                    <Badge
                      variant={tx.status === 'success' ? 'default' : 'destructive'}
                      className="font-mono text-xs"
                    >
                      {tx.status}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <p className="text-muted-foreground">
                      From: <span className="text-foreground">{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      To: <span className="text-foreground">{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold font-mono">
                    {isSender && '-'}
                    {formatUnits(tx.value, 18)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">ETH</p>
                </div>

                <div className="text-right space-y-2">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground font-mono">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function PYUSDTransactionList({ transactions, userAddress }: { transactions: PYUSDTransfer[], userAddress: string }) {
  if (transactions.length === 0) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardContent className="p-8">
          <Alert className="border-primary/30 bg-primary/5">
            <Activity className="h-4 w-4" />
            <AlertDescription className="font-mono">
              No PYUSD transfers found for this address
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx, idx) => {
        const isSender = tx.from.toLowerCase() === userAddress.toLowerCase();

        return (
          <Card key={`${tx.hash}-${idx}`} className="bg-card/50 backdrop-blur border-primary/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {isSender ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    )}
                    <Badge variant="outline" className="font-mono text-xs border-primary/50">
                      {isSender ? 'SENT' : 'RECEIVED'}
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <p className="text-muted-foreground">
                      From: <span className="text-foreground">{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</span>
                    </p>
                    <p className="text-muted-foreground">
                      To: <span className="text-foreground">{tx.to.slice(0, 6)}...{tx.to.slice(-4)}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold font-mono">
                    {isSender && '-'}
                    {formatUnits(tx.value, 6)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">PYUSD</p>
                </div>

                <div className="text-right space-y-2">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-mono"
                  >
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="text-xs text-muted-foreground font-mono">
                    {new Date(tx.timestamp * 1000).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
