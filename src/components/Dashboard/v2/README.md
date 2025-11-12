# Dashboard v2 Components

Modern, reusable React components for the Dashboard interface, built with TypeScript and Tailwind CSS.

## Main Component

### DashboardV2
A complete dashboard implementation using all the v2 components. This is a drop-in replacement for the original Dashboard with improved design and modularity.

**Features:**
- Modern stat cards showing rebate collected, total accounts, and P&L
- Improved visual hierarchy with better spacing and typography
- Enhanced empty states for both funded and test accounts
- Unified account cards with consistent design
- Smooth transitions and hover effects
- Fully responsive layout

**Usage:**
```tsx
import { DashboardV2 } from './components/Dashboard/v2';

// In your router/App.tsx
<Route path="/dashboard" component={DashboardV2} />
```

## Components

### 1. StatCard
A card component for displaying key metrics and statistics.

**Props:**
- `title: string` - The label/title for the metric
- `value: string | number` - The value to display
- `currency?: string` - Optional currency label (default: "USDC")
- `icon?: LucideIcon` - Optional icon component (default: DollarSign)
- `iconClassName?: string` - Optional icon styling classes

**Example:**
```tsx
import { StatCard } from './components/Dashboard/v2';
import { DollarSign } from 'lucide-react';

<StatCard 
  title="Rebate Collected" 
  value="$0.8020" 
  currency="USDC"
  icon={DollarSign}
  iconClassName="text-emerald-400"
/>
```

---

### 2. EmptyPlaceholder
A placeholder component for empty states with icon and message.

**Props:**
- `message: string` - The message to display
- `icon?: LucideIcon` - Optional icon component (default: Inbox)
- `iconClassName?: string` - Optional icon styling classes

**Example:**
```tsx
import { EmptyPlaceholder } from './components/Dashboard/v2';
import { FolderOpen } from 'lucide-react';

<EmptyPlaceholder 
  message="No funded accounts yet. Pass an evaluation to get funded."
  icon={FolderOpen}
  iconClassName="text-slate-600"
/>
```

---

### 3. AccountCard
A unified card component for displaying both Exam and Funded account information.

**Props:**
- `account: TestAccount | FundedAccount` - The account data object
- `type: "exam" | "funded"` - Account type
- `onAccessAccount: () => void` - Callback when "Access Account" button is clicked

**Features:**
- Automatically calculates P&L, progress, and drawdown metrics
- Different styling for exam vs funded accounts
- Progress bar for exam accounts
- Status badge with active/inactive states
- Responsive grid layout for stats
- Hover effects and smooth transitions

**Example - Exam Account:**
```tsx
import { AccountCard } from './components/Dashboard/v2';

const testAccount = {
  id: '123',
  account_size: 100,
  virtual_balance: 110.80,
  profit_target: 10,
  dd_max: 600,
  dd_daily: 400,
  account_mode: 'Exam',
  status: 'active',
  // ... other required fields
};

<AccountCard 
  account={testAccount}
  type="exam"
  onAccessAccount={() => navigate('/trading')}
/>
```

**Example - Funded Account:**
```tsx
const fundedAccount = {
  id: '456',
  balance_actual: 4.802,
  n_max: 100,
  l_user: 1,
  dd_max: 600,
  dd_daily: 400,
  status: 'active',
  // ... other required fields
};

<AccountCard 
  account={fundedAccount}
  type="funded"
  onAccessAccount={() => navigate('/trading')}
/>
```

---

## Layout Example

```tsx
import { StatCard, EmptyPlaceholder, AccountCard } from './components/Dashboard/v2';

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Rebate Collected" value="$0.8020" />
        <StatCard title="Total Accounts" value={3} currency="" />
        <StatCard title="Total Profit" value="$100.00" />
      </div>

      {/* Funded Accounts */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Funded Accounts</h2>
        {fundedAccounts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fundedAccounts.map(account => (
              <AccountCard 
                key={account.id}
                account={account}
                type="funded"
                onAccessAccount={() => handleAccess(account.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyPlaceholder message="No funded accounts yet" />
        )}
      </div>

      {/* Exam Accounts */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">Exam Accounts</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testAccounts.map(account => (
            <AccountCard 
              key={account.id}
              account={account}
              type="exam"
              onAccessAccount={() => handleAccess(account.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

## Design System

All components follow the existing design system:
- **Colors**: Slate backgrounds, emerald for success, red for losses
- **Spacing**: Consistent padding and gaps using Tailwind
- **Typography**: Clear hierarchy with varying font sizes and weights
- **Interactions**: Hover states and smooth transitions
- **Accessibility**: Semantic HTML and proper color contrast

## Dependencies

- React 18+
- TypeScript
- Tailwind CSS
- lucide-react (for icons)
- Database types from `lib/database.types.ts`
