// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReputationStake} from "../src/ReputationStake.sol";
import {MetaEvidence} from "../src/MetaEvidence.sol";

contract MockGEN is ERC20 {
    constructor() ERC20("GenLayer Test Token", "GEN") {}

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract ReputationStakeTest is Test {
    MockGEN gen;
    MetaEvidence evidence;
    ReputationStake rs;

    address owner = makeAddr("owner");
    address treasury = makeAddr("treasury");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    bytes32 constant EVIDENCE = keccak256("frozen-snapshot");

    event Slashed(address indexed validator, uint256 amount, uint256 indexed round, bytes32 reasonHash, bytes reason);

    function setUp() public {
        gen = new MockGEN();
        evidence = new MetaEvidence(owner);
        rs = new ReputationStake(owner, gen, evidence, treasury, 1_000); // 10% per round

        for (uint256 i; i < 2; ++i) {
            address v = i == 0 ? alice : bob;
            gen.mint(v, 1_000 ether);
            vm.prank(v);
            gen.approve(address(rs), type(uint256).max);
        }
        gen.mint(owner, 10_000 ether);
        vm.startPrank(owner);
        gen.approve(address(rs), type(uint256).max);
        rs.fundRewards(1_000 ether);
        vm.stopPrank();
    }

    function _stake(address v, uint256 amount) internal {
        vm.prank(v);
        rs.stake(amount);
    }

    function _verdict(address v, bool met) internal {
        vm.prank(owner);
        evidence.recordVerdict(v, met, EVIDENCE);
    }

    function test_StakeTracksBalances() public {
        _stake(alice, 100 ether);
        _stake(alice, 50 ether);
        assertEq(rs.stakes(alice), 150 ether);
        assertEq(rs.totalStaked(), 150 ether);
        assertEq(gen.balanceOf(address(rs)), 1_150 ether); // stakes + reward pool
    }

    function test_StakeRejectsZero() public {
        vm.prank(alice);
        vm.expectRevert(ReputationStake.ZeroAmount.selector);
        rs.stake(0);
    }

    function test_Unstake() public {
        _stake(alice, 100 ether);
        vm.startPrank(alice);
        rs.unstake(40 ether);
        assertEq(rs.stakes(alice), 60 ether);
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.InsufficientStake.selector, 61 ether, 60 ether));
        rs.unstake(61 ether);
        vm.stopPrank();
        assertEq(gen.balanceOf(alice), 940 ether);
    }

    function test_ClaimRewardWhenConditionMet() public {
        _stake(alice, 100 ether);
        _verdict(alice, true);
        vm.prank(bob); // anyone can trigger; reward goes to the validator
        uint256 reward = rs.claimReward(alice);
        assertEq(reward, 10 ether);
        assertEq(gen.balanceOf(alice), 910 ether);
        assertEq(rs.rewardPool(), 990 ether);
        assertTrue(rs.rewardClaimed(alice, 1));
    }

    function test_ClaimRewardOncePerRound() public {
        _stake(alice, 100 ether);
        _verdict(alice, true);
        rs.claimReward(alice);
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.AlreadyClaimed.selector, alice, 1));
        rs.claimReward(alice);

        vm.prank(owner);
        evidence.advanceRound();
        _verdict(alice, true);
        rs.claimReward(alice);
        assertEq(gen.balanceOf(alice), 920 ether);
    }

    function test_ClaimRewardNeedsVerdictAndMet() public {
        _stake(alice, 100 ether);
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.NoVerdict.selector, alice));
        rs.claimReward(alice);
        _verdict(alice, false);
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.ConditionNotMet.selector, alice));
        rs.claimReward(alice);
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.NoStake.selector, bob));
        rs.claimReward(bob);
    }

    function test_ClaimRewardLimitedByPool() public {
        ReputationStake dry = new ReputationStake(owner, gen, evidence, treasury, 1_000);
        vm.startPrank(alice);
        gen.approve(address(dry), type(uint256).max);
        dry.stake(100 ether);
        vm.stopPrank();
        _verdict(alice, true);
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.RewardPoolEmpty.selector, 10 ether, 0));
        dry.claimReward(alice);
    }

    function test_SlashWhenConditionNotMet() public {
        _stake(bob, 200 ether);
        _verdict(bob, false);
        bytes memory reason = bytes("voted against consensus on frozen evidence");
        vm.expectEmit(true, true, true, true);
        emit Slashed(bob, 200 ether, 1, keccak256(reason), reason);
        vm.prank(owner);
        rs.slash(bob, reason);
        assertEq(rs.stakes(bob), 0);
        assertTrue(rs.slashed(bob));
        assertEq(gen.balanceOf(treasury), 200 ether);
        assertEq(rs.totalStaked(), 0);

        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.IsSlashed.selector, bob));
        rs.stake(1 ether);
    }

    function test_SlashGuards() public {
        _stake(alice, 100 ether);
        bytes memory reason = bytes("r");

        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, alice));
        rs.slash(alice, reason);

        vm.startPrank(owner);
        vm.expectRevert(ReputationStake.EmptyReason.selector);
        rs.slash(alice, "");
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.NoVerdict.selector, alice));
        rs.slash(alice, reason);
        evidence.recordVerdict(alice, true, EVIDENCE);
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.ConditionMet.selector, alice));
        rs.slash(alice, reason);
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.NoStake.selector, bob));
        rs.slash(bob, reason);
        vm.stopPrank();
    }

    function test_SlashedValidatorCannotClaim() public {
        _stake(bob, 100 ether);
        _verdict(bob, false);
        vm.prank(owner);
        rs.slash(bob, bytes("bad vote"));
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.IsSlashed.selector, bob));
        rs.claimReward(bob);
    }

    function test_MetaEvidenceOneVerdictPerRound() public {
        _verdict(alice, true);
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(MetaEvidence.VerdictExists.selector, alice));
        evidence.recordVerdict(alice, false, EVIDENCE);
        MetaEvidence.Verdict memory v = evidence.verdictAt(1, alice);
        assertTrue(v.recorded && v.conditionMet);
        assertEq(v.evidenceHash, EVIDENCE);
        vm.expectRevert(abi.encodeWithSelector(MetaEvidence.NoVerdict.selector, bob));
        evidence.conditionMet(bob);
    }

    function test_OwnerSettings() public {
        vm.startPrank(owner);
        vm.expectRevert(abi.encodeWithSelector(ReputationStake.RewardTooHigh.selector, 5_001));
        rs.setRewardBps(5_001);
        rs.setRewardBps(250);
        rs.setTreasury(bob);
        MetaEvidence other = new MetaEvidence(owner);
        rs.setMetaEvidence(other);
        vm.stopPrank();
        assertEq(rs.rewardBps(), 250);
        assertEq(rs.treasury(), bob);
        assertEq(address(rs.metaEvidence()), address(other));
    }

    function testFuzz_SlashConservesTokens(uint96 amount) public {
        vm.assume(amount > 0 && amount <= 1_000 ether);
        _stake(alice, amount);
        _verdict(alice, false);
        uint256 before = gen.balanceOf(address(rs)) + gen.balanceOf(treasury);
        vm.prank(owner);
        rs.slash(alice, bytes("fuzz"));
        assertEq(gen.balanceOf(address(rs)) + gen.balanceOf(treasury), before);
        assertEq(gen.balanceOf(address(rs)), rs.rewardPool() + rs.totalStaked());
    }
}
