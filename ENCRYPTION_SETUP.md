# Wallet Private Key Encryption Setup

This document explains how to set up and use the private key encryption system for secure wallet storage.

## Overview

Wallet private keys are encrypted using **AES-256-GCM** (Galois/Counter Mode) before being stored in the database. This provides:

- **Confidentiality**: Private keys cannot be read without the encryption key
- **Authentication**: GCM mode provides built-in authentication, preventing tampering
- **Security**: Military-grade 256-bit encryption

## Initial Setup

### 1. Generate Encryption Key

Run the key generation script:

```bash
node scripts/generate-encryption-key.js
```

This will output:

- A base64-encoded 256-bit encryption key
- Instructions for adding it to your environment

**⚠️ CRITICAL: Store this key securely in a password manager! If you lose it, encrypted data cannot be recovered!**

### 2. Add Key to Local Environment

Add the key to your `.env` file:

```bash
ENCRYPTION_KEY=<your-generated-key>
```

### 3. Add Key to Supabase Edge Functions

Set the key as a Supabase secret:

```bash
npx supabase secrets set ENCRYPTION_KEY="<your-generated-key>"
```

Verify it was set:

```bash
npx supabase secrets list
```

## Usage

### Generating Wallets

#### Option 1: Generate Random Wallets

The wallet generation script (`scripts/gen-account.cjs`) automatically encrypts private keys before storing them:

```bash
# Generate 50 wallets (default)
node scripts/gen-account.cjs

# Generate custom number of wallets
node scripts/gen-account.cjs 100
```

#### Option 2: Import Wallets from CSV

If you have existing wallets to import, use the CSV import script (`scripts/import-wallets-from-csv.cjs`):

```bash
# First, install the csv-parse package (one-time setup)
npm install csv-parse

# Import wallets from CSV file
node scripts/import-wallets-from-csv.cjs path/to/wallets.csv
```

**CSV Format:**

```csv
account_address,key_pk,key_address
0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1,0x1234...abcdef,0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1
0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199,0xabcd...567890,0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199
```

Where:

- `account_address`: The wallet address (must start with 0x)
- `key_pk`: The private key (must start with 0x) - will be encrypted before storage
- `key_address`: The public key/address (must start with 0x)

**Features:**

- Validates all records before inserting
- Encrypts private keys automatically
- Sets `invalid_at` to 160 days from import time
- Batch processing for large CSV files
- Shows progress during import

**Requirements (both scripts):**

- `ENCRYPTION_KEY` must be set in `.env`
- `VITE_SUPABASE_URL` must be set
- `VITE_SUPABASE_ANON_KEY` must be set

### How It Works

#### Encryption (in `scripts/gen-account.cjs`):

1. Generate random wallet using ethers.js
2. Encrypt private key using AES-256-GCM with random IV
3. Store encrypted key in database as: `iv:authTag:ciphertext` (all base64)

#### Decryption (in Edge Functions):

1. Retrieve encrypted key from database
2. Split into IV, auth tag, and ciphertext
3. Decrypt using the same encryption key
4. Use decrypted private key for trading operations

## Storage Format

Encrypted private keys are stored in the `wallets.key_pk` column in the format:

```
<iv>:<authTag>:<ciphertext>
```

Where:

- `iv`: 12-byte initialization vector (base64)
- `authTag`: 16-byte authentication tag (base64)
- `ciphertext`: Encrypted private key (base64)

Example:

```
Vu6OjQ8XlK/P1Zn3:kP9mN2xR7vC4fT6wZ1qL8h:hJ3pL9mK5rB2cF8xQ4vN7wT6z
```

## Security Considerations

### ✅ DO:

- Store the encryption key in a secure password manager
- Use different encryption keys for development/staging/production
- Rotate encryption keys periodically (requires re-encrypting all data)
- Set proper permissions on `.env` files (600 or 400)
- Use Supabase secrets for edge function keys
- Keep backups of your encryption key in secure locations

### ❌ DON'T:

- Never commit the encryption key to version control
- Never share the encryption key via email or chat
- Never use the same key across multiple projects
- Never store the key in plaintext on servers
- Never log or print the decrypted private keys

## Key Rotation

If you need to rotate the encryption key:

1. Generate a new encryption key
2. Read all wallets with the old key
3. Decrypt private keys using old key
4. Re-encrypt with new key
5. Update database with new encrypted values
6. Update environment variables

**Note:** A key rotation script can be created if needed.

## Troubleshooting

### "ENCRYPTION_KEY environment variable is not set"

- Ensure `.env` file exists and contains `ENCRYPTION_KEY`
- For edge functions, ensure secret is set with `npx supabase secrets set`

### "ENCRYPTION_KEY must be 32 bytes (256 bits) when decoded"

- The key must be exactly 32 bytes when base64-decoded
- Use `scripts/generate-encryption-key.js` to generate a valid key

### "Invalid encrypted value format"

- The encrypted value must be in format `iv:authTag:ciphertext`
- This usually indicates database corruption or manual editing

### Decryption Fails

- Ensure you're using the same encryption key that was used to encrypt
- Check that the encrypted value hasn't been truncated or modified
- Verify the IV and auth tag are intact

## Files Involved

- `supabase/functions/_shared/crypto.ts` - Encryption/decryption utilities (Deno/Edge Functions)
- `scripts/gen-account.cjs` - Random wallet generation with encryption (Node.js)
- `scripts/import-wallets-from-csv.cjs` - CSV wallet import with encryption (Node.js)
- `scripts/generate-encryption-key.js` - Key generation utility
- `scripts/wallets-example.csv` - Example CSV format
- `supabase/functions/hyperliquid-trading/services/accountCreator.ts` - Uses decryption
- `supabase/migrations/20251121173220_rename_fake_wallets_to_wallets_with_updates.sql` - Table schema

## Testing Encryption

You can test the encryption/decryption locally:

```javascript
// In a Deno environment (edge function)
import { encrypt, decrypt } from "./supabase/functions/_shared/crypto.ts";

const testKey = "0x1234567890abcdef";
const encrypted = await encrypt(testKey);
console.log("Encrypted:", encrypted);

const decrypted = await decrypt(encrypted);
console.log("Decrypted:", decrypted);
console.log("Match:", testKey === decrypted);
```

## Additional Security Recommendations

1. **Database Security**: Enable RLS (Row Level Security) on the `wallets` table
2. **Network Security**: Use SSL/TLS for all database connections
3. **Access Control**: Limit who can access service role keys
4. **Monitoring**: Log access to wallet records for audit trails
5. **Backup**: Maintain secure backups of both the database and encryption key
6. **Compliance**: Ensure your key management meets relevant compliance requirements (SOC2, PCI-DSS, etc.)
