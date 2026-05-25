// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IMatchMarket {
    function matchTime() external view returns (uint256);
    function resolve(uint8 outcome) external;
}

/**
 * Admin-only resolve wrapper with a timelock.
 * Deploy this first, then pass its address as marketAdmin to MarketFactory
 * so that only this contract can call MatchMarket.resolve().
 */
contract Resolver {
    address public admin;

    event Resolved(address indexed market, uint8 outcome);

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    constructor(address _admin) {
        admin = _admin;
    }

    // Cannot resolve before matchTime + 90 minutes.
    function resolve(address market, uint8 outcome) external onlyAdmin {
        IMatchMarket m = IMatchMarket(market);
        require(block.timestamp >= m.matchTime() + 90 minutes, "too early");
        m.resolve(outcome);
        emit Resolved(market, outcome);
    }
}
