# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Bitcoin price tracker — a single-page vanilla TypeScript app that polls the CoinGecko API every 30 seconds and displays the current BTC/USD price.

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build` (runs `tsc` then `vite build`)
- **Lint:** `pnpm lint` (fix with `pnpm lint:fix`)
- **Format:** `pnpm format` (check with `pnpm format:check`)
- **Test:** `pnpm test` (single run) / `pnpm test:watch` (watch mode)
- **Test with coverage:** `pnpm test:coverage`
- **Run a single test file:** `pnpm vitest run src/main.test.ts`

Package manager is **pnpm** (enforced via `preinstall` hook — npm/yarn will fail).

## Architecture

No framework, no router. `src/main.ts` bootstraps the app via `init()` and re-exports public functions for testing. Code is organized into:

- **`src/components/`** — UI pieces (`BitcoinSvg`, `PriceCard`)
- **`src/api/`** — API calls (`fetchBitcoinPrice`)
- **`src/lib/`** — utilities (`format`, `updatePrice`) and global constants (`constants`)

All public functions are individually tested in `src/main.test.ts`.

Styling uses **Tailwind CSS v4** via the Vite plugin (`@tailwindcss/vite`), imported in `src/style.css`. The Inter font is loaded from Google Fonts in `index.html`.

## Tooling Notes

- **Path alias:** `@/*` maps to `./src/*` (configured in both `tsconfig.json` and `vite.config.ts`)
- **Test environment:** happy-dom (configured in `vite.config.ts`), with vitest globals enabled
- **ESLint:** flat config (`eslint.config.js`) — typescript-eslint + prettier integration
- **TypeScript:** strict mode with `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`
