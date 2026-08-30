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

**ReputationStake** is a GenLayer Intelligent Contract that escrowes on-chain reputation units (Portal points metaphor) between parties — stake → active → released | slashed.

| Step | Method | Who |
|------|--------|-----|
| Fund | `credit_reputation` | owner (demo bootstrap) |
| Lock | `stake(amount, target, purpose)` | staker |
| OK | `release(stake_id)` | target / staker / owner |
| Breach | `slash(stake_id, reason)` | arbiter / owner |

> Studionet v0.1 uses **bookkeeping balances** inside the IC — not native GL token transfers. Indexers can map units to Portal reputation later.

### Why GenLayer

Reputation without escrow forces trust upfront. ReputationStake makes “I’ll put my points on the line” a consensus-visible contract primitive — useful for APIs, workers, courses, and partnerships where token transfers are overkill.

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

```bash
cd demo && python3 -m http.server 5175
```

Live: https://valentinzubok.github.io/ReputationStake/

## License

MIT © 2026 Valentyn Zubok.
