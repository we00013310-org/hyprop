import { TESTNET_API_URL } from "../constants.ts";

let assetIndexCache: Map<string, number> | null = null;
let assetMetaCache: Map<string, any> | null = null;

async function loadAssetMetadata(): Promise<void> {
  if (assetIndexCache && assetMetaCache) return;

  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "meta" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch asset metadata: ${response.statusText}`);
  }

  const meta = await response.json();
  console.log("Asset metadata:", JSON.stringify(meta));

  assetIndexCache = new Map();
  assetMetaCache = new Map();
  meta.universe.forEach((asset: any, index: number) => {
    assetIndexCache!.set(asset.name, index);
    assetMetaCache!.set(asset.name, asset);
  });
}

export async function getAssetIndex(coin: string): Promise<number> {
  await loadAssetMetadata();
  const index = assetIndexCache!.get(coin);
  if (index === undefined) {
    throw new Error(`Asset ${coin} not found`);
  }
  return index;
}

export async function getAssetMeta(coin: string): Promise<any> {
  await loadAssetMetadata();
  const meta = assetMetaCache!.get(coin);
  if (!meta) {
    throw new Error(`Asset metadata for ${coin} not found`);
  }
  return meta;
}

export async function getMaxBuilderFee(
  userAddress: string,
  builderAddress: string
): Promise<number> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "maxBuilderFee",
      user: userAddress,
      builder: builderAddress,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch max builder fee: ${response.statusText}`);
  }

  const maxFee = await response.json();
  console.log(
    `Max builder fee for ${userAddress} / ${builderAddress}: ${maxFee}`
  );
  return maxFee;
}

export async function getBuilderReferralState(
  builderAddress: string
): Promise<any> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "referral",
      user: builderAddress,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch referral state: ${response.statusText}`);
  }

  const state = await response.json();
  console.log(`Referral state for ${builderAddress}:`, JSON.stringify(state));
  return state;
}

export async function getAccountValue(address: string): Promise<number> {
  const response = await fetch(`${TESTNET_API_URL}/info`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "clearinghouseState",
      user: address,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch account value: ${response.statusText}`);
  }

  const state = await response.json();
  const accountValue = parseFloat(state.marginSummary?.accountValue || "0");
  console.log(`Account value for ${address}: ${accountValue} USDC`);
  return accountValue;
}
