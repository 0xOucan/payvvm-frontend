/**
 * POST /api/sync/full
 *
 * Full historical sync from EVVM creation (block 9455841) to current block
 * Syncs in 500-block chunks and stores all PayVVM transactions in Vercel KV
 *
 * This endpoint can be called incrementally:
 * - Checks last synced block from KV
 * - Syncs next chunk (500 blocks)
 * - Returns progress
 *
 * Call repeatedly until complete!
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSyncProgress, updateSyncProgress } from '@/lib/kv';
import { syncBatch } from '@/lib/sync';

const EVVM_CREATION_BLOCK = 9455841;
const CHUNK_SIZE = 500;

export async function POST(request: NextRequest) {
  try {
    // Get current sync progress
    const { lastBlock: lastSyncedBlock } = await getSyncProgress();

    // Get current blockchain block number
    const currentBlockResponse = await fetch(
      'https://sepolia.etherscan.io/api?module=proxy&action=eth_blockNumber'
    );
    const currentBlockData = await currentBlockResponse.json();
    const currentBlock = parseInt(currentBlockData.result, 16);

    console.log(`[Sync Full] Current block: ${currentBlock}, Last synced: ${lastSyncedBlock}`);

    // Calculate next chunk
    const fromBlock = lastSyncedBlock + 1;
    const toBlock = Math.min(fromBlock + CHUNK_SIZE - 1, currentBlock);

    if (fromBlock > currentBlock) {
      return NextResponse.json({
        success: true,
        message: 'Already up to date',
        progress: {
          lastSyncedBlock,
          currentBlock,
          isComplete: true,
          percentComplete: 100,
        },
      });
    }

    console.log(`[Sync Full] Syncing chunk: ${fromBlock} to ${toBlock}`);

    // Call batch sync logic directly
    const batchResult = await syncBatch(fromBlock, toBlock);

    // Update sync progress
    await updateSyncProgress(toBlock);

    // Calculate progress
    const totalBlocks = currentBlock - EVVM_CREATION_BLOCK;
    const syncedBlocks = toBlock - EVVM_CREATION_BLOCK;
    const percentComplete = Math.floor((syncedBlocks / totalBlocks) * 100);

    const isComplete = toBlock >= currentBlock;

    console.log(
      `[Sync Full] Progress: ${syncedBlocks}/${totalBlocks} blocks (${percentComplete}%)`
    );

    return NextResponse.json({
      success: true,
      message: isComplete ? 'Sync complete!' : 'Chunk synced',
      chunk: {
        fromBlock,
        toBlock,
        transactionsFound: batchResult.transactionsFound,
        transactionsStored: batchResult.transactionsStored,
      },
      progress: {
        lastSyncedBlock: toBlock,
        currentBlock,
        totalBlocks,
        syncedBlocks,
        percentComplete,
        isComplete,
        blocksRemaining: currentBlock - toBlock,
        estimatedChunksRemaining: Math.ceil((currentBlock - toBlock) / CHUNK_SIZE),
      },
    });
  } catch (error) {
    console.error('[Sync Full] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sync/full
 *
 * Get current sync status without triggering a sync
 */
export async function GET() {
  try {
    const { lastBlock: lastSyncedBlock, lastSync } = await getSyncProgress();

    // Get current blockchain block number
    const currentBlockResponse = await fetch(
      'https://sepolia.etherscan.io/api?module=proxy&action=eth_blockNumber'
    );
    const currentBlockData = await currentBlockResponse.json();
    const currentBlock = parseInt(currentBlockData.result, 16);

    const totalBlocks = currentBlock - EVVM_CREATION_BLOCK;
    const syncedBlocks = lastSyncedBlock - EVVM_CREATION_BLOCK;
    const percentComplete = Math.floor((syncedBlocks / totalBlocks) * 100);
    const isComplete = lastSyncedBlock >= currentBlock;

    return NextResponse.json({
      progress: {
        lastSyncedBlock,
        currentBlock,
        totalBlocks,
        syncedBlocks,
        percentComplete,
        isComplete,
        blocksRemaining: currentBlock - lastSyncedBlock,
        estimatedChunksRemaining: Math.ceil((currentBlock - lastSyncedBlock) / CHUNK_SIZE),
        lastSyncTimestamp: lastSync,
      },
    });
  } catch (error) {
    console.error('[Sync Status] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
