# Portal — ReputationStake v0.2 (Intelligent Contracts)

**Type:** Builder → Intelligent Contracts

## Studionet smoke (DONE — v0.2)

| Item | Value |
|------|--------|
| Address | `0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca` |
| Explorer | https://explorer-studio.genlayer.com/address/0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca |
| Deploy | `0x873eb938b42ab5abe300c17e13b066d97049f37176abb9604aaf43329bd77899` |
| credit_reputation | `0xd75721f0426fb13c5020114668ae82fdcf08f23960c7c902de666770b3c65ad6` |
| stake (stake-1) | `0x41bf16a4214c7ce2fc3e2282f7e3ef4d73fdfc13d8d024b6f5ec345011a42075` |
| release (stake-1) | `0x68bb3765d06be86636d3eb9d39f41ba24d00efaced82298e408e2ffad414e52b` |
| stake (stake-2) | `0x0d401573a6f3ec5c25a018be1196e3f3aafceb1a731a4e0ac6a7e2dd9145721a` |
| slash (stake-2, SUCCESS) | `0x332b440cdeb6f949e0bdfbe61d1b93793bee10f61a0c8073518015cc14cf6498` |
| Verified | `get_stake("stake-2")` → `status: slashed`, `breach: true` |

**Do not submit:** first slash attempt `0x1ddbce21dbd993a0df3c33c2e54fbf82daaa26f6182c30f9296124bd66760555` (FINALIZED ERROR — LLM breach=false).

Source commit: `a50c431` — https://github.com/valentinzubok/ReputationStake/blob/main/contracts/ReputationStake.py

## Title

```text
ReputationStake v0.2 — escrow with consensus-gated slash (get_webpage + breach LLM)
```

## Notes (paste into Portal)

```text
ReputationStake v0.2 escrows bookkeeping reputation units. release is target-or-owner only (staker cannot self-unwind). slash(stake_id, reason, evidence_url) fetches the evidence page under eq_principle_strict_eq, then judges {"breach": bool} via prompt_comparative — slash only if validators agree on breach.

Lifecycle: credit_reputation → stake (active) → release | slash.

Studionet smoke (all FINALIZED SUCCESS except noted):
- Contract: 0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca
- Deploy: 0x873eb938b42ab5abe300c17e13b066d97049f37176abb9604aaf43329bd77899
- credit_reputation: 0xd75721f0426fb13c5020114668ae82fdcf08f23960c7c902de666770b3c65ad6
- stake-1: 0x41bf16a4214c7ce2fc3e2282f7e3ef4d73fdfc13d8d024b6f5ec345011a42075
- release stake-1 (owner): 0x68bb3765d06be86636d3eb9d39f41ba24d00efaced82298e408e2ffad414e52b
- stake-2: 0x0d401573a6f3ec5c25a018be1196e3f3aafceb1a731a4e0ac6a7e2dd9145721a
- slash stake-2 (breach=true): 0x332b440cdeb6f949e0bdfbe61d1b93793bee10f61a0c8073518015cc14cf6498

GitHub: https://github.com/valentinzubok/ReputationStake (commit a50c431)
Demo: https://valentinzubok.github.io/ReputationStake/
Explorer: https://explorer-studio.genlayer.com/address/0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca
```

## Evidence links

1. https://github.com/valentinzubok/ReputationStake
2. https://github.com/valentinzubok/ReputationStake/blob/main/contracts/ReputationStake.py
3. https://valentinzubok.github.io/ReputationStake/
4. https://explorer-studio.genlayer.com/address/0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca
5. https://explorer-studio.genlayer.com/tx/0x873eb938b42ab5abe300c17e13b066d97049f37176abb9604aaf43329bd77899
6. https://explorer-studio.genlayer.com/tx/0xd75721f0426fb13c5020114668ae82fdcf08f23960c7c902de666770b3c65ad6
7. https://explorer-studio.genlayer.com/tx/0x41bf16a4214c7ce2fc3e2282f7e3ef4d73fdfc13d8d024b6f5ec345011a42075
8. https://explorer-studio.genlayer.com/tx/0x68bb3765d06be86636d3eb9d39f41ba24d00efaced82298e408e2ffad414e52b
9. https://explorer-studio.genlayer.com/tx/0x0d401573a6f3ec5c25a018be1196e3f3aafceb1a731a4e0ac6a7e2dd9145721a
10. https://explorer-studio.genlayer.com/tx/0x332b440cdeb6f949e0bdfbe61d1b93793bee10f61a0c8073518015cc14cf6498
