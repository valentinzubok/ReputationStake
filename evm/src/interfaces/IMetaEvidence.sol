// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Read-side of a MetaEvidence registry: per-round verdicts on whether a validator met its
///         condition (e.g. voted with the final GenLayer consensus on frozen evidence).
interface IMetaEvidence {
    /// @notice Current evidence round.
    function round() external view returns (uint256);

    /// @notice True once a verdict for `validator` exists in the current round.
    function hasVerdict(address validator) external view returns (bool);

    /// @notice Verdict for `validator` in the current round. Reverts if there is none.
    function conditionMet(address validator) external view returns (bool);
}
