# Fail Funded Account API

This document describes how to use the `failFundedAccount` API endpoint.

## Overview

The `failFundedAccount` endpoint allows you to manually fail a funded account. When called, it will:

1. Fetch all open positions from Hyperliquid for the account
2. Close all positions using market orders
3. Update the account status to "failed" in the database

## API Endpoint

**URL:** `${SUPABASE_URL}/functions/v1/hyperliquid-trading`

**Method:** `POST`

**Headers:**
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${SUPABASE_ANON_KEY}",
  "apikey": "${SUPABASE_ANON_KEY}",
  "x-wallet-address": "0x..."
}
```

**Body:**
```json
{
  "action": {
    "type": "failFundedAccount"
  },
  "accountId": "uuid-of-funded-account"
}
```

## Example Usage

### JavaScript/TypeScript

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
    body: JSON.stringify({
      action: { type: "failFundedAccount" },
      accountId: "your-funded-account-id",
    }),
  }
);

const result = await response.json();

if (result.success) {
  console.log(result.data.message);
  // Output: "Account {accountId} has been failed and all positions closed"
} else {
  console.error("Error:", result.error);
}
```

### cURL

```bash
curl -X POST \
  "${SUPABASE_URL}/functions/v1/hyperliquid-trading" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "x-wallet-address: 0x..." \
  -d '{
    "action": { "type": "failFundedAccount" },
    "accountId": "your-funded-account-id"
  }'
```

## Response

### Success Response

```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Account {accountId} has been failed and all positions closed"
  },
  "walletAddress": null
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Authorization

- The `x-wallet-address` header must match a user in the database
- The account must belong to the authenticated user
- Only funded accounts can be failed using this endpoint

## Important Notes

1. **Position Closure:** All open positions will be closed at market price using reduce-only orders
2. **Error Handling:** If individual position closures fail, the function will continue closing other positions and still mark the account as failed
3. **Logging:** All operations are logged to the edge function console for debugging
4. **Irreversible:** Once an account is failed, it cannot be reactivated

## Integration Example

You can integrate this into your frontend like this:

```typescript
// In a React component or service file
import { supabase } from "@/lib/supabase";

export async function failFundedAccount(
  accountId: string,
  walletAddress: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
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
        body: JSON.stringify({
          action: { type: "failFundedAccount" },
          accountId,
        }),
      }
    );

    const result = await response.json();

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      message: result.data.message,
    };
  } catch (error) {
    console.error("Failed to fail account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Usage in component
const handleFailAccount = async () => {
  const result = await failFundedAccount(accountId, userWalletAddress);

  if (result.success) {
    alert(result.message);
    // Refresh account data
  } else {
    alert(`Error: ${result.error}`);
  }
};
```

## Testing

You can test the endpoint using the browser console or a tool like Postman. Make sure:

1. You have a valid funded account ID
2. Your wallet address is authenticated
3. The account belongs to your user
4. The Supabase edge function is deployed

## Deployment

To deploy the updated edge function:

```bash
npx supabase functions deploy hyperliquid-trading
```
