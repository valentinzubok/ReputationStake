# Changelog

## 0.2.0 — 2026-08-30

- Consensus-gated `slash(stake_id, reason, evidence_url)`: `get_webpage` + `prompt_comparative` on `{"breach": bool}`
- `release` is target-or-owner only (staker cannot self-unwind)
- Fee fields documented as bookkeeping hints; `list_by_status` follows order

## 0.1.0 — 2026-08-30

- Initial ReputationStake IC: stake, release, slash, credit_reputation
