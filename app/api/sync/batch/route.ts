/**
 * POST /api/sync/batch
 *
 * Syncs a specific block range and stores PayVVM transactions in Vercel KV
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchPayVVMTransactions } from '@/utils/hypersync';
import { storeTx, StoredTransaction } from '@/lib/kv';

export async function POST(request: NextRequest) {
  try {
    const { fromBlock, toBlock } = await request.json();

    if (!fromBlock || !toBlock) {
      return NextResponse.json(
        { error: 'Missing fromBlock or toBlock' },
        { status: 400 }
      );
    }

    if (toBlock - fromBlock > 500) {
      return NextResponse.json(
        { error: 'Block range too large. Max 500 blocks per batch.' },
        { status: 400 }
      );
    }

    console.log(`[Sync Batch] Syncing blocks ${fromBlock} to ${toBlock}`);

    // Fetch transactions using existing HyperSync logic
    const transactions = await fetchPayVVMTransactions(
      '', // Empty address = fetch all transactions
      fromBlock,
      toBlock,
      1000 // Large limit since we're storing all
    );

    console.log(`[Sync Batch] Found ${transactions.length} transactions`);

    // Store each transaction in KV
    let storedCount = 0;
    for (const tx of transactions) {
      const storedTx: StoredTransaction = {
        hash: tx.hash,
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp,
        from: tx.from,
        to: tx.to,
        token: tx.token,
        amount: tx.amount,
        executedBy: tx.executedBy,
        txType: tx.txType,
        functionName: tx.functionName || 'unknown',
        gasUsed: tx.gasUsed,
        indexed_at: Date.now(),
      };

      await storeTx(storedTx);
      storedCount++;
    }

    console.log(`[Sync Batch] Stored ${storedCount} transactions`);

    return NextResponse.json({
      success: true,
      fromBlock,
      toBlock,
      transactionsFound: transactions.length,
      transactionsStored: storedCount,
    });
  } catch (error) {
    console.error('[Sync Batch] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync batch',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
