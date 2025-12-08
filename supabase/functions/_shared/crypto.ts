/**
 * Encryption/Decryption utilities for sensitive data like private keys
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = "AES-GCM";
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96 bits recommended for GCM

/**
 * Get the encryption key from environment
 * This should be a 32-byte (256-bit) base64-encoded key
 */
function getEncryptionKey(): CryptoKey {
  const encodedKey = Deno.env.get("ENCRYPTION_KEY");
  if (!encodedKey) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // Decode base64 key to raw bytes
  const keyData = Uint8Array.from(atob(encodedKey), (c) => c.charCodeAt(0));

  if (keyData.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes (256 bits) when decoded");
  }

  // Import the key for use with Web Crypto API
  return crypto.subtle.importKey(
    "raw",
    keyData,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a string value (like a private key)
 * Returns base64-encoded string in format: iv:authTag:ciphertext
 *
 * Note: Web Crypto API automatically handles auth tag with GCM mode
 * The auth tag is appended to the ciphertext automatically
 */
export async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encrypt the data (GCM mode automatically appends 16-byte auth tag)
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
      tagLength: 128, // 128 bits = 16 bytes
    },
    key,
    data
  );

  // The encrypted data contains ciphertext + auth tag (last 16 bytes)
  const encryptedBytes = new Uint8Array(encryptedData);

  // Split into ciphertext and auth tag
  const ciphertext = encryptedBytes.slice(0, -16);
  const authTag = encryptedBytes.slice(-16);

  // Convert to base64 and return in format "iv:authTag:ciphertext"
  const ivBase64 = btoa(String.fromCharCode(...iv));
  const authTagBase64 = btoa(String.fromCharCode(...authTag));
  const ciphertextBase64 = btoa(String.fromCharCode(...ciphertext));

  return `${ivBase64}:${authTagBase64}:${ciphertextBase64}`;
}

/**
 * Decrypt an encrypted string
 * Expects format: iv:authTag:ciphertext (all base64-encoded)
 */
export async function decrypt(encryptedValue: string): Promise<string> {
  const key = await getEncryptionKey();

  // Split IV, auth tag, and ciphertext
  const parts = encryptedValue.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted value format. Expected 'iv:authTag:ciphertext'");
  }

  const [ivBase64, authTagBase64, ciphertextBase64] = parts;

  // Decode from base64
  const iv = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));
  const authTag = Uint8Array.from(atob(authTagBase64), (c) => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(ciphertextBase64), (c) => c.charCodeAt(0));

  // Combine ciphertext and auth tag (Web Crypto API expects them together)
  const combinedData = new Uint8Array(ciphertext.length + authTag.length);
  combinedData.set(ciphertext);
  combinedData.set(authTag, ciphertext.length);

  // Decrypt the data
  const decryptedData = await crypto.subtle.decrypt(
    {
      name: ALGORITHM,
      iv: iv,
      tagLength: 128,
    },
    key,
    combinedData
  );

  // Convert back to string
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

/**
 * Generate a new encryption key (for setup/rotation)
 * Returns a base64-encoded 256-bit key
 */
export function generateEncryptionKey(): string {
  const key = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...key));
}
