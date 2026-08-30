# Portal — ReputationStake v0.2 (Intelligent Contracts)

**Type:** Builder → Intelligent Contracts  

Redeploy Studionet with `contracts/ReputationStake.py` v0.2, then paste txs below.

## Title

```text
ReputationStake v0.2 — escrow with consensus-gated slash (get_webpage + breach LLM)
```

## Notes (paste)

```text
ReputationStake v0.2 escrows bookkeeping reputation units. release is target-or-owner only (staker cannot self-unwind). slash(stake_id, reason, evidence_url) fetches the evidence page under eq_principle_strict_eq, then judges {"breach": bool} via prompt_comparative — slash only if validators agree on breach.

Lifecycle: credit → stake (active) → release | slash.

GitHub: https://github.com/valentinzubok/ReputationStake
(Replace with new Studionet address + deploy/credit/stake/release/slash txs after v0.2 smoke.)
```

## Studio smoke checklist

1. Deploy owner + arbiter = `0x6f6077…`
2. `credit_reputation(owner, "1000")`
3. `stake("200", "0x2222…", "API access demo")` → `release("stake-1")` from… wait: release needs target wallet. From Studio same account = owner can release.
4. Second stake → `slash("stake-2", "SLA breach", "https://test-server.genlayer.com/static/genvm/hello.html")`
5. Confirm `get_stake` status `slashed` + `breach: true` (LLM may vary — retry if UNDETERMINED; only submit FINALIZED SUCCESS)
