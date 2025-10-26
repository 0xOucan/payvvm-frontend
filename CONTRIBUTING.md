# Contributing to PayVVM Frontend

Thank you for your interest in contributing to PayVVM Frontend! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Development Priorities](#development-priorities)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, professional, and constructive in all interactions.

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm installed
- Git configured with SSH keys
- Familiarity with Next.js, TypeScript, and Tailwind CSS

### Setup

1. **Fork the repository**
   ```bash
   # Via GitHub UI: Click "Fork" button
   ```

2. **Clone your fork**
   ```bash
   git clone git@github.com:YOUR_USERNAME/payvvm-frontend.git
   cd payvvm-frontend
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream git@github.com:0xOucan/payvvm-frontend.git
   ```

4. **Install dependencies**
   ```bash
   pnpm install
   ```

5. **Create environment file**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

6. **Start development server**
   ```bash
   pnpm dev
   ```

## Development Workflow

### Creating a Feature Branch

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### Branch Naming Convention

- `feature/` - New features (e.g., `feature/wallet-integration`)
- `fix/` - Bug fixes (e.g., `fix/balance-calculation`)
- `docs/` - Documentation updates (e.g., `docs/api-reference`)
- `refactor/` - Code refactoring (e.g., `refactor/service-layer`)
- `test/` - Test additions/updates (e.g., `test/send-form`)

### Making Changes

1. **Run the development server** to test your changes
   ```bash
   pnpm dev
   ```

2. **Test in both themes** (Cyberpunk and Normie)
   - Click the theme toggle in navbar
   - Verify styling works in both modes

3. **Check responsiveness**
   - Test on mobile (DevTools → Toggle device toolbar)
   - Verify tablet and desktop layouts

4. **Run linting**
   ```bash
   pnpm lint
   ```

## Project Structure

Understanding the codebase structure will help you contribute effectively:

```
payvvm-frontend/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Wallet dashboard
│   └── ...                # Other routes
├── components/
│   ├── ui/                # shadcn/ui primitives (don't modify manually)
│   └── *.tsx              # Feature components (modify these)
├── contexts/              # React Context providers
├── services/              # API integration layer (⚠️ TODO: implement)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and helpers
├── config/                # App configuration
└── styles/                # Global styles and theme
```

**Key Files:**
- `services/evvm.ts` - **Primary integration target** - All TODO functions here
- `contexts/wallet-context.tsx` - Wallet state management (needs Reown Kit)
- `lib/mock.ts` - Mock data (safe to modify for testing)
- `styles/globals.css` - Theme variables and custom CSS

## Coding Standards

### TypeScript

- **Strict mode enabled** - No `any` types without justification
- **Explicit return types** for exported functions
- **Interface over type** for object shapes (unless union types needed)

```typescript
// ✅ Good
export async function getBalance(address: string): Promise<Balance[]> {
  // implementation
}

// ❌ Avoid
export async function getBalance(address: any) {
  // implementation
}
```

### React Components

- **Functional components** with TypeScript
- **Named exports** for reusable components
- **Props interface** clearly defined

```typescript
// ✅ Good
interface BalanceCardProps {
  title: string
  tokens: Balance[]
}

export function BalanceCard({ title, tokens }: BalanceCardProps) {
  return <Card>...</Card>
}
```

### Styling

- **Tailwind classes** for styling (avoid inline styles)
- **Use `cn()` utility** from `lib/utils.ts` for conditional classes
- **Respect theme variables** - Use CSS variables from `globals.css`

```tsx
// ✅ Good
<div className={cn(
  "px-4 py-2 rounded-lg",
  isActive && "bg-primary text-primary-foreground"
)}>

// ❌ Avoid
<div style={{ padding: "8px 16px", backgroundColor: isActive ? "green" : "" }}>
```

### State Management

- **Use Context** for global state (wallet, theme)
- **useState/useEffect** for component-level state
- **Minimize prop drilling** - Extract to Context if passing through >2 levels

### Accessibility

- **WCAG AA compliance** required
- **Semantic HTML** - Use correct elements (`<button>`, `<nav>`, etc.)
- **ARIA labels** for icon-only buttons
- **Keyboard navigation** - All interactive elements must be keyboard accessible

```tsx
// ✅ Good
<button aria-label="Close dialog" onClick={handleClose}>
  <X className="h-4 w-4" />
</button>

// ❌ Avoid
<div onClick={handleClose}>
  <X />
</div>
```

## Commit Guidelines

### Commit Message Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks (dependencies, config)

**Examples:**

```bash
feat(wallet): implement Reown Kit integration

- Add WalletConnect provider setup
- Update WalletContext with real connection logic
- Add disconnect functionality

Closes #12

---

fix(send): correct PYUSD decimal handling

The amount input was using 18 decimals instead of 6 for PYUSD.
Updated formatUnits call to use correct decimals.

Fixes #23

---

docs(readme): add HyperSync integration guide

Added step-by-step instructions for integrating Envio HyperSync
with code examples and API references.
```

## Pull Request Process

### Before Submitting

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Run checks**
   ```bash
   pnpm lint
   pnpm build  # Ensure it builds successfully
   ```

3. **Test thoroughly**
   - Test in both themes (Cyberpunk + Normie)
   - Test on mobile and desktop
   - Test with mock data (current state)
   - If implementing real services, test with testnet

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open PR on GitHub**
   - Use a clear, descriptive title
   - Reference related issues (`Closes #123`, `Fixes #456`)
   - Describe what changed and why
   - Add screenshots for UI changes
   - Mark as draft if work in progress

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that breaks existing functionality)
- [ ] Documentation update

## Changes Made
- Change 1
- Change 2
- Change 3

## Testing
- [ ] Tested in Cyberpunk theme
- [ ] Tested in Normie theme
- [ ] Tested on mobile
- [ ] Tested on desktop
- [ ] Linting passes (`pnpm lint`)
- [ ] Build succeeds (`pnpm build`)

## Screenshots (if applicable)
[Add screenshots here]

## Related Issues
Closes #123
Fixes #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated (if needed)
- [ ] No console errors or warnings
- [ ] Accessibility guidelines followed
```

### Review Process

1. **Automated checks** must pass (linting, build)
2. **Maintainer review** - Expect feedback and iteration
3. **Address feedback** - Make changes and push updates
4. **Approval** - Once approved, maintainer will merge

## Development Priorities

The project is in **UI-complete, integration-pending** state. Contributions are most valuable in these areas:

### 🔥 High Priority

1. **Wallet Integration** (`contexts/wallet-context.tsx`)
   - Replace mock wallet with Reown Kit / WalletConnect
   - Implement real signature flows (EIP-191, EIP-712)
   - Handle wallet errors and edge cases

2. **EVVM Service Layer** (`services/evvm.ts`)
   - Implement all 8 TODO functions with real contract calls
   - Add contract ABIs from payvvm-contracts
   - Error handling and loading states

3. **Envio HyperSync Integration**
   - Replace mock transaction feeds
   - Real-time indexing for Explorer
   - Balance updates via HyperSync queries

### 📝 Medium Priority

4. **Testing**
   - Unit tests (Vitest) for utilities
   - Component tests (React Testing Library)
   - E2E tests (Playwright) for critical flows

5. **Service Worker**
   - Offline caching strategy
   - Background sync for transactions
   - Push notifications

6. **Enhanced Features**
   - Batch payments / payroll
   - Recurring subscriptions
   - Payment links
   - Multi-signature support

### 🎨 Low Priority

7. **UI Polish**
   - Animation improvements
   - Loading skeleton states
   - Enhanced error states
   - Additional theme variants

8. **Documentation**
   - API documentation
   - Component Storybook
   - Video tutorials

## Questions or Issues?

- **Bugs**: Open an issue with reproduction steps
- **Feature requests**: Open an issue with use case description
- **Questions**: Open a discussion or ask in issue comments
- **Security**: Email security@payvvm.example (do NOT open public issue)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to PayVVM Frontend!** 🚀
