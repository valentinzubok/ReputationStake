// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IMetaEvidence} from "./interfaces/IMetaEvidence.sol";

/// @title ReputationStake (EVM)
/// @notice Validators stake an ERC-20 (e.g. GEN) as reputation. Each round a MetaEvidence registry
///         says whether a validator met its condition: met → the validator can claim a reward,
///         not met → the owner can slash the whole stake to the treasury.
contract ReputationStake is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint16 public constant MAX_REWARD_BPS = 5_000; // 50% of stake per round, hard cap

    IERC20 public immutable stakeToken;
    IMetaEvidence public metaEvidence;
    address public treasury;
    uint16 public rewardBps;

    mapping(address validator => uint256 amount) public stakes;
    mapping(address validator => bool) public slashed;
    mapping(address validator => mapping(uint256 round => bool)) public rewardClaimed;

    uint256 public totalStaked;
    uint256 public rewardPool;

    event Staked(address indexed validator, uint256 amount, uint256 newStake);
    event Unstaked(address indexed validator, uint256 amount, uint256 newStake);
    event Slashed(address indexed validator, uint256 amount, uint256 indexed round, bytes32 reasonHash, bytes reason);
    event RewardClaimed(address indexed validator, uint256 indexed round, uint256 reward);
    event RewardsFunded(address indexed from, uint256 amount);
    event MetaEvidenceSet(address indexed metaEvidence);
    event TreasurySet(address indexed treasury);
    event RewardBpsSet(uint16 rewardBps);

    error ZeroAmount();
    error ZeroAddress();
    error IsSlashed(address validator);
    error NoStake(address validator);
    error InsufficientStake(uint256 requested, uint256 available);
    error NoVerdict(address validator);
    error ConditionMet(address validator);
    error ConditionNotMet(address validator);
    error AlreadyClaimed(address validator, uint256 round);
    error RewardPoolEmpty(uint256 needed, uint256 available);
    error RewardTooHigh(uint16 bps);
    error EmptyReason();

    constructor(address initialOwner, IERC20 token, IMetaEvidence evidence, address treasury_, uint16 rewardBps_)
        Ownable(initialOwner)
    {
        if (address(token) == address(0) || address(evidence) == address(0) || treasury_ == address(0)) {
            revert ZeroAddress();
        }
        if (rewardBps_ > MAX_REWARD_BPS) revert RewardTooHigh(rewardBps_);
        stakeToken = token;
        metaEvidence = evidence;
        treasury = treasury_;
        rewardBps = rewardBps_;
    }

    // ── validators ──────────────────────────────────────────────────────────

    /// @notice Stake `amount` tokens (approve first). Slashed validators cannot stake again.
    function stake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        if (slashed[msg.sender]) revert IsSlashed(msg.sender);
        stakes[msg.sender] += amount;
        totalStaked += amount;
        stakeToken.safeTransferFrom(msg.sender, address(this), amount);
        emit Staked(msg.sender, amount, stakes[msg.sender]);
    }

    /// @notice Withdraw part or all of an unslashed stake.
    function unstake(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 current = stakes[msg.sender];
        if (amount > current) revert InsufficientStake(amount, current);
        stakes[msg.sender] = current - amount;
        totalStaked -= amount;
        stakeToken.safeTransfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount, current - amount);
    }

    /// @notice Pay `validator` its reward for the current round if MetaEvidence says the condition
    ///         was met. Anyone may trigger it; tokens always go to the validator.
    function claimReward(address validator) external nonReentrant returns (uint256 reward) {
        if (slashed[validator]) revert IsSlashed(validator);
        uint256 s = stakes[validator];
        if (s == 0) revert NoStake(validator);
        if (!metaEvidence.hasVerdict(validator)) revert NoVerdict(validator);
        if (!metaEvidence.conditionMet(validator)) revert ConditionNotMet(validator);
        uint256 r = metaEvidence.round();
        if (rewardClaimed[validator][r]) revert AlreadyClaimed(validator, r);

        reward = (s * rewardBps) / 10_000;
        if (reward > rewardPool) revert RewardPoolEmpty(reward, rewardPool);
        rewardClaimed[validator][r] = true;
        rewardPool -= reward;
        stakeToken.safeTransfer(validator, reward);
        emit RewardClaimed(validator, r, reward);
    }

    // ── owner ───────────────────────────────────────────────────────────────

    /// @notice Slash the full stake of `validator` to the treasury. Allowed only when MetaEvidence
    ///         holds a current-round verdict that the condition was NOT met.
    function slash(address validator, bytes calldata reason) external onlyOwner nonReentrant {
        if (reason.length == 0) revert EmptyReason();
        uint256 amount = stakes[validator];
        if (amount == 0) revert NoStake(validator);
        if (!metaEvidence.hasVerdict(validator)) revert NoVerdict(validator);
        if (metaEvidence.conditionMet(validator)) revert ConditionMet(validator);

        stakes[validator] = 0;
        slashed[validator] = true;
        totalStaked -= amount;
        stakeToken.safeTransfer(treasury, amount);
        emit Slashed(validator, amount, metaEvidence.round(), keccak256(reason), reason);
    }

    /// @notice Add tokens to the reward pool (approve first). Anyone may fund it.
    function fundRewards(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        rewardPool += amount;
        stakeToken.safeTransferFrom(msg.sender, address(this), amount);
        emit RewardsFunded(msg.sender, amount);
    }

    function setMetaEvidence(IMetaEvidence evidence) external onlyOwner {
        if (address(evidence) == address(0)) revert ZeroAddress();
        metaEvidence = evidence;
        emit MetaEvidenceSet(address(evidence));
    }

    function setTreasury(address treasury_) external onlyOwner {
        if (treasury_ == address(0)) revert ZeroAddress();
        treasury = treasury_;
        emit TreasurySet(treasury_);
    }

    function setRewardBps(uint16 bps) external onlyOwner {
        if (bps > MAX_REWARD_BPS) revert RewardTooHigh(bps);
        rewardBps = bps;
        emit RewardBpsSet(bps);
    }
}
