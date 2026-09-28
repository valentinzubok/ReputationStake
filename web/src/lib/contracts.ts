import { CONTRACT_ADDRESS } from "./config";
import { type Address, type TxStage, parseJson, readContract, writeAndWait } from "./genlayer";

export type StakeRow = {
  stake_id: string;
  staker: string;
  target: string;
  amount: number;
  purpose: string;
  status: string;
  evidence_policy: string[];
  policy_hash: string;
  reason: string;
  evidence_url: string;
  evidence_source: string;
  evidence_hash: string;
  evidence_chars: number;
  evidence_covered_chars: number;
  breach: boolean;
};

export type PolicyCheck = { allowed: boolean; source?: string; error?: string };

export type Balance = { user: string; available: number; escrowed: number };

export type Stats = {
  total: number;
  active: number;
  released: number;
  slashed: number;
  total_escrowed: number;
};

export type EventRow = {
  kind: string;
  [key: string]: unknown;
};

export async function listIds(): Promise<string[]> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "list_ids", []);
  return parseJson<string[]>(raw, []);
}

export async function getStake(id: string): Promise<StakeRow | null> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "get_stake", [id]);
  const parsed = parseJson<StakeRow & { error?: string }>(raw, {} as StakeRow);
  return parsed.stake_id ? parsed : null;
}

export async function getStats(): Promise<Stats | null> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "get_stats", []);
  return parseJson<Stats | null>(raw, null);
}

export async function getBalance(user: string): Promise<Balance | null> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "get_balance", [user]);
  return parseJson<Balance | null>(raw, null);
}

export async function getOwner(): Promise<string> {
  return (await readContract<string>(CONTRACT_ADDRESS, "get_owner", [])) || "";
}

export async function getArbiter(): Promise<string> {
  return (await readContract<string>(CONTRACT_ADDRESS, "get_arbiter", [])) || "";
}

export async function getEvents(): Promise<EventRow[]> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "get_events", []);
  return parseJson<EventRow[]>(raw, []);
}

export async function getEvidencePolicy(stakeId: string): Promise<string[]> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "get_evidence_policy", [stakeId]);
  return parseJson<{ evidence_policy?: string[] }>(raw, {}).evidence_policy || [];
}

/** Free dry-run of the stake's evidence policy, so the arbiter learns before paying fees. */
export async function checkEvidenceUrl(stakeId: string, url: string): Promise<PolicyCheck> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "check_evidence_url", [stakeId, url]);
  return parseJson<PolicyCheck>(raw, { allowed: false, error: "unreadable" });
}

export async function stake(
  account: Address,
  provider: unknown,
  amount: string,
  target: string,
  purpose: string,
  evidencePolicy: string,
  onStage?: (stage: TxStage, hash: string) => void,
) {
  return writeAndWait(
    account,
    provider,
    CONTRACT_ADDRESS,
    "stake",
    [amount, target, purpose, evidencePolicy],
    onStage,
  );
}

export async function release(
  account: Address,
  provider: unknown,
  stakeId: string,
  onStage?: (stage: TxStage, hash: string) => void,
) {
  return writeAndWait(account, provider, CONTRACT_ADDRESS, "release", [stakeId], onStage);
}

export async function slash(
  account: Address,
  provider: unknown,
  stakeId: string,
  reason: string,
  evidenceUrl: string,
  onStage?: (stage: TxStage, hash: string) => void,
) {
  return writeAndWait(
    account,
    provider,
    CONTRACT_ADDRESS,
    "slash",
    [stakeId, reason, evidenceUrl],
    onStage,
  );
}

export async function creditReputation(
  account: Address,
  provider: unknown,
  user: string,
  amount: string,
  onStage?: (stage: TxStage, hash: string) => void,
) {
  return writeAndWait(
    account,
    provider,
    CONTRACT_ADDRESS,
    "credit_reputation",
    [user, amount],
    onStage,
  );
}
