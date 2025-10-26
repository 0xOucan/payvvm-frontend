import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for users to submit signed MATE faucet claim messages
 * Fishers can poll this endpoint to discover pending MATE faucet claims
 */

// In-memory store for pending MATE claims (in production, use Redis/Database)
const pendingMateClaims: Array<{
  id: string;
  timestamp: number;
  claimer: string;
  nonce: string;
  signature: string;
  evvmId?: string;
  executed: boolean;
}> = [];

// Clean up executed MATE claims older than 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const initialLength = pendingMateClaims.length;

  for (let i = pendingMateClaims.length - 1; i >= 0; i--) {
    if (pendingMateClaims[i].executed && pendingMateClaims[i].timestamp < oneHourAgo) {
      pendingMateClaims.splice(i, 1);
    }
  }

  if (pendingMateClaims.length !== initialLength) {
    console.log(`🧹 Cleaned up ${initialLength - pendingMateClaims.length} old MATE faucet claims`);
  }
}, 5 * 60 * 1000); // Every 5 minutes

/**
 * POST /api/fishing/submit-mate-claim
 * Submit a signed MATE faucet claim message to the fishing pool
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

    // Check if this MATE claim already exists (by signature)
    const existing = pendingMateClaims.find(claim => claim.signature === signature);
    if (existing) {
      return NextResponse.json(
        { error: 'MATE claim already submitted', id: existing.id },
        { status: 409 }
      );
    }

    // Generate unique ID
    const id = `${claimer}-${nonce}-${Date.now()}`;

    // Add to pending pool
    const claim = {
      id,
      timestamp: Date.now(),
      claimer,
      nonce,
      signature,
      evvmId,
      executed: false,
    };

    pendingMateClaims.push(claim);

    console.log(`📝 New MATE faucet claim submitted to fishing pool: ${id}`);
    console.log(`   Claimer: ${claimer}`);
    console.log(`   Nonce: ${nonce}`);
    console.log(`   Pending count: ${pendingMateClaims.filter(c => !c.executed).length}`);

    return NextResponse.json({
      success: true,
      id,
      message: 'MATE faucet claim submitted to fishing pool',
      pendingCount: pendingMateClaims.filter(c => !c.executed).length,
    });

  } catch (error) {
    console.error('Error submitting MATE faucet claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/fishing/submit-mate-claim
 * Get pending MATE faucet claims for fishers to execute
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const onlyPending = searchParams.get('pending') === 'true';

    // Filter and sort MATE claims
    let mateclaims = onlyPending
      ? pendingMateClaims.filter(c => !c.executed)
      : pendingMateClaims;

    // Sort by timestamp (FIFO)
    mateclaims = mateclaims
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: mateclaims.length,
      totalPending: pendingMateClaims.filter(c => !c.executed).length,
      mateclaims,
    });

  } catch (error) {
    console.error('Error fetching MATE faucet claims:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/fishing/submit-mate-claim/:id
 * Mark MATE claim as executed
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, txHash } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'MATE claim ID required' },
        { status: 400 }
      );
    }

    const claim = pendingMateClaims.find(c => c.id === id);
    if (!claim) {
      return NextResponse.json(
        { error: 'MATE claim not found' },
        { status: 404 }
      );
    }

    if (claim.executed) {
      return NextResponse.json(
        { error: 'MATE claim already executed' },
        { status: 409 }
      );
    }

    claim.executed = true;
    console.log(`✅ MATE faucet claim marked as executed: ${id}`);
    if (txHash) {
      console.log(`   TX Hash: ${txHash}`);
    }

    return NextResponse.json({
      success: true,
      message: 'MATE claim marked as executed',
    });

  } catch (error) {
    console.error('Error updating MATE claim:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
