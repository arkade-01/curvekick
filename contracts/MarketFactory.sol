// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./MatchMarket.sol";

contract MarketFactory {
    address public admin;
    address public marketAdmin; // Resolver address in production
    address public token;       // ERC20 used for all markets

    mapping(string => address) private _markets;
    address[] private _allMarkets;

    event MarketCreated(address indexed market, string matchId, uint256 matchTime);

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    constructor(address _admin, address _marketAdmin, address _token) {
        admin       = _admin;
        marketAdmin = _marketAdmin;
        token       = _token;
    }

    function createMarket(string calldata matchId, uint256 matchTime)
        external
        onlyAdmin
        returns (address)
    {
        require(_markets[matchId] == address(0), "market exists");
        MatchMarket market = new MatchMarket(matchId, matchTime, marketAdmin, token);
        _markets[matchId] = address(market);
        _allMarkets.push(address(market));
        emit MarketCreated(address(market), matchId, matchTime);
        return address(market);
    }

    function getMarket(string calldata matchId) external view returns (address) {
        return _markets[matchId];
    }

    function getAllMarkets() external view returns (address[] memory) {
        return _allMarkets;
    }
}
