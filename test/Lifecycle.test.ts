import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

const HOME = 0n;
const DRAW = 1n;
const AWAY = 2n;

async function deployFactory(adminAddress: string) {
  const F = await ethers.getContractFactory("MarketFactory");
  const factory = await F.deploy(adminAddress, adminAddress);
  await factory.waitForDeployment();
  return factory;
}

async function getMarket(marketAddress: string) {
  return ethers.getContractAt("MatchMarket", marketAddress);
}

// ── Full lifecycle ────────────────────────────────────────────────────────────

describe("Full market lifecycle", function () {
  it("Create → buy all 3 outcomes → resolve HOME → claim → losers rejected", async function () {
    const [admin, buyer1, buyer2, buyer3] = await ethers.getSigners();

    // 1. Deploy factory (admin is also marketAdmin for tests)
    const factory = await deployFactory(admin.address);

    // 2. Create market
    const matchId   = "BRAZ-FRA-01";
    const matchTime = BigInt(Math.floor(Date.now() / 1000)) - 3600n; // 1h ago
    const tx        = await factory.connect(admin).createMarket(matchId, matchTime);
    const receipt   = await tx.wait();

    const createdEvent = receipt?.logs
      .map((l) => { try { return factory.interface.parseLog(l as any); } catch { return null; } })
      .find((e) => e?.name === "MarketCreated");
    const marketAddress = createdEvent?.args.market as string;

    const market = await getMarket(marketAddress);

    // 3. Factory stored it
    expect(await factory.getMarket(matchId)).to.equal(marketAddress);
    expect((await factory.getAllMarkets()).length).to.equal(1);

    // 4. Buy from 3 different wallets (one outcome each)
    const homeCost = await market.curves(HOME).then((addr: string) =>
      ethers.getContractAt("BondingCurve", addr).then((c) => c.getBuyCost(5n))
    );
    const drawCost = await market.curves(DRAW).then((addr: string) =>
      ethers.getContractAt("BondingCurve", addr).then((c) => c.getBuyCost(3n))
    );
    const awayCost = await market.curves(AWAY).then((addr: string) =>
      ethers.getContractAt("BondingCurve", addr).then((c) => c.getBuyCost(4n))
    );

    await market.connect(buyer1).buy(HOME, 5n, { value: homeCost });
    await market.connect(buyer2).buy(DRAW, 3n, { value: drawCost });
    await market.connect(buyer3).buy(AWAY, 4n, { value: awayCost });

    // 5. getMarketState reflects the buys
    const state = await market.getMarketState();
    expect(state.homeSupply).to.equal(5n);
    expect(state.drawSupply).to.equal(3n);
    expect(state.awaySupply).to.equal(4n);
    expect(state.isResolved).to.be.false;

    // 6. Can't buy/sell after resolve (check pre-resolve sell works)
    const homeCurve = await ethers.getContractAt("BondingCurve", await market.curves(HOME));
    expect(await homeCurve.balanceOf(buyer1.address)).to.equal(5n);

    // 7. Resolve HOME as winner
    await market.connect(admin).resolve(HOME);

    const resolvedState = await market.getMarketState();
    expect(resolvedState.isResolved).to.be.true;
    expect(resolvedState.outcome).to.equal(HOME);
    expect(await market.totalPool()).to.be.gt(0n);

    // 8. Can't buy after resolve
    await expect(market.connect(buyer1).buy(HOME, 1n, { value: homeCost })).to.be.revertedWith(
      "market resolved"
    );

    // 9. buyer1 (HOME winner) claims
    const poolBefore   = await market.totalPool();
    const balanceBefore = await ethers.provider.getBalance(buyer1.address);

    const claimTx = await market.connect(buyer1).claim();
    const claimReceipt = await claimTx.wait();
    const gasUsed = claimReceipt!.gasUsed * claimReceipt!.gasPrice;

    const balanceAfter = await ethers.provider.getBalance(buyer1.address);
    const net = balanceAfter - balanceBefore + gasUsed;

    // buyer1 holds all 5 HOME shares out of 5 total → gets entire pool
    expect(net).to.equal(poolBefore);

    // 10. Can't claim twice
    await expect(market.connect(buyer1).claim()).to.be.revertedWith("already claimed");

    // 11. DRAW holder can't claim
    await expect(market.connect(buyer2).claim()).to.be.revertedWith("no winning shares");

    // 12. AWAY holder can't claim
    await expect(market.connect(buyer3).claim()).to.be.revertedWith("no winning shares");
  });

  it("Multiple HOME winners split the pool proportionally", async function () {
    const [admin, buyer1, buyer2] = await ethers.getSigners();
    const factory = await deployFactory(admin.address);
    const matchTime = BigInt(Math.floor(Date.now() / 1000)) - 3600n;
    const tx        = await factory.connect(admin).createMarket("SPLIT-01", matchTime);
    const receipt   = await tx.wait();
    const createdEvent = receipt?.logs
      .map((l) => { try { return factory.interface.parseLog(l as any); } catch { return null; } })
      .find((e) => e?.name === "MarketCreated");
    const market = await getMarket(createdEvent?.args.market as string);

    // buyer1 buys 2 HOME, buyer2 buys 8 HOME → 20% / 80% split
    const cost2 = await (await ethers.getContractAt("BondingCurve", await market.curves(HOME))).getBuyCost(2n);
    await market.connect(buyer1).buy(HOME, 2n, { value: cost2 });

    const cost8 = await (await ethers.getContractAt("BondingCurve", await market.curves(HOME))).getBuyCost(8n);
    await market.connect(buyer2).buy(HOME, 8n, { value: cost8 });

    await market.connect(admin).resolve(HOME);
    const pool = await market.totalPool();

    await market.connect(buyer1).claim();
    await market.connect(buyer2).claim();

    // buyer1 gets 2/10 of pool, buyer2 gets 8/10 — verify via events
    const filter  = market.filters.WinnerClaimed();
    const events  = await market.queryFilter(filter);
    const payouts = Object.fromEntries(
      events.map((e) => [e.args.winner.toLowerCase(), e.args.amount])
    );

    expect(payouts[buyer1.address.toLowerCase()]).to.equal((pool * 2n) / 10n);
    expect(payouts[buyer2.address.toLowerCase()]).to.equal((pool * 8n) / 10n);
  });

  it("Cannot resolve already-resolved market", async function () {
    const [admin] = await ethers.getSigners();
    const factory  = await deployFactory(admin.address);
    const matchTime = BigInt(Math.floor(Date.now() / 1000)) - 3600n;
    const tx        = await factory.connect(admin).createMarket("DOUBLE-01", matchTime);
    const receipt   = await tx.wait();
    const createdEvent = receipt?.logs
      .map((l) => { try { return factory.interface.parseLog(l as any); } catch { return null; } })
      .find((e) => e?.name === "MarketCreated");
    const market = await getMarket(createdEvent?.args.market as string);

    await market.connect(admin).resolve(HOME);
    await expect(market.connect(admin).resolve(AWAY)).to.be.revertedWith("already resolved");
  });

  it("Non-admin cannot resolve", async function () {
    const [admin, attacker] = await ethers.getSigners();
    const factory  = await deployFactory(admin.address);
    const matchTime = BigInt(Math.floor(Date.now() / 1000)) - 3600n;
    const tx        = await factory.connect(admin).createMarket("AUTH-01", matchTime);
    const receipt   = await tx.wait();
    const createdEvent = receipt?.logs
      .map((l) => { try { return factory.interface.parseLog(l as any); } catch { return null; } })
      .find((e) => e?.name === "MarketCreated");
    const market = await getMarket(createdEvent?.args.market as string);

    await expect(market.connect(attacker).resolve(HOME)).to.be.revertedWith("not admin");
  });

  it("Duplicate matchId reverts", async function () {
    const [admin] = await ethers.getSigners();
    const factory  = await deployFactory(admin.address);
    const matchTime = BigInt(Math.floor(Date.now() / 1000)) + 86400n;
    await factory.connect(admin).createMarket("DUP-01", matchTime);
    await expect(factory.connect(admin).createMarket("DUP-01", matchTime)).to.be.revertedWith(
      "market exists"
    );
  });
});

// ── Resolver timelock ─────────────────────────────────────────────────────────

describe("Resolver", function () {
  it("resolves after matchTime + 90 min", async function () {
    const [admin] = await ethers.getSigners();

    const R = await ethers.getContractFactory("Resolver");
    const resolver = await R.deploy(admin.address);
    await resolver.waitForDeployment();

    // Market admin = resolver address
    const M = await ethers.getContractFactory("MatchMarket");
    const pastMatchTime = BigInt(Math.floor(Date.now() / 1000)) - 6000n; // 100 min ago
    const market = await M.deploy("RES-01", pastMatchTime, await resolver.getAddress());
    await market.waitForDeployment();

    await resolver.connect(admin).resolve(await market.getAddress(), HOME);
    expect((await market.getMarketState()).isResolved).to.be.true;
  });

  it("blocks resolve before matchTime + 90 min", async function () {
    const [admin] = await ethers.getSigners();

    const R = await ethers.getContractFactory("Resolver");
    const resolver = await R.deploy(admin.address);
    await resolver.waitForDeployment();

    const M = await ethers.getContractFactory("MatchMarket");
    const futureMatchTime = BigInt(Math.floor(Date.now() / 1000)) + 3600n; // 1h from now
    const market = await M.deploy("RES-02", futureMatchTime, await resolver.getAddress());
    await market.waitForDeployment();

    await expect(
      resolver.connect(admin).resolve(await market.getAddress(), HOME)
    ).to.be.revertedWith("too early");
  });
});
