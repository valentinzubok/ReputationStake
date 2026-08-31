# ReputationStake

<p align="center">
  <img src="assets/cover.png" alt="ReputationStake — Stake reputation. Build trust." width="100%" />
</p>

<p align="center">
  <strong>Stake reputation. Build trust.</strong>
</p>

<p align="center">
  <a href="https://reputationstake-console.vercel.app"><img src="https://img.shields.io/badge/Live-Console-d97706?style=flat-square" alt="Live console" /></a>
  <a href="https://github.com/valentinzubok/ReputationStake/actions/workflows/ci.yml"><img src="https://github.com/valentinzubok/ReputationStake/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
</p>

---

## What it is

**ReputationStake** is a GenLayer product for **reputation escrow** between parties: lock bookkeeping units, release on success, or slash with web evidence + LLM breach consensus.

| Layer | What |
|-------|------|
| **Intelligent Contract** | [`contracts/ReputationStake.py`](contracts/ReputationStake.py) — escrow, `get_webpage` + `prompt_comparative` slash |
| **Console (Project)** | [`web/`](web/) — Next.js dApp on Studionet via **genlayer-js** + MetaMask |

**Live console:** https://reputationstake-console.vercel.app  
**Studionet:** [`0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca`](https://explorer-studio.genlayer.com/address/0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca)

Reads work **without wallet** — click **Refresh**. Writes need MetaMask; roles matter (owner / staker / target / arbiter).

> Static flow preview (localStorage mock): [GitHub Pages demo](https://valentinzubok.github.io/ReputationStake/) — not on-chain.

---

## Features

- **Owner bootstrap** — `credit_reputation` (console panel when owner wallet connected)
- **Stake / release** — target or owner releases; staker cannot self-unwind
- **Consensus slash** — arbiter + `evidence_url` + LLM `breach: bool`
- **Method map** — [`contracts/README.md`](contracts/README.md) ↔ [`web/src/lib/contracts.ts`](web/src/lib/contracts.ts)

---

## Quick start (console)

```bash
git clone https://github.com/valentinzubok/ReputationStake.git
cd ReputationStake/web
npm install
npm run dev   # http://localhost:3002
```

1. **Refresh** — see `stake-1` / `stake-2` from smoke
2. Connect **owner** wallet for `credit_reputation` + `slash`
3. Connect **staker** wallet for `stake`

Contract tests:

```bash
cd ..
pip install -r requirements-dev.txt
coverage run -m pytest -q && coverage report -m
```

---

## Portal

- **Intelligent Contracts** — see [`SUBMIT.md`](SUBMIT.md)
- **Projects** — see [`PROJECT_SUBMIT.md`](PROJECT_SUBMIT.md)

Screenshot for stewards: [`docs/console-screenshot.png`](docs/console-screenshot.png)

## API

See [`docs/API.md`](docs/API.md).

## License

MIT © 2026 Valentyn Zubok.
