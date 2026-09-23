"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CHAIN_ID,
  CONTRACT_ADDRESS,
  CONTRACT_REPO,
  DEFAULT_PURPOSE,
  EVIDENCE_EXAMPLES,
  EXPLORER,
  GITHUB,
  txUrl,
} from "@/lib/config";
import {
  creditReputation,
  getArbiter,
  getBalance,
  getEvents,
  getOwner,
  getStake,
  getStats,
  listIds,
  release,
  slash,
  stake,
  type Balance,
  type EventRow,
  type StakeRow,
  type Stats,
} from "@/lib/contracts";
import { fundWithTestGen, getNativeBalance } from "@/lib/genlayer";
import { useWallet } from "./WalletProvider";

const short = (h: string, n = 10) => (h ? `${h.slice(0, n)}…${h.slice(-4)}` : "—");
const shortHash = (h: string) => (h ? `${h.slice(0, 16)}…` : "—");

/** The slash the network refused: evidence did not support the claim, so the call reverted. */
const REJECTED_SLASH_TX =
  "0xe0353c6a01b204dcfd4de92d0006417d49eea39b7966ef8153d04ac06c8fe46e";

const EVENT_TONE: Record<string, string> = {
  StakeCreated: "",
  StakeReleased: "released",
  StakeSlashed: "slashed",
  SlashRejected: "slashed",
  ReputationCredited: "",
};

/** Hero illustration: escrow on the beam, validators deciding which pan it falls into. */
function Scales() {
  return (
    <div className="scales" aria-hidden="true">
      <div className="beam" />
      <div className="pans">
        <div className="pan keep">
          no breach
          <b>escrow returns</b>
        </div>
        <div className="pan slash">
          breach
          <b>escrow slashed</b>
        </div>
      </div>
      <div className="evidence">
        <span className="seal">sha-256 frozen</span>
        validators read the same evidence, then agree on one boolean
      </div>
    </div>
  );
}

export function ReputationStakeApp() {
  const { address, provider, connect, error: walletError } = useWallet();
  const [rows, setRows] = useState<StakeRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [owner, setOwner] = useState("");
  const [arbiter, setArbiter] = useState("");
  const [balance, setBalance] = useState<Balance | null>(null);
  const [gen, setGen] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(false);
  const [tx, setTx] = useState("");

  const [amount, setAmount] = useState("100");
  const [target, setTarget] = useState("");
  const [purpose, setPurpose] = useState(DEFAULT_PURPOSE);

  const [slashId, setSlashId] = useState("");
  const [reason, setReason] = useState("the published page is not the agreed page");
  const [evidence, setEvidence] = useState(EVIDENCE_EXAMPLES[1].url);

  const [releaseId, setReleaseId] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [ids, o, a, s, ev] = await Promise.all([
        listIds(),
        getOwner(),
        getArbiter(),
        getStats(),
        getEvents(),
      ]);
      setOwner(o);
      setArbiter(a);
      setStats(s);
      setEvents(ev.slice(-8).reverse());
      const loaded = await Promise.all(ids.map((id) => getStake(id)));
      setRows((loaded.filter(Boolean) as StakeRow[]).reverse());
      if (address) {
        setGen(await getNativeBalance(address));
        setBalance(await getBalance(address));
      }
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : "read failed"}`);
      setOk(false);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const run = async (name: string, fn: () => Promise<string | void>) => {
    if (!address || !provider) {
      setMsg("Connect MetaMask for writes");
      setOk(false);
      return;
    }
    setBusy(name);
    setMsg("");
    try {
      const hash = await fn();
      if (hash) setTx(hash);
      await refresh();
      // Set the message after refresh: refresh() clears state while it reloads.
      setMsg(`${name} OK`);
      setOk(true);
    } catch (e) {
      setMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
      setOk(false);
    } finally {
      setBusy("");
    }
  };

  const acct = address as `0x${string}`;
  const disabled = !!busy || !address;
  const isArbiter = !!address && arbiter.toLowerCase() === address.toLowerCase();
  const isOwner = !!address && owner.toLowerCase() === address.toLowerCase();

  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <h1>
            Reputation<span className="accent">Stake</span>
          </h1>
          <p className="lede">
            Escrow reputation against a promise. The counterparty cannot take it and the arbiter
            cannot take it either: a slash only goes through when GenLayer validators, reading the
            same frozen evidence, <strong>agree the obligation was breached</strong>. When they do
            not, the transaction reverts and the escrow stays put.
          </p>
          <div className="chips">
            <span className="chip">
              chain <b>{CHAIN_ID}</b>
            </span>
            {stats && (
              <>
                <span className="chip">
                  stakes <b>{stats.total}</b>
                </span>
                <span className="chip">
                  active <b>{stats.active}</b>
                </span>
                <span className="chip">
                  released <b>{stats.released}</b>
                </span>
                <span className="chip hot">
                  slashed <b>{stats.slashed}</b>
                </span>
                <span className="chip">
                  escrowed <b>{stats.total_escrowed}</b>
                </span>
              </>
            )}
          </div>
          <p className="muted" style={{ marginTop: "0.8rem" }}>
            Contract <a href={EXPLORER}>{short(CONTRACT_ADDRESS, 12)}</a> · owner{" "}
            <code>{short(owner)}</code> · arbiter <code>{short(arbiter)}</code> ·{" "}
            <a href={CONTRACT_REPO}>contract source</a> · <a href={GITHUB}>this console</a>
          </p>
          <div>
            {!address ? (
              <button onClick={() => void connect()}>Connect MetaMask</button>
            ) : (
              <span className="pill">
                <span className="dot" /> {short(address)} · {gen || "?"} GEN
                {balance ? ` · ${balance.available} free / ${balance.escrowed} escrowed` : ""}
              </span>
            )}
            {address && (
              <button
                className="ghost"
                style={{ marginLeft: "0.5rem" }}
                disabled={!!busy}
                onClick={() =>
                  void run("Get test GEN", async () => {
                    await fundWithTestGen(acct);
                  })
                }
              >
                Get test GEN
              </button>
            )}
          </div>
          {walletError && <p className="msg">{walletError}</p>}
          {msg && <p className={ok ? "okmsg" : "msg"}>{msg}</p>}
          {tx && (
            <p className="tx muted">
              last tx <a href={txUrl(tx)}>{tx}</a>
            </p>
          )}
        </div>
        <Scales />
      </section>

      <div className="row">
        <section className="card">
          <h2>1 · Stake against a promise</h2>
          <p className="muted">
            Locks your reputation units in escrow and names the obligation the validators will
            judge later. You cannot stake to yourself.
          </p>
          <label htmlFor="amount">Amount (units)</label>
          <input
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
          />
          <label htmlFor="target">Target address</label>
          <input
            id="target"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="0x…"
          />
          <label htmlFor="purpose">Purpose (the obligation)</label>
          <textarea
            id="purpose"
            rows={3}
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
          <button
            disabled={disabled || !target}
            onClick={() => void run("stake", () => stake(acct, provider, amount, target, purpose))}
          >
            {busy === "stake" ? (
              <span className="working">
                <span className="spinner" /> staking…
              </span>
            ) : (
              "stake → escrow"
            )}
          </button>
          {balance && balance.available === 0 && (
            <p className="muted">
              Your balance is 0. The owner bootstraps units with <code>credit_reputation</code>.
            </p>
          )}
        </section>

        <section className="card">
          <h2>2 · Release it</h2>
          <p className="muted">
            The target (or the owner) confirms the obligation was met and the units go back to the
            staker. The staker cannot unwind their own stake.
          </p>
          <label htmlFor="releaseId">Stake id</label>
          <input
            id="releaseId"
            value={releaseId}
            onChange={(e) => setReleaseId(e.target.value)}
            placeholder="stake-1"
          />
          <button
            disabled={disabled || !releaseId}
            onClick={() => void run("release", () => release(acct, provider, releaseId))}
          >
            {busy === "release" ? (
              <span className="working">
                <span className="spinner" /> releasing…
              </span>
            ) : (
              "release escrow"
            )}
          </button>
          {isOwner && (
            <>
              <label htmlFor="creditTo">Owner: credit reputation to</label>
              <input
                id="creditTo"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="0x…"
              />
              <button
                className="ghost"
                disabled={disabled || !target}
                onClick={() =>
                  void run("credit_reputation", () =>
                    creditReputation(acct, provider, target, amount),
                  )
                }
              >
                credit {amount} units
              </button>
            </>
          )}
        </section>

        <section className="card">
          <h2>3 · Ask for a slash</h2>
          <p className="muted">
            Arbiter only. Validators fetch the evidence URL and agree on its SHA-256 and text, then
            judge that frozen text against the obligation. A slash the network does not support
            aborts the whole transaction.
          </p>
          <label htmlFor="slashId">Stake id</label>
          <input
            id="slashId"
            value={slashId}
            onChange={(e) => setSlashId(e.target.value)}
            placeholder="stake-1"
          />
          <label htmlFor="reason">Claimed breach</label>
          <textarea
            id="reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <label htmlFor="evidence">Evidence URL (https)</label>
          <input id="evidence" value={evidence} onChange={(e) => setEvidence(e.target.value)} />
          <p className="muted">
            Try both:{" "}
            {EVIDENCE_EXAMPLES.map((ex) => (
              <button
                key={ex.url}
                className="ghost"
                style={{ marginRight: "0.35rem", fontSize: "0.72rem" }}
                onClick={() => setEvidence(ex.url)}
              >
                {ex.label}
              </button>
            ))}
          </p>
          <button
            disabled={disabled || !slashId || !isArbiter}
            onClick={() =>
              void run("slash", () => slash(acct, provider, slashId, reason, evidence))
            }
          >
            {busy === "slash" ? (
              <span className="working">
                <span className="spinner" /> asking validators…
              </span>
            ) : (
              "slash → ask the network"
            )}
          </button>
          {address && !isArbiter && (
            <p className="muted">
              Connected wallet is not the arbiter (<code>{short(arbiter)}</code>), so this call will
              be rejected on chain.
            </p>
          )}
          <p className="muted">
            A rejected slash leaves no state behind, so it never shows in the lists below — the
            proof is the transaction itself:{" "}
            <a href={txUrl(REJECTED_SLASH_TX)}>{shortHash(REJECTED_SLASH_TX)}</a> tried to slash
            stake-1 with the hello page as evidence and the validators found no breach.
          </p>
        </section>
      </div>

      <section style={{ marginTop: "2rem" }}>
        <h2>Stakes on chain {loading && <span className="spinner" />}</h2>
        {rows.length === 0 && !loading && <p className="muted">No stakes yet.</p>}
        {rows.map((r) => (
          <article key={r.stake_id} className={`card stake ${r.status}`}>
            <div className="head">
              <span className="id">{r.stake_id}</span>
              <span className={`status ${r.status}`}>{r.status}</span>
              <span className="amount">{r.amount}</span>
            </div>
            <p className="purpose">{r.purpose}</p>
            <p className="hashline">
              staker <code>{short(r.staker)}</code> → target <code>{short(r.target)}</code>
            </p>
            {r.status === "slashed" && (
              <div className="verdictbox">
                <strong>breach agreed by validators.</strong> Claim: {r.reason}
                <div className="hashline">
                  evidence <a href={r.evidence_url}>{r.evidence_url}</a> · sha-256{" "}
                  <code>{shortHash(r.evidence_hash)}</code>
                </div>
              </div>
            )}
          </article>
        ))}
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Recent events</h2>
        {events.length === 0 ? (
          <p className="muted">No events yet.</p>
        ) : (
          <ul className="timeline">
            {events.map((e, i) => (
              <li key={i} className={EVENT_TONE[String(e.kind)] || ""}>
                <strong>{String(e.kind)}</strong>{" "}
                <span className="muted">
                  {[e.id, e.amount, e.staker ? short(String(e.staker)) : null]
                    .filter(Boolean)
                    .map(String)
                    .join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="foot">
        ReputationStake on GenLayer Studio Dev (chain {CHAIN_ID}). Reads work without a wallet;
        writes need MetaMask and test GEN for fees. Contract source and the deployment record live
        in <a href={CONTRACT_REPO}>ReputationStakeCore</a>.
      </footer>
    </main>
  );
}
