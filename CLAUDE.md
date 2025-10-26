# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **payvvm-frontend** - a standalone Next.js 16 PWA for gasless PYUSD payments powered by EVVM. This frontend is part of the larger PayVVM ecosystem but operates independently from the Scaffold-ETH 2 based `envioftpayvvm` module.

**Key Technologies:**
- **Framework**: Next.js 16 with React 19 and App Router
- **UI**: shadcn/ui (New York style) + Tailwind CSS v4 + Radix UI primitives
- **State**: React Context API (WalletContext, ThemeContext)
- **Forms**: React Hook Form + Zod validation
- **Styling**: Tailwind CSS v4 with OKLCH color system + custom retro/cyberpunk aesthetic
- **PWA**: Progressive Web App with manifest.webmanifest
- **Analytics**: Vercel Analytics

## Architecture

### Directory Structure

```
payvvm-frontend/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Main wallet dashboard
│   ├── send/              # Payment sending interface
│   ├── invoice/           # Invoice creation & QR codes
│   ├── withdraw/          # Withdraw PYUSD to L1/L2
│   ├── faucets/           # Token faucet claims
│   ├── explorer/          # Transaction history feed
│   ├── profile/           # User profile & settings
│   └── privacy/           # Privacy policy
├── components/            # Reusable React components
│   ├── ui/               # shadcn/ui primitives
│   ├── navbar.tsx        # Main navigation
│   ├── balance-card.tsx  # Token balance displays
│   ├── debit-card.tsx    # PYUSD card UI
│   ├── send-form.tsx     # Payment form
│   ├── invoice-qr.tsx    # QR code generation
│   └── faucet-card.tsx   # Faucet claim cards
├── contexts/              # React Context providers
│   ├── wallet-context.tsx # Wallet connection state
│   └── theme-context.tsx  # Dark/light theme
├── services/              # API & blockchain services
│   └── evvm.ts           # EVVM integration layer (TODO)
├── hooks/                 # Custom React hooks
│   ├── use-toast.ts      # Toast notifications
│   └── use-mobile.ts     # Mobile detection
├── lib/                   # Utilities & helpers
│   ├── utils.ts          # cn() for Tailwind + misc utils
│   └── mock.ts           # Mock data for development
├── config/                # App configuration
│   └── site.ts           # Site metadata & links
├── styles/                # Global styles
│   └── globals.css       # Tailwind imports + CSS variables
└── public/                # Static assets
    └── manifest.webmanifest # PWA manifest
```

### Key Architectural Patterns

**1. Context-Based State Management**
- `WalletContext`: Manages wallet connection state (currently mock, needs WalletConnect/Reown integration)
- `ThemeContext`: Handles dark/light mode with localStorage persistence
- Both contexts wrap the app in `app/layout.tsx`

**2. Service Layer Pattern**
- `services/evvm.ts` provides abstraction for blockchain interactions
- Currently returns mock data - all functions have `// TODO: Implement real EVVM integration` comments
- Functions include: `getEvvmBalances()`, `withdrawPyusdToSepolia()`, `createPaymentIntent()`, `submitSignedPayment()`, etc.

**3. Component Composition**
- shadcn/ui components in `components/ui/` are building blocks
- Feature components (`balance-card`, `send-form`, etc.) compose UI primitives
- Pages in `app/` orchestrate components and data fetching

**4. Loading States**
- Each route has a `loading.tsx` for Suspense boundaries
- Uses spinner component from `components/ui/spinner.tsx`

## Development Commands

### Setup
```bash
# Install dependencies
pnpm install

# Development server (http://localhost:3000)
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint
```

### Working with shadcn/ui Components

This project uses shadcn/ui configured in `components.json`:
- **Style**: `new-york` (modern, clean aesthetic)
- **Base color**: `neutral`
- **Icon library**: `lucide-react`
- **Path aliases**: `@/components`, `@/lib`, `@/hooks`, etc.

When adding new shadcn components, they will be added to `components/ui/` automatically.

## Current State & TODOs

### Implemented Features
- ✅ Full UI/UX with retro cyberpunk theme (scanlines, glitch effects, pixel borders)
- ✅ PWA configuration with manifest
- ✅ Responsive navbar with mobile support
- ✅ Dashboard with balance cards and transaction feed
- ✅ Send payment form with QR scanner
- ✅ Invoice creation with QR codes
- ✅ Faucet claim interface
- ✅ Explorer/transaction history view
- ✅ Dark/light theme toggle
- ✅ Mock wallet connection (localStorage-based)

### Integration TODOs (Search for `// TODO:` in code)

**Critical Path:**
1. **Wallet Integration** (`contexts/wallet-context.tsx:30`)
   - Replace mock wallet with WalletConnect/Reown Kit
   - Implement real wallet signature flows

2. **EVVM Service Layer** (`services/evvm.ts`)
   - Implement all 8 service functions with real contract calls
   - Functions to implement:
     - `getEvvmBalances()` - Query EVVM balances via Envio HyperSync or RPC
     - `getNativeBalances()` - Query L1/L2 native token balances
     - `withdrawPyusdToSepolia()` - Call Treasury withdrawal with EIP-191 signature
     - `createPaymentIntent()` - Generate payment intent for QR codes
     - `submitSignedPayment()` - Submit signed payment to EVVM fisher
     - `createInvoice()` - Create invoice with amount/memo
     - `resolveName()` - Resolve EVVM NameService domains
     - `getExplorerFeed()` - Query transaction history via Envio HyperSync

3. **Contract Integration**
   - Add contract ABIs (EVVM, Treasury, NameService)
   - Configure contract addresses (already deployed - see parent CLAUDE.md)
   - Set up ethers/viem for contract calls

4. **Envio HyperSync Integration**
   - Replace mock transaction feeds with real HyperSync queries
   - Index EVVM payment events, withdrawals, name registrations
   - Real-time balance updates

### Configuration Notes

**Environment Variables** (not currently used, but will be needed):
```bash
NEXT_PUBLIC_DOCS_EVVM=https://www.evvm.info/docs/EVVM/Introduction
NEXT_PUBLIC_DOCS_HYPERSYNC=https://docs.envio.dev/docs/HyperSync-LLM/hypersync-complete
# Add when implementing:
# NEXT_PUBLIC_EVVM_CONTRACT_ETH=0x2029bb5e15E22c19Bc8bde3426fab29dD4db8A98
# NEXT_PUBLIC_EVVM_CONTRACT_ARB=0xC688C12541Ff85EF3E63755F6889317f312d03A3
# NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
# NEXT_PUBLIC_ENVIO_API_KEY=...
```

**TypeScript Configuration**:
- `typescript.ignoreBuildErrors: true` in `next.config.mjs` (consider removing once integration is complete)
- Path aliases configured via `tsconfig.json` with `@/*` pointing to root

**Deployed Contracts** (from parent CLAUDE.md):
- **Ethereum Sepolia**: EVVM `0x2029bb5e15E22c19Bc8bde3426fab29dD4db8A98`, Treasury `0x98465F828b82d0b676937e159547F35BBDBdfe91`
- **Arbitrum Sepolia**: EVVM `0xC688C12541Ff85EF3E63755F6889317f312d03A3`, Treasury `0x7d4F9D95e84f6903c7247527e6BF1FA864F7c764`

## UI Customization

### Theme System
The app uses Tailwind CSS v4 with OKLCH color space for precise color control:
- Colors defined in `styles/globals.css` using CSS custom properties
- Light and dark mode variants with `.dark` class
- Primary accent color: `#00FF7F` (cyber green)
- Background uses subtle scanline effect (`.scanlines` class)

### Custom CSS Classes
- `.glitch-hover` - Glitch text effect on hover
- `.pixel-border` - Retro pixel-art style borders
- `.scanlines` - CRT monitor scanline overlay
- Font stack: Geist Sans + Geist Mono from `next/font/google`

### Adding shadcn Components
When adding new UI components from shadcn/ui, they will automatically use the configured theme. The `components.json` ensures consistency.

## Important Patterns

### Protected Routes
Dashboard and authenticated pages check wallet connection:
```typescript
const { isConnected } = useWallet()
useEffect(() => {
  if (!isConnected) {
    router.push('/')
  }
}, [isConnected, router])
```

### Data Fetching Pattern
Pages use `useEffect` to load data on mount:
```typescript
useEffect(() => {
  async function loadData() {
    const [evvm, native] = await Promise.all([
      getEvvmBalances(address),
      getNativeBalances(address),
    ])
    setEvvmBalances(evvm)
    setNativeBalances(native)
  }
  loadData()
}, [address])
```

### Form Validation
Forms use React Hook Form + Zod (dependencies installed):
```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
```

## Integration with Parent Project

This frontend is designed to work with the PayVVM ecosystem:
- **EVVM Contracts**: Located in `/home/oucan/PayVVM/PAYVVM/src/contracts/`
- **Envio Indexer**: Located in `/home/oucan/PayVVM/envioftpayvvm/packages/envio/`
- **Contract ABIs**: Will need to be copied from PAYVVM forge artifacts

The parent project uses Foundry for contracts and Envio for indexing. When implementing the EVVM service layer, refer to:
1. Contract interfaces in `PAYVVM/src/contracts/`
2. Envio event schemas in `envioftpayvvm/packages/envio/config.yaml`
3. Signature verification patterns in `PAYVVM/src/lib/SignatureRecover.sol`

## Development Workflow

1. **UI Development**: Currently works with mock data - safe to iterate on components/styling
2. **Service Integration**: Replace mocks in `services/evvm.ts` one function at a time
3. **Testing**: Test with deployed testnet contracts (Sepolia/Arbitrum Sepolia)
4. **Deployment**: Deploy to Vercel (analytics already configured)

## Debugging Tips

- **TypeScript errors**: Currently ignored in build - fix incrementally by removing `ignoreBuildErrors`
- **Mock data**: Located in `lib/mock.ts` - easy to extend for testing
- **Wallet state**: Stored in localStorage as `payvvm-wallet-address`
- **Theme state**: Managed by `next-themes` library with system preference detection
