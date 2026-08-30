# Portal — ReputationStake (Intelligent Contracts) · Studionet smoke DONE

## Smoke (FINALIZED — 20 validators)

| Item | Value |
|------|--------|
| Address | `0xB868a1Af1c5A8515dc41116787E144c074436b41` |
| Owner / Arbiter | `0x6f6077eC587f2964d30aCE8D803Edc27988046e3` |
| Explorer | https://explorer-studio.genlayer.com/address/0xB868a1Af1c5A8515dc41116787E144c074436b41 |
| Deploy | `0x4f81914c2ab6046d532f4a59411a3a584b575289de17223d723713da7c0bf43e` |
| credit_reputation | `0xa691009c6c6f96550ea24accea5272d0d2bd84d98e7b2a409a40fff7aedf8340` |
| credit_reputation (2nd) | `0x072e519f21b10b77885d599a23afaa08ccde14aef0aa4a3addbcf31a8eaa1a09` |
| stake | `0xcf421f74427be9eeaca4d05b76d30c246a78ddb329d19242b0ae5701b8090b26` |
| release | `0x7b8de27e773ab574392c141e30c8950dd1e0f9b37e8b884ef7db2a49cc6a6770` |

Verified: `list_ids` → `["stake-1"]`; after release `status=released`. Zero ERROR/UNDETERMINED.

## Contribution Type

**Builder → Intelligent Contracts**

## Title

```text
ReputationStake — reputation escrow (stake → release | slash) on GenLayer
```

## Notes / Description (paste into Portal)

```text
ReputationStake is a GenLayer Intelligent Contract that escrows bookkeeping reputation units between parties: stake(amount, target, purpose) locks available → escrow; release returns to staker on success; slash (arbiter/owner) moves escrow to target on breach.

Lifecycle covered on Studionet (Normal / Full Consensus, 20 validators): credit_reputation → stake (active) → release (released). All txs FINALIZED. Zero ERROR/UNDETERMINED.

Studionet v0.1 uses in-contract balances (owner credit_reputation bootstrap) — Portal reputation metaphor without native GL transfers. Arbiter can be a separate court address; smoke used owner=arbiter.

GitHub: https://github.com/valentinzubok/ReputationStake
Studionet: 0xB868a1Af1c5A8515dc41116787E144c074436b41
Deploy: 0x4f81914c2ab6046d532f4a59411a3a584b575289de17223d723713da7c0bf43e
credit: 0xa691009c6c6f96550ea24accea5272d0d2bd84d98e7b2a409a40fff7aedf8340
stake: 0xcf421f74427be9eeaca4d05b76d30c246a78ddb329d19242b0ae5701b8090b26
release: 0x7b8de27e773ab574392c141e30c8950dd1e0f9b37e8b884ef7db2a49cc6a6770
Explorer: https://explorer-studio.genlayer.com/address/0xB868a1Af1c5A8515dc41116787E144c074436b41
```

## Evidence links (Portal)

1. https://github.com/valentinzubok/ReputationStake
2. https://github.com/valentinzubok/ReputationStake/blob/main/contracts/ReputationStake.py
3. https://explorer-studio.genlayer.com/address/0xB868a1Af1c5A8515dc41116787E144c074436b41
4. https://explorer-studio.genlayer.com/tx/0x4f81914c2ab6046d532f4a59411a3a584b575289de17223d723713da7c0bf43e
5. https://explorer-studio.genlayer.com/tx/0xcf421f74427be9eeaca4d05b76d30c246a78ddb329d19242b0ae5701b8090b26
6. https://explorer-studio.genlayer.com/tx/0x7b8de27e773ab574392c141e30c8950dd1e0f9b37e8b884ef7db2a49cc6a6770
