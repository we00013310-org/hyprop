const fs = require("fs").promises;
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
const { parse } = require("csv-parse/sync");
require("dotenv").config();

const csvFilePath = "./scripts/wallets-example.csv";

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const encryptionKey = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseAnonKey || !encryptionKey) {
  console.error("Missing required environment variables:");
  console.error("- VITE_SUPABASE_URL:", !!supabaseUrl);
  console.error("- SUPABASE_ANON_KEY:", !!supabaseAnonKey);
  console.error("- ENCRYPTION_KEY:", !!encryptionKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Encrypt a private key using AES-256-GCM
 */
function encryptPrivateKey(privateKey) {
  // Decode base64 encryption key
  const key = Buffer.from(encryptionKey, "base64");

  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (256 bits) when decoded");
  }

  // Generate random IV (12 bytes for GCM)
  const iv = crypto.randomBytes(12);

  // Create cipher
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  // Encrypt the private key
  let encrypted = cipher.update(privateKey, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Get auth tag
  const authTag = cipher.getAuthTag();

  // Combine IV, auth tag, and ciphertext
  // Format: iv:authTag:ciphertext (all base64)
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Calculate invalid_at date (160 days from now)
 */
function calculateInvalidAt() {
  const now = new Date();
  const invalidAt = new Date(now.getTime() + 159 * 24 * 60 * 60 * 1000); // 159 days (so invalid on day 160)
  return invalidAt.toISOString();
}

/**
 * Validate wallet data
 */
function validateWallet(wallet, lineNumber) {
  const errors = [];

  if (!wallet.account_address || typeof wallet.account_address !== "string") {
    errors.push(`Line ${lineNumber}: Missing or invalid account_address`);
  } else if (!wallet.account_address.startsWith("0x")) {
    errors.push(`Line ${lineNumber}: account_address must start with 0x`);
  }

  if (!wallet.key_pk || typeof wallet.key_pk !== "string") {
    errors.push(`Line ${lineNumber}: Missing or invalid key_pk (private key)`);
  }

  if (!wallet.key_address || typeof wallet.key_address !== "string") {
    errors.push(`Line ${lineNumber}: Missing or invalid key_address`);
  } else if (!wallet.key_address.startsWith("0x")) {
    errors.push(`Line ${lineNumber}: key_address must start with 0x`);
  }

  return errors;
}

async function main() {
  if (!csvFilePath) {
    console.error("Usage: node import-wallets-from-csv.cjs <path-to-csv-file>");
    console.error("\nCSV file format:");
    console.error("account_address,key_pk,key_address");
    console.error("0x1234...,0xabcd...,0x5678...");
    process.exit(1);
  }

  console.log(`Reading CSV file: ${csvFilePath}`);

  // Read CSV file
  let csvContent;
  try {
    csvContent = await fs.readFile(csvFilePath, "utf-8");
  } catch (error) {
    console.error(`Failed to read CSV file: ${error.message}`);
    process.exit(1);
  }

  // Parse CSV
  let records;
  try {
    records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch (error) {
    console.error(`Failed to parse CSV file: ${error.message}`);
    process.exit(1);
  }

  console.log(`Found ${records.length} wallet records in CSV`);

  if (records.length === 0) {
    console.error("No wallet records found in CSV file");
    process.exit(1);
  }

  // Validate all records first
  const allErrors = [];
  records.forEach((record, index) => {
    const errors = validateWallet(record, index + 2); // +2 because line 1 is header, index starts at 0
    allErrors.push(...errors);
  });

  if (allErrors.length > 0) {
    console.error("\n❌ Validation errors found:");
    allErrors.forEach((error) => console.error(`  - ${error}`));
    console.error("\nPlease fix the errors and try again.");
    process.exit(1);
  }

  console.log("✅ All records validated successfully");

  // Calculate invalid_at timestamp (160 days from now)
  const invalidAt = calculateInvalidAt();
  console.log(`Setting invalid_at to: ${invalidAt} (160 days from now)`);

  // Process and encrypt wallets
  const wallets = [];
  console.log("\nEncrypting private keys...");

  for (let i = 0; i < records.length; i++) {
    const record = records[i];

    try {
      // Encrypt the private key
      const encryptedPrivateKey = encryptPrivateKey(record.key_pk);

      wallets.push({
        account_address: record.account_address,
        key_pk: encryptedPrivateKey, // Encrypted private key
        key_address: record.key_address,
        status: 0, // 0 = available
        invalid_at: invalidAt,
      });

      // Show progress
      if ((i + 1) % 10 === 0 || i === records.length - 1) {
        console.log(`  Encrypted ${i + 1}/${records.length} private keys...`);
      }
    } catch (error) {
      console.error(
        `Failed to encrypt private key for wallet ${record.account_address}:`,
        error.message
      );
      process.exit(1);
    }
  }

  console.log("✅ All private keys encrypted successfully");

  // Insert wallets into Supabase in batches of 100
  const batchSize = 100;
  let insertedCount = 0;
  let errorCount = 0;

  console.log(`\nInserting ${wallets.length} wallets into database...`);

  for (let i = 0; i < wallets.length; i += batchSize) {
    const batch = wallets.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from("wallets")
      .insert(batch)
      .select("account_address");

    if (error) {
      console.error(
        `Error inserting batch ${Math.floor(i / batchSize) + 1}:`,
        error
      );
      errorCount += batch.length;
    } else {
      insertedCount += data.length;
      console.log(
        `  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          wallets.length / batchSize
        )} (${insertedCount}/${wallets.length} wallets)`
      );
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("IMPORT COMPLETE");
  console.log("=".repeat(80));
  console.log(`✅ Successfully inserted: ${insertedCount} wallets`);
  if (errorCount > 0) {
    console.log(`❌ Failed to insert: ${errorCount} wallets`);
  }
  console.log(`⚠️  Private keys are encrypted and stored securely`);
  console.log(`📅 All wallets will become invalid on: ${invalidAt}`);
  console.log("=".repeat(80));

  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
