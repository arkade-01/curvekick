import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, xlayerTestnet } from "@/lib/wagmi";

const queryClient = new QueryClient();

export default function App({ Component, pageProps }: AppProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "clxxxxxxxxxxxxxxxxx"}
      config={{
        loginMethods: ["email", "wallet", "google", "twitter"],
        appearance: {
          theme: "dark",
          accentColor: "#00FF6A",
          logo: "https://curvekick.com/logo.png",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        defaultChain: xlayerTestnet,
        supportedChains: [xlayerTestnet],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <Component {...pageProps} />
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
