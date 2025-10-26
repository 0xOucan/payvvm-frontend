/**
 * Explorer API Route - HyperSync Queries
 *
 * Server-side only - fetches transactions using HyperSync client
 * Supports three transaction types: payvvm, eth, pyusd
 */

import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to ensure HyperSync only loads server-side
async function getHyperSyncUtils() {
  const {
    fetchPayVVMTransactions,
    fetchETHTransfers,
    fetchPYUSDTransfers,
  } = await import('@/utils/hypersync');
  return { fetchPayVVMTransactions, fetchETHTransfers, fetchPYUSDTransfers };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');
    const type = searchParams.get('type') || 'payvvm'; // payvvm | eth | pyusd
    const fromBlock = searchParams.get('fromBlock');
    const toBlock = searchParams.get('toBlock');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Validate required parameters
    if (!address) {
      return NextResponse.json(
        { error: 'address parameter is required' },
        { status: 400 }
      );
    }

    if (!fromBlock || !toBlock) {
      return NextResponse.json(
        { error: 'fromBlock and toBlock are required' },
        { status: 400 }
      );
    }

    const fromBlockNum = parseInt(fromBlock);
    const toBlockNum = parseInt(toBlock);

    if (isNaN(fromBlockNum) || isNaN(toBlockNum)) {
      return NextResponse.json(
        { error: 'Invalid block numbers' },
        { status: 400 }
      );
    }

    // Load HyperSync utilities dynamically (server-side only)
    console.log(`[Explorer API] Loading HyperSync utilities for type: ${type}...`);
    console.log(`[Explorer API] Query params: address=${address}, fromBlock=${fromBlockNum}, toBlock=${toBlockNum}, limit=${limit}`);
    const { fetchPayVVMTransactions, fetchETHTransfers, fetchPYUSDTransfers } = await getHyperSyncUtils();
    console.log('[Explorer API] HyperSync utilities loaded successfully');

    // Fetch transactions based on type
    let transactions;
    switch (type) {
      case 'payvvm':
        console.log(`[Explorer API] Fetching PayVVM transactions for ${address} from block ${fromBlockNum} to ${toBlockNum}`);
        transactions = await fetchPayVVMTransactions(address, fromBlockNum, toBlockNum, limit);
        console.log(`[Explorer API] Raw PayVVM result: ${JSON.stringify(transactions).slice(0, 500)}`);
        break;

      case 'eth':
        console.log(`[Explorer API] Fetching ETH transfers for ${address}`);
        transactions = await fetchETHTransfers(address, fromBlockNum, toBlockNum, limit);
        break;

      case 'pyusd':
        console.log(`[Explorer API] Fetching PYUSD transfers for ${address}`);
        transactions = await fetchPYUSDTransfers(address, fromBlockNum, toBlockNum, limit);
        break;

      default:
        return NextResponse.json(
          { error: `Invalid type: ${type}. Must be payvvm, eth, or pyusd` },
          { status: 400 }
        );
    }

    console.log(`[Explorer API] Fetched ${transactions.length} ${type} transactions`);

    return NextResponse.json({
      success: true,
      type,
      transactions,
      count: transactions.length,
    });
  } catch (error) {
    console.error('[Explorer API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
        transactions: [],
      },
      { status: 500 }
    );
  }
}
