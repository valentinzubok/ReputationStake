# Portal — ReputationStake (Intelligent Contracts)

**Type:** Builder → Intelligent Contracts  
**Title:** ReputationStake — reputation escrow primitive for trustless partnerships

## Description (paste)

```text
ReputationStake lets builders lock bookkeeping reputation units in escrow for a counterparty (target). stake(amount, target, purpose) moves available → escrow; release returns funds on success; slash (arbiter/owner) transfers escrow to target on breach.

Lifecycle: active → released | slashed. Events: StakeCreated, StakeReleased, StakeSlashed.

Studionet v0.1 uses in-contract balances (credit_reputation owner bootstrap) — maps to Portal reputation metaphor without native GL transfers.

GitHub: https://github.com/valentinzubok/ReputationStake
```

## Evidence

1. https://github.com/valentinzubok/ReputationStake
2. Studio deploy address (after deploy)
3. stake + release txs
