// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.21;

import { Test, console2 } from "forge-std/Test.sol";
import { RocketPoolExample } from "../src/RocketPoolExample.sol";
import { Counter } from "../src/Counter.sol";
import { IRocketStorage } from "../src/interfaces/IRocketStorage.sol";
import { IRocketTokenRETH } from "../src/interfaces/IRocketTokenRETH.sol";

contract RocketPoolExampleTest is Test {
    address constant ROCKET_POOL_STORAGE_ADDRESS = 0x1d8f8f00cfa6758d7bE78336684788Fb0ee0Fa46;
    RocketPoolExample public rp_example;
    IRocketStorage rocketStorage;

    function setUp() public {
        rp_example = new RocketPoolExample(ROCKET_POOL_STORAGE_ADDRESS);
    }

    /// @dev tests entry point on middle man
    //  - this contract's ether balance should decrease by the amount deposited
    //  - the example contract's rETH balance should increase by the amount recieved from swap
    function testFuzz_Deposit(uint256 _amount) public {
        // setup
        vm.deal(address(this), 11 ether);
        address rocketTokenRETHAddress = IRocketStorage(ROCKET_POOL_STORAGE_ADDRESS).getAddress(
            keccak256(abi.encodePacked("contract.address", "rocketTokenRETH"))
        );
        IRocketTokenRETH rocketTokenRETH = IRocketTokenRETH(rocketTokenRETHAddress);

        // Bound fuzzed variables
        _amount = bound(_amount, 0.01 ether, 0.1 ether);

        // Pre-act data
        uint256 preEthBalance = address(this).balance;
        uint256 preRETHBalance = rocketTokenRETH.balanceOf(address(this));

        // Assertions
        assertGt(preEthBalance, 0, "Ether balance should be greater than 0 before deposit");
        assertEq(preRETHBalance, 0, "rETH balance should be 0 before deposit");

        console.log("preEthBalance:", preEthBalance);
        console.log("_amount:", _amount);

        // Act
        rp_example.deposit{ value: _amount }();

        // Post-act data
        uint256 postEthBalance = address(this).balance;
        uint256 postRETHBalance = rocketTokenRETH.balanceOf(address(this));

        // assert
        assertEq(postEthBalance, 0, "Ether balance did not decrease by the amount deposited");
        assertGt(postRETHBalance, preRETHBalance, "No rETH was minted");
    }
}
