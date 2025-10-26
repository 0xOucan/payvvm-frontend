import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for users to submit signed payment messages
 * Fishers can poll this endpoint to discover pending transactions
 */

// In-memory store for pending transactions (in production, use Redis/Database)
const pendingTransactions: Array<{
  id: string;
  timestamp: number;
  from: string;
  to: string;
  token: string;
  amount: string;
  priorityFee: string;
  nonce: string;
  signature: string;
  executor: string;
  priorityFlag: boolean;
  evvmId?: string;
  executed: boolean;
}> = [];

// Clean up executed transactions older than 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const initialLength = pendingTransactions.length;

  for (let i = pendingTransactions.length - 1; i >= 0; i--) {
    if (pendingTransactions[i].executed && pendingTransactions[i].timestamp < oneHourAgo) {
      pendingTransactions.splice(i, 1);
    }
  }

  if (pendingTransactions.length !== initialLength) {
    console.log(`🧹 Cleaned up ${initialLength - pendingTransactions.length} old transactions`);
  }
}, 5 * 60 * 1000); // Every 5 minutes

/**
 * POST /api/fishing/submit
 * Submit a signed payment message to the fishing pool
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { from, to, token, amount, priorityFee, nonce, signature, executor, priorityFlag, evvmId } = body;

    // Validate required fields
    if (!from || !to || !token || !amount || !nonce || !signature || executor === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if this transaction already exists (by signature)
    const existing = pendingTransactions.find(tx => tx.signature === signature);
    if (existing) {
      return NextResponse.json(
        { error: 'Transaction already submitted', id: existing.id },
        { status: 409 }
      );
    }

    // Generate unique ID
    const id = `${from}-${nonce}-${Date.now()}`;

    // Add to pending pool
    const transaction = {
      id,
      timestamp: Date.now(),
      from,
      to,
      token,
      amount,
      priorityFee: priorityFee || '0',
      nonce,
      signature,
      executor: executor || '0x0000000000000000000000000000000000000000',
      priorityFlag: priorityFlag !== undefined ? priorityFlag : false,
      evvmId,
      executed: false,
    };

    pendingTransactions.push(transaction);

    console.log(`📝 New transaction submitted to fishing pool: ${id}`);
    console.log(`   From: ${from}`);
    console.log(`   To: ${to}`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Priority Fee: ${priorityFee || '0'}`);
    console.log(`   Pending count: ${pendingTransactions.filter(tx => !tx.executed).length}`);

    return NextResponse.json({
      success: true,
      id,
      message: 'Transaction submitted to fishing pool',
      pendingCount: pendingTransactions.filter(tx => !tx.executed).length,
    });

  } catch (error) {
    console.error('Error submitting transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fishing/submit
 * Get pending transactions for fishers to execute
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const onlyPending = searchParams.get('pending') === 'true';

    // Filter and sort transactions
    let transactions = onlyPending
      ? pendingTransactions.filter(tx => !tx.executed)
      : pendingTransactions;

    // Sort by priority fee (descending), then timestamp (ascending)
    transactions = transactions
      .sort((a, b) => {
        const feeDiff = BigInt(b.priorityFee) - BigInt(a.priorityFee);
        if (feeDiff !== 0n) return Number(feeDiff);
        return a.timestamp - b.timestamp;
      })
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: transactions.length,
      totalPending: pendingTransactions.filter(tx => !tx.executed).length,
      transactions,
    });

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/fishing/submit/:id
 * Mark transaction as executed
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, txHash } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Transaction ID required' },
        { status: 400 }
      );
    }

    const transaction = pendingTransactions.find(tx => tx.id === id);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    if (transaction.executed) {
      return NextResponse.json(
        { error: 'Transaction already executed' },
        { status: 409 }
      );
    }

    transaction.executed = true;
    console.log(`✅ Transaction marked as executed: ${id}`);
    if (txHash) {
      console.log(`   TX Hash: ${txHash}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Transaction marked as executed',
    });

  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
