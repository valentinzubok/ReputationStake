/** Live ReputationStake deploy on GenLayer Studio Dev (chain 61997). Override via env. */
export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_REPUTATIONSTAKE_ADDRESS ||
  "0x795b7661E10dF78BEd921dB7986C05b115614015") as `0x${string}`;

/** Studio Dev / Studio Next — chain ID 61997. */
export const CHAIN_ID = 61997;
export const RPC_URL =
  process.env.NEXT_PUBLIC_GENLAYER_RPC || "https://studio-dev.genlayer.com/api";
export const EXPLORER_BASE =
  process.env.NEXT_PUBLIC_GENLAYER_EXPLORER || "https://explorer-studio-dev.genlayer.com";
export const EXPLORER = `${EXPLORER_BASE}/address/${CONTRACT_ADDRESS}`;
export const txUrl = (hash: string) => `${EXPLORER_BASE}/tx/${hash}`;

export const GITHUB = "https://github.com/valentinzubok/ReputationStake";
export const CONTRACT_REPO = "https://github.com/valentinzubok/ReputationStakeCore";

/** Stable pages a reviewer can paste as slash evidence while trying the console. */
export const EVIDENCE_EXAMPLES = [
  {
    label: "hello page — obligation met, slash should be rejected",
    url: "https://test-server.genlayer.com/static/genvm/hello.html",
  },
  {
    label: "example.com — wrong page, slash should pass",
    url: "https://example.com/",
  },
];

export const DEFAULT_PURPOSE = "Publish a page whose text says: Hello world";
