import { create } from "zustand";

export type Tokens = "ETH" | "DAI" | "";
type DepositState = {
  contractAddress: string;
  token: Tokens;
  setContractAddress: (address: string) => void;
  setToken: (type: Tokens) => void;
  reset: () => void;
};

export const useDepositStore = create<DepositState>((set) => ({
  contractAddress: "",
  token: "",
  setContractAddress: (address) => set({ contractAddress: address }),
  setToken: (type) => set({ token: type }),
  reset: () => set({ contractAddress: "", token: undefined }),
}));
