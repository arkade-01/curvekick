// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./BondingCurve.sol";

/**
 * One prediction market for a single football match.
 * Deploys 3 BondingCurve instances (HOME=0, DRAW=1, AWAY=2).
 * All token balances are held here; curves only track share accounting.
 *
 * ERC20 flow:
 *   buy  — caller approves this contract, then calls buy(). Market pulls exact cost.
 *   sell — no approval needed. Market pushes refund to seller.
 *   claim — winners call after resolution. Market pushes payout.
 */
contract MatchMarket {
    using SafeERC20 for IERC20;

    uint8 private constant HOME = 0;
    uint8 private constant DRAW = 1;
    uint8 private constant AWAY = 2;

    // Priced in token decimals (1e18 = 1 token unit).
    // BASE_PRICE = 0.01 CKUSD,  SLOPE = 0.001 CKUSD per share of supply.
    uint256 private constant BASE_PRICE = 0.01  * 1e18;
    uint256 private constant SLOPE      = 0.001 * 1e18;

    IERC20          public immutable token;
    BondingCurve[3] public curves;
    address         public admin;
    string          public matchId;
    uint256         public matchTime;

    bool    public resolved;
    uint8   public resolvedOutcome;
    uint256 public totalPool;

    mapping(address => bool) public claimed;

    event MarketResolved(uint8 indexed outcome, uint256 totalPool);
    event WinnerClaimed(address indexed winner, uint256 amount);

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    constructor(string memory _matchId, uint256 _matchTime, address _admin, address _token) {
        matchId   = _matchId;
        matchTime = _matchTime;
        admin     = _admin;
        token     = IERC20(_token);
        curves[HOME] = new BondingCurve(BASE_PRICE, SLOPE, address(this));
        curves[DRAW] = new BondingCurve(BASE_PRICE, SLOPE, address(this));
        curves[AWAY] = new BondingCurve(BASE_PRICE, SLOPE, address(this));
    }

    /**
     * Buy `shares` of `outcome`.
     * Caller must have approved at least `maxCost` tokens to this contract.
     * Reverts if cost > maxCost (slippage guard).
     */
    function buy(uint8 outcome, uint256 shares, uint256 maxCost) external {
        require(outcome < 3,   "invalid outcome");
        require(!resolved,     "market resolved");
        require(shares > 0,    "zero shares");

        uint256 cost = curves[outcome].getBuyCost(shares);
        require(cost <= maxCost, "slippage exceeded");

        token.safeTransferFrom(msg.sender, address(this), cost);
        curves[outcome].buy(msg.sender, shares, cost);
    }

    function sell(uint8 outcome, uint256 shares) external {
        require(outcome < 3, "invalid outcome");
        require(!resolved,   "market resolved");
        require(shares > 0,  "zero shares");

        uint256 refund = curves[outcome].sell(msg.sender, shares);
        token.safeTransfer(msg.sender, refund);
    }

    // onlyAdmin — in production this is the Resolver contract.
    function resolve(uint8 outcome) external onlyAdmin {
        require(outcome < 3, "invalid outcome");
        require(!resolved,   "already resolved");

        resolved        = true;
        resolvedOutcome = outcome;
        totalPool       = token.balanceOf(address(this));

        emit MarketResolved(outcome, totalPool);
    }

    function claim() external {
        require(resolved,            "not resolved");
        require(!claimed[msg.sender], "already claimed");

        BondingCurve winningCurve = curves[resolvedOutcome];
        uint256 userShares    = winningCurve.balanceOf(msg.sender);
        uint256 winningSupply = winningCurve.totalSupply();
        require(userShares > 0, "no winning shares");

        claimed[msg.sender] = true;
        uint256 payout = (userShares * totalPool) / winningSupply;
        token.safeTransfer(msg.sender, payout);

        emit WinnerClaimed(msg.sender, payout);
    }

    function getMarketState() external view returns (
        uint256 homePrice,  uint256 homeSupply,
        uint256 drawPrice,  uint256 drawSupply,
        uint256 awayPrice,  uint256 awaySupply,
        bool    isResolved, uint8   outcome
    ) {
        homePrice  = curves[HOME].getBuyCost(1);
        homeSupply = curves[HOME].totalSupply();
        drawPrice  = curves[DRAW].getBuyCost(1);
        drawSupply = curves[DRAW].totalSupply();
        awayPrice  = curves[AWAY].getBuyCost(1);
        awaySupply = curves[AWAY].totalSupply();
        isResolved = resolved;
        outcome    = resolvedOutcome;
    }
}
