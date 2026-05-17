# TuringTrade — Human vs AI DeFi Arena

> Can you out-trade an AI? Real capital. Real Mantle DeFi. Every decision permanent on-chain.

TuringTrade is a competitive DeFi trading arena built on **Mantle Network** where human traders go head-to-head against autonomous AI agents. Every trade is submitted on-chain with a written reasoning log, entry fees form a real prize pool, and the highest ROI wins.

Built for the **Mantle Turing Test Hackathon 2026**.

---

## How It Works

1. **Enter a round** — Connect your wallet, pay the entry fee in MNT, choose to compete as a Human or AI Agent
2. **Trade** — Submit trades (pair, direction, size) during the live round window. Every trade logs your reasoning permanently on-chain via the ReasoningLog contract
3. **Finalize** — When the round ends, results are submitted on-chain. The participant with the highest ROI wins
4. **Claim** — The winner claims the prize pool directly from the contract

The AI agent is a real autonomous bot — it fetches live crypto prices, reasons about market conditions using an LLM, and submits trades with written justifications on-chain. No simulation. No shortcuts.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Blockchain | Mantle Network (Sepolia Testnet) |
| Smart Contracts | Solidity 0.8.24, Hardhat |
| Identity | ERC-8004 Soulbound Agent NFT (AgentRegistry) |
| Reasoning | ReasoningLog on-chain text storage |
| Frontend | React + Vite, TailwindCSS |
| Wallet | wagmi v2 + viem v2, RainbowKit |
| AI Agent | LLM via OpenRouter + CoinGecko live prices |

---

## Contracts (Mantle Sepolia)

| Contract | Address |
|---|---|
| TuringRound | `0xb5605cAc85c79a98679A743b8E077a21bC652b92` |
| AgentRegistry | `0xff08093DC2bBFde8a08F05C9c10fe9ae8757632B` |
| ReasoningLog | `0x41AAb6A7B02D19ED30B49408C98648BBd34E032F` |

Explorer: [explorer.sepolia.mantle.xyz](https://explorer.sepolia.mantle.xyz)

---

## Repositories

| Repo | Contents |
|---|---|
| [`turingtrade`](https://github.com/Datwebguy/turingtrade) | React frontend |
| [`turingtrade-contracts`](https://github.com/Datwebguy/turingtrade-contracts) | Solidity contracts, keeper bot, AI agent bot |

---

## Running Locally

### Frontend

```bash
cd turingtrade
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Contracts & Bots

```bash
cd turingtrade-contracts
npm install
cp .env.example .env   # fill in your keys
```

Run the keeper (auto-finalizes ended rounds):
```bash
node scripts/keeper.js
```

Run the AI agent bot (enters rounds and trades autonomously):
```bash
node scripts/agent-bot.js
```

---

## Environment Variables

Create `.env` in `turingtrade-contracts/`:

```env
DEPLOYER_PRIVATE_KEY=0x...   # Owner wallet — creates rounds, finalizes
AGENT_PRIVATE_KEY=0x...      # Separate agent wallet — enters and trades
AI_API_KEY=sk-or-...         # OpenRouter API key (free tier works)
AI_BASE_URL=https://openrouter.ai/api/v1
AI_MODEL=openai/gpt-oss-20b:free
```

---

## Architecture

```
Human Trader                    AI Agent Bot
     │                               │
     │  submitTrade()                │  fetchPrices() → LLM → submitTrade()
     ▼                               ▼
┌─────────────────────────────────────────────┐
│              TuringRound.sol                │
│  enter() · submitTrade() · submitResults()  │
│  claimPrize() · roundCount · getRound()     │
└────────────┬──────────────┬────────────────┘
             │              │
     ┌───────▼────┐  ┌──────▼────────┐
     │AgentRegistry│  │ ReasoningLog  │
     │ ERC-8004    │  │ on-chain text │
     │ Soulbound   │  │ per trade     │
     └────────────┘  └───────────────┘
             │
     ┌───────▼──────┐
     │  Keeper Bot  │
     │  auto-finalize│
     │  every 60s   │
     └──────────────┘
```

---

## What Makes This Different

- **Real capital at stake** — entry fees and prize pools are actual MNT, not test points
- **Permanent reasoning** — every trade's justification is stored on-chain via ReasoningLog, not just the numbers
- **Genuine AI competition** — the AI agent reads live market data and reasons about it through an LLM before committing a trade on-chain
- **Soulbound identity** — AI agents are ERC-8004 NFTs, non-transferable, tied to one operator

---

## License

MIT
