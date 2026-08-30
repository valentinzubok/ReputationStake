# ReputationStake API

## Write methods

| Method | Inputs | Notes |
|--------|--------|-------|
| `credit_reputation(user, amount)` | 0x, int string | Owner bootstrap (bookkeeping units, not native GL transfer) |
| `stake(amount, target, purpose)` | int string, 0x, string | Caller = staker; moves available → escrow |
| `release(stake_id)` | id | Target, staker, or owner |
| `slash(stake_id, reason)` | id, string | Arbiter or owner; escrow → target |
| `set_arbiter(new_arbiter)` | 0x | Owner only |
| `set_fee(receiver, amount)` | 0x, digit string | Owner only |
| `transfer_ownership(new_owner)` | 0x | Owner only |

## View methods

| Method | Returns |
|--------|---------|
| `get_stake(stake_id)` | stake record JSON |
| `list_ids` | all stake ids |
| `list_by_status(status)` | `active` / `released` / `slashed` |
| `get_balance(user)` | `{available, escrowed}` |
| `get_events` | event log |
| `get_owner` / `get_arbiter` / `get_fee` / `get_stats` | strings / JSON |

## Lifecycle

`Created (StakeCreated)` → `active` → `released` | `slashed`

## Events

`StakeCreated`, `StakeReleased`, `StakeSlashed`, `ReputationCredited`, `ArbiterUpdated`, `FeeUpdated`, `OwnershipTransferred`

## Limits

| Constant | Value |
|----------|-------|
| `MAX_STAKE_AMOUNT` | 1_000_000_000 |
| `MAX_PURPOSE_LEN` | 512 |
| `MAX_REASON_LEN` | 512 |
| `MAX_ID_LEN` | 64 |

## Example (Studio)

```text
credit_reputation("0xStaker", "1000")
stake("200", "0xTarget", "Paid API access for 30 days")
release("stake-1")
slash("stake-2", "SLA breach — no delivery")
```

## Errors

- `insufficient reputation balance`
- `cannot stake to yourself`
- `stake is not active`
- `only arbiter or owner`
- `only target, staker, or owner may release`
