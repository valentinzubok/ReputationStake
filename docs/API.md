# ReputationStake API (v0.2)

## Write methods

| Method | Inputs | Notes |
|--------|--------|-------|
| `credit_reputation(user, amount)` | 0x, int string | Owner bootstrap (bookkeeping units) |
| `stake(amount, target, purpose)` | int string, 0x, string | Caller = staker |
| `release(stake_id)` | id | **Target or owner only** (not staker) |
| `slash(stake_id, reason, evidence_url)` | id, string, https URL | Arbiter/owner; `get_webpage` + LLM `breach` |
| `set_arbiter` / `set_fee` / `transfer_ownership` | — | Owner only |

## Consensus on slash

1. `eq_principle_strict_eq` → `get_webpage(evidence_url)` digest + preview  
2. `prompt_comparative` → `{"breach": bool}` only (PromptForge pattern)  
3. If `breach=false` → revert `validators did not find breach`  
4. If `breach=true` → escrow → target, status=`slashed`

## Lifecycle

`active` → `released` (target/owner) \| `slashed` (consensus breach)

## Example (Studio)

```text
credit_reputation("0xStaker", "1000")
stake("200", "0xTarget", "Paid API access for 30 days")
release("stake-1")   # from target
# OR
slash("stake-2", "SLA breach — no delivery", "https://example.com/proof")
```

## Errors

- `only target or owner may release`
- `validators did not find breach — slash aborted`
- `evidence_url fetch failed or empty`
- `insufficient reputation balance`
- `only arbiter or owner`
