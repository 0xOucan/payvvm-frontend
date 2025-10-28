# PayVVM Batch Sync Architecture

## Overview

The batch sync system indexes all historical PayVVM transactions from EVVM creation (block 9,455,841) and stores them in Vercel KV for fast querying. This solves the HyperSync 500-block limitation by pre-indexing all data.

## Architecture

### Storage (Vercel KV)

```
payvvm:tx:{hash}                    → StoredTransaction object
payvvm:txs:user:{address}           → Sorted set (score=timestamp, member=hash)
payvvm:txs:by-block                 → Sorted set (score=blockNumber, member=hash)
payvvm:sync:progress                → {lastBlock, lastSync} tracker
```

### Transaction Types Indexed

All **EVVM internal transactions** (MATE and PYUSD):
- ✅ **pay()** - EVVM payments (MATE or PYUSD)
- ✅ **claimPyusd()** - PYUSD faucet claims (1 PYUSD)
- ✅ **claimMate()** - MATE faucet claims (510 MATE)
- ⏳ **goldenStaking()** - Staking operations (future)
- ⏳ **Treasury operations** - Deposits/withdrawals (future)

All executed by fisher: `0x121c631B7aEa24316bD90B22C989Ca008a84E5Ed`

## Setup

### 1. Create Vercel KV Database

```bash
# Option A: Via Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Storage tab
4. Click "Create Database" → "KV"
5. Choose free tier (256 MB)
6. Name it "payvvm-transactions"

# Option B: Via Vercel CLI
npm i -g vercel
vercel link
vercel storage create kv payvvm-transactions
```

### 2. Pull Environment Variables

```bash
# This populates KV_* environment variables in .env.local
vercel env pull
```

Your `.env.local` will now have:
```bash
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### 3. Start Development Server

```bash
pnpm dev
```

## Usage

### Full Historical Sync

The `/api/sync/full` endpoint syncs **incrementally** in 500-block chunks.

**Method 1: Manual Loop (Terminal)**
```bash
# Run this script to sync all history
while true; do
  RESPONSE=$(curl -s -X POST http://localhost:3000/api/sync/full)
  echo "$RESPONSE" | jq '.'

  IS_COMPLETE=$(echo "$RESPONSE" | jq -r '.progress.isComplete')

  if [ "$IS_COMPLETE" = "true" ]; then
    echo "✅ Sync complete!"
    break
  fi

  echo "⏳ Syncing next chunk..."
  sleep 2
done
```

**Method 2: Frontend Admin UI (Coming Soon)**
- Navigate to `/admin/sync` (to be created)
- Click "Start Full Sync"
- Watch progress bar

**Method 3: Vercel Cron Job (Production)**
```typescript
// app/api/cron/sync/route.ts
export async function GET() {
  // Calls /api/sync/full once per hour
  // Gradually syncs all history in background
}
```

### Check Sync Status

```bash
# GET endpoint - doesn't trigger sync
curl http://localhost:3000/api/sync/full

# Response:
{
  "progress": {
    "lastSyncedBlock": 9460000,
    "currentBlock": 9508000,
    "percentComplete": 8,
    "blocksRemaining": 48000,
    "estimatedChunksRemaining": 96,
    "isComplete": false
  }
}
```

### Query Transactions

```bash
# Get user's transactions (newest first)
curl "http://localhost:3000/api/transactions?address=0x9c77c6fafc1eb0821F1De12972Ef0199C97C6e45&limit=50"

# Response:
{
  "success": true,
  "transactions": [...],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "totalCount": 127,
    "hasMore": true
  }
}
```

## Performance

### Sync Speed
- **Chunk size**: 500 blocks (~1.7 hours of Sepolia)
- **Request rate**: ~3 seconds per chunk (with rate limiting)
- **Total time**: ~5-6 minutes for 52,000 blocks (9455841 → 9508000)
- **Network usage**: ~100 KB per chunk

### Query Speed
- **User transactions**: <50ms (KV sorted set range query)
- **Block range**: <100ms (KV sorted set range query)
- **Single transaction**: <10ms (KV get)

## Integration

### Update Explorer Component

Replace on-the-fly HyperSync query with KV query:

```typescript
// BEFORE (app/explorer/page.tsx)
const transactions = await fetchPayVVMTransactions(address, fromBlock, toBlock);

// AFTER
const response = await fetch(`/api/transactions?address=${address}&limit=50`);
const { transactions } = await response.json();
```

### Update Dashboard Recent Activity

```typescript
// BEFORE (app/dashboard/page.tsx)
const response = await fetch(`/api/explorer?address=${address}&fromBlock=${fromBlock}&toBlock=${toBlock}`);

// AFTER
const response = await fetch(`/api/transactions?address=${address}&limit=5`);
```

## Monitoring

### Key Metrics
- **Sync progress**: `GET /api/sync/full` → `progress.percentComplete`
- **Transaction count**: `getUserTxCount(address)`
- **Last sync**: `getSyncProgress()` → `lastSync`

### Alerts
- Sync lag > 1000 blocks → Trigger background sync
- KV storage > 200 MB → Implement data pruning
- Query latency > 200ms → Check KV connection

## Roadmap

### Phase 1: Core Indexing (Current)
- [x] EVVM pay() transactions
- [x] Faucet claims (PYUSD, MATE)
- [x] Vercel KV storage
- [x] Batch sync API
- [ ] Explorer UI integration
- [ ] Dashboard UI integration

### Phase 2: Enhanced Features
- [ ] Admin sync UI at `/admin/sync`
- [ ] Real-time sync via webhook
- [ ] Signature parsing (extract original signer)
- [ ] Golden staking indexing
- [ ] Treasury operations indexing

### Phase 3: Production
- [ ] Vercel cron job for auto-sync
- [ ] Data pruning for old transactions
- [ ] Analytics dashboard
- [ ] Export to CSV/JSON

## Troubleshooting

### "Failed to connect to KV"
```bash
# Ensure KV env vars are set
vercel env pull
cat .env.local | grep KV_

# Restart dev server
pnpm dev
```

### "Sync stuck at X%"
```bash
# Check current block
curl https://sepolia.etherscan.io/api?module=proxy&action=eth_blockNumber

# Force resume from specific block
curl -X POST http://localhost:3000/api/sync/batch \
  -H "Content-Type: application/json" \
  -d '{"fromBlock": 9460000, "toBlock": 9460500}'
```

### "Transaction count mismatch"
```bash
# Clear KV and re-sync
# (Use Vercel dashboard to delete KV database and recreate)
```

## Cost Analysis (Vercel Free Tier)

### KV Storage Limits
- **Free tier**: 256 MB, 100K requests/month
- **Transaction size**: ~500 bytes per transaction
- **Capacity**: ~500,000 transactions in free tier
- **Current estimate**: ~1,000-2,000 transactions (well under limit)

### Bandwidth
- **Sync**: ~10 MB total for full historical sync
- **Queries**: <1 KB per request
- **Estimated monthly**: <100 MB (free tier is sufficient)

## Notes

- Transactions are indexed from **EVVM creation** (block 9,455,841) onwards
- Only **MATE and PYUSD** transactions within EVVM are tracked
- **Not indexed**: Ethereum L1 transactions, non-PayVVM operations
- Sync is **idempotent** - safe to re-run chunks
- KV keys use lowercase addresses for consistency
