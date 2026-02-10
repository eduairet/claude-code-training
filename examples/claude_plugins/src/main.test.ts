import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { bitcoinSvg } from "@/components/BitcoinSvg";
import { render } from "@/components/PriceCard";
import { fetchBitcoinPrice } from "@/api/bitcoin";
import { formatUsd } from "@/lib/format";
import { updatePrice } from "@/main";

describe("bitcoinSvg", () => {
  it("returns an SVG string with the bitcoin icon", () => {
    const svg = bitcoinSvg();
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain('fill="#F7931A"');
  });
});

describe("formatUsd", () => {
  it("formats a whole number with two decimals", () => {
    expect(formatUsd(100)).toBe("$100.00");
  });

  it("formats a large number with commas", () => {
    expect(formatUsd(97_345.67)).toBe("$97,345.67");
  });

  it("rounds to two decimal places", () => {
    expect(formatUsd(50_000.999)).toBe("$50,001.00");
  });

  it("formats zero", () => {
    expect(formatUsd(0)).toBe("$0.00");
  });

  it("formats small decimals", () => {
    expect(formatUsd(0.1)).toBe("$0.10");
  });
});

describe("fetchBitcoinPrice", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the USD price from the API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bitcoin: { usd: 97_500 } }),
      }),
    );

    const price = await fetchBitcoinPrice();
    expect(price).toBe(97_500);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("throws on a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      }),
    );

    await expect(fetchBitcoinPrice()).rejects.toThrow("API error: 429");
  });
});

describe("render", () => {
  it("populates the app element with the tracker UI", () => {
    const app = document.createElement("div");
    render(app);

    expect(app.querySelector("#price")).not.toBeNull();
    expect(app.querySelector("#status")).not.toBeNull();
    expect(app.querySelector("svg")).not.toBeNull();
    expect(app.querySelector("#price")!.textContent).toBe("Loading...");
  });
});

describe("updatePrice", () => {
  let app: HTMLElement;

  beforeEach(() => {
    app = document.createElement("div");
    app.id = "app";
    document.body.appendChild(app);
    render(app);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("displays the fetched price in the DOM", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ bitcoin: { usd: 100_000 } }),
      }),
    );

    await updatePrice();

    const priceEl = document.getElementById("price")!;
    expect(priceEl.textContent).toBe("$100,000.00");

    const statusEl = document.getElementById("status")!;
    expect(statusEl.textContent).toContain("Updated");
  });

  it("shows an error message when the fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network error")),
    );

    await updatePrice();

    const statusEl = document.getElementById("status")!;
    expect(statusEl.textContent).toBe("Failed to fetch price. Retrying...");
  });
});
