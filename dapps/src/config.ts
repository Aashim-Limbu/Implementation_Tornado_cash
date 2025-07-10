import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, zksyncSepoliaTestnet } from "wagmi/chains";

let _config: ReturnType<typeof getDefaultConfig> | null = null;

export const getWagmiConfig = () => {
  if (!_config) {
    _config = getDefaultConfig({
      appName: "Tornado cash implementation",
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
      chains: [sepolia, zksyncSepoliaTestnet],
    });
  }
  return _config;
};
