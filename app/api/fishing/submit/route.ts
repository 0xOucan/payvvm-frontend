import { NextRequest, NextResponse } from 'next/server';
import { executePayment, isFisherEnabled } from '@/fishing/fisher-executor';

/**
 * API endpoint for users to submit signed payment messages
 * Executes transactions immediately in serverless environment
 */

// In-memory store for transaction history (in production, use Redis/Database)
const transactionHistory: Array<{
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
  txHash?: string;
  error?: string;
}> = [];

/**
 * POST /api/fishing/submit
 * Submit a signed payment message and execute it immediately
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

    // Check if fisher is enabled
    if (!isFisherEnabled()) {
      return NextResponse.json(
        {
          error: 'Fisher bot is not enabled. Please configure FISHER_PRIVATE_KEY and set FISHER_ENABLED=true in environment variables.',
        },
        { status: 503 }
      );
    }

    // Check if this transaction already exists (by signature)
    const existing = transactionHistory.find(tx => tx.signature === signature);
    if (existing) {
      if (existing.executed && existing.txHash) {
        return NextResponse.json({
          success: true,
          id: existing.id,
          txHash: existing.txHash,
          message: 'Transaction already executed',
        });
      }
      return NextResponse.json(
        { error: 'Transaction already submitted', id: existing.id },
        { status: 409 }
      );
    }

    // Generate unique ID
    const id = `${from}-${nonce}-${Date.now()}`;

    console.log(`📝 New payment transaction submitted: ${id}`);
    console.log(`   From: ${from}`);
    console.log(`   To: ${to}`);
    console.log(`   Amount: ${amount}`);
    console.log(`   Priority Fee: ${priorityFee || '0'}`);

    // Execute the transaction immediately
    const result = await executePayment({
      from,
      to,
      token,
      amount,
      priorityFee: priorityFee || '0',
      nonce,
      signature,
      executor: executor || '0x0000000000000000000000000000000000000000',
      priorityFlag: priorityFlag !== undefined ? priorityFlag : false,
    });

    // Store in history
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
      executed: result.success,
      txHash: result.txHash,
      error: result.error,
    };

    transactionHistory.push(transaction);

    if (result.success) {
      console.log(`✅ Transaction executed successfully: ${result.txHash}`);
      return NextResponse.json({
        success: true,
        id,
        txHash: result.txHash,
        gasUsed: result.gasUsed,
        message: 'Transaction executed successfully',
      });
    } else {
      console.error(`❌ Transaction execution failed: ${result.error}`);
      return NextResponse.json(
        {
          error: result.error || 'Transaction execution failed',
          id,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error submitting/executing transaction:', error);
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
