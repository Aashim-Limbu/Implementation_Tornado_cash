import { Chain, getDefaultConfig } from "@rainbow-me/rainbowkit";
import { sepolia, zksyncSepoliaTestnet } from "wagmi/chains";

let _config: ReturnType<typeof getDefaultConfig> | null = null;
const anvil: Chain = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["http://127.0.0.1:8545"] },
  },
  testnet: true,
};

export const getWagmiConfig = () => {
  if (!_config) {
    _config = getDefaultConfig({
      appName: "Tornado cash implementation",
      projectId: process.env.NEXT_PUBLIC_PROJECT_ID!,
      chains: [anvil, sepolia, zksyncSepoliaTestnet],
      ssr: true,
    });
  }
  return _config;
};
