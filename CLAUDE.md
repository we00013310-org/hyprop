# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HyProp is a prop trading platform for cryptocurrency futures, built with React/TypeScript frontend and Supabase backend. The platform allows traders to:

1. Take test accounts (simulated trading evaluations)
2. Pass evaluation criteria to get funded accounts
3. Trade with HyProp capital on Hyperliquid DEX

## Development Commands

```bash
# Development
npm run dev              # Start development server (local/default mode)
npm run dev:stg          # Start development server (staging mode)
npm run build            # Build for staging
npm run build:prod       # Build for production
npm run preview          # Preview production build (local)
npm run preview:stg      # Preview staging build

# Code Quality
npm run lint             # Run ESLint
npm run typecheck        # Type check without emitting files

# Database (Supabase)
npx supabase start       # Start local Supabase instance
npx supabase db reset    # Reset local database
npx supabase migration new <name>  # Create new migration
npx supabase db push     # Push migrations to remote
npm run db:types         # Generate TypeScript types from local database
npm run db:types:remote  # Generate TypeScript types from remote database (requires SUPABASE_PROJECT_ID)

# Edge Functions
npm run server           # Serve edge functions locally
npx supabase functions deploy hyperliquid-trading  # Deploy edge function

# Utilities
npm run import-wallets:stg  # Import wallets from CSV (staging)
```

## Architecture

### Authentication Flow

- Web3 wallet-based authentication (MetaMask)
- No traditional Supabase Auth - wallet addresses are the primary identifier
- `AuthContext` manages wallet connection and user state
- User record created/loaded via wallet address in `users` table

### Database Structure (PostgreSQL via Supabase)

**Core Tables:**

- `users` - User accounts indexed by wallet_address
- `test_accounts` - Simulated trading accounts for evaluation (Phase 1)
- `funded_accounts` - Live trading accounts with HyProp capital (Phase 2)
- `wallets` - Pre-generated wallet accounts with encrypted private keys
- `positions` - Current open positions (funded accounts)
- `test_positions` - Simulated positions (test accounts, Phase 1)
- `test_orders` - Open/filled/cancelled limit orders (test accounts, Phase 1)
- `equity_snapshots` - Historical equity for drawdown tracking
- `events` - Audit log for all account activities
- `payouts` - Profit distribution records
- `treasury_transfers` - On-chain USDC movements
- `pairs` - Trading pair metadata from Hyperliquid
- `config` - System configuration

**RLS (Row Level Security):**
All tables have RLS enabled. Users can only access their own data via policies checking `auth.uid() = user_id` or through foreign key relationships.

### Trading System

**Phase 1 (Current - Test Accounts):**

- Simulated trading using real-world oracle prices (CoinGecko/Binance)
- Positions stored in `test_positions` table
- Orders stored in `test_orders` table (status: "open", "filled", "cancelled")
- No real orders placed on Hyperliquid
- PnL calculated using real BTC price vs entry price
- Auto-close positions with >5% loss
- Test passes if: 24h elapsed + 8% profit + no loss limit breach
- Limit order matching: `useLimitOrderMatcher` hook monitors price and automatically fills orders when conditions are met (buy when price <= limit, sell when price >= limit)

**Phase 2 (Future - Funded Accounts):**

- Real trading via Hyperliquid API
- Positions tracked in `positions` table
- Uses Hyperliquid subaccounts and builder codes
- Real-time risk monitoring via `RiskEngine`

**Risk Management (`src/lib/riskEngine.ts`):**

- Daily drawdown checks (based on `e_day_start`)
- Max drawdown checks (based on `high_water_mark` for 2-step, `balance_actual` for 1-step)
- Equity calculation: `balance + upnl - feesAccrued - fundingAccrued`
- Auto-pauses accounts on daily drawdown breach
- Auto-fails accounts on max drawdown breach
- Daily reset at UTC 00:00

### Hyperliquid Integration

**Edge Function (`supabase/functions/hyperliquid-trading/index.ts`):**

- Serverless Deno function handling all trading operations
- Authentication via `x-wallet-address` header
- Actions: `placeOrder`, `cancelOrder`, `approveBuilderFee`, `getTestPositions`, `updatePositionPnL`, `checkTestStatus`
- Phase 1: Simulates positions in database instead of placing real orders
- Phase 2: Uses `@nktkas/hyperliquid` SDK with wallet private keys

**Price Oracles:**

- Primary: CoinGecko API (real BTC price)
- Fallback: Binance API
- Last resort: Hyperliquid testnet price
- Used for calculating PnL on simulated positions

**Trading Client (`src/lib/hyperliquidTrading.ts`):**

- `HyperliquidTrading` class wraps edge function calls
- Methods: `placeOrder()`, `cancelOrder()`, `closePosition()`, `updatePositionPnL()`, `checkTestStatus()`
- Helper functions: `getOpenOrders()`, `getUserFills()`, `getUserPositions()`

### Frontend Structure

**Routing:**

- Uses Wouter library (lightweight React router)
- Routes: `/` (Dashboard), `/new-account`, `/trade`, `/account-trading/:accountId`, `/funded-account-trading/:accountId`, `/portfolio`, `/leaderboard`, `/referrals`, `/nfts`, `/demo`
- Protected routes: All routes require wallet connection (enforced by `AuthProvider`)

**Component Hierarchy:**

```
App (AuthProvider, ToastProvider)
├── AuthForm (wallet connection)
├── DashboardPage (account overview)
├── NewAccountPage (create new test account)
├── AccountTradingPage (main trading interface)
│   ├── OrderForm (place/cancel orders)
│   ├── PositionTable (current positions with PnL)
│   ├── OpenOrdersTable (pending limit orders)
│   ├── OrdersTable (order history/fills)
│   ├── Chart (price chart)
│   └── TargetInfo (evaluation progress)
├── TradingDashboardPage (multi-account view)
├── PortfolioPage
├── LeaderboardPage
├── ReferralsPage
├── NFTsPage
└── DemoSettingsPage (configure demo price offset)
```

**State Management:**

- React Context: `AuthContext` (wallet/user), `ToastProvider` (notifications)
- TanStack Query (React Query) for server state (accounts, positions, orders, prices)
- Local component state for UI
- Real-time data via Supabase subscriptions and query invalidation

**Data Fetching Patterns:**

- Custom hooks wrapping TanStack Query: `useAccounts`, `useTestOrders`, `useHyperliquidPrice`
- Query keys follow pattern: `["resource-type", id]` (e.g., `["test-positions", testAccountId]`)
- Mutations invalidate related queries via `queryClient.invalidateQueries()`

**UI Libraries:**

- TailwindCSS v4 with custom theme (dark mode, trading-specific colors)
- Radix UI for accessible components (Dialog, Dropdown, Progress, Slider)
- TanStack Table for data tables with pagination
- Lucide React icons
- Framer Motion (`motion` package) for animations

## Environment Variables

The project supports multiple environments via Vite modes. Use `.env` for local, `.env.stg` for staging, `.env.production` for production.

**Frontend (.env, .env.stg):**

```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
ENCRYPTION_KEY=<base64-encoded-256-bit-key>  # For wallet private key encryption
```

**Supabase Edge Functions (supabase/functions/.env, set via `npx supabase secrets set` for remote):**

```
SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
ENCRYPTION_KEY=<base64-encoded-256-bit-key>  # Must match frontend .env
```

**Wallet Import Scripts:**

```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<service-anon-key>
ENCRYPTION_KEY=<base64-encoded-256-bit-key>
```

**Setting up encryption:** See `ENCRYPTION_SETUP.md` for detailed instructions on generating and configuring the encryption key.

**Important:** The `ENCRYPTION_KEY` must be identical across all environments (frontend, edge functions, scripts) for the same deployment.

## Key Custom Hooks and Utilities

**Data Hooks (TanStack Query):**

- `useAccounts` - Load test and funded accounts for current user
- `useTestOrders` - Query and manage test account limit orders
- `useOpenOrders` - Fetch paginated open orders with real-time updates
- `useCancelTestOrder` - Mutation for cancelling individual orders
- `useCancelAllTestOrders` - Mutation for bulk order cancellation
- `useHyperliquidPrice` - Real-time BTC price from oracle (with demo offset support)
- `useLimitOrderMatcher` - Automatically fills limit orders when price conditions are met

**Trading Utilities:**

- `src/lib/hyperliquidTrading.ts` - `HyperliquidTrading` class for all trading operations
- `src/lib/hyperliquidApi.ts` - Direct Hyperliquid API integration helpers
- `src/lib/priceOracle.ts` - Price fetching from CoinGecko/Binance with fallbacks
- `src/lib/riskEngine.ts` - Drawdown calculations and risk checks
- `src/lib/walletUtils.ts` - Wallet encryption/decryption utilities

**Path Aliases:**

- `@/` maps to `src/` (configured in tsconfig.json and vite.config.ts)
- Example: `import { supabase } from "@/lib/supabase"`

## Key Technical Decisions

1. **Wallet-based auth instead of Supabase Auth** - Crypto-native UX, users connect Web3 wallet
2. **Two-phase rollout** - Phase 1 simulates trading, Phase 2 adds real Hyperliquid integration
3. **Edge function for trading** - Keeps private keys server-side, never exposed to frontend
4. **AES-256-GCM encryption for private keys** - All wallet private keys encrypted at rest in database
5. **Real-world oracle prices for simulation** - More accurate evaluation than testnet prices
6. **Numeric type for all money values** - Prevents floating point precision issues
7. **RLS policies** - Database-level security, users can't access others' data
8. **Wouter for routing** - Lightweight alternative to React Router (< 2KB)
9. **TanStack Query for server state** - Replaces manual useState/useEffect patterns for data fetching

## Common Patterns

**Database Queries (Raw Supabase):**

```typescript
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle(); // or .single() if expecting exactly one
```

**Database Queries (TanStack Query):**

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Query
const { data, isLoading, error } = useQuery({
  queryKey: ["test-positions", testAccountId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("test_positions")
      .select("*")
      .eq("test_account_id", testAccountId);
    if (error) throw error;
    return data;
  },
});

// Mutation
const queryClient = useQueryClient();
const { mutate } = useMutation({
  mutationFn: async (orderId: string) => {
    const { error } = await supabase
      .from("test_orders")
      .update({ status: "cancelled" })
      .eq("id", orderId);
    if (error) throw error;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["test-orders", testAccountId] });
  },
});
```

**Edge Function Calls:**

```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hyperliquid-trading`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      "x-wallet-address": walletAddress,
    },
    body: JSON.stringify({ action, accountId }),
  }
);
```

**Error Handling:**

- Frontend: Try/catch with user-friendly error messages via `ToastContext`
- Edge function: Detailed console.log for debugging, generic errors to client
- Database: Check for error field in Supabase response
- TanStack Query: Errors automatically caught and exposed via `error` property

## Testing Notes

- Test accounts simulate 1-step evaluations (8% profit target, loss limits)
- Builder code `0x7c4E42B6cDDcEfa029D230137908aB178D52d324` is hardcoded for Phase 2
- Testnet API URL: `https://api.hyperliquid-testnet.xyz`
- Auto-close threshold: 5% loss on position margin

## Migration Strategy

When adding new database tables/columns:

1. Create migration: `npx supabase migration new description`
2. Write SQL with proper indexes and RLS policies
3. Test locally with `npx supabase db reset`
4. Deploy: `npx supabase db push`
