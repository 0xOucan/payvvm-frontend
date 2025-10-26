import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for users to submit signed faucet claim messages
 * Fishers can poll this endpoint to discover pending faucet claims
 */

// In-memory store for pending claims (in production, use Redis/Database)
const pendingClaims: Array<{
  id: string;
  timestamp: number;
  claimer: string;
  nonce: string;
  signature: string;
  evvmId?: string;
  executed: boolean;
}> = [];

// Clean up executed claims older than 1 hour
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const initialLength = pendingClaims.length;

  for (let i = pendingClaims.length - 1; i >= 0; i--) {
    if (pendingClaims[i].executed && pendingClaims[i].timestamp < oneHourAgo) {
      pendingClaims.splice(i, 1);
    }
  }

  if (pendingClaims.length !== initialLength) {
    console.log(`🧹 Cleaned up ${initialLength - pendingClaims.length} old faucet claims`);
  }
}, 5 * 60 * 1000); // Every 5 minutes

/**
 * POST /api/fishing/submit-claim
 * Submit a signed faucet claim message to the fishing pool
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

    // Check if this claim already exists (by signature)
    const existing = pendingClaims.find(claim => claim.signature === signature);
    if (existing) {
      return NextResponse.json(
        { error: 'Claim already submitted', id: existing.id },
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

    pendingClaims.push(claim);

    console.log(`📝 New faucet claim submitted to fishing pool: ${id}`);
    console.log(`   Claimer: ${claimer}`);
    console.log(`   Nonce: ${nonce}`);
    console.log(`   Pending count: ${pendingClaims.filter(c => !c.executed).length}`);

    return NextResponse.json({
      success: true,
      id,
      message: 'Faucet claim submitted to fishing pool',
      pendingCount: pendingClaims.filter(c => !c.executed).length,
    });

  } catch (error) {
    console.error('Error submitting faucet claim:', error);
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
      ? pendingClaims.filter(c => !c.executed)
      : pendingClaims;

    // Sort by timestamp (FIFO)
    claims = claims
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      count: claims.length,
      totalPending: pendingClaims.filter(c => !c.executed).length,
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

    const claim = pendingClaims.find(c => c.id === id);
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
