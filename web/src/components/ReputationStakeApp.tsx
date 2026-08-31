"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_TARGET, DEMO_URL, EXPLORER, GITHUB } from "@/lib/config";
import {
  creditReputation,
  getArbiter,
  getBalance,
  getOwner,
  getStake,
  getStats,
  listIds,
  releaseStake,
  slashStake,
  stake,
  type StakeRow,
} from "@/lib/contracts";
import { useWallet } from "./WalletProvider";

function sameAddr(a?: string | null, b?: string | null) {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

export function ReputationStakeApp() {
  const { address, provider, ready, error, connect } = useWallet();
  const [rows, setRows] = useState<StakeRow[]>([]);
  const [balance, setBalance] = useState("");
  const [stats, setStats] = useState("");
  const [owner, setOwner] = useState("");
  const [arbiter, setArbiter] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [tx, setTx] = useState("");
  const [msg, setMsg] = useState("");

  const [amount, setAmount] = useState("100");
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [purpose, setPurpose] = useState("API access guarantee");
  const [creditUser, setCreditUser] = useState("");
  const [creditAmount, setCreditAmount] = useState("500");
  const [reason, setReason] = useState(
    "Endpoint returns only Hello world string with no service functionality — SLA fully breached",
  );
  const [evidenceUrl, setEvidenceUrl] = useState(DEMO_URL);

  const isOwner = sameAddr(address, owner);
  const isArbiter = sameAddr(address, arbiter) || isOwner;

  const refresh = useCallback(async () => {
    setLoading(true);
    setMsg("");
    try {
      const [list, o, a] = await Promise.all([listIds(), getOwner(), getArbiter()]);
      setOwner(o);
      setArbiter(a);
      const loaded = await Promise.all(list.map((id) => getStake(id)));
      setRows(loaded.filter(Boolean) as StakeRow[]);
      if (address) {
        const bal = await getBalance(address);
        setBalance(bal ? JSON.stringify(bal) : "");
      } else {
        setBalance("");
      }
      const s = await getStats();
      setStats(s ? JSON.stringify(s) : "");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Studionet read failed");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (address && !creditUser) setCreditUser(address);
  }, [address, creditUser]);

  const run = async (label: string, fn: () => Promise<string>) => {
    if (!address || !provider) {
      setMsg("Connect MetaMask for write transactions");
      return;
    }
    setBusy(label);
    setMsg("");
    setTx("");
    try {
      const hash = await fn();
      setTx(hash);
      setMsg(`${label} submitted (ACCEPTED) — data refreshed`);
      await refresh();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy("");
    }
  };

  return (
    <main className="wrap">
      <header>
        <h1>ReputationStake Console</h1>
        <p className="muted">
          Reputation escrow on Studionet — stake, release (target/owner), slash with evidence
          (arbiter/owner + LLM breach). Reads work without wallet (click Refresh).
        </p>
        <div className="row">
          {address ? (
            <span className="pill ok">
              {address.slice(0, 6)}…{address.slice(-4)}
              {isOwner ? " · owner" : ""}
              {isArbiter && !isOwner ? " · arbiter" : ""}
            </span>
          ) : (
            <button type="button" onClick={() => void connect()}>
              Connect MetaMask
            </button>
          )}
          <button type="button" className="ghost" onClick={() => void refresh()} disabled={loading}>
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>
        {error && <p className="msg">{error}</p>}
        {msg && <p className={msg.includes("failed") ? "msg" : "okmsg"}>{msg}</p>}
        {tx && <p className="tx">tx: {tx}</p>}
        {balance && <p className="muted">your balance: {balance}</p>}
        {stats && <p className="muted">on-chain stats: {stats}</p>}
      </header>

      <section className="card roles">
        <h2>Roles</h2>
        <ul className="muted">
          <li>
            <strong>Owner</strong> ({owner ? `${owner.slice(0, 10)}…` : "…"}): credit_reputation,
            release override, set arbiter
          </li>
          <li>
            <strong>Staker</strong>: stake (needs available balance from credit)
          </li>
          <li>
            <strong>Target</strong>: release active stake on success
          </li>
          <li>
            <strong>Arbiter</strong> ({arbiter ? `${arbiter.slice(0, 10)}…` : "…"}): slash with
            evidence_url — LLM must agree breach=true
          </li>
        </ul>
      </section>

      {isOwner && (
        <section className="card">
          <h2>Owner — credit reputation</h2>
          <p className="muted">Bootstrap bookkeeping balance before stake (not native GL).</p>
          <label>user address</label>
          <input value={creditUser} onChange={(e) => setCreditUser(e.target.value)} />
          <label>amount</label>
          <input value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} />
          <button
            type="button"
            disabled={!ready || !!busy}
            onClick={() =>
              void run("credit_reputation", () =>
                creditReputation(address!, provider, creditUser, creditAmount),
              )
            }
          >
            credit_reputation
          </button>
        </section>
      )}

      <section className="grid">
        <div className="card">
          <h2>New stake</h2>
          <p className="muted">Staker wallet. Cannot stake to yourself.</p>
          <label>amount</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value)} />
          <label>target</label>
          <input value={target} onChange={(e) => setTarget(e.target.value)} />
          <label>purpose</label>
          <input value={purpose} onChange={(e) => setPurpose(e.target.value)} />
          <button
            type="button"
            disabled={!ready || !!busy}
            onClick={() =>
              void run("stake", () => stake(address!, provider, amount, target, purpose))
            }
          >
            stake
          </button>
        </div>

        <div className="card">
          <h2>Slash setup (arbiter/owner)</h2>
          <label>reason</label>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          <label>evidence_url</label>
          <input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} />
          <p className="muted">
            Use slash on an active stake below. Weak reasons may yield breach=false (tx ERROR).
          </p>
        </div>
      </section>

      <section className="card">
        <h2>Stakes ({loading ? "…" : rows.length})</h2>
        {loading && <p className="muted">Loading from Studionet…</p>}
        <table>
          <thead>
            <tr>
              <th>id</th>
              <th>amount</th>
              <th>status</th>
              <th>actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.stake_id}>
                <td>{r.stake_id}</td>
                <td>{r.amount}</td>
                <td className={r.status === "slashed" ? "bad" : r.status === "released" ? "ok" : ""}>
                  {r.status}
                  {r.breach ? " (breach)" : ""}
                </td>
                <td className="row">
                  {r.status === "active" && (
                    <>
                      <button
                        type="button"
                        disabled={!ready || !!busy}
                        title="Target or owner wallet"
                        onClick={() =>
                          void run("release", () => releaseStake(address!, provider, r.stake_id))
                        }
                      >
                        release
                      </button>
                      <button
                        type="button"
                        disabled={!ready || !!busy || !isArbiter}
                        title={isArbiter ? "Arbiter/owner" : "Connect arbiter or owner wallet"}
                        onClick={() =>
                          void run("slash", () =>
                            slashStake(address!, provider, r.stake_id, reason, evidenceUrl),
                          )
                        }
                      >
                        slash
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="footer">
        <a href={GITHUB} target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href={EXPLORER} target="_blank" rel="noreferrer">
          Studionet contract
        </a>
        <span className="muted">
          IC source: contracts/ReputationStake.py · bindings: web/src/lib/contracts.ts
        </span>
      </footer>
    </main>
  );
}
