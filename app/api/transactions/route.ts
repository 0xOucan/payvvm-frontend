/**
 * GET /api/transactions
 *
 * Query stored PayVVM transactions from Vercel KV
 *
 * Query parameters:
 * - address: User address to filter by (optional)
 * - limit: Number of results (default: 50, max: 100)
 * - offset: Pagination offset (default: 0)
 *
 * Returns transactions sorted by timestamp (newest first)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserTxs, getUserTxCount } from '@/lib/kv';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');

    const limit = limitParam ? Math.min(parseInt(limitParam), 100) : 50;
    const offset = offsetParam ? parseInt(offsetParam) : 0;

    if (!address) {
      return NextResponse.json(
        { error: 'Missing address parameter' },
        { status: 400 }
      );
    }

    console.log(`[Transactions API] Querying for ${address}, limit=${limit}, offset=${offset}`);

    // Fetch transactions from KV
    const transactions = await getUserTxs(address, limit, offset);
    const totalCount = await getUserTxCount(address);

    console.log(`[Transactions API] Found ${transactions.length} transactions (total: ${totalCount})`);

    // Transform to match PayVVMTransaction interface expected by frontend
    const formattedTransactions = transactions.map(tx => ({
      hash: tx.hash,
      blockNumber: tx.blockNumber,
      timestamp: tx.timestamp,
      from: tx.from,
      to: tx.to,
      token: tx.token,
      amount: tx.amount,
      type: (tx.from.toLowerCase() === address.toLowerCase() ? 'send' : 'receive') as 'send' | 'receive',
      executedBy: tx.executedBy,
      txType: tx.txType,
      functionName: tx.functionName,
      gasUsed: tx.gasUsed,
    }));

    return NextResponse.json({
      success: true,
      transactions: formattedTransactions,
      pagination: {
        limit,
        offset,
        totalCount,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('[Transactions API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch transactions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
