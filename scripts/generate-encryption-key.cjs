#!/usr/bin/env node
/**
 * Generate a secure encryption key for wallet private keys
 * Run this once and add the output to your .env file and Supabase secrets
 */

const crypto = require('crypto');

// Generate a 256-bit (32 byte) random key
const key = crypto.randomBytes(32);
const base64Key = key.toString('base64');

console.log('='.repeat(80));
console.log('ENCRYPTION KEY GENERATED');
console.log('='.repeat(80));
console.log('\n⚠️  IMPORTANT: Keep this key secret and secure!\n');
console.log('Add this to your .env file:');
console.log('-'.repeat(80));
console.log(`ENCRYPTION_KEY=${base64Key}`);
console.log('-'.repeat(80));
console.log('\nFor Supabase Edge Functions, run:');
console.log('-'.repeat(80));
console.log(`npx supabase secrets set ENCRYPTION_KEY="${base64Key}"`);
console.log('-'.repeat(80));
console.log('\n⚠️  Store this key securely in your password manager!');
console.log('⚠️  If you lose this key, encrypted data cannot be recovered!');
console.log('⚠️  Never commit this key to version control!\n');
console.log('='.repeat(80));
