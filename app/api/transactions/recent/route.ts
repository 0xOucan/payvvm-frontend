/**
 * GET /api/transactions/recent?address=...
 *
 * Fetches ONLY the most recent transactions (last 1000 blocks)
 * Always bypasses cache to show latest activity
 * Used on page load to supplement cached historical data
 */

import { NextRequest, NextResponse } from 'next/server';
import { fetchPayVVMTransactions } from '@/utils/hypersync';

const RECENT_BLOCKS_RANGE = 1000; // Scan last 1000 blocks for recent activity

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    console.log(`[Recent Transactions] Fetching recent txs for ${address}`);

    // Get latest block from HyperSync
    const heightResponse = await fetch('https://sepolia.hypersync.xyz/height');
    const heightData = await heightResponse.json();
    const currentBlock = heightData.height;

    if (!currentBlock) {
      throw new Error('Failed to get current block height');
    }

    const fromBlock = Math.max(currentBlock - RECENT_BLOCKS_RANGE, 1);

    console.log(
      `[Recent Transactions] Scanning blocks ${fromBlock} to ${currentBlock} (last ${RECENT_BLOCKS_RANGE} blocks)`
    );

    // Fetch recent transactions
    const recentTxs = await fetchPayVVMTransactions(
      address,
      fromBlock,
      currentBlock,
      1000 // Large limit to get all recent txs
    );

    console.log(`[Recent Transactions] Found ${recentTxs.length} recent transactions`);

    return NextResponse.json({
      success: true,
      address,
      transactions: recentTxs,
      metadata: {
        fromBlock,
        toBlock: currentBlock,
        blocksScanned: RECENT_BLOCKS_RANGE,
        fetchedAt: Date.now(),
      },
    });
  } catch (error) {
    console.error('[Recent Transactions] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch recent transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
