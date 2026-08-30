# { "Depends": "py-genlayer:15qfivjvy80800rh998pcxmd2m8va1wq2qzqhz850n8ggcr4i9q0" }

from genlayer import *
import json
import re

# ReputationStake v0.1 — reputation escrow for trustless partnerships.
# Copyright (c) 2026 Valentyn Zubok. MIT License.
#
# Lifecycle: stake → active → released | slashed
# Bookkeeping reputation units (Portal points metaphor) — no native GL token transfer on Studionet.

MAX_ID_LEN = 64
MAX_PURPOSE_LEN = 512
MAX_REASON_LEN = 512
MAX_STAKE_AMOUNT = 1_000_000_000

STATUS_ACTIVE = "active"
STATUS_RELEASED = "released"
STATUS_SLASHED = "slashed"

ADDR_RE = re.compile(r"^0x[a-fA-F0-9]{40}$")


def _normalize_id(stake_id: str) -> str:
    sid = str(stake_id).strip()
    if not sid:
        raise Exception("stake_id is required")
    if len(sid) > MAX_ID_LEN:
        raise Exception("stake_id exceeds 64 chars")
    for ch in sid:
        ok = ("a" <= ch.lower() <= "z") or ("0" <= ch <= "9") or ch in "-_/"
        if not ok:
            raise Exception("stake_id: only a-z, 0-9, -, _, /")
    return sid


def _require_address(label: str, value: str) -> str:
    addr = str(value).strip()
    if not ADDR_RE.match(addr):
        raise Exception(f"{label} must be a 0x address")
    return addr


def _parse_amount(amount) -> int:
    try:
        amt = int(str(amount).strip())
    except Exception:
        raise Exception("amount must be a positive integer")
    if amt <= 0:
        raise Exception("amount must be positive")
    if amt > MAX_STAKE_AMOUNT:
        raise Exception("amount exceeds max stake")
    return amt


def _sanitize_text(label: str, text: str, max_len: int) -> str:
    cleaned = " ".join(str(text).split())
    if not cleaned:
        raise Exception(f"{label} is required")
    if len(cleaned) > max_len:
        raise Exception(f"{label} exceeds {max_len} chars")
    return cleaned


class ReputationStake(gl.Contract):
    owner: str
    arbiter: str
    fee_receiver: str
    fee_per_action: str
    balances_json: str
    stakes_json: str
    order_json: str
    seq: str
    events_json: str

    def __init__(self, owner_address: str, arbiter_address: str = ""):
        owner = _require_address("owner_address", owner_address)
        self.owner = owner
        self.arbiter = _require_address("arbiter_address", arbiter_address or owner_address)
        self.fee_receiver = owner
        self.fee_per_action = "0"
        self.balances_json = "{}"
        self.stakes_json = "{}"
        self.order_json = "[]"
        self.seq = "0"
        self.events_json = "[]"

    def _load_balances(self):
        return json.loads(self.balances_json)

    def _save_balances(self, balances):
        self.balances_json = json.dumps(balances, sort_keys=True, separators=(",", ":"))

    def _load_stakes(self):
        return json.loads(self.stakes_json)

    def _save_stakes(self, stakes):
        self.stakes_json = json.dumps(stakes, sort_keys=True, separators=(",", ":"))

    def _load_order(self):
        return json.loads(self.order_json)

    def _save_order(self, order):
        self.order_json = json.dumps(order, separators=(",", ":"))

    def _append_event(self, kind: str, payload: dict):
        events = json.loads(self.events_json)
        events.append({"kind": kind, **payload})
        if len(events) > 200:
            events = events[-200:]
        self.events_json = json.dumps(events, separators=(",", ":"))

    def _only_owner(self):
        if str(gl.message.sender_address) != self.owner:
            raise Exception("only owner")

    def _only_arbiter(self):
        caller = str(gl.message.sender_address)
        if caller != self.arbiter and caller != self.owner:
            raise Exception("only arbiter or owner")

    def _balance_of(self, balances, user: str) -> dict:
        key = str(user)
        if key not in balances:
            balances[key] = {"available": 0, "escrowed": 0}
        return balances[key]

    def _next_stake_id(self) -> str:
        n = int(self.seq) + 1
        self.seq = str(n)
        return f"stake-{n}"

    @gl.public.write
    def transfer_ownership(self, new_owner: str) -> None:
        self._only_owner()
        self.owner = _require_address("new_owner", new_owner)
        self._append_event("OwnershipTransferred", {"to": self.owner})

    @gl.public.write
    def set_arbiter(self, new_arbiter: str) -> None:
        self._only_owner()
        self.arbiter = _require_address("new_arbiter", new_arbiter)
        self._append_event("ArbiterUpdated", {"arbiter": self.arbiter})

    @gl.public.write
    def set_fee(self, receiver: str, amount: str) -> None:
        self._only_owner()
        self.fee_receiver = _require_address("receiver", receiver)
        amt = str(amount).strip()
        if not amt.isdigit():
            raise Exception("amount must be digits only")
        self.fee_per_action = amt
        self._append_event("FeeUpdated", {"receiver": self.fee_receiver, "amount": amt})

    @gl.public.write
    def credit_reputation(self, user: str, amount: str) -> None:
        """Owner bookkeeping mint for demos / steward bootstrap (not native GL transfer)."""
        self._only_owner()
        addr = _require_address("user", user)
        amt = _parse_amount(amount)
        balances = self._load_balances()
        row = self._balance_of(balances, addr)
        row["available"] = int(row.get("available", 0)) + amt
        balances[addr] = row
        self._save_balances(balances)
        self._append_event("ReputationCredited", {"user": addr, "amount": amt})

    @gl.public.write
    def stake(self, amount: str, target: str, purpose: str) -> None:
        staker = str(gl.message.sender_address)
        target_addr = _require_address("target", target)
        if target_addr == staker:
            raise Exception("cannot stake to yourself")
        amt = _parse_amount(amount)
        purpose_txt = _sanitize_text("purpose", purpose, MAX_PURPOSE_LEN)

        balances = self._load_balances()
        row = self._balance_of(balances, staker)
        available = int(row.get("available", 0))
        if available < amt:
            raise Exception("insufficient reputation balance")

        row["available"] = available - amt
        row["escrowed"] = int(row.get("escrowed", 0)) + amt
        balances[staker] = row
        self._save_balances(balances)

        stake_id = self._next_stake_id()
        stakes = self._load_stakes()
        stakes[stake_id] = {
            "stake_id": stake_id,
            "staker": staker,
            "target": target_addr,
            "amount": amt,
            "purpose": purpose_txt,
            "status": STATUS_ACTIVE,
            "reason": "",
        }
        self._save_stakes(stakes)
        order = self._load_order()
        order.append(stake_id)
        self._save_order(order)
        self._append_event(
            "StakeCreated",
            {
                "id": stake_id,
                "staker": staker,
                "target": target_addr,
                "amount": amt,
                "purpose": purpose_txt,
            },
        )

    @gl.public.write
    def release(self, stake_id: str) -> None:
        sid = _normalize_id(stake_id)
        stakes = self._load_stakes()
        if sid not in stakes:
            raise Exception("unknown stake_id")
        entry = stakes[sid]
        if entry.get("status") != STATUS_ACTIVE:
            raise Exception("stake is not active")

        caller = str(gl.message.sender_address)
        if caller not in (entry["target"], entry["staker"], self.owner):
            raise Exception("only target, staker, or owner may release")

        amt = int(entry["amount"])
        balances = self._load_balances()
        row = self._balance_of(balances, entry["staker"])
        row["escrowed"] = max(0, int(row.get("escrowed", 0)) - amt)
        row["available"] = int(row.get("available", 0)) + amt
        balances[entry["staker"]] = row
        self._save_balances(balances)

        entry["status"] = STATUS_RELEASED
        stakes[sid] = entry
        self._save_stakes(stakes)
        self._append_event(
            "StakeReleased",
            {"id": sid, "staker": entry["staker"], "amount": amt, "caller": caller},
        )

    @gl.public.write
    def slash(self, stake_id: str, reason: str) -> None:
        self._only_arbiter()
        sid = _normalize_id(stake_id)
        stakes = self._load_stakes()
        if sid not in stakes:
            raise Exception("unknown stake_id")
        entry = stakes[sid]
        if entry.get("status") != STATUS_ACTIVE:
            raise Exception("stake is not active")

        reason_txt = _sanitize_text("reason", reason, MAX_REASON_LEN)
        amt = int(entry["amount"])
        balances = self._load_balances()
        staker_row = self._balance_of(balances, entry["staker"])
        staker_row["escrowed"] = max(0, int(staker_row.get("escrowed", 0)) - amt)
        balances[entry["staker"]] = staker_row

        target_row = self._balance_of(balances, entry["target"])
        target_row["available"] = int(target_row.get("available", 0)) + amt
        balances[entry["target"]] = target_row
        self._save_balances(balances)

        entry["status"] = STATUS_SLASHED
        entry["reason"] = reason_txt
        stakes[sid] = entry
        self._save_stakes(stakes)
        self._append_event(
            "StakeSlashed",
            {
                "id": sid,
                "staker": entry["staker"],
                "target": entry["target"],
                "amount": amt,
                "reason": reason_txt,
                "arbiter": str(gl.message.sender_address),
            },
        )

    @gl.public.view
    def get_stake(self, stake_id: str) -> str:
        sid = _normalize_id(stake_id)
        stakes = self._load_stakes()
        if sid not in stakes:
            return json.dumps({"error": "unknown stake_id"})
        return json.dumps(stakes[sid], sort_keys=True)

    @gl.public.view
    def list_ids(self) -> str:
        return self.order_json

    @gl.public.view
    def list_by_status(self, status: str) -> str:
        wanted = str(status).strip().lower()
        stakes = self._load_stakes()
        ids = [sid for sid, s in stakes.items() if s.get("status") == wanted]
        return json.dumps(ids, separators=(",", ":"))

    @gl.public.view
    def get_balance(self, user: str) -> str:
        addr = _require_address("user", user)
        balances = self._load_balances()
        row = balances.get(addr, {"available": 0, "escrowed": 0})
        return json.dumps({"user": addr, **row}, separators=(",", ":"))

    @gl.public.view
    def get_events(self) -> str:
        return self.events_json

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner

    @gl.public.view
    def get_arbiter(self) -> str:
        return self.arbiter

    @gl.public.view
    def get_fee(self) -> str:
        return json.dumps(
            {"receiver": self.fee_receiver, "amount": self.fee_per_action},
            separators=(",", ":"),
        )

    @gl.public.view
    def get_stats(self) -> str:
        stakes = self._load_stakes()
        active = released = slashed = total_escrowed = 0
        for s in stakes.values():
            st = s.get("status")
            amt = int(s.get("amount", 0))
            if st == STATUS_ACTIVE:
                active += 1
                total_escrowed += amt
            elif st == STATUS_RELEASED:
                released += 1
            elif st == STATUS_SLASHED:
                slashed += 1
        return json.dumps(
            {
                "total": len(stakes),
                "active": active,
                "released": released,
                "slashed": slashed,
                "total_escrowed": total_escrowed,
                "arbiter": self.arbiter,
            },
            separators=(",", ":"),
        )
