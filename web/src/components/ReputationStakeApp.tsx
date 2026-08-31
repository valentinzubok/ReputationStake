"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_TARGET, DEMO_URL, EXPLORER } from "@/lib/config";
import {
  getBalance,
  getStake,
  getStats,
  listIds,
  releaseStake,
  slashStake,
  stake,
  type StakeRow,
} from "@/lib/contracts";
import { useWallet } from "./WalletProvider";

export function ReputationStakeApp() {
  const { address, provider, ready, error, connect } = useWallet();
  const [rows, setRows] = useState<StakeRow[]>([]);
  const [balance, setBalance] = useState("");
  const [stats, setStats] = useState("");
  const [busy, setBusy] = useState("");
  const [tx, setTx] = useState("");
  const [msg, setMsg] = useState("");

  const [amount, setAmount] = useState("100");
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [purpose, setPurpose] = useState("API access guarantee");
  const [reason, setReason] = useState(
    "Endpoint returns only Hello world with no service — SLA breached",
  );
  const [evidenceUrl, setEvidenceUrl] = useState(DEMO_URL);

  const refresh = useCallback(async () => {
    try {
      const list = await listIds();
      const loaded = await Promise.all(list.map((id) => getStake(id)));
      setRows(loaded.filter(Boolean) as StakeRow[]);
      if (address) {
        const bal = await getBalance(address);
        setBalance(bal ? JSON.stringify(bal) : "");
      }
      const s = await getStats();
      setStats(s ? JSON.stringify(s) : "");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "read failed");
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (label: string, fn: () => Promise<string>) => {
    if (!address || !provider) {
      setMsg("Connect MetaMask first");
      return;
    }
    setBusy(label);
    setMsg("");
    setTx("");
    try {
      const hash = await fn();
      setTx(hash);
      setMsg(`${label} accepted`);
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
          Reputation escrow — stake, release (target/owner), consensus slash on Studionet.
        </p>
        <div className="row">
          {address ? (
            <span className="pill ok">{address.slice(0, 6)}…{address.slice(-4)}</span>
          ) : (
            <button type="button" onClick={() => void connect()}>
              Connect MetaMask
            </button>
          )}
          <a href={EXPLORER} target="_blank" rel="noreferrer">
            Explorer
          </a>
          <button type="button" className="ghost" onClick={() => void refresh()}>
            Refresh
          </button>
        </div>
        {(error || msg) && <p className="msg">{error || msg}</p>}
        {tx && <p className="tx">tx: {tx}</p>}
        {balance && <p className="muted">balance: {balance}</p>}
        {stats && <p className="muted">stats: {stats}</p>}
      </header>

      <section className="grid">
        <div className="card">
          <h2>New stake</h2>
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
          <h2>Slash (arbiter/owner)</h2>
          <label>reason</label>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
          <label>evidence_url</label>
          <input value={evidenceUrl} onChange={(e) => setEvidenceUrl(e.target.value)} />
          <p className="muted">Select active stake below, then slash with evidence URL.</p>
        </div>
      </section>

      <section className="card">
        <h2>Stakes ({rows.length})</h2>
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
                        onClick={() =>
                          void run("release", () =>
                            releaseStake(address!, provider, r.stake_id),
                          )
                        }
                      >
                        release
                      </button>
                      <button
                        type="button"
                        disabled={!ready || !!busy}
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
    </main>
  );
}
