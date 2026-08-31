# Portal — ReputationStake (Projects)

**Type:** Builder → **Projects** (not Intelligent Contracts — submit IC separately)

## Requirements

- Live app with MetaMask + genlayer-js calling Studionet
- IC source in `contracts/ReputationStake.py` (same repo)
- Deploy `web/` to Vercel (root directory: `web`)

## Local dev

```bash
cd web && npm install && npm run dev
# http://localhost:3002
```

## Vercel deploy

```bash
cd web
vercel --prod
```

Env: `NEXT_PUBLIC_REPUTATIONSTAKE_ADDRESS=0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca`

## Title

```text
ReputationStake — reputation escrow console (Next.js + consensus slash)
```

## Notes (paste)

```text
ReputationStake is a GenLayer Project: a Next.js console for reputation escrow between parties.

Use case: stake bookkeeping reputation units, release to staker (target/owner only), slash with evidence_url (get_webpage + LLM breach consensus) — via genlayer-js + MetaMask on Studionet.

Intelligent Contract (in-repo): contracts/ReputationStake.py
Studionet: 0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca
App: web/ (Next.js) — https://reputationstake-console.vercel.app
GitHub: https://github.com/valentinzubok/ReputationStake

Smoke txs (IC, already submitted separately):
Deploy 0x873eb938b42ab5abe300c17e13b066d97049f37176abb9604aaf43329bd77899
slash 0x332b440cdeb6f949e0bdfbe61d1b93793bee10f61a0c8073518015cc14cf6498
```

## Evidence

1. https://github.com/valentinzubok/ReputationStake
2. https://reputationstake-console.vercel.app
3. https://github.com/valentinzubok/ReputationStake/blob/main/contracts/ReputationStake.py
4. https://explorer-studio.genlayer.com/address/0x638d2FA5c2eF973BE0bA348453F9F2281FE3F9ca
