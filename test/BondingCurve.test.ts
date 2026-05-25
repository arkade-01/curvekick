import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

async function deployCurve(
  marketAddress: string,
  basePrice = ethers.parseEther("0.001"),
  slope = ethers.parseEther("0.0001"),
) {
  const factory = await ethers.getContractFactory("BondingCurve");
  const curve = await factory.deploy(basePrice, slope, marketAddress);
  await curve.waitForDeployment();
  return curve;
}

describe("BondingCurve", function () {
  it("buy increases price (getBuyCost grows with supply)", async function () {
    const [market, buyer] = await ethers.getSigners();
    const curve = await deployCurve(market.address);

    const costBefore = await curve.getBuyCost(1n);

    const cost10 = await curve.getBuyCost(10n);
    await curve.connect(market).buy(buyer.address, 10n, { value: cost10 });

    const costAfter = await curve.getBuyCost(1n);
    expect(costAfter).to.be.gt(costBefore);
  });

  it("sell decreases price (getSellRefund shrinks with supply)", async function () {
    const [market, buyer] = await ethers.getSigners();
    const curve = await deployCurve(market.address);

    const cost10 = await curve.getBuyCost(10n);
    await curve.connect(market).buy(buyer.address, 10n, { value: cost10 });

    const refundAtSupply10 = await curve.getSellRefund(5n);
    await curve.connect(market).sell(buyer.address, 5n);
    const refundAtSupply5 = await curve.getSellRefund(5n);

    expect(refundAtSupply5).to.be.lt(refundAtSupply10);
  });

  it("overpayment is refunded to market", async function () {
    const [market, buyer] = await ethers.getSigners();
    const curve = await deployCurve(market.address);

    const exactCost = await curve.getBuyCost(1n);
    const overpay = exactCost + ethers.parseEther("1");

    const marketBalanceBefore = await ethers.provider.getBalance(market.address);
    const tx = await curve.connect(market).buy(buyer.address, 1n, { value: overpay });
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
    const marketBalanceAfter = await ethers.provider.getBalance(market.address);

    // market sent overpay, got back excess: net cost = exactCost + gas
    const netSpent = marketBalanceBefore - marketBalanceAfter - gasUsed;
    expect(netSpent).to.equal(exactCost);
  });

  it("cannot sell more than owned", async function () {
    const [market, buyer] = await ethers.getSigners();
    const curve = await deployCurve(market.address);

    const cost5 = await curve.getBuyCost(5n);
    await curve.connect(market).buy(buyer.address, 5n, { value: cost5 });

    await expect(curve.connect(market).sell(buyer.address, 6n)).to.be.revertedWith(
      "insufficient shares",
    );
  });

  it("sell returns correct OKB amount", async function () {
    const [market, buyer] = await ethers.getSigners();
    const curve = await deployCurve(market.address);

    const cost5 = await curve.getBuyCost(5n);
    await curve.connect(market).buy(buyer.address, 5n, { value: cost5 });

    const expectedRefund = await curve.getSellRefund(5n);
    const marketBalanceBefore = await ethers.provider.getBalance(market.address);

    const tx = await curve.connect(market).sell(buyer.address, 5n);
    const receipt = await tx.wait();
    const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
    const marketBalanceAfter = await ethers.provider.getBalance(market.address);

    const received = marketBalanceAfter - marketBalanceBefore + gasUsed;
    expect(received).to.equal(expectedRefund);
  });

  it("totalRaised reflects OKB deposited", async function () {
    const [market, buyer] = await ethers.getSigners();
    const curve = await deployCurve(market.address);

    const cost5 = await curve.getBuyCost(5n);
    await curve.connect(market).buy(buyer.address, 5n, { value: cost5 });

    expect(await curve.totalRaised()).to.equal(cost5);
  });

  it("balanceOf tracks shares correctly", async function () {
    const [market, buyer] = await ethers.getSigners();
    const curve = await deployCurve(market.address);

    const cost3 = await curve.getBuyCost(3n);
    await curve.connect(market).buy(buyer.address, 3n, { value: cost3 });
    expect(await curve.balanceOf(buyer.address)).to.equal(3n);

    await curve.connect(market).sell(buyer.address, 2n);
    expect(await curve.balanceOf(buyer.address)).to.equal(1n);
  });
});
