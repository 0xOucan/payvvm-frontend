"use client";

import { useState, useEffect } from 'react';
import { formatUnits } from 'viem';
import { usePublicClient } from 'wagmi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, ArrowUpRight, ArrowDownRight, Activity, RefreshCw } from 'lucide-react';
import { useTransactionCache } from '@/hooks/use-transaction-cache';

// Type definitions (matching utils/hypersync.ts)
interface PayVVMTransaction {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  token: string;
  amount: string;
  type: 'send' | 'receive';
  executedBy: string;
  txType: 'payment' | 'faucet_claim' | 'staking' | 'treasury' | 'unknown';
  functionName?: string;
  gasUsed?: string;
}

interface ETHTransfer {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  type: 'send' | 'receive';
  gasUsed?: string;
}

interface PYUSDTransfer {
  hash: string;
  blockNumber: number;
  timestamp: number;
  from: string;
  to: string;
  value: string;
  type: 'send' | 'receive';
  logIndex: number;
}

const PYUSD_TOKEN = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
const MATE_TOKEN = '0x0000000000000000000000000000000000000001';
const GOLDEN_FISHER = '0x121c631B7aEa24316bD90B22C989Ca008a84E5Ed';

interface TransactionHistoryProps {
  address: string | null;
  limit?: number;
}

export function TransactionHistory({ address, limit = 50 }: TransactionHistoryProps) {
  // Use transaction cache for PayVVM transactions (scans all history)
  const {
    transactions: payvvmTxs,
    isLoading: payvvmLoading,
    isScanning,
    metadata,
    refresh,
  } = useTransactionCache(address || undefined);

  const [ethTxs, setEthTxs] = useState<ETHTransfer[]>([]);
  const [pyusdTxs, setPyusdTxs] = useState<PYUSDTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // Changed from 'payvvm' to 'all'
  const publicClient = usePublicClient();

  // Filter transactions by token type
  const mateTxs = payvvmTxs.filter(tx => tx.token.toLowerCase() === MATE_TOKEN.toLowerCase());
  const pyusdPayvvmTxs = payvvmTxs.filter(tx => tx.token.toLowerCase() === PYUSD_TOKEN.toLowerCase());

  // Load ETH and PYUSD transfers (keep original logic for these)
  useEffect(() => {
    async function loadOtherTransactions() {
      if (!address) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const currentBlock = await publicClient?.getBlockNumber();
        if (!currentBlock) {
          throw new Error('Failed to get current block number');
        }

        const fromBlock = Number(currentBlock) - 500;
        const toBlock = Number(currentBlock) + 200;

        const params = new URLSearchParams({
          address,
          fromBlock: fromBlock.toString(),
          toBlock: toBlock.toString(),
          limit: limit.toString(),
        });

        const [ethRes, pyusdRes] = await Promise.all([
          fetch(`/api/explorer?${params.toString()}&type=eth`),
          fetch(`/api/explorer?${params.toString()}&type=pyusd`),
        ]);

        const [ethData, pyusdData] = await Promise.all([
          ethRes.json(),
          pyusdRes.json(),
        ]);

        setEthTxs(ethData.transactions || []);
        setPyusdTxs(pyusdData.transactions || []);
      } catch (error) {
        console.error('Error loading other transactions:', error);
      } finally {
        setLoading(false);
      }
    }

    loadOtherTransactions();
  }, [address, limit, publicClient]);

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

  if (payvvmLoading || loading) {
    return (
      <Card className="bg-card/50 backdrop-blur border-primary/50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground font-mono">
              {isScanning
                ? `Scanning transaction history... ${metadata ? `${metadata.chunksScanned}/${Math.ceil(metadata.totalBlocks / 500)} chunks` : ''}`
                : 'Loading transactions from cache...'}
            </p>
            {metadata && metadata.totalTransactions > 0 && (
              <p className="text-xs text-muted-foreground font-mono">
                Found {metadata.totalTransactions} transactions so far
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {metadata && (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-muted-foreground font-mono">
            Full history scanned • {metadata.totalTransactions} total transactions
          </p>
          <Button
            onClick={() => refresh()}
            variant="outline"
            size="sm"
            className="gap-2 font-mono"
            disabled={isScanning}
          >
            <RefreshCw className={`h-3 w-3 ${isScanning ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="all" className="font-mono">
            All ({payvvmTxs.length})
          </TabsTrigger>
          <TabsTrigger value="mate" className="font-mono">
            MATE ({mateTxs.length})
          </TabsTrigger>
          <TabsTrigger value="pyusd" className="font-mono">
            PYUSD ({pyusdPayvvmTxs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <PayVVMTransactionList transactions={payvvmTxs} userAddress={address} />
        </TabsContent>

      <TabsContent value="mate">
        <PayVVMTransactionList transactions={mateTxs} userAddress={address} />
      </TabsContent>

      <TabsContent value="pyusd">
        <PayVVMTransactionList transactions={pyusdPayvvmTxs} userAddress={address} />
      </TabsContent>
    </Tabs>
    </div>
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
        const isSender = tx.type === 'send';

        return (
          <Card key={tx.hash} className="bg-card/50 backdrop-blur border-primary/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Left: Type and addresses */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {isSender ? (
                      <ArrowUpRight className="h-4 w-4 text-red-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-green-500" />
                    )}
                    <Badge variant="outline" className="font-mono text-xs border-primary/50">
                      {isSender ? 'SENT' : 'RECEIVED'}
                    </Badge>
                    <Badge variant="outline" className="font-mono text-xs border-amber-500/50">
                      Gasless
                    </Badge>
                    {tx.txType === 'faucet_claim' && (
                      <Badge variant="outline" className="font-mono text-xs border-green-500/50 bg-green-500/10">
                        FAUCET CLAIM
                      </Badge>
                    )}
                    {tx.txType === 'payment' && (
                      <Badge variant="outline" className="font-mono text-xs border-blue-500/50 bg-blue-500/10">
                        PAYMENT
                      </Badge>
                    )}
                    {tx.txType === 'treasury' && (
                      <Badge variant="outline" className="font-mono text-xs border-purple-500/50 bg-purple-500/10">
                        TREASURY
                      </Badge>
                    )}
                    {tx.functionName && (
                      <Badge variant="outline" className="font-mono text-xs border-purple-500/50">
                        {tx.functionName}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    {tx.txType === 'faucet_claim' ? (
                      <>
                        <p className="text-muted-foreground">
                          Claimer: <span className="text-foreground font-semibold">{tx.from.slice(0, 6)}...{tx.from.slice(-4)}</span>
                        </p>
                        <p className="text-muted-foreground">
                          Token: <span className="text-foreground">
                            {tx.token.toLowerCase() === PYUSD_TOKEN.toLowerCase() ? 'PYUSD' : 'MATE'}
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                    <p className="text-muted-foreground">
                      Executed by: <span className="text-foreground text-amber-500">{tx.executedBy.slice(0, 6)}...{tx.executedBy.slice(-4)}</span>
                      <span className="ml-1 text-xs opacity-70">
                        ({tx.executedBy.toLowerCase() === GOLDEN_FISHER.toLowerCase() ? 'Fisher' : 'Direct'})
                      </span>
                    </p>
                  </div>
                </div>

                {/* Center: Amount */}
                <div className="text-right">
                  <p className="text-lg font-bold font-mono">
                    {tx.txType === 'faucet_claim' ? '+' : (isSender ? '-' : '+')}
                    {formatUnits(BigInt(tx.amount), tx.token.toLowerCase() === PYUSD_TOKEN.toLowerCase() ? 6 : 18)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {tx.token.toLowerCase() === PYUSD_TOKEN.toLowerCase() ? 'PYUSD' : 'MATE'}
                  </p>
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
        const isSender = tx.type === 'send';

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
                    {formatUnits(BigInt(tx.value), 18)}
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
        const isSender = tx.type === 'send';

        return (
          <Card key={`${tx.hash}-${tx.logIndex}`} className="bg-card/50 backdrop-blur border-primary/50">
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
                    {formatUnits(BigInt(tx.value), 6)}
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
