<div align="center">

<img alt="UCARDS" src="./src/assets/ucards-logo.png" width="160">

# UCARDS

**Private virtual cards for the onchain economy.**

NFT-gated card issuance on Ethereum.
Hold `$UCARD` → mint your membership NFT → spin up unlimited private virtual cards.

[![Built on Ethereum](https://img.shields.io/badge/Built%20on-Ethereum-627EEA?style=flat-square)](https://ethereum.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

---

## What is UCARDS

UCARDS is a membership-gated virtual card layer for Ethereum. Holders of the `$UCARD` token mint a one-time card NFT, which unlocks the dashboard where they can spin up private virtual cards backed by stablecoin balances. Cards work anywhere Visa and Mastercard are accepted — checkout looks like any other card payment, your wallet stays off the ledger.

## How it works

1. **Buy** at least 100 `$UCARD` on Ethereum
2. **Mint** your membership NFT — one per wallet, transferable
3. **Connect** the wallet that holds the NFT to the UCARDS dashboard
4. **Top up** USDC into your card account
5. **Generate** virtual cards (number / expiry / CVV) on demand
6. **Spend** anywhere Visa or Mastercard is accepted, online

## Tech

- **Frontend** — React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Framer Motion
- **Wallets** — wagmi / viem, MetaMask + Coinbase Wallet + Rainbow + WalletConnect
- **Token** — ERC-20 `$UCARD` on Ethereum mainnet
- **Membership** — ERC-721 NFT, minted once per qualifying wallet
- **Card rails** — virtual-card issuance via licensed processor (TBD)
- **Settlement** — USDC on Ethereum mainnet

## Running locally

```bash
npm install --legacy-peer-deps
npm run dev
# → http://localhost:4280
```

## Attribution

This project is based on **[BASEUSDP](https://github.com/BaseUsdp/BaseUSDP)** (MIT-licensed, © 2026 BASEUSDP). The original UI scaffold, scroll-morph hero, and component structure are forked under MIT. UCARDS pivots the product from private stablecoin payments on Base to NFT-gated virtual card issuance on Ethereum — the rebrand, narrative, palette, and product logic are our own.

Original LICENSE is preserved.

## License

MIT
