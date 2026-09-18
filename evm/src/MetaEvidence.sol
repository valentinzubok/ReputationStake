// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IMetaEvidence} from "./interfaces/IMetaEvidence.sol";

/// @title MetaEvidence
/// @notice Round-based registry of `conditionMet` verdicts per validator. The owner (a relayer of
///         GenLayer consensus results) records each verdict with the hash of the evidence it was
///         judged on, so every slash or reward can be traced back to frozen evidence.
contract MetaEvidence is IMetaEvidence, Ownable {
    struct Verdict {
        bool recorded;
        bool conditionMet;
        bytes32 evidenceHash;
    }

    uint256 public override round = 1;

    mapping(uint256 round => mapping(address validator => Verdict)) private _verdicts;

    event VerdictRecorded(uint256 indexed round, address indexed validator, bool conditionMet, bytes32 evidenceHash);
    event RoundAdvanced(uint256 indexed round);

    error NoVerdict(address validator);
    error VerdictExists(address validator);
    error ZeroAddress();

    constructor(address initialOwner) Ownable(initialOwner) {}

    /// @notice Record the verdict for `validator` in the current round (once per round).
    function recordVerdict(address validator, bool met, bytes32 evidenceHash) external onlyOwner {
        if (validator == address(0)) revert ZeroAddress();
        Verdict storage v = _verdicts[round][validator];
        if (v.recorded) revert VerdictExists(validator);
        _verdicts[round][validator] = Verdict({recorded: true, conditionMet: met, evidenceHash: evidenceHash});
        emit VerdictRecorded(round, validator, met, evidenceHash);
    }

    /// @notice Start a new round; previous verdicts stay readable through `verdictAt`.
    function advanceRound() external onlyOwner {
        emit RoundAdvanced(++round);
    }

    function hasVerdict(address validator) external view override returns (bool) {
        return _verdicts[round][validator].recorded;
    }

    function conditionMet(address validator) external view override returns (bool) {
        Verdict storage v = _verdicts[round][validator];
        if (!v.recorded) revert NoVerdict(validator);
        return v.conditionMet;
    }

    function verdictAt(uint256 r, address validator) external view returns (Verdict memory) {
        return _verdicts[r][validator];
    }
}
