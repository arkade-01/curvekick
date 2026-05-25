import "dotenv/config";
import hardhatToolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";

const PRIVATE_KEY =
  process.env.PRIVATE_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthers],
  solidity: {
    profiles: {
      default: {
        version: "0.8.24",
      },
      production: {
        version: "0.8.24",
        settings: {
          optimizer: { enabled: true, runs: 200 },
        },
      },
    },
  },
  networks: {
    xlayer_testnet: {
      type: "http",
      url:
        process.env.XLAYER_TESTNET_RPC ?? "https://testrpc.xlayer.tech/terigon",
      chainId: 1952,
      accounts: [PRIVATE_KEY],
    },
    xlayer_mainnet: {
      type: "http",
      url: process.env.XLAYER_RPC ?? "https://rpc.xlayer.tech",
      chainId: 196,
      accounts: [PRIVATE_KEY],
    },
  },
});
