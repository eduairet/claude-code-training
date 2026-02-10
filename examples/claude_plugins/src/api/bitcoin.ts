import { COINGECKO_API } from "@/lib/constants";

export async function fetchBitcoinPrice(): Promise<number> {
  const response = await fetch(COINGECKO_API);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = (await response.json()) as { bitcoin: { usd: number } };
  return data.bitcoin.usd;
}
