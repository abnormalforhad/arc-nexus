# ⚡ Arc Nexus — Institutional Finance on Arc

A real-time, full-stack dApp built on **Circle's Arc Testnet** — the Economic Operating System for Stablecoin Finance.

![Arc Nexus](https://img.shields.io/badge/Arc-Testnet-blue) ![USDC](https://img.shields.io/badge/Gas-USDC-green) ![EVM](https://img.shields.io/badge/EVM-Compatible-purple)

## 🚀 What is Arc Nexus?

Arc Nexus is a real-time institutional finance command center that connects directly to the Arc blockchain via RPC/WebSocket. **Every number on screen is live data** — not a mockup.

### Features

| Panel | Description | Data Source |
|-------|-------------|-------------|
| ⛓️ **Explorer** | Live block feed with tx count, gas, finality timing | Arc RPC (real-time) |
| 👛 **Wallet** | MetaMask connect, USDC/EURC/USYC balances | ERC-20 contracts |
| 💸 **Transfer** | Send USDC/EURC on-chain with real tx execution | `transfer()` calls |
| 🔄 **StableFX** | FX swap simulator with live EUR/USD rates | Public FX API |
| 🌉 **Bridge** | CCTP v2 cross-chain routes & contract addresses | Arc docs |
| 📡 **Network** | Block height, gas price, protocol features | JSON-RPC |

## 🛠 Tech Stack

- **Frontend**: React + Vite
- **Blockchain**: ethers.js v6
- **Styling**: Vanilla CSS (silk light theme)
- **Network**: Arc Testnet (Chain ID: `5042002`)
- **RPC**: `https://rpc.testnet.arc.network`

## 📦 Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/arc-nexus.git
cd arc-nexus
npm install
npm run dev
```

Open **http://localhost:5173** — the Explorer, Network, Bridge, and StableFX tabs work immediately without a wallet.

## 🔗 To Use Wallet Features

1. Install [MetaMask](https://metamask.io/download)
2. Get free testnet USDC from [Circle Faucet](https://faucet.circle.com)
3. Click "Connect Wallet" — the app auto-adds Arc Testnet to MetaMask

## 📍 Arc Testnet Contracts

| Contract | Address |
|----------|---------|
| USDC | `0x3600000000000000000000000000000000000000` |
| EURC | `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a` |
| USYC | `0xe9185F0c5F296Ed1797AaE4238D26CCaBEadb86C` |
| StableFX | `0x867650F5eAe8df91445971f14d89fd84F0C9a9f8` |
| CCTP TokenMessenger | `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA` |

## 📚 Based On

- [Arc Litepaper](https://www.arc.network/litepaper)
- [Arc Developer Docs](https://docs.arc.network)
- [Circle Developer Console](https://console.circle.com)

## 📝 License

MIT
