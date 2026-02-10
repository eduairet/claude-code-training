import "@/style.css";

export { bitcoinSvg } from "@/components/BitcoinSvg";
export { render } from "@/components/PriceCard";
export { fetchBitcoinPrice } from "@/api/bitcoin";
export { formatUsd } from "@/lib/format";
export { updatePrice } from "@/lib/updatePrice";

import { render } from "@/components/PriceCard";
import { updatePrice } from "@/lib/updatePrice";
import { POLL_INTERVAL_MS } from "@/lib/constants";

function init(): void {
  const app = document.getElementById("app");
  if (!app) return;

  render(app);
  updatePrice();
  setInterval(updatePrice, POLL_INTERVAL_MS);
}

init();
