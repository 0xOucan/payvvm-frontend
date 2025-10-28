/**
 * POST /api/sync/batch
 *
 * Syncs a specific block range and stores PayVVM transactions in Vercel KV
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncBatch } from '@/lib/sync';

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

    const result = await syncBatch(fromBlock, toBlock);

    return NextResponse.json({
      success: true,
      fromBlock,
      toBlock,
      ...result,
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
