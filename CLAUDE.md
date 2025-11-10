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
npm run dev              # Start development server (Vite)
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run typecheck       # Type check without emitting files

# Database (Supabase)
npx supabase start      # Start local Supabase
npx supabase db reset   # Reset local database
npx supabase migration new <name>  # Create new migration
npx supabase functions deploy hyperliquid-trading  # Deploy edge function
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
- `positions` - Current open positions (funded accounts)
- `test_positions` - Simulated positions (test accounts, Phase 1)
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
- No real orders placed on Hyperliquid
- PnL calculated using real BTC price vs entry price
- Auto-close positions with >5% loss
- Test passes if: 24h elapsed + 8% profit + no loss limit breach

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

**Component Hierarchy:**
```
App (AuthProvider)
├── AuthForm (wallet connection)
├── Dashboard
│   ├── AccountSelection (test/funded account cards)
│   ├── TestAccountCard
│   └── FundedAccountCard
├── TradingInterface (main trading view)
│   ├── AccountStats (balance, PnL, equity)
│   ├── OrderForm (place/cancel orders)
│   ├── PositionsList (current positions)
│   ├── OpenOrdersList (pending orders)
│   └── TradeHistoryList (fills history)
└── AdminConsole (admin panel)
    ├── UserManagement
    ├── AccountManagement
    ├── PayoutManagement
    └── SystemSettings
```

**State Management:**
- React Context for auth (`AuthContext`)
- Local component state for UI
- Real-time Supabase queries for data
- No Redux/Zustand currently

**Styling:**
- TailwindCSS with custom config
- Dark theme (slate-900 background)
- Lucide React icons

## Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

For Supabase Edge Function:
```
SUPABASE_URL=<supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## Key Technical Decisions

1. **Wallet-based auth instead of Supabase Auth** - Crypto-native UX, users connect Web3 wallet
2. **Two-phase rollout** - Phase 1 simulates trading, Phase 2 adds real Hyperliquid integration
3. **Edge function for trading** - Keeps private keys server-side, never exposed to frontend
4. **Real-world oracle prices for simulation** - More accurate evaluation than testnet prices
5. **Numeric type for all money values** - Prevents floating point precision issues
6. **RLS policies** - Database-level security, users can't access others' data

## Common Patterns

**Database Queries:**
```typescript
const { data, error } = await supabase
  .from('table_name')
  .select('*')
  .eq('user_id', userId)
  .maybeSingle();  // or .single() if expecting exactly one
```

**Edge Function Calls:**
```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hyperliquid-trading`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      'x-wallet-address': walletAddress,
    },
    body: JSON.stringify({ action, accountId }),
  }
);
```

**Error Handling:**
- Frontend: Try/catch with user-friendly error messages
- Edge function: Detailed console.log for debugging, generic errors to client
- Database: Check for error field in Supabase response

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
