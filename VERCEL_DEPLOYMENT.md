# Vercel Deployment Guide

This guide explains how to deploy the PayVVM Frontend to Vercel with all necessary configurations.

## Quick Deploy

The app is pre-configured for Vercel deployment with all public environment variables set in `vercel.json`.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/0xOucan/payvvm-frontend)

## Environment Variables Setup

### Automatic (via vercel.json)

The following environment variables are automatically configured from `vercel.json`:

**Public Variables (Safe to expose):**
- `NEXT_PUBLIC_HYPERSYNC_URL` - HyperSync endpoint for Sepolia
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect project ID
- All EVVM contract addresses (Sepolia testnet)
- All faucet addresses
- Token addresses and decimals
- Feature flags
- Documentation links

**Fisher Bot Settings:**
- `FISHER_ENABLED` - Set to `false` by default
- `FISHER_GAS_PRICE_MULTIPLIER` - Gas multiplier (1.2)
- `FISHER_POLLING_INTERVAL` - Polling interval in ms (5000)

### Manual Setup Required (Sensitive)

**FISHER_PRIVATE_KEY** - Required for Fisher Bot functionality

This is intentionally NOT included in `vercel.json` for security reasons.

#### To enable the Fisher Bot:

1. **Go to your Vercel project dashboard**
2. Navigate to **Settings** → **Environment Variables**
3. Add a new environment variable:
   - **Key**: `FISHER_PRIVATE_KEY`
   - **Value**: Your Golden Fisher wallet private key (starts with `0x`)
   - **Environments**: Select all (Production, Preview, Development)
4. Add another environment variable to enable it:
   - **Key**: `FISHER_ENABLED`
   - **Value**: `true`
   - **Environments**: Select all
5. **Redeploy** your application

**⚠️ Security Warning:**
- NEVER commit `FISHER_PRIVATE_KEY` to git
- NEVER expose it in client-side code
- Use a dedicated wallet for the Fisher Bot
- Fund it with only the necessary ETH for gas

## Deployment Steps

### Option 1: Deploy from GitHub (Recommended)

1. **Fork or clone** the repository to your GitHub account

2. **Import to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select "Import Git Repository"
   - Choose your forked `payvvm-frontend` repository
   - Vercel will auto-detect Next.js settings

3. **Configure (if needed):**
   - Framework Preset: **Next.js**
   - Build Command: `pnpm build` (auto-detected from vercel.json)
   - Output Directory: `.next` (default)
   - Install Command: `pnpm install` (auto-detected from vercel.json)

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)

5. **Add Fisher Private Key (optional):**
   - Follow steps in [Manual Setup Required](#manual-setup-required-sensitive)

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Or deploy to preview
vercel
```

### Option 3: One-Click Deploy Button

Use the deploy button at the top of this guide to clone and deploy in one step.

## Post-Deployment Configuration

### 1. Verify Environment Variables

After deployment, check that all environment variables are correctly set:

```bash
# In Vercel dashboard
Settings → Environment Variables
```

Verify that you see all variables from `vercel.json`.

### 2. Test the Deployment

Visit your deployed URL and verify:
- ✅ Landing page loads
- ✅ Dashboard shows correct contract addresses
- ✅ Explorer loads transaction data from HyperSync
- ✅ Faucet page displays correctly
- ✅ No console errors related to missing environment variables

### 3. Enable Fisher Bot (Optional)

If you want gasless transaction execution:

1. Add `FISHER_PRIVATE_KEY` as described above
2. Change `FISHER_ENABLED` to `true`
3. Redeploy
4. Check logs to verify fisher bot is running:
   ```
   Settings → Functions → Logs
   ```
   Look for: `🎣 Fisher Bot Starting...`

## Environment-Specific Configurations

### Production

All environment variables from `vercel.json` are used.

**Additional production considerations:**
- Enable Vercel Analytics (already configured via package)
- Set up custom domain
- Configure CORS if needed
- Monitor function logs for fisher bot

### Preview (Pull Requests)

Same configuration as production, but with preview URLs.

Good for testing:
- New features
- HyperSync integration changes
- Frontend updates

### Development

Local development uses `.env.local` instead of `vercel.json`.

To sync with Vercel:
```bash
vercel env pull .env.local
```

This downloads environment variables from Vercel to your local `.env.local`.

## Troubleshooting

### Error: "Environment Variable references Secret which does not exist"

**Cause:** vercel.json had secret references (e.g., `@hypersync-url`) but secrets weren't created.

**Solution:** This has been fixed in the latest version. The `vercel.json` now uses direct values for public variables.

If you see this error:
1. Pull latest changes from main branch
2. Verify `vercel.json` has direct values, not `@secret-name` references
3. Redeploy

### Error: "Fisher bot not starting"

**Cause:** `FISHER_PRIVATE_KEY` is not set or invalid.

**Solution:**
1. Add `FISHER_PRIVATE_KEY` in Vercel dashboard
2. Ensure it's a valid private key (64 hex characters with `0x` prefix)
3. Check that wallet has ETH for gas on Sepolia
4. Verify `FISHER_ENABLED=true`
5. Redeploy

### Error: "HyperSync connection failed"

**Cause:** HyperSync endpoint is unreachable or incorrect.

**Solution:**
1. Verify `NEXT_PUBLIC_HYPERSYNC_URL=https://sepolia.hypersync.xyz`
2. Check Envio HyperSync status: https://status.envio.dev
3. Test endpoint directly:
   ```bash
   curl -X POST https://sepolia.hypersync.xyz/query \
     -H "Content-Type: application/json" \
     -d '{"from_block":0,"to_block":100,"field_selection":{}}'
   ```

### Build Errors

**Common causes:**
- Missing dependencies
- TypeScript errors
- Environment variable issues

**Solution:**
1. Check build logs in Vercel dashboard
2. Test build locally:
   ```bash
   pnpm build
   ```
3. Verify all dependencies in `package.json`
4. Check `next.config.mjs` configuration

## Performance Optimization

### Vercel Settings

**Recommended:**
- **Node.js Version**: 20.x (set in dashboard)
- **Function Region**: Choose closest to your users
- **Caching**: Enabled (default)

### Next.js Optimizations

Already configured:
- Static generation for public pages
- Image optimization via Next.js Image component
- Code splitting and lazy loading
- Turbopack for faster builds (Next.js 16)

## Monitoring & Analytics

### Vercel Analytics

Already integrated via `@vercel/analytics` package.

View analytics in:
```
Vercel Dashboard → Analytics
```

Metrics available:
- Page views
- Unique visitors
- Web Vitals (LCP, FID, CLS)
- Top pages
- Devices and browsers

### Function Logs

Monitor Fisher Bot and API routes:
```
Vercel Dashboard → Functions → Logs
```

Filter by:
- Function name (e.g., `/api/fishing/submit`)
- Log level (Info, Warning, Error)
- Time range

## Custom Domain Setup

1. **Add domain in Vercel:**
   ```
   Settings → Domains → Add
   ```

2. **Configure DNS:**
   - Add CNAME record pointing to Vercel
   - Or use Vercel nameservers

3. **SSL Certificate:**
   - Automatically provisioned by Vercel
   - Usually ready in 1-2 minutes

4. **Update environment variables if needed:**
   - Some features may require updating CORS settings
   - WalletConnect might need domain whitelist

## Security Checklist

Before going to production:

- [ ] `FISHER_PRIVATE_KEY` is stored as environment variable (not in code)
- [ ] `.env.local` is in `.gitignore`
- [ ] All sensitive data uses environment variables
- [ ] Fisher wallet has limited funds (only gas money)
- [ ] CORS is properly configured for API routes
- [ ] Rate limiting is enabled for public endpoints
- [ ] Contract addresses are verified on Etherscan

## Support

**Issues with deployment?**

1. Check [Vercel Documentation](https://vercel.com/docs)
2. Review [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
3. Open an issue on [GitHub](https://github.com/0xOucan/payvvm-frontend/issues)

**Need help with EVVM or HyperSync?**

- EVVM Docs: https://www.evvm.info/docs/EVVM/Introduction
- Envio Docs: https://docs.envio.dev/docs/HyperSync-LLM/hypersync-complete

---

**Last Updated:** October 2024
**Next.js Version:** 16.0.0
**Vercel Configuration:** vercel.json
