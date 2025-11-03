import { NextRequest, NextResponse } from 'next/server';
import { executeDispersePay, isFisherEnabled } from '@/fishing/fisher-executor';

/**
 * API endpoint for users to submit signed dispersePay (payroll) messages
 * Executes batch distributions immediately in serverless environment
 */

// In-memory store for dispersePay history (in production, use Redis/Database)
const disperseHistory: Array<{
  id: string;
  timestamp: number;
  from: string;
  recipients: Array<{
    amount: string;
    to_address: string;
    to_identity: string;
  }>;
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
 * POST /api/fishing/submit-disperse
 * Submit a signed dispersePay message and execute it immediately
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { from, recipients, token, amount, priorityFee, nonce, signature, executor, priorityFlag, evvmId } = body;

    // Validate required fields
    if (!from || !recipients || !Array.isArray(recipients) || recipients.length === 0 || !token || !amount || !nonce || !signature || executor === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields or invalid recipients array' },
        { status: 400 }
      );
    }

    // Validate each recipient
    for (const recipient of recipients) {
      if (!recipient.to_address || !recipient.amount) {
        return NextResponse.json(
          { error: 'Each recipient must have to_address and amount' },
          { status: 400 }
        );
      }
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
    const existing = disperseHistory.find(tx => tx.signature === signature);
    if (existing) {
      if (existing.executed && existing.txHash) {
        return NextResponse.json({
          success: true,
          id: existing.id,
          txHash: existing.txHash,
          message: 'dispersePay already executed',
        });
      }
      return NextResponse.json(
        { error: 'dispersePay already submitted', id: existing.id },
        { status: 409 }
      );
    }

    // Generate unique ID
    const id = `${from}-${nonce}-${Date.now()}`;

    console.log(`📝 New dispersePay (payroll) submitted: ${id}`);
    console.log(`   From: ${from}`);
    console.log(`   Recipients: ${recipients.length}`);
    console.log(`   Total Amount: ${amount}`);
    console.log(`   Priority Fee: ${priorityFee || '0'}`);
    console.log(`\n🔍 DEBUG: API Received Recipients:`);
    console.log(JSON.stringify(recipients, null, 2));

    // Execute the dispersePay immediately
    const result = await executeDispersePay({
      from,
      recipients,
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
      recipients,
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

    disperseHistory.push(transaction);

    if (result.success) {
      console.log(`✅ dispersePay executed successfully: ${result.txHash}`);
      return NextResponse.json({
        success: true,
        id,
        txHash: result.txHash,
        gasUsed: result.gasUsed,
        message: 'dispersePay (payroll) executed successfully',
      });
    } else {
      console.error(`❌ dispersePay execution failed: ${result.error}`);
      return NextResponse.json(
        {
          error: result.error || 'dispersePay execution failed',
          id,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error submitting/executing dispersePay:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fishing/submit-disperse
 * Get dispersePay history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const onlyPending = searchParams.get('pending') === 'true';

    // Filter and sort transactions
    let transactions = onlyPending
      ? disperseHistory.filter(tx => !tx.executed)
      : disperseHistory;

    // Sort by timestamp (descending)
    transactions = transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: transactions.length,
      totalPending: disperseHistory.filter(tx => !tx.executed).length,
      transactions,
    });

  } catch (error) {
    console.error('Error fetching dispersePay transactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
