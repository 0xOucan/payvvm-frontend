# Integration Guide: PayVVM Frontend as Submodule

This guide explains how to integrate `payvvm-frontend` as a Git submodule in the main [PAYVVM](https://github.com/0xOucan/PAYVVM) repository.

## Overview

The PayVVM Frontend is designed to work as a **standalone PWA** but can be integrated into the main PAYVVM monorepo as a Git submodule. This allows:

- **Independent development** - Frontend can be developed and deployed separately
- **Version pinning** - Main repo can pin to specific frontend versions
- **Simplified deployment** - Frontend can be deployed to Vercel independently
- **Clear separation** - Contracts, indexer, and frontend remain decoupled

## Architecture Context

```
PAYVVM (monorepo)
├── PAYVVM/                     # Solidity contracts + Foundry
│   ├── src/contracts/          # EVVM, Treasury, NameService
│   └── out/                    # Compiled ABIs
├── envioftpayvvm/              # Scaffold-ETH 2 module
│   ├── packages/foundry/       # Contract dev environment
│   ├── packages/nextjs/        # SE-2 frontend (different from payvvm-frontend)
│   ├── packages/envio/         # HyperSync indexer
│   └── payvvm-frontend/        # 👈 THIS REPO (as submodule)
├── App/                        # Planned: public dashboard
└── Telegram/                   # Planned: bot + relayer
```

## Setup as Submodule

### From Main PAYVVM Repository

Navigate to the main PAYVVM repo and add the submodule:

```bash
cd /path/to/PAYVVM

# Add payvvm-frontend as submodule in envioftpayvvm/
git submodule add git@github.com:0xOucan/payvvm-frontend.git envioftpayvvm/payvvm-frontend

# Initialize and update the submodule
git submodule update --init --recursive

# Commit the submodule addition
git add .gitmodules envioftpayvvm/payvvm-frontend
git commit -m "Add payvvm-frontend as submodule"
git push
```

### Cloning Main Repo with Submodules

When others clone the main PAYVVM repo:

```bash
# Clone with submodules in one command
git clone --recurse-submodules git@github.com:0xOucan/PAYVVM.git

# Or if already cloned, initialize submodules
cd PAYVVM
git submodule update --init --recursive
```

### Working with the Submodule

**Update submodule to latest:**
```bash
cd envioftpayvvm/payvvm-frontend
git pull origin main
cd ../..
git add envioftpayvvm/payvvm-frontend
git commit -m "Update payvvm-frontend submodule to latest"
git push
```

**Pin submodule to specific commit:**
```bash
cd envioftpayvvm/payvvm-frontend
git checkout <commit-hash or tag>
cd ../..
git add envioftpayvvm/payvvm-frontend
git commit -m "Pin payvvm-frontend to v1.2.3"
git push
```

## Integration Points

The frontend needs to integrate with other PAYVVM modules:

### 1. Contract ABIs

**Source**: `PAYVVM/out/` (Foundry build artifacts)

**Integration**:
```bash
# In payvvm-frontend, copy ABIs from contracts
cd /path/to/PAYVVM/envioftpayvvm/payvvm-frontend

# Create contracts directory
mkdir -p lib/contracts

# Copy ABIs (example script)
cp ../../PAYVVM/out/Evvm.sol/Evvm.json lib/contracts/
cp ../../PAYVVM/out/Treasury.sol/Treasury.json lib/contracts/
cp ../../PAYVVM/out/NameService.sol/NameService.json lib/contracts/
```

**Then in TypeScript**:
```typescript
// lib/contracts.ts
import EvvmABI from './contracts/Evvm.json'
import TreasuryABI from './contracts/Treasury.json'

export const EVVM_ABI = EvvmABI.abi
export const TREASURY_ABI = TreasuryABI.abi
```

### 2. Envio HyperSync Indexer

**Source**: `envioftpayvvm/packages/envio/`

**Integration**:
```typescript
// services/hypersync.ts
import { HypersyncClient } from '@envio-dev/hypersync-client'

const client = new HypersyncClient({
  url: process.env.NEXT_PUBLIC_HYPERSYNC_URL,
})

// Query indexed EVVM events
export async function queryPayments(params: QueryParams) {
  // Use same event schemas as defined in packages/envio/config.yaml
}
```

**Event schemas** from `packages/envio/config.yaml` should match what frontend expects.

### 3. Deployed Contract Addresses

Contracts deployed via `PAYVVM/` deployment scripts should have addresses configured in frontend `.env`:

```env
# From PAYVVM deployment artifacts
NEXT_PUBLIC_EVVM_CONTRACT_ETH=0x2029bb5e15E22c19Bc8bde3426fab29dD4db8A98
NEXT_PUBLIC_TREASURY_CONTRACT_ETH=0x98465F828b82d0b676937e159547F35BBDBdfe91
```

See `broadcast/` directory in PAYVVM module for deployment addresses.

## Development Workflow

### Recommended Setup

1. **Main repo**: Clone with submodules
   ```bash
   git clone --recurse-submodules git@github.com:0xOucan/PAYVVM.git
   cd PAYVVM
   ```

2. **Contract development**: Work in `PAYVVM/`
   ```bash
   cd PAYVVM
   make compile
   # ABIs in out/
   ```

3. **Indexer development**: Work in `envioftpayvvm/packages/envio/`
   ```bash
   cd envioftpayvvm/packages/envio
   pnpm codegen
   pnpm dev
   ```

4. **Frontend development**: Work in submodule
   ```bash
   cd envioftpayvvm/payvvm-frontend
   pnpm dev
   # Runs on localhost:3000
   ```

### Syncing Contract Changes to Frontend

When contracts are updated:

```bash
# 1. Compile contracts
cd PAYVVM
make compile

# 2. Copy new ABIs to frontend
cd ../envioftpayvvm/payvvm-frontend
cp ../../PAYVVM/out/Evvm.sol/Evvm.json lib/contracts/

# 3. Update contract addresses if redeployed
# Edit .env.local with new addresses from broadcast/

# 4. Restart frontend dev server
pnpm dev
```

### Syncing Indexer Schema to Frontend

When indexer events change:

```bash
# 1. Update packages/envio/config.yaml with new events

# 2. Regenerate indexer types
cd packages/envio
pnpm codegen

# 3. Update frontend HyperSync queries to match
cd ../../payvvm-frontend
# Edit services/hypersync.ts to use new event schemas

# 4. Test
pnpm dev
```

## Deployment

### Frontend Deployment (Vercel)

The frontend can be deployed independently:

```bash
cd envioftpayvvm/payvvm-frontend

# Deploy to Vercel
vercel

# Or configure in Vercel dashboard:
# - Root directory: envioftpayvvm/payvvm-frontend
# - Build command: pnpm build
# - Output directory: .next
```

**Environment variables** must be set in Vercel dashboard.

### Full Stack Deployment

For complete deployment:

1. **Deploy contracts** (Sepolia/Arbitrum Sepolia)
   ```bash
   cd PAYVVM
   make deployTestnet NETWORK=eth
   make deployTestnet NETWORK=arb
   ```

2. **Deploy indexer** (Envio platform)
   ```bash
   cd envioftpayvvm/packages/envio
   envio deploy
   ```

3. **Deploy frontend** (Vercel)
   ```bash
   cd ../../payvvm-frontend
   vercel --prod
   ```

4. **Update frontend env** with deployed addresses and HyperSync URL

## Version Management

### Recommended Strategy

Use **Git tags** for frontend releases:

```bash
cd envioftpayvvm/payvvm-frontend

# Tag a release
git tag -a v1.0.0 -m "Initial release with mock data"
git push origin v1.0.0

# In main repo, pin to tag
cd ../..
git submodule update --remote envioftpayvvm/payvvm-frontend
cd envioftpayvvm/payvvm-frontend
git checkout v1.0.0
cd ../..
git add envioftpayvvm/payvvm-frontend
git commit -m "Pin frontend to v1.0.0"
```

### Version Compatibility Matrix

| PAYVVM Contracts | Envio Indexer | Frontend   | Status      |
|------------------|---------------|------------|-------------|
| v1.0.x           | v1.0.x        | v1.0.x     | ✅ Testnet   |
| v1.1.x           | v1.1.x        | v1.1.x     | 🚧 Dev      |

## Troubleshooting

### Submodule Not Updating

```bash
# Force update
git submodule update --remote --force

# Or delete and re-add
git submodule deinit -f envioftpayvvm/payvvm-frontend
rm -rf .git/modules/envioftpayvvm/payvvm-frontend
git rm -f envioftpayvvm/payvvm-frontend
git submodule add git@github.com:0xOucan/payvvm-frontend.git envioftpayvvm/payvvm-frontend
```

### ABI Mismatch Errors

Ensure ABIs are synced:
```bash
cd PAYVVM
make compile
cd ../envioftpayvvm/payvvm-frontend
# Copy latest ABIs from ../../PAYVVM/out/
```

### HyperSync Query Failures

Check that:
1. Indexer is running and synced (`packages/envio/`)
2. NEXT_PUBLIC_HYPERSYNC_URL is correct in `.env.local`
3. Event schemas match between indexer config and frontend queries

## Further Reading

- [PAYVVM Main Repo](https://github.com/0xOucan/PAYVVM)
- [PAYVVM Contracts](https://github.com/0xOucan/payvvm-contracts)
- [Git Submodules Documentation](https://git-scm.com/book/en/v2/Git-Tools-Submodules)
- [Envio Docs](https://docs.envio.dev)

---

**Need help?** Open an issue in the [main PAYVVM repo](https://github.com/0xOucan/PAYVVM/issues).
