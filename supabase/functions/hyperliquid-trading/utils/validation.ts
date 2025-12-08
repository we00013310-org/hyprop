import type { TestAccount } from "../types.ts";

export function validateWalletAddress(address: string | null): void {
  if (!address) {
    throw new Error("Missing wallet address");
  }
}

export function validatePrivateKey(key: string): void {
  const trimmedKey = key.trim();

  if (!trimmedKey.startsWith("0x")) {
    throw new Error("Invalid private key format. Must start with 0x.");
  }

  if (trimmedKey.length !== 66) {
    throw new Error(
      `Invalid private key format. Must be 66 characters long (got ${trimmedKey.length}).`
    );
  }
}

export function validateAccountForTrading(account: TestAccount): void {
  if (account.status !== "active") {
    throw new Error(
      `Trading is disabled for this account. Status: ${account.status}. ` +
        `Accounts that have passed or failed cannot place new orders, but you can still view positions and history.`
    );
  }
}

export function validateOrderParams(
  coin: string,
  size: string,
  price?: string
): void {
  if (!coin || coin.trim().length === 0) {
    throw new Error("Invalid coin symbol");
  }

  const parsedSize = parseFloat(size);
  if (isNaN(parsedSize) || parsedSize <= 0) {
    throw new Error("Invalid order size");
  }

  if (price) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      throw new Error("Invalid order price");
    }
  }
}
