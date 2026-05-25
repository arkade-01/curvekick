import { createConfig } from "@privy-io/wagmi";
import { defineChain } from "viem";
import { http } from "wagmi";

export const xlayerTestnet = defineChain({
  id: 1952,
  name: "X Layer Testnet",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testrpc.xlayer.tech/terigon", "https://xlayertestrpc.okx.com/terigon"] },
  },
  blockExplorers: {
    default: { name: "OKX Explorer", url: "https://www.okx.com/web3/explorer/xlayer-test" },
  },
  testnet: true,
});

export const xlayerMainnet = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: { name: "OKLink", url: "https://www.oklink.com/xlayer" },
  },
});

// @privy-io/wagmi's createConfig automatically injects Privy's connector.
export const wagmiConfig = createConfig({
  chains: [xlayerTestnet],
  transports: {
    [xlayerTestnet.id]: http(),
  },
});
