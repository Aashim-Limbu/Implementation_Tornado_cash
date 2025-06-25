import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, zksyncSepoliaTestnet } from "wagmi/chains";

declare global {
  var _walletConfig: ReturnType<typeof getDefaultConfig> | undefined;
}

export default function getWalletConfig() {
  if (!process.env.NEXT_PUBLIC_PROJECT_ID || !process.env.NEXT_PUBLIC_RPC_URL) {
    throw new Error("Missing env vars");
  }

  if (!global._walletConfig) {
    global._walletConfig = getDefaultConfig({
      appName: "Mixer App",
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID,
      chains: [sepolia, zksyncSepoliaTestnet],
      ssr: true,
    });
  }

  return global._walletConfig;
}
