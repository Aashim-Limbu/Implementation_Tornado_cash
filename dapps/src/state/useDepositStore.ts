import { create } from "zustand";

interface DepositState {
  contractAddress: string;
  tokenAddress: string;
  setContractAddress: (address: string) => void;
  setTokenAddress: (address: string) => void;
}

export const useDepositStore = create<DepositState>((set) => ({
  contractAddress: "",
  tokenAddress: "",
  setContractAddress: (address) => set({ contractAddress: address }),
  setTokenAddress: (address) => set({ tokenAddress: address }),
}));
