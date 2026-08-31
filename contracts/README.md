# Intelligent Contract — ReputationStake (source of truth)

GenLayer IC for reputation escrow with consensus-gated slash.

| Item | Value |
|------|--------|
| File | [`ReputationStake.py`](./ReputationStake.py) |
| Studionet | [`0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca`](https://explorer-studio.genlayer.com/address/0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca) |
| App bindings | [`web/src/lib/contracts.ts`](../web/src/lib/contracts.ts) |

## Roles

| Role | Methods |
|------|---------|
| **Owner** | `credit_reputation`, `release` (override), `transfer_ownership`, `set_arbiter` |
| **Staker** | `stake` (needs available balance) |
| **Target** | `release` (acknowledge delivery) |
| **Arbiter** (or owner) | `slash(stake_id, reason, evidence_url)` — `get_webpage` + LLM `breach` consensus |

## Method alignment (app ↔ contract)

| App call (`web/src/lib/contracts.ts`) | Contract method | Kind |
|---------------------------------------|-----------------|------|
| `listIds()` | `list_ids()` | view |
| `getStake(id)` | `get_stake(stake_id)` | view |
| `getBalance(user)` | `get_balance(user)` | view |
| `getStats()` | `get_stats()` | view |
| `getOwner()` | `get_owner()` | view |
| `getArbiter()` | `get_arbiter()` | view |
| `creditReputation(...)` | `credit_reputation(user, amount)` | write — owner only |
| `stake(...)` | `stake(amount, target, purpose)` | write |
| `releaseStake(...)` | `release(stake_id)` | write — target or owner |
| `slashStake(...)` | `slash(stake_id, reason, evidence_url)` | write — arbiter/owner; `eq_principle_strict_eq` + `prompt_comparative` on `breach` |

## Core consensus path (slash)

1. `slash` → fetch `evidence_url` under `eq_principle_strict_eq`
2. `prompt_comparative` (or strict_eq fallback) on `{"breach": bool}` vs purpose + reason + page preview
3. Escrow moves to target only if validators agree `breach: true`

## Deploy (Studio)

Constructor: `owner_address`, optional `arbiter_address` (defaults to owner). Paste [`ReputationStake.py`](./ReputationStake.py) into [GenLayer Studio](https://studio.genlayer.com/contracts).
