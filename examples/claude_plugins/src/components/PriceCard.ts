import { bitcoinSvg } from "./BitcoinSvg";

export function render(app: HTMLElement): void {
  app.innerHTML = `
    <div class="min-h-screen bg-gray-900 flex items-center justify-center font-inter">
      <div class="bg-white/10 backdrop-blur-sm rounded-3xl px-12 py-10 flex flex-col items-center gap-6 shadow-2xl">
        ${bitcoinSvg()}
        <p id="price" class="text-white text-5xl font-bold tracking-tight">Loading...</p>
        <p id="status" class="text-white/60 text-sm">Fetching price...</p>
      </div>
    </div>
  `;
}
