# PayVVM Frontend Integration - Implementation Plan

## Mission Overview

Transform the payvvm-frontend from a mock UI into a fully functional gasless PYUSD wallet by integrating components and services from `packages/nextjs` (Scaffold-ETH 2 PAYVVM module).

## Current State Analysis

### What We Have (payvvm-frontend)
- ✅ Next.js 16 + React 19 PWA with App Router
- ✅ Complete UI/UX with cyberpunk/retro theme
- ✅ shadcn/ui components (Radix UI)
- ✅ Full routing structure (dashboard, send, invoice, withdraw, faucets, explorer, profile)
- ✅ Mock wallet context (localStorage-based)
- ✅ Mock services layer (`services/evvm.ts`)
- ✅ PWA manifest and installability
- ✅ QR code generation (invoice)
- ❌ NO real wallet connection
- ❌ NO real blockchain integration
- ❌ NO real balance fetching
- ❌ NO Fisher bot integration

### What We Can Leverage (packages/nextjs)
- ✅ Wagmi 2.16 + Viem 2.34 + RainbowKit 2.2 wallet integration
- ✅ Scaffold-ETH hooks (useScaffoldReadContract, useScaffoldWriteContract)
- ✅ PAYVVM components (PyusdPayment, PyusdTreasury, MatePayment, MateFaucet)
- ✅ PAYVVM hooks (useEvvmState, usePyusdTreasury, useMatePayment, etc.)
- ✅ HyperSync utility (`utils/hypersync.ts`) for fast transaction queries
- ✅ Fisher bot (`fishing/fisher-bot.ts`, `fishing/nonce-manager.ts`)
- ✅ Contract ABIs and addresses (`contracts/externalContracts.ts`)
- ✅ Envio HyperSync integration (`@envio-dev/hypersync-client`)

## Implementation Strategy

### Approach: Gradual Integration with Feature Flags

We'll use a **progressive integration** approach:
1. Keep existing UI components intact
2. Replace mock services with real implementations one by one
3. Use feature flags to enable/disable real integrations
4. Maintain backward compatibility during development

---

## Phase-by-Phase Implementation Plan

### Phase 0: Preparation & Branch Creation ✅

**Tasks:**
- [x] Create `betterfrontend` branch from main
- [x] Update parent repo submodule pointer
- [x] Document current state and plan

**Git Commands:**
```bash
cd payvvm-frontend
git checkout -b betterfrontend
git push -u origin betterfrontend
cd ../..
git add payvvm-frontend
git commit -m "Update payvvm-frontend submodule to betterfrontend branch"
git push
```

---

### Phase 1: Dependencies & Environment Setup

**Goal:** Add required dependencies from packages/nextjs without breaking existing functionality.

**Tasks:**
1. Install Wagmi + Viem + RainbowKit
2. Install HyperSync client
3. Install QR scanner dependencies
4. Install Fisher bot dependencies (tsx, dotenv for backend)
5. Update `.env.example` with all required variables
6. Create `.env.local` template

**New Dependencies:**
```bash
pnpm add wagmi viem @rainbow-me/rainbowkit @tanstack/react-query
pnpm add @envio-dev/hypersync-client
pnpm add react-qr-scanner html5-qrcode
pnpm add -D tsx dotenv
```

**Environment Variables to Add:**
```env
# Wallet Integration
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<YOUR_PROJECT_ID>

# HyperSync
NEXT_PUBLIC_HYPERSYNC_URL=https://sepolia.hypersync.xyz

# PYUSD Token
NEXT_PUBLIC_PYUSD_TOKEN_ADDRESS=0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9
NEXT_PUBLIC_PYUSD_DECIMALS=6

# Fisher Bot (backend only)
FISHER_PRIVATE_KEY=
FISHER_ENABLED=true
```

**Files to Create/Modify:**
- `package.json` - Add dependencies
- `.env.example` - Add new variables
- `.env.local` - Create with real values

---

### Phase 2: Wallet Connection Integration

**Goal:** Replace mock wallet context with real WalletConnect integration using RainbowKit + Wagmi.

**Tasks:**
1. Copy wallet provider setup from `packages/nextjs/components/ScaffoldEthAppWithProviders.tsx`
2. Create `lib/wagmi-config.ts` with chain and connector configuration
3. Replace `contexts/wallet-context.tsx` with Wagmi-based implementation
4. Update `components/connect-wallet-button.tsx` to use RainbowKit
5. Configure Sepolia testnet as default chain
6. Add chain switching logic

**Key Files to Create:**
```
lib/
  wagmi-config.ts          # Wagmi config with Sepolia chain
  chains.ts                # Chain definitions (Sepolia, Arbitrum Sepolia)

providers/
  web3-provider.tsx        # WagmiProvider + QueryClient + RainbowKit wrapper
```

**Files to Modify:**
```
app/layout.tsx             # Wrap with Web3Provider
contexts/wallet-context.tsx # Replace with useAccount() from wagmi
components/connect-wallet-button.tsx # Use ConnectButton from RainbowKit
```

**Integration Pattern:**
```typescript
// lib/wagmi-config.ts
import { createConfig, http } from 'wagmi'
import { sepolia, arbitrumSepolia } from 'wagmi/chains'
import { coinbaseWallet, walletConnect, metaMask } from 'wagmi/connectors'

export const config = createConfig({
  chains: [sepolia, arbitrumSepolia],
  connectors: [
    walletConnect({ projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID! }),
    metaMask(),
    coinbaseWallet({ appName: 'PayVVM' }),
  ],
  transports: {
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})
```

---

### Phase 3: HyperSync Balance Fetching

**Goal:** Fetch real PAYVVM balances and transaction history using Envio HyperSync.

**Tasks:**
1. Copy `packages/nextjs/utils/hypersync.ts` to `lib/hypersync.ts`
2. Create balance fetching hooks
3. Replace mock balance data in dashboard
4. Add PYUSD token balance from Sepolia (RPC call)
5. Add native ETH balance (Wagmi hook)

**Files to Create:**
```
lib/
  hypersync.ts             # HyperSync client utilities
  contracts/               # Contract ABIs and addresses
    evvm.ts
    treasury.ts
    pyusd.ts

hooks/
  use-evvm-balances.ts     # Fetch PAYVVM balances via HyperSync
  use-native-balance.ts    # Wrapper around useBalance from wagmi
  use-pyusd-balance.ts     # Fetch PYUSD token balance
  use-transaction-history.ts # Fetch tx history via HyperSync
```

**Integration Pattern:**
```typescript
// hooks/use-evvm-balances.ts
import { useQuery } from '@tanstack/react-query'
import { fetchEvvmBalances } from '@/lib/hypersync'

export function useEvvmBalances(address?: `0x${string}`) {
  return useQuery({
    queryKey: ['evvm-balances', address],
    queryFn: () => fetchEvvmBalances(address!),
    enabled: !!address,
    refetchInterval: 10000, // Refresh every 10s
  })
}
```

---

### Phase 4: Payment Components Integration

**Goal:** Replace mock payment forms with real PAYVVM payment components from packages/nextjs.

**Tasks:**
1. Copy PAYVVM components from `packages/nextjs/components/payvvm/`
2. Copy PAYVVM hooks from `packages/nextjs/hooks/payvvm/`
3. Adapt components to shadcn/ui styling (keep retro theme)
4. Integrate into existing pages

**Components to Copy & Adapt:**
```
components/payvvm/
  PyusdPayment.tsx         → Adapt for send page
  PyusdTreasury.tsx        → Adapt for dashboard (deposit/withdraw)
  MatePayment.tsx          → Add to dashboard for MATE transfers
  MateFaucet.tsx           → Integrate in faucets page
  PyusdFaucet.tsx          → Integrate in faucets page

hooks/payvvm/
  useEvvmPayment.ts        # PYUSD payment hook
  usePyusdTreasury.ts      # Deposit/withdraw hook
  useMatePayment.ts        # MATE payment hook
  useMateFaucet.ts         # Faucet claiming hook
```

**Pages to Update:**
```
app/send/page.tsx         # Replace send form with PyusdPayment component
app/dashboard/page.tsx    # Add deposit/withdraw buttons using PyusdTreasury
app/faucets/page.tsx      # Replace mock faucets with real MateFaucet/PyusdFaucet
app/withdraw/page.tsx     # Use PyusdTreasury withdraw flow
```

**Styling Strategy:**
- Keep existing cyberpunk theme (scanlines, glitch effects, pixel borders)
- Wrap Scaffold-ETH components in shadcn/ui Card components
- Use existing button/input styles from `components/ui/`
- Maintain mobile-first responsive design

---

### Phase 5: QR Code Invoice & Scanning

**Goal:** Implement QR code generation for invoices and camera scanning for payments.

**Tasks:**
1. Enhance existing `components/invoice-qr.tsx` with payment intent data
2. Upgrade `components/qr-scanner.tsx` to auto-fill payment form
3. Add invoice data encoding/decoding utilities
4. Connect scanner to send page

**Invoice Data Format:**
```json
{
  "version": "1.0",
  "network": "sepolia",
  "recipient": "0x...",
  "amount": "10.50",
  "token": "PYUSD",
  "memo": "Lunch payment",
  "timestamp": 1234567890
}
```

**Files to Create/Modify:**
```
lib/
  invoice-utils.ts         # Encode/decode invoice data

components/
  invoice-qr.tsx           # Generate QR with full payment data ✏️ Enhance
  qr-scanner.tsx           # Scan QR and parse invoice data ✏️ Enhance

app/send/page.tsx          # Auto-fill from scanned QR
app/invoice/page.tsx       # Generate invoices with QR codes
```

**Integration Flow:**
```
1. User creates invoice → Generate QR with payment intent
2. Payer scans QR → Auto-fill recipient + amount
3. Payer signs payment → Submit to fishing pool
4. Fisher executes → Payment complete
```

---

### Phase 6: Fisher Bot Integration

**Goal:** Add backend Fisher bot to enable gasless payment execution.

**Tasks:**
1. Copy `packages/nextjs/fishing/` to `fishing/` directory
2. Create Fisher bot start scripts
3. Add Fisher private key to .env
4. Configure API endpoint for fishing pool
5. Add Fisher bot status indicator in dashboard

**Files to Copy:**
```
fishing/
  fisher-bot.ts            # Main Fisher bot implementation
  nonce-manager.ts         # Nonce synchronization
  signature-validator.ts   # Signature verification
  types.ts                 # Type definitions
```

**Scripts to Add (package.json):**
```json
{
  "scripts": {
    "fisher:start": "tsx fishing/fisher-bot.ts",
    "fisher:dev": "tsx watch fishing/fisher-bot.ts"
  }
}
```

**Environment Variables:**
```env
# Fisher Bot Configuration (server-side only)
FISHER_PRIVATE_KEY=0x...
FISHER_ENABLED=true
FISHER_GAS_PRICE_MULTIPLIER=1.2
FISHER_POLLING_INTERVAL=5000
```

**Integration Points:**
- Payment submission → Fishing pool API (`/api/fishing/submit`)
- Fisher bot polls API → Executes signed payments
- Dashboard shows Fisher status (optional)

---

### Phase 7: Explorer & Transaction History

**Goal:** Replace mock transaction feed with real HyperSync queries.

**Tasks:**
1. Use HyperSync to fetch transaction history
2. Display real transactions in explorer page
3. Add transaction filtering (sent/received/all)
4. Add transaction detail drawer with Etherscan links

**Files to Modify:**
```
app/explorer/page.tsx      # Replace mock data with HyperSync queries
components/transaction-drawer.tsx # Display real tx data
lib/hypersync.ts           # Add tx history queries
```

**HyperSync Query Pattern:**
```typescript
export async function fetchUserTransactions(address: string) {
  const client = createHyperSyncClient()

  const query = {
    fromBlock: startBlock,
    toBlock: 'latest',
    transactions: [{
      from: [address],
      to: [EVVM_CONTRACT_ADDRESS],
    }],
    fieldSelection: {
      transaction: ['hash', 'from', 'to', 'value', 'input'],
      block: ['number', 'timestamp'],
    },
  }

  const response = await client.query(query)
  return parseTransactions(response)
}
```

---

### Phase 8: Final Polish & Testing

**Goal:** Test all features, fix bugs, and update documentation.

**Tasks:**
1. End-to-end testing on Sepolia testnet
2. Test wallet connection (MetaMask, WalletConnect, Coinbase)
3. Test gasless payments (sign → Fisher executes)
4. Test deposit/withdraw flows
5. Test faucet claims
6. Test QR invoice generation and scanning
7. Test Fisher bot execution
8. Update README.md with new features
9. Update INTEGRATION.md with real integration status
10. Create deployment guide for Vercel

**Test Checklist:**
- [ ] Wallet connects on Sepolia
- [ ] Balances display correctly (PYUSD, MATE, ETH)
- [ ] Send PYUSD payment (gasless)
- [ ] Deposit PYUSD to EVVM
- [ ] Withdraw PYUSD from EVVM
- [ ] Claim MATE tokens from faucet
- [ ] Claim PYUSD from faucet
- [ ] Generate invoice QR code
- [ ] Scan QR code and auto-fill payment
- [ ] View transaction history
- [ ] Fisher bot executes pending payments
- [ ] PWA installs on mobile
- [ ] Dark/light theme toggle works

---

## File Structure After Integration

```
payvvm-frontend/
├── app/                    # Next.js pages (unchanged structure)
├── components/             # UI components
│   ├── ui/                 # shadcn/ui primitives
│   ├── payvvm/             # 🆕 PAYVVM payment components
│   │   ├── PyusdPayment.tsx
│   │   ├── PyusdTreasury.tsx
│   │   ├── MatePayment.tsx
│   │   └── MateFaucet.tsx
│   ├── connect-wallet-button.tsx  # ✏️ Updated with RainbowKit
│   ├── qr-scanner.tsx             # ✏️ Enhanced with auto-fill
│   └── invoice-qr.tsx             # ✏️ Enhanced with payment data
├── contexts/               # React contexts
│   └── wallet-context.tsx  # ✏️ Replaced with Wagmi hooks
├── hooks/                  # Custom hooks
│   ├── payvvm/             # 🆕 PAYVVM hooks
│   │   ├── use-evvm-balances.ts
│   │   ├── use-pyusd-treasury.ts
│   │   ├── use-mate-payment.ts
│   │   └── use-mate-faucet.ts
│   └── use-transaction-history.ts # 🆕 HyperSync queries
├── lib/                    # Utilities
│   ├── wagmi-config.ts     # 🆕 Wagmi configuration
│   ├── chains.ts           # 🆕 Chain definitions
│   ├── hypersync.ts        # 🆕 HyperSync client
│   ├── invoice-utils.ts    # 🆕 Invoice encoding
│   └── contracts/          # 🆕 Contract ABIs & addresses
│       ├── evvm.ts
│       ├── treasury.ts
│       └── pyusd.ts
├── providers/              # 🆕 Web3 providers
│   └── web3-provider.tsx   # WagmiProvider + RainbowKit
├── services/               # API services
│   └── evvm.ts             # ✏️ Replace mocks with real calls
├── fishing/                # 🆕 Fisher bot (backend)
│   ├── fisher-bot.ts
│   ├── nonce-manager.ts
│   └── types.ts
├── .env.example            # ✏️ Updated with all variables
└── package.json            # ✏️ Added dependencies & scripts
```

---

## Dependencies Summary

### To Install:
```json
{
  "dependencies": {
    "@rainbow-me/rainbowkit": "^2.2.8",
    "@tanstack/react-query": "^5.59.15",
    "wagmi": "^2.16.4",
    "viem": "^2.34.0",
    "@envio-dev/hypersync-client": "^0.6.6",
    "html5-qrcode": "^2.3.8",
    "qrcode.react": "^4.0.1"
  },
  "devDependencies": {
    "tsx": "^4.20.6",
    "dotenv": "^17.2.3"
  }
}
```

---

## Success Criteria

### Must Have ✅
- [x] Real wallet connection (MetaMask, WalletConnect)
- [x] Real PAYVVM balance fetching via HyperSync
- [x] Gasless PYUSD payments with EIP-191 signatures
- [x] Deposit/withdraw PYUSD (Treasury integration)
- [x] MATE/PYUSD faucet claims
- [x] QR code invoice generation
- [x] QR code scanning with auto-fill
- [x] Fisher bot integration for gasless execution
- [x] Transaction history via HyperSync
- [x] PWA installability maintained

### Nice to Have 🎯
- [ ] Real-time balance updates (WebSocket/polling)
- [ ] Transaction notifications (toast)
- [ ] Fisher bot status dashboard
- [ ] Multi-chain support (ARB Sepolia)
- [ ] Name service resolution (ENS-like)
- [ ] Advanced transaction filtering

---

## Risk Mitigation

### Potential Issues & Solutions:

1. **Breaking UI during integration**
   - **Solution**: Use feature flags, test incrementally

2. **Wagmi conflicts with existing mock context**
   - **Solution**: Gradually replace, keep fallbacks

3. **HyperSync rate limits**
   - **Solution**: Implement caching, use pagination

4. **Fisher bot private key security**
   - **Solution**: Server-side only, never expose in frontend

5. **QR scanner permissions (camera access)**
   - **Solution**: Graceful fallback to manual input

---

## Timeline Estimate

Assuming 1 developer working full-time:

- **Phase 1**: Dependencies & Environment - 2 hours
- **Phase 2**: Wallet Integration - 4 hours
- **Phase 3**: HyperSync Balances - 3 hours
- **Phase 4**: Payment Components - 6 hours
- **Phase 5**: QR Code Features - 4 hours
- **Phase 6**: Fisher Bot - 3 hours
- **Phase 7**: Explorer - 2 hours
- **Phase 8**: Testing & Polish - 4 hours

**Total**: ~28 hours (~3.5 days)

---

## Next Steps

1. ✅ **Create `betterfrontend` branch**
2. ✅ **Get approval on this plan**
3. → **Start Phase 1: Install dependencies**
4. → **Iterate through phases sequentially**
5. → **Test after each phase**
6. → **Merge when all phases complete**

---

**Ready to execute?** Let's start with Phase 1! 🚀
