const fs = require("fs").promises;
const { HDNodeWallet } = require("ethers");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");
require("dotenv").config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;
const encryptionKey = process.env.ENCRYPTION_KEY;

if (!supabaseUrl || !supabaseServiceKey || !encryptionKey) {
  console.error("Missing required environment variables:");
  console.error("- VITE_SUPABASE_URL:", !!supabaseUrl);
  console.error("- SUPABASE_SERVICE_ROLE_KEY:", !!supabaseServiceKey);
  console.error("- ENCRYPTION_KEY:", !!encryptionKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

async function main() {
  const count = process.argv[2] ? parseInt(process.argv[2], 10) : 50;
  const wallets = [];

  console.log(`Generating ${count} wallet accounts...`);

  for (let i = 0; i < count; i++) {
    const wallet = HDNodeWallet.createRandom();

    // Encrypt the private key before storing
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);

    wallets.push({
      account_address: wallet.address,
      key_pk: encryptedPrivateKey, // Encrypted private key
      key_address: wallet.address,
      status: 0, // 0 = available
    });
  }

  console.log(
    `Generated ${wallets.length} wallets. Inserting into database...`
  );

  // Insert wallets into Supabase (table is now called 'wallets')
  const { data, error } = await supabase
    .from("wallets")
    .insert(wallets)
    .select("account_address");
  if (error) {
    console.error("Error inserting wallets:", error);
    process.exit(1);
  }

  console.log(
    `Successfully inserted ${data.length} wallets into the database.`
  );
  console.log("⚠️  Private keys are encrypted and stored securely.");
  for (const wallet of data) {
    console.log(`- ${wallet.account_address}`);
  }
}

main().catch(console.error);
