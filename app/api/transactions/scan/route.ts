/**
 * POST /api/transactions/scan
 *
 * Scans ALL historical chunks for a specific address
 * From EVVM deployment (block 9455841) to current block
 *
 * Returns all MATE and PYUSD PayVVM transactions for the address
 * Results should be cached client-side to avoid re-scanning
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchPayVVMTransactions } from '@/utils/hypersync';

const EVVM_CREATION_BLOCK = 9455841;
const CHUNK_SIZE = 500;

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    console.log(`[Transaction Scan] Starting full scan for ${address}`);

    // Get latest block from HyperSync
    const heightResponse = await fetch('https://sepolia.hypersync.xyz/height');
    const heightData = await heightResponse.json();
    const currentBlock = heightData.height || 9506000; // Fallback if API fails

    const totalBlocks = currentBlock - EVVM_CREATION_BLOCK;
    const totalChunks = Math.ceil(totalBlocks / CHUNK_SIZE);

    console.log(`[Transaction Scan] Scanning ${totalChunks} chunks (${totalBlocks} blocks) from ${currentBlock} to ${EVVM_CREATION_BLOCK} (newest first)`);

    // Scan all chunks in REVERSE order (newest to oldest)
    // This shows recent transactions first
    const allTransactions = [];
    let chunksScanned = 0;

    for (let toBlock = currentBlock; toBlock >= EVVM_CREATION_BLOCK; toBlock -= CHUNK_SIZE) {
      const fromBlock = Math.max(toBlock - CHUNK_SIZE + 1, EVVM_CREATION_BLOCK);

      // Fetch transactions for this chunk
      const chunkTxs = await fetchPayVVMTransactions(
        address,
        fromBlock,
        toBlock,
        1000 // Large limit since we want all txs for this user
      );

      allTransactions.push(...chunkTxs);
      chunksScanned++;

      // Log progress every 10 chunks
      if (chunksScanned % 10 === 0 || chunksScanned === totalChunks) {
        const percentComplete = Math.floor((chunksScanned / totalChunks) * 100);
        console.log(
          `[Transaction Scan] Progress: ${chunksScanned}/${totalChunks} chunks (${percentComplete}%) - Found ${allTransactions.length} txs so far`
        );
      }
    }

    console.log(`[Transaction Scan] Scan complete! Found ${allTransactions.length} total transactions`);

    // Format transactions for frontend
    const formattedTransactions = allTransactions.map(tx => ({
      hash: tx.hash,
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
      from: tx.from,
      to: tx.to,
      token: tx.token,
      amount: tx.amount,
      type: tx.type,
      executedBy: tx.executedBy,
      txType: tx.txType,
      functionName: tx.functionName,
      gasUsed: tx.gasUsed,
    }));

    return NextResponse.json({
      success: true,
      address,
      transactions: formattedTransactions,
      metadata: {
        totalTransactions: allTransactions.length,
        chunksScanned,
        totalBlocks,
        fromBlock: EVVM_CREATION_BLOCK,
        toBlock: currentBlock,
        scannedAt: Date.now(),
      },
    });
  } catch (error) {
    console.error('[Transaction Scan] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to scan transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
