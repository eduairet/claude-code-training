import { fetchBitcoinPrice } from "@/api/bitcoin";
import { formatUsd } from "@/lib/format";

export async function updatePrice(): Promise<void> {
  const priceEl = document.getElementById("price");
  const statusEl = document.getElementById("status");
  if (!priceEl || !statusEl) return;

  try {
    const price = await fetchBitcoinPrice();
    priceEl.textContent = formatUsd(price);
    statusEl.textContent = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Failed to fetch price. Retrying...";
  }
}
