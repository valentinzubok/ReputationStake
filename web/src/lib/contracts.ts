import { CONTRACT_ADDRESS } from "./config";
import type { Address } from "./genlayer";
import { parseJson, readContract, writeAndWait } from "./genlayer";

export type StakeRow = {
  stake_id: string;
  staker: string;
  target: string;
  amount: number;
  purpose: string;
  status: string;
  breach?: boolean;
  reason?: string;
  evidence_url?: string;
};

export type BalanceRow = {
  user: string;
  available: number;
  escrowed: number;
};

export type Stats = {
  active: number;
  released: number;
  slashed: number;
  total_escrowed: number;
};

export async function listIds(): Promise<string[]> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "list_ids", []);
  return parseJson<string[]>(raw, []);
}

export async function getStake(id: string): Promise<StakeRow | null> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "get_stake", [id]);
  const parsed = parseJson<StakeRow & { error?: string }>(raw, {} as StakeRow);
  if ("error" in parsed && parsed.error) return null;
  return parsed.stake_id ? parsed : null;
}

export async function getBalance(user: string): Promise<BalanceRow | null> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "get_balance", [user]);
  return parseJson<BalanceRow | null>(raw, null);
}

export async function getStats(): Promise<Stats | null> {
  const raw = await readContract<string>(CONTRACT_ADDRESS, "get_stats", []);
  return parseJson<Stats | null>(raw, null);
}

export async function getOwner(): Promise<string> {
  return readContract<string>(CONTRACT_ADDRESS, "get_owner", []);
}

export async function getArbiter(): Promise<string> {
  return readContract<string>(CONTRACT_ADDRESS, "get_arbiter", []);
}

export async function creditReputation(
  account: Address,
  provider: unknown,
  user: string,
  amount: string,
): Promise<string> {
  return writeAndWait(account, provider, CONTRACT_ADDRESS, "credit_reputation", [
    user,
    amount,
  ]);
}

export async function stake(
  account: Address,
  provider: unknown,
  amount: string,
  target: string,
  purpose: string,
): Promise<string> {
  return writeAndWait(account, provider, CONTRACT_ADDRESS, "stake", [
    amount,
    target,
    purpose,
  ]);
}

export async function releaseStake(
  account: Address,
  provider: unknown,
  stakeId: string,
): Promise<string> {
  return writeAndWait(account, provider, CONTRACT_ADDRESS, "release", [stakeId]);
}

export async function slashStake(
  account: Address,
  provider: unknown,
  stakeId: string,
  reason: string,
  evidenceUrl: string,
): Promise<string> {
  return writeAndWait(account, provider, CONTRACT_ADDRESS, "slash", [
    stakeId,
    reason,
    evidenceUrl,
  ]);
}
