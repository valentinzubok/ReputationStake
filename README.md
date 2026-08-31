# ReputationStake

<p align="center">
  <img src="assets/cover.png" alt="ReputationStake — Stake reputation. Build trust." width="100%" />
</p>

<p align="center">
  <strong>Stake reputation. Build trust.</strong>
</p>

<p align="center">
  <a href="https://github.com/valentinzubok/ReputationStake/actions/workflows/ci.yml"><img src="https://github.com/valentinzubok/ReputationStake/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
  <a href="https://valentinzubok.github.io/ReputationStake/"><img src="https://img.shields.io/badge/demo-GitHub%20Pages-2dd4bf" alt="Demo" /></a>
</p>

## Overview

**ReputationStake v0.2** escrows bookkeeping reputation units between parties. Release is **target/owner only**. Slash is **consensus-gated**: `get_webpage(evidence_url)` + `prompt_comparative` on `{"breach": bool}`.

| Step | Method | Who / consensus |
|------|--------|-----------------|
| Fund | `credit_reputation` | owner bootstrap |
| Lock | `stake` | staker |
| OK | `release` | target or owner |
| Breach | `slash(…, evidence_url)` | arbiter + LLM/web consensus |

### Why GenLayer

Slash is not a free-text owner decree — validators fetch evidence and agree on boolean `breach` (same pattern as [PromptForge](https://github.com/valentinzubok/PromptForge) `passed`).

> Studionet balances are in-contract bookkeeping (Portal points metaphor), not native GL transfers.

## Install

```bash
git clone https://github.com/valentinzubok/ReputationStake.git
cd ReputationStake
pip install -r requirements-dev.txt
coverage run -m pytest -q && coverage report -m
```

Studio: paste [`contracts/ReputationStake.py`](contracts/ReputationStake.py).

## API

See [`docs/API.md`](docs/API.md).

## Demo

- **Static flow mock:** https://valentinzubok.github.io/ReputationStake/
- **Project app (Studionet):** https://reputationstake-console.vercel.app (`web/` — Next.js + MetaMask + genlayer-js)

```bash
cd web && npm install && npm run dev   # http://localhost:3002
```

Deploy `web/` to Vercel for Portal **Projects** submission — see [`PROJECT_SUBMIT.md`](PROJECT_SUBMIT.md).

## License

MIT © 2026 Valentyn Zubok.
