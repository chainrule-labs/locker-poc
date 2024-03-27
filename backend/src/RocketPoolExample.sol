// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import { IRocketStorage } from "./interfaces/IRocketStorage.sol";
import { IRocketDepositPool } from "./interfaces/IRocketDepositPool.sol";
import { IRocketTokenRETH } from "./interfaces/IRocketTokenRETH.sol";

contract RocketPoolExample {
    IRocketStorage rocketStorage;
    mapping(address => uint256) balances;

    constructor(address _rocketStorageAddress) {
        rocketStorage = IRocketStorage(_rocketStorageAddress);
    }

    /// @notice Allows a user to send in Ether, which is then forwarded on to RocketPool
    function deposit() public payable {
        // Check deposit amount
        require(msg.value > 0, "Invalid deposit amount");

        // 1. Instantiate RocketDepositPool
        address rocketDepositPoolAddress =
            rocketStorage.getAddress(keccak256(abi.encodePacked("contract.address", "rocketDepositPool")));
        IRocketDepositPool rocketDepositPool = IRocketDepositPool(rocketDepositPoolAddress);

        console.log("Instantiated RocketDepositPool");

        // 2. Instantiate RocketTokenRETH
        address rocketTokenRETHAddress =
            rocketStorage.getAddress(keccak256(abi.encodePacked("contract.address", "rocketTokenRETH")));
        IRocketTokenRETH rocketTokenRETH = IRocketTokenRETH(rocketTokenRETHAddress);

        console.log("Instantiated RocketTokenRETH");

        // 3. Get balance before
        uint256 rethBalance1 = rocketTokenRETH.balanceOf(address(this));

        console.log("Got balance before");

        // 4. Deposit ETH to RocketPool
        rocketDepositPool.deposit{ value: msg.value }();

        console.log("Deposited ETH to RocketPool");

        // 5. Ensure the balance of RETH increased
        uint256 rethBalance2 = rocketTokenRETH.balanceOf(address(this));

        console.log("Got balance after");

        require(rethBalance2 > rethBalance1, "No rETH was minted");

        // 6. Update user's balance
        uint256 rethMinted = rethBalance2 - rethBalance1;
        balances[msg.sender] += rethMinted;
    }

    /// @notice send RETH from this contract to the caller
    function withdraw() public payable {
        // 1. Instantiate RocketTokenRETH
        address rocketTokenRETHAddress =
            rocketStorage.getAddress(keccak256(abi.encodePacked("contract.address", "rocketTokenRETH")));
        IRocketTokenRETH rocketTokenRETH = IRocketTokenRETH(rocketTokenRETHAddress);

        // 2. Transfer rETH to caller
        uint256 balance = balances[msg.sender];
        balances[msg.sender] = 0;
        require(rocketTokenRETH.transfer(msg.sender, balance), "rETH was not transferred to caller");
    }

    function test() public pure returns (uint256) {
        return 1;
    }
}
