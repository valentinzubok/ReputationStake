import { CONTRACT_ADDRESS } from "./config";
import { type Address, parseJson, readContract, writeAndWait } from "./genlayer";

export type StakeRow = {
  stake_id: string;
  staker: string;
  target: string;
  amount: number;
  purpose: string;
  status: string;
  reason: string;
  evidence_url: string;
  evidence_hash: string;
  breach: boolean;
};

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

export async function stake(
  account: Address,
  provider: unknown,
  amount: string,
  target: string,
  purpose: string,
) {
  return writeAndWait(account, provider, CONTRACT_ADDRESS, "stake", [amount, target, purpose]);
}

export async function release(account: Address, provider: unknown, stakeId: string) {
  return writeAndWait(account, provider, CONTRACT_ADDRESS, "release", [stakeId]);
}

export async function slash(
  account: Address,
  provider: unknown,
  stakeId: string,
  reason: string,
  evidenceUrl: string,
) {
  return writeAndWait(account, provider, CONTRACT_ADDRESS, "slash", [
    stakeId,
    reason,
    evidenceUrl,
  ]);
}

export async function creditReputation(
  account: Address,
  provider: unknown,
  user: string,
  amount: string,
) {
  return writeAndWait(account, provider, CONTRACT_ADDRESS, "credit_reputation", [user, amount]);
}
