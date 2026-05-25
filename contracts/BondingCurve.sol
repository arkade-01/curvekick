// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * Linear bonding curve: price = basePrice + slope * supply
 *
 * Shares are fungible units tracked per address.
 * The MatchMarket that owns this curve holds all token balances —
 * BondingCurve only manages share accounting and price math.
 *
 * Cost to buy N shares starting at current supply S:
 *   integral from S to S+N of (basePrice + slope*x) dx
 *   = basePrice*N + slope*(N*(2S+N))/2
 */
contract BondingCurve {
    uint256 public immutable basePrice;
    uint256 public immutable slope;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    address public immutable market;

    event SharesBought(address indexed buyer,  uint256 shares, uint256 cost);
    event SharesSold(address indexed seller, uint256 shares, uint256 refund);

    modifier onlyMarket() {
        require(msg.sender == market, "not market");
        _;
    }

    constructor(uint256 _basePrice, uint256 _slope, address _market) {
        basePrice = _basePrice;
        slope     = _slope;
        market    = _market;
    }

    function getBuyCost(uint256 shares) public view returns (uint256) {
        return _integralCost(totalSupply, shares);
    }

    function getSellRefund(uint256 shares) public view returns (uint256) {
        require(shares <= totalSupply, "exceeds supply");
        return _integralCost(totalSupply - shares, shares);
    }

    function getPrice(uint256 shares) external view returns (uint256) {
        return getBuyCost(shares);
    }

    // Total tokens locked in the market attributable to this curve.
    function totalRaised() external view returns (uint256) {
        return _integralCost(0, totalSupply);
    }

    // Called by MatchMarket after it has already pulled tokens from the buyer.
    function buy(address buyer, uint256 shares, uint256 cost) external onlyMarket {
        totalSupply      += shares;
        balanceOf[buyer] += shares;
        emit SharesBought(buyer, shares, cost);
    }

    // Called by MatchMarket. Updates share balances; market handles token transfer.
    function sell(address seller, uint256 shares) external onlyMarket returns (uint256 refund) {
        require(balanceOf[seller] >= shares, "insufficient shares");
        refund             = getSellRefund(shares);
        balanceOf[seller] -= shares;
        totalSupply        -= shares;
        emit SharesSold(seller, shares, refund);
    }

    function _integralCost(uint256 startSupply, uint256 shares) internal view returns (uint256) {
        uint256 baseCost  = basePrice * shares;
        uint256 slopeCost = slope * shares * (2 * startSupply + shares) / 2;
        return baseCost + slopeCost;
    }
}
