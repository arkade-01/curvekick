// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * Testnet stablecoin — "CurveKick USD" (CKUSD).
 * Anyone can call faucet() to receive 1 000 CKUSD once per 24 hours.
 * On mainnet, replace this with the real stablecoin address (USDC/USDT on X Layer).
 */
contract TestToken is ERC20 {
    uint256 public constant FAUCET_AMOUNT = 1_000 * 1e18; // 1 000 CKUSD
    uint256 public constant COOLDOWN = 24 hours;

    mapping(address => uint256) public lastFaucet;

    constructor() ERC20("CurveKick USD", "CKUSD") {
        // Mint 1 000 000 CKUSD to deployer for seeding markets
        _mint(msg.sender, 1_000_000 * 1e18);
    }

    function faucet() external {
        require(
            block.timestamp >= lastFaucet[msg.sender] + COOLDOWN,
            "Faucet: wait 24 hours between claims"
        );
        lastFaucet[msg.sender] = block.timestamp;
        _mint(msg.sender, FAUCET_AMOUNT);
    }

    function nextClaimTime(address user) external view returns (uint256) {
        uint256 next = lastFaucet[user] + COOLDOWN;
        return next > block.timestamp ? next : 0;
    }
}
