// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console2} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReputationStake} from "../src/ReputationStake.sol";
import {MetaEvidence} from "../src/MetaEvidence.sol";

/// Usage:
///   OWNER=0x... TOKEN=0x<GEN ERC-20> TREASURY=0x... REWARD_BPS=1000 \
///   forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
contract Deploy is Script {
    function run() external returns (MetaEvidence evidence, ReputationStake rs) {
        address owner = vm.envAddress("OWNER");
        address token = vm.envAddress("TOKEN");
        address treasury = vm.envAddress("TREASURY");
        uint16 rewardBps = uint16(vm.envOr("REWARD_BPS", uint256(1_000)));

        vm.startBroadcast();
        evidence = new MetaEvidence(owner);
        rs = new ReputationStake(owner, IERC20(token), evidence, treasury, rewardBps);
        vm.stopBroadcast();

        console2.log("MetaEvidence", address(evidence));
        console2.log("ReputationStake", address(rs));
    }
}
