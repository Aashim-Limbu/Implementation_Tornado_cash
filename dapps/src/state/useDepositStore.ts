import { create } from "zustand";
export type DENOMINATION_TYPE = {
  id: number;
  value: string;
  contractAddress: string;
};

interface DepositState {
  denomination: DENOMINATION_TYPE | null;
  tokenAddress: string;
  setTokenAddress: (address: string) => void;
  setDenomination: (denomination: DENOMINATION_TYPE) => void;
}

export const useDepositStore = create<DepositState>((set) => ({
  denomination: null,
  tokenAddress: "",
  setDenomination: (denomination) => set({ denomination }),
  setTokenAddress: (address) => set({ tokenAddress: address }),
}));
