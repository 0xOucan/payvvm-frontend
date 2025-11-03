# PayVVM Frontend

> **Gasless PYUSD, wallet-first.**
> A Progressive Web App for gasless PYUSD payments powered by EVVM (Ethereum Virtual Virtual Machine).

![PayVVM Banner](https://img.shields.io/badge/EVVM-Powered-00FF7F?style=for-the-badge)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-00FF7F?style=for-the-badge)
![Next.js 16](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)

## Overview

PayVVM Frontend is a mobile-first Progressive Web App that enables **gasless PYUSD payments** through EVVM's signature-based transaction system. Users sign EIP-191 messages, and fishers execute transactions—eliminating gas fees while maintaining full decentralization.

**Key Features:**
- 🚀 **Gasless Payments** - Sign EIP-191 messages, fishers handle gas
- 💳 **PYUSD Native** - Stable USD payments, payroll, and subscriptions
- ⚡ **Envio HyperSync** - Real-time blockchain indexing and transaction history
- 📱 **PWA Support** - Installable, works offline, native app experience
- 🎨 **Dual Themes** - Cyberpunk (retro terminal) and Normie (clean minimal)
- 🔍 **Built-in Explorer** - PayVVM Scan for transaction history and state queries
- 📲 **QR Payments** - Generate invoices and scan to pay

## Table of Contents

- [Quick Start](#quick-start)
- [Features](#features)
- [Architecture](#architecture)
- [Development](#development)
- [Integration Status](#integration-status)
- [PWA Features](#pwa-features)
- [Theme System](#theme-system)
- [Pages & Routes](#pages--routes)
- [Components](#components)
- [Services & APIs](#services--apis)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [Links](#links)

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Git

### Installation

```bash
# Clone the repository
git clone git@github.com:0xOucan/payvvm-frontend.git
cd payvvm-frontend

# Install dependencies
pnpm install

# Run development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

Create a `.env.local` file:

```env
# Envio HyperSync endpoint
NEXT_PUBLIC_HYPERSYNC_URL=

# Documentation links
NEXT_PUBLIC_DOCS_EVVM=https://www.evvm.info/docs/EVVM/Introduction
NEXT_PUBLIC_DOCS_HYPERSYNC=https://docs.envio.dev/docs/HyperSync-LLM/hypersync-complete

# WalletConnect (when implementing real wallet integration)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=

# EVVM Contract Addresses (Testnet)
NEXT_PUBLIC_EVVM_CONTRACT_ETH=0x2029bb5e15E22c19Bc8bde3426fab29dD4db8A98
NEXT_PUBLIC_EVVM_CONTRACT_ARB=0xC688C12541Ff85EF3E63755F6889317f312d03A3
NEXT_PUBLIC_TREASURY_CONTRACT_ETH=0x98465F828b82d0b676937e159547F35BBDBdfe91
NEXT_PUBLIC_TREASURY_CONTRACT_ARB=0x7d4F9D95e84f6903c7247527e6BF1FA864F7c764
```

## Features

### ✅ Implemented (v0 Generated UI + Real Integrations)

- **Landing Page** - Hero section with feature highlights and CTAs
- **Wallet Dashboard** - PYUSD debit card UI, balance cards, activity feed with real HyperSync data
- **Send Payments** - Address/QR input, amount, gasless EIP-191 signing flow
- **Payroll (Batch Payments)** - ⚠️ WIP: Multi-recipient PYUSD distribution via dispersePay (gasless)
- **Invoice Creation** - Generate QR codes for payment requests
- **Faucet Claims** - UI for MATE and PYUSD testnet faucets (gasless + gas variants)
- **Withdraw Interface** - Withdraw PYUSD from EVVM to L1/L2
- **Explorer (PayVVM Scan)** - ✅ Real HyperSync integration with transaction filtering
- **Profile Page** - Wallet management, name registration, settings
- **PWA Manifest** - Installable with offline support
- **Theme Toggle** - Cyberpunk (retro terminal) ↔ Normie (minimal clean)
- **Responsive Design** - Mobile-first, WCAG AA compliant
- **QR Scanner** - Camera-based scanning for payment addresses
- **HyperSync Integration** - ✅ Live transaction indexing for PayVVM, ETH, PYUSD transfers

### 🚧 Integration TODOs

The UI is complete, and **HyperSync integration is live**. Remaining integrations needed in `services/evvm.ts`:

1. **Wallet Connection** - Replace mock wallet with Reown Kit/WalletConnect
2. **EVVM Contract Calls** - Implement 7 service functions:
   - `getEvvmBalances(address)` - Query internal EVVM balances
   - `getNativeBalances(address)` - Query L1/L2 native balances
   - `withdrawPyusdToSepolia(address, amount)` - Treasury withdrawal with signature
   - `createPaymentIntent(payload)` - Generate payment intent for QR codes
   - `submitSignedPayment(eip191Msg, sig)` - Submit signed payment to fisher
   - `createInvoice(amount, memo?)` - Create invoice with QR data
   - `resolveName(nameOrAddress)` - EVVM NameService resolution

3. ✅ ~~**Envio HyperSync**~~ - **COMPLETED** - Live transaction indexing via `utils/hypersync.ts`
4. **Contract ABIs** - Add EVVM, Treasury, NameService, Staking ABIs
5. **Signature Verification** - EIP-191/EIP-712 message signing flows

Most service functions currently return mock data (see `lib/mock.ts`), except HyperSync queries.

## Architecture

### Tech Stack

- **Framework**: Next.js 16 (App Router, React 19, RSC)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 (OKLCH color system)
- **UI Components**: shadcn/ui (Radix UI primitives + CVA)
- **Forms**: React Hook Form + Zod validation
- **State**: React Context API (WalletContext, ThemeContext)
- **PWA**: Service Worker + Web Manifest
- **Analytics**: Vercel Analytics

### Project Structure

```
payvvm-frontend/
├── app/                      # Next.js App Router
│   ├── page.tsx             # Landing page
│   ├── dashboard/           # Wallet dashboard (protected)
│   ├── send/                # Payment sending interface
│   ├── invoice/             # Invoice QR generation
│   ├── withdraw/            # Withdraw to L1/L2
│   ├── faucets/             # Token faucet claims
│   ├── explorer/            # Transaction history (PayVVM Scan)
│   ├── profile/             # User settings
│   └── privacy/             # Privacy policy
├── components/
│   ├── ui/                  # shadcn/ui primitives
│   ├── navbar.tsx           # Main navigation
│   ├── balance-card.tsx     # Token balance displays
│   ├── debit-card.tsx       # PYUSD debit card UI
│   ├── send-form.tsx        # Payment form with QR scanner
│   ├── invoice-qr.tsx       # QR code generation
│   ├── faucet-card.tsx      # Faucet claim cards
│   └── ...                  # Other feature components
├── contexts/
│   ├── wallet-context.tsx   # Wallet connection state (mock → Reown)
│   └── theme-context.tsx    # Dark/light theme persistence
├── services/
│   └── evvm.ts              # EVVM integration layer (⚠️ TODO)
├── hooks/
│   ├── use-toast.ts         # Toast notifications (sonner)
│   └── use-mobile.ts        # Responsive breakpoint detection
├── lib/
│   ├── utils.ts             # cn() for Tailwind + helpers
│   └── mock.ts              # Mock data (balances, transactions)
├── config/
│   └── site.ts              # Site metadata, links, constants
├── styles/
│   └── globals.css          # Tailwind + CSS variables + custom effects
└── public/
    ├── manifest.webmanifest # PWA manifest
    └── *.png                # Icons, assets
```

### State Management Pattern

**Context-Based Architecture:**
- `WalletContext` - Global wallet connection state (address, isConnected, connect, disconnect)
- `ThemeContext` - Theme preference with localStorage persistence (Cyberpunk ↔ Normie)

Both contexts wrap the app in `app/layout.tsx`:

```tsx
<ThemeProvider>
  <WalletProvider>
    <Navbar />
    <main>{children}</main>
  </WalletProvider>
</ThemeProvider>
```

### Service Layer Pattern

All blockchain interactions are abstracted through `services/evvm.ts`:

```typescript
// services/evvm.ts (currently returns mocks)
export async function getEvvmBalances(address: string) {
  // TODO: Implement real EVVM balance fetching
  return mockBalancesEVVM
}
```

This allows the UI to work with mock data during development and easily swap in real implementations.

## Development

### Available Scripts

```bash
# Development server with hot reload
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

### Adding shadcn/ui Components

This project uses [shadcn/ui](https://ui.shadcn.com/) with the "New York" style preset:

```bash
# Example: Add a new component
npx shadcn-ui@latest add button
```

Components are added to `components/ui/` and can be imported via path aliases:

```tsx
import { Button } from '@/components/ui/button'
```

### Development Workflow

1. **UI Development** - All UI is complete and works with mock data
2. **Service Integration** - Replace functions in `services/evvm.ts` incrementally
3. **Testing** - Test with deployed testnet contracts (see [Deployed Contracts](#deployed-contracts))
4. **Deployment** - Deploy to Vercel (analytics pre-configured)

## Integration Status

### Current State: ⚠️ Mock Data

The entire UI/UX is complete and fully functional with mock data. To integrate with real EVVM contracts:

### Step 1: Wallet Integration

Replace the mock wallet in `contexts/wallet-context.tsx`:

```typescript
// TODO: Replace with Reown Kit / WalletConnect
import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
```

**Resources:**
- [Reown AppKit Docs](https://docs.reown.com/appkit/overview)
- [WalletConnect v2](https://docs.walletconnect.com/)

### Step 2: Contract ABIs

Add contract ABIs from [payvvm-contracts](https://github.com/0xOucan/payvvm-contracts):

```typescript
// lib/contracts.ts
export const EVVM_ABI = [/* ... */]
export const TREASURY_ABI = [/* ... */]
export const NAME_SERVICE_ABI = [/* ... */]
```

Forge artifacts are located in `PAYVVM/out/` after compilation.

### Step 3: EVVM Service Implementation

Implement real contract calls in `services/evvm.ts`:

```typescript
import { readContract, writeContract } from 'wagmi/actions'

export async function getEvvmBalances(address: string) {
  // Query EVVM contract for internal balances
  const pyusdBalance = await readContract({
    address: EVVM_CONTRACT_ADDRESS,
    abi: EVVM_ABI,
    functionName: 'balanceOf',
    args: [address, PYUSD_TOKEN_ID],
  })

  return [
    { symbol: 'PYUSD', amount: formatUnits(pyusdBalance, 6), decimals: 6 },
    // ... other tokens
  ]
}
```

### Step 4: Envio HyperSync Integration ✅ COMPLETED

**HyperSync is now live!** Transaction indexing is implemented in `utils/hypersync.ts`.

**Implementation Details:**

```typescript
// utils/hypersync.ts
export async function fetchPayVVMTransactions(
  userAddress: string,
  fromBlock: number,
  toBlock: number,
  limit: number = 50
): Promise<PayVVMTransaction[]> {
  const query = {
    from_block: fromBlock,
    to_block: toBlock,
    transactions: [{
      from: [GOLDEN_FISHER.toLowerCase()],
      to: [EVVM_CONTRACT.toLowerCase()],
      status: 1, // CRITICAL: Filter for successful transactions only
    }],
    // ... field selection
  }

  const response = await fetch('https://sepolia.hypersync.xyz/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  })

  // Decode pay() function parameters without events
  // EVVM's pay() doesn't emit events - we decode from tx.input
}
```

**Key Features:**
- ✅ Filters successful transactions at HyperSync query level (`status: 1`)
- ✅ Decodes EVVM `pay()` function calls via manual ABI parsing
- ✅ Identifies user involvement (send/receive) by comparing addresses
- ✅ Works without events (EVVM's gasless design doesn't emit logs)
- ✅ Fetches PayVVM, ETH, and PYUSD transfers in parallel

**Resources:**
- [Envio HyperSync Docs](https://docs.envio.dev/docs/HyperSync-LLM/hypersync-complete)
- [HyperSync HTTP API](https://docs.envio.dev/docs/HyperSync/hypersync-clients)

### Deployed Contracts

**Ethereum Sepolia:**
- EVVM: `0x2029bb5e15E22c19Bc8bde3426fab29dD4db8A98`
- Treasury: `0x98465F828b82d0b676937e159547F35BBDBdfe91`
- NameService: `0xD904f38B8c9968AbAb63f47c21aB120FCe59F013`
- Staking: `0xA68D4a0cFFDc6145D35Ae27521d01b166Fe4AE46`

**Arbitrum Sepolia:**
- EVVM: `0xC688C12541Ff85EF3E63755F6889317f312d03A3`
- Treasury: `0x7d4F9D95e84f6903c7247527e6BF1FA864F7c764`
- NameService: `0x82Fbac7857E8407cE6578E02B0be0d3Cd15Fb790`
- Staking: `0xaC3C70604a5633807Ae0149B6E6766452355635C`

See [payvvm-contracts](https://github.com/0xOucan/payvvm-contracts) for contract source code and documentation.

## PWA Features

### Progressive Web App Support

This app is a fully installable PWA with:

- **Web App Manifest** (`public/manifest.webmanifest`)
  - Name: "PayVVM - Gasless PYUSD Wallet"
  - Theme color: `#00FF7F` (cyber green)
  - Icons: 192x192, 512x512 (maskable)
  - Display: `standalone` (native app feel)

- **Service Worker** (planned)
  - App shell caching for offline use
  - Runtime caching for HyperSync API calls (stale-while-revalidate)
  - Offline fallback pages

- **Install Prompt**
  - `InstallPWAButton` component in navbar
  - A2HS (Add to Home Screen) prompt for mobile
  - Shows only when app is not installed

### Offline Capabilities

The app gracefully handles offline states:
- Cached static assets load instantly
- Dashboard shows last-known balances
- Send/Invoice forms work with optimistic UI
- Explorer shows cached transaction history

## Theme System

### Dual Theme Support

PayVVM Frontend offers two distinct visual experiences:

#### 🌃 Cyberpunk Mode (Default)
**Dystopian terminal aesthetic with retro computing vibes**

- **Palette**: Terminal green (`#00FF7F`), near-black (`#0B0F0C`), cyber accents
- **Effects**:
  - CRT scanlines (`.scanlines` class)
  - Glitch text on hover (`.glitch-hover`)
  - Pixel art borders (`.pixel-border`)
  - Monospace fonts for numbers
- **Vibe**: Blade Runner meets terminal hacker

#### 🌅 Normie Mode
**Clean, minimal, professional design**

- **Palette**: Neutral grays, soft green accents (`#10B981`)
- **Effects**: Smooth transitions, soft shadows, system fonts
- **Vibe**: Modern fintech app

### Implementation

Themes use Tailwind CSS v4 with OKLCH color space for precise, perceptually uniform colors:

```css
/* styles/globals.css */
:root {
  --primary: oklch(0.205 0 0);
  --background: oklch(1 0 0);
  /* ... */
}

.dark {
  --primary: oklch(0.985 0 0);
  --background: oklch(0.145 0 0);
  /* ... */
}
```

Theme toggle in navbar saves preference to `localStorage` and respects `prefers-color-scheme`.

### Accessibility

- **WCAG AA compliant** - Color contrast ratios meet accessibility standards
- **Respects `prefers-reduced-motion`** - Disables glitch/scanline effects
- **Keyboard navigation** - All interactive elements are keyboard accessible
- **Focus indicators** - Visible focus rings on all focusable elements
- **ARIA labels** - Proper semantic HTML and ARIA attributes

## Pages & Routes

### `/` - Landing Page
**Hero section with product value proposition**

- Glitch-effect headline: "Gasless PYUSD, wallet-first."
- Feature highlights: Gasless, PYUSD-native, HyperSync live
- CTAs: "Launch PayVVM" → `/dashboard`, "Open Explorer" → `/explorer`
- Footer: Docs, GitHub, Twitter, Privacy links

### `/dashboard` - Wallet Dashboard
**Main wallet interface (requires wallet connection)**

- **PYUSD Debit Card** - Hero card with balance, randomized card number, address
- **Balance Cards** - MATE (EVVM native), ETH (gas), other tokens
- **Quick Actions** - Send, Invoice, Withdraw, Faucets, Explorer
- **Activity Feed** - Recent 5 transactions with "View all in Explorer"

Redirect to `/` if wallet not connected.

### `/send` - Send Payments
**Gasless PYUSD payment interface**

- **Recipient**: Text input or "Scan QR" button (opens camera)
- **Amount**: Decimal input with PYUSD (6 decimals) formatting
- **Memo**: Optional message field
- **Advanced**: Async Nonce toggle (for concurrent transactions)
- **CTA**: "Send (Gasless)" → creates EIP-191 message → wallet signature → submit to fisher

Badge: "Gasless / EVVM EIP-191"
Success: "Payment sent! View in Explorer"

### `/invoice` - Create Invoice
**Generate QR code payment requests**

- **Amount**: PYUSD amount input
- **Memo**: Optional invoice description
- **CTA**: "Generate QR" → displays QR code encoding:
  - Deep link: `payvvm://send?to=<address>&amount=<amt>&memo=<m>`
  - Or JSON payload for wallet signature

Instructions: "Customer scans QR to auto-fill Send form and signs (gasless)."

### `/withdraw` - Withdraw to L1/L2
**Withdraw PYUSD from EVVM internal balance to Sepolia wallet**

- **Amount**: PYUSD amount to withdraw
- **Preview**: Shows fees, expected arrival time
- **Flow**:
  1. Check allowance
  2. Approve if needed (EIP-191 signature)
  3. Withdraw (EIP-191 signature)
  4. Success with transaction link

Notes: "Gas sponsored by fishers when possible; otherwise wallet signs standard tx."

### `/faucets` - Testnet Faucets
**Claim test tokens for development**

Three faucet cards:
1. **MATE Faucet (Gasless)** - Claim MATE without ETH
2. **MATE Faucet (Needs Gas)** - Same payout, requires ETH for tx
3. **PYUSD (PayVVM) Faucet (Gasless)** - Claim test PYUSD internal balance

Each card shows:
- Claim amount and rules
- Cooldown timer (if recently claimed)
- "Claim" button with loading state
- Last claim status
- Success toast on claim

### `/explorer` - PayVVM Scan
**Transaction history and EVVM state explorer**

- **Search**: Address, name, or transaction ID
- **Tabs**: PayVVM Payments, ETH Transfers, PYUSD Transfers
- **Live Data**: Real HyperSync integration (✅ implemented)
- **Table**: Paginated transaction list with filters
  - Columns: Type, Token, Amount, From/To, Time, Block
  - Shows only successful transactions (failed txs filtered at query level)
  - Decodes pay() function parameters via ABI parsing
  - Identifies user involvement (send/receive)
- **Filters**: Token type, time range, block range

**Technical Implementation:**
- Uses HyperSync HTTP API at `https://sepolia.hypersync.xyz/query`
- Filters successful transactions using `status: 1` in TransactionSelection
- Decodes EVVM `pay()` function calls without events (gasless design)
- See `utils/hypersync.ts` for implementation details

Powered by Envio HyperSync for real-time indexing.

### `/profile` - User Profile
**Wallet management and settings**

- **Connected Address**: Display with copy button
- **Wallet Sessions**: List of connected wallets/providers
- **PayVVM Names**: List of registered EVVM names + "Register Name" button
- **Notifications**: Preferences for transaction alerts
- **Danger Zone**: Disconnect wallet button

### `/payroll` - Batch Payment Distribution ⚠️ WIP
**Multi-recipient PYUSD distribution via EVVM dispersePay**

- **Add Recipients**: Manually add multiple addresses with individual amounts
- **Import CSV**: Bulk upload payroll data
- **Preview**: Review total distribution and gas savings
- **Sign & Execute**: Create EIP-191 signature for all payments (single signature, multiple transfers)

**Status**: Currently experiencing `InvalidSignature()` errors despite mathematically valid signatures. Under investigation with EVVM team.

**Technical Details:**
- Uses EVVM `dispersePay()` function for batch payments
- Changed to async nonces (`priorityFlag: true`) to prevent race conditions
- Signature construction verified via diagnostic tools
- Fisher bot executes signed batch on-chain

See [Diagnostic Tools](#diagnostic-tools) for debugging scripts.

## Diagnostic Tools

A suite of command-line tools for debugging EVVM transactions and signatures:

### Transaction Analysis
```bash
# Analyze any dispersePay transaction
npx tsx analyze-any-tx.ts <tx-hash>

# Verify recipient amounts add up correctly
npx tsx analyze-recipients.ts <tx-hash>

# Simulate contract signature verification
npx tsx simulate-contract-verification.ts <tx-hash>
```

### State Queries
```bash
# Check if async nonce is available
npx tsx check-async-nonce.ts

# Check user's EVVM PYUSD balance
npx tsx check-evvm-balance.ts

# Verify EVVM contract ID
npx tsx check-evvm-id.ts
```

### Signature Testing
```bash
# Test exact signature from transaction
npx tsx test-exact-signature.ts
```

These tools were created to debug payroll `InvalidSignature()` errors and verify:
- ✅ Signatures are mathematically valid
- ✅ Message construction matches contract format
- ✅ Nonce availability
- ✅ Balance sufficiency
- ✅ Recipient amounts validate

Despite all checks passing, transactions still revert—issue under investigation.

## Components

### Core Components

#### `<Navbar />`
Main navigation with responsive mobile menu
- Logo + navigation links (Dashboard, Send, Invoice, Explorer)
- Right side: `<InstallPWAButton />`, `<ModeToggle />`, `<ConnectWalletButton />`
- Sticky positioning with backdrop blur

#### `<ConnectWalletButton />`
Wallet connection UI
- Shows "Connect Wallet" when disconnected
- Shows shortened address when connected (with dropdown)
- Uses `useWallet()` hook from WalletContext

#### `<DebitCard />`
PYUSD debit card visual component
```tsx
<DebitCard
  label="PYUSD Balance"
  address="0x742d35Cc..."
  balance="250.00"
  symbol="PYUSD"
/>
```
- Displays balance with large typography
- Shows card holder (shortened address)
- Generates randomized 16-digit card number (non-sensitive, for aesthetics)
- Subline: "EVVM internal balance · signature-based transfers"

#### `<BalanceCard />`
Token balance display
```tsx
<BalanceCard
  title="MATE Balance"
  tokens={[{ symbol: 'MATE', amount: '1234.56', decimals: 18 }]}
/>
```

#### `<SendForm />`
Payment form with QR scanner
- Address input with validation
- "Scan QR" button (opens `<QRScanner />`)
- Amount input with decimal handling
- Async nonce toggle (advanced)
- Submit → EIP-191 signing flow

#### `<InvoiceQR />`
QR code generation for invoices
```tsx
<InvoiceQR amount="42.00" memo="Coffee payment" />
```
- Generates QR encoding payment data
- Copy-to-clipboard button
- Share functionality (Web Share API)

#### `<QRScanner />`
Camera-based QR code scanner
- Requests camera permission
- Live video preview with scanning overlay
- Parses QR data and auto-fills forms
- Graceful fallback if camera unavailable

#### `<FaucetCard />`
Faucet claim interface
```tsx
<FaucetCard
  title="MATE Faucet (Gasless)"
  description="Claim 100 MATE every 24 hours"
  gasless={true}
  onClaim={handleClaim}
/>
```
- Claim button with loading state
- Cooldown timer display
- Last claim status

#### `<DataTable />`
Generic data table for Explorer
- Pagination support
- Row click handlers
- Sortable columns
- Loading states

### UI Primitives

All shadcn/ui components in `components/ui/`:
- Button, Card, Badge, Toast, Dialog, Sheet
- Form, Input, Label, Textarea
- Accordion, Tabs, Dropdown
- And more...

## Services & APIs

### `services/evvm.ts`

**⚠️ Currently returns mock data. Implement real contract calls.**

```typescript
// Get EVVM internal balances (PYUSD, MATE, etc.)
export async function getEvvmBalances(address: string): Promise<Balance[]>

// Get native chain balances (ETH on Sepolia)
export async function getNativeBalances(address: string): Promise<Balance[]>

// Withdraw PYUSD from EVVM to L1/L2 wallet
export async function withdrawPyusdToSepolia(
  address: string,
  amount: string
): Promise<{ success: boolean; txHash: string }>

// Create payment intent (for invoices)
export async function createPaymentIntent(payload: {
  to: string
  amount: string
  token: string
  memo?: string
}): Promise<{ intentId: string }>

// Submit signed EIP-191 payment to fisher
export async function submitSignedPayment(
  eip191Msg: string,
  sig: string
): Promise<{ success: boolean; txId: string }>

// Create invoice with QR data
export async function createInvoice(
  amount: string,
  memo?: string
): Promise<{ invoiceId: string }>

// Resolve EVVM NameService name to address
export async function resolveName(
  nameOrAddress: string
): Promise<string>

// Query transaction history via HyperSync
export async function getExplorerFeed(params: {
  type?: string
  limit?: number
  offset?: number
}): Promise<Transaction[]>
```

### Mock Data (`lib/mock.ts`)

Used during development before real integration:

```typescript
export const mockBalancesEVVM = [
  { symbol: 'PYUSD', amount: '250.00', decimals: 6 },
  { symbol: 'MATE', amount: '1234.56', decimals: 18 },
]

export const mockBalancesNative = [
  { symbol: 'ETH', amount: '0.1234', decimals: 18 },
]

export const mockTxs = [
  {
    id: 'tx_1',
    type: 'payment',
    token: 'PYUSD',
    amount: '19.99',
    counterparty: 'vitalik.eth',
    time: '2m'
  },
  // ... more mock transactions
]
```

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/0xOucan/payvvm-frontend)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel
```

**Environment Variables:**
Set all `NEXT_PUBLIC_*` variables in Vercel dashboard → Settings → Environment Variables.

### Self-Hosted

```bash
# Build production bundle
pnpm build

# Start production server
pnpm start
```

Serve on port 3000 by default. Use a reverse proxy (nginx, Caddy) for production.

### PWA Considerations

- **HTTPS Required** - Service workers only work over HTTPS (or localhost)
- **Icon Assets** - Ensure `public/icon-192.png` and `public/icon-512.png` exist
- **Service Worker** - Register in `app/layout.tsx` (currently not implemented)

## Contributing

This is part of the [PayVVM monorepo](https://github.com/0xOucan/PAYVVM). Contributions are welcome!

### Development Priorities

1. **Wallet Integration** - Implement Reown Kit / WalletConnect
2. **EVVM Service Layer** - Replace mocks with real contract calls
3. **HyperSync Integration** - Real-time transaction indexing
4. **Service Worker** - Offline caching and background sync
5. **Testing** - Unit tests (Vitest) and E2E tests (Playwright)

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Run `pnpm lint` before committing
- **Prettier** - Code formatting (future: add prettier config)
- **Commit Messages** - Use conventional commits

### Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Links

### PayVVM Ecosystem

- **Main Repository**: [PAYVVM](https://github.com/0xOucan/PAYVVM)
- **Smart Contracts**: [payvvm-contracts](https://github.com/0xOucan/payvvm-contracts)
- **Frontend (This Repo)**: [payvvm-frontend](https://github.com/0xOucan/payvvm-frontend)

### Documentation

- **EVVM Docs**: https://www.evvm.info/docs/EVVM/Introduction
- **Envio HyperSync**: https://docs.envio.dev/docs/HyperSync-LLM/hypersync-complete
- **PayVVM Architecture**: See main repo README

### External Tools

- **Next.js**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Reown AppKit**: https://docs.reown.com/appkit/overview
- **Envio Platform**: https://envio.dev

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for gasless PYUSD payments**

*Runs on EVVM test networks for demo. Use at your own risk.*
