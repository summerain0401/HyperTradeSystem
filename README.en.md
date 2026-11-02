# HyperTradeSystem

[中文](README.md) | [English](README.en.md)

A Hyperliquid trading-terminal prototype with market selection, charts, an order book, positions, orders, and wallet connectivity.

**Status: UI and integration experiment.** Market requests can fall back to mock data. The order button updates a local Zustand simulation with an initial 10,000 USDC balance; a complete live trading flow is not established. Separate agent-approval code targets mainnet, so review it before connecting or signing.

## Run locally

Use Node.js compatible with Next.js 16 (20.9+) and npm. From the repository root:

```bash
npm ci
npm run dev
```

Open <http://localhost:3000>. Other scripts:

```bash
npm run lint
npm run build
npm start
```

## Implementation and configuration

| Component | Location |
| --- | --- |
| Pages and UI | `src/app/`, `src/components/` |
| Market REST / WebSocket | `src/lib/hyperliquid-api.ts`, `src/lib/websocket.ts` |
| Simulated orders and balances | `src/lib/store.ts` |
| Agent-approval signing | `src/lib/auth.ts` |
| Wallet providers | `src/components/providers.tsx` |

The WalletConnect `projectId` is still `YOUR_PROJECT_ID`. Supply your own project ID; there is no environment-variable configuration for it yet. Never put wallet private keys in source files.

Stack: Next.js, React, TypeScript, Tailwind CSS, Radix UI, Zustand, ECharts/Recharts, wagmi, viem, and RainbowKit.

## Limits

Markets and wallets require network access, and displayed values may be simulated. There is no dedicated automated test script. A successful build does not validate trading or signatures. This documentation update did not connect a wallet, sign, place orders, or validate production deployment.

## License
The default branch does not include a project-level license file. Public visibility does not itself grant reuse rights. Third-party dependencies and assets retain their own terms.
