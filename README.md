# ReputationStake

<p align="center">
  <img src="assets/cover.png" alt="ReputationStake — Stake reputation. Build trust." width="100%" />
</p>

<p align="center">
  <strong>Escrow reputation against a promise. Only consensus can slash it.</strong>
</p>

<p align="center">
  <a href="https://valentinzubok.github.io/ReputationStake/"><img src="https://img.shields.io/badge/Live-Console-a78bfa?style=flat-square" alt="Live console" /></a>
  <a href="https://github.com/valentinzubok/ReputationStake/actions/workflows/ci.yml"><img src="https://github.com/valentinzubok/ReputationStake/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/GenLayer-Studio%20Dev%2061997-a78bfa?style=flat-square" alt="Studio Dev" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
</p>

---

## The trust problem

Someone promises something off-chain and you want them to have skin in the game. Escrow alone does
not help: somebody still has to decide whether the promise was kept, and whoever decides can lie.
Give the counterparty the key and they can take the stake; give the staker the key and they can walk
away; give an arbiter the key and you are back to trusting a person.

**ReputationStake puts the breach question itself under consensus.** A slash only moves the escrow
when GenLayer validators, each reading the *same frozen* evidence, independently agree the
obligation was breached.

```
stake(amount, target, purpose, policy)   staker escrows units against a named obligation
                                         AND fixes the https sources a slash may cite
release(stake_id)                        target (or owner): obligation met, units return
slash(stake_id, reason, evidence_url)    the arbiter asks the network and cannot steer it:
      1. evidence_url must satisfy the evidence_policy agreed at stake time — exact
         origin, path prefix on a boundary, no dot segments. Otherwise it reverts here,
         before a single model runs.
      2. validators fetch the page and agree on the SHA-256 of the WHOLE normalized
         document plus a bounded deterministic digest of it (eq_principle.strict_eq)
      3. their LLMs judge that digest, with obligation, claim and page text quoted as
         untrusted data, and must answer with a literal JSON boolean
         (eq_principle.prompt_comparative — no fallback to another strategy)
      4. breach == true  → escrow moves to the target, verdict + document hash stored
         anything else   → the whole transaction reverts and the escrow does not move
```

The last line is the product: **an arbiter cannot slash on assertion alone.**

## Live

| | |
|---|---|
| Console | **https://valentinzubok.github.io/ReputationStake/** (reads work with no wallet) |
| Network | GenLayer Studio Dev / Studio Next — chain `61997` |
| Contract | [`0x1E075794c6404F8f5b9ef87aE29Cf77071Cec86f`](https://explorer-studio-dev.genlayer.com/address/0x1E075794c6404F8f5b9ef87aE29Cf77071Cec86f) |
| Source sha256 | `e38ca5472ab97da4c02850f80aa3331794b7b809ead4e5bd91ee2e8ea1772d18` — equals [`contracts/ReputationStake.py`](contracts/ReputationStake.py) |
| Deploy record | [`STUDIO_DEV_DEPLOY.md`](STUDIO_DEV_DEPLOY.md) — every lifecycle transaction |
| Contract-only repo | [ReputationStakeCore](https://github.com/valentinzubok/ReputationStakeCore) |

`scripts/verify_deployment.py` runs in CI and fails the build if the deployed bytes ever stop
matching the contract in this repository.

### What is on chain right now

`get_stats` → `{"total":3,"active":1,"released":1,"slashed":1,"total_escrowed":300}`

- `stake-1` — **active**, 300 escrowed, after **two** refused slashes:
  [`0xb0422555…`](https://explorer-studio-dev.genlayer.com/tx/0xb0422555adcce9a68cb300d91f923b30997be8089dcefbdd9c34df8a4de44a12)
  cited `https://example.com/`, which is outside the policy this stake was created with, and was
  rejected before any model ran; [`0x16441e99…`](https://explorer-studio-dev.genlayer.com/tx/0x16441e992916cd209f2fd07c574c1a5a1b1a3f6d2ef3c0561427c27f83ce7970)
  stayed inside the policy, but the validators agreed there was no breach.
- `stake-2` — **slashed**: the page under its policy was the IANA example page rather than the
  promised text, the validators agreed `breach: true` through real comparative consensus, and the
  sha-256 of the whole 911-character document (`27319d96…`) is stored with the verdict.
- `stake-3` — **released**, units returned.

### Hardening (v0.4)

The slash path is the part that moves value, so it is the part with the constraints:
the evidence policy is fixed by the staker at creation time, the judged text is a bounded
deterministic digest of the **whole** document rather than its opening, the verdict must be a
literal JSON boolean, obligation/claim/page text are quoted as untrusted data with injection
phrasing flagged, and a comparative-consensus failure reverts the transaction instead of quietly
switching strategy. `tests/test_adversarial.py` holds the attacks; `STUDIO_DEV_DEPLOY.md` has the
per-request breakdown.

## The console

[`web/`](web/) — Next.js 16 + `genlayer-js` 2.0.0-rc.1 + MetaMask, exported statically to GitHub
Pages. It handles the full transaction lifecycle: it estimates the Studio Dev fee, signs through the
wallet on chain 61997, waits for `ACCEPTED` — which it labels *accepted — awaiting finalization*,
because acceptance is not completion — then keeps polling until the chain reports `FINALIZED` and
re-reads the contract at each stage.

| Panel | Calls |
|---|---|
| Stake against a promise | `stake` (plus owner-only `credit_reputation`) |
| Release it | `release` |
| Ask for a slash | `slash` — arbiter only. `check_evidence_url` dry-runs the stake's policy for free first, and two example URLs show both outcomes: one the network refuses, one it agrees to |
| Stakes on chain / events | `list_ids`, `get_stake`, `get_stats`, `get_balance`, `get_events`, `get_evidence_policy` |

```bash
cd web
npm install
npm run dev      # http://localhost:3002
```

Reads need no wallet. For writes: connect MetaMask (the app adds/switches to chain 61997) and press
**Get test GEN** — Studio Dev charges a fee deposit on every transaction.

## EVM variant

[`evm/`](evm/) holds a Solidity `ReputationStake` + `MetaEvidence` pair (ERC-20 stakes,
`conditionMet` rewards, reason-tagged slashing) with Foundry tests — the same escrow shape for
chains without validator consensus.

## Contract tests

```bash
pip install -r requirements-dev.txt
coverage run -m pytest -q && coverage report -m     # 37 tests
```

The suite substitutes a fake GenVM module and covers the lifecycle, access control, validation and
both slash outcomes.

## API

See [`docs/API.md`](docs/API.md) and the method map in [`contracts/README.md`](contracts/README.md).

## License

MIT © 2026 Valentyn Zubok.
