import { NextRequest, NextResponse } from 'next/server';
import { executePyusdFaucetClaim, isFisherEnabled } from '@/fishing/fisher-executor';

/**
 * API endpoint for users to submit signed PYUSD faucet claim messages
 * Executes claims immediately in serverless environment
 */

// In-memory store for claim history (in production, use Redis/Database)
const claimHistory: Array<{
  id: string;
  timestamp: number;
  claimer: string;
  nonce: string;
  signature: string;
  evvmId?: string;
  executed: boolean;
  txHash?: string;
  error?: string;
}> = [];

/**
 * POST /api/fishing/submit-claim
 * Submit a signed PYUSD faucet claim message and execute it immediately
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { claimer, nonce, signature, evvmId } = body;

    // Validate required fields
    if (!claimer || !nonce || !signature) {
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

    // Check if this claim already exists (by signature)
    const existing = claimHistory.find(claim => claim.signature === signature);
    if (existing) {
      if (existing.executed && existing.txHash) {
        return NextResponse.json({
          success: true,
          id: existing.id,
          txHash: existing.txHash,
          message: 'Claim already executed',
        });
      }
      return NextResponse.json(
        { error: 'Claim already submitted', id: existing.id },
        { status: 409 }
      );
    }

    // Generate unique ID
    const id = `${claimer}-${nonce}-${Date.now()}`;

    console.log(`📝 New PYUSD faucet claim submitted: ${id}`);
    console.log(`   Claimer: ${claimer}`);
    console.log(`   Nonce: ${nonce}`);

    // Execute the claim immediately
    const result = await executePyusdFaucetClaim({
      claimer,
      nonce,
      signature,
    });

    // Store in history
    const claim = {
      id,
      timestamp: Date.now(),
      claimer,
      nonce,
      signature,
      evvmId,
      executed: result.success,
      txHash: result.txHash,
      error: result.error,
    };

    claimHistory.push(claim);

    if (result.success) {
      console.log(`✅ PYUSD faucet claim executed successfully: ${result.txHash}`);
      return NextResponse.json({
        success: true,
        id,
        txHash: result.txHash,
        gasUsed: result.gasUsed,
        message: 'PYUSD faucet claim executed successfully',
      });
    } else {
      console.error(`❌ PYUSD faucet claim execution failed: ${result.error}`);
      return NextResponse.json(
        {
          error: result.error || 'Claim execution failed',
          id,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error submitting/executing PYUSD faucet claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fishing/submit-claim
 * Get pending faucet claims for fishers to execute
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const onlyPending = searchParams.get('pending') === 'true';

    // Filter and sort claims
    let claims = onlyPending
      ? claimHistory.filter(c => !c.executed)
      : claimHistory;

    // Sort by timestamp (FIFO)
    claims = claims
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: claims.length,
      totalPending: claimHistory.filter(c => !c.executed).length,
      claims,
    });

  } catch (error) {
    console.error('Error fetching faucet claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/fishing/submit-claim/:id
 * Mark claim as executed
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, txHash } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Claim ID required' },
        { status: 400 }
      );
    }

    const claim = claimHistory.find(c => c.id === id);
    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      );
    }

    if (claim.executed) {
      return NextResponse.json(
        { error: 'Claim already executed' },
        { status: 409 }
      );
    }

    claim.executed = true;
    console.log(`✅ Faucet claim marked as executed: ${id}`);
    if (txHash) {
      console.log(`   TX Hash: ${txHash}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Claim marked as executed',
    });

  } catch (error) {
    console.error('Error updating claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
