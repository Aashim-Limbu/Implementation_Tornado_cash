"use client";
import {getWagmiConfig} from "@/config";
import {RainbowKitProvider} from "@rainbow-me/rainbowkit";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {ReactNode} from "react";
import {WagmiProvider} from "wagmi";
import Navbar from "../Navbar";

const queryClient = new QueryClient();
const config = getWagmiConfig();

export const RainbowProvider = ({children}: {children: ReactNode}) => {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider modalSize="compact">
                    <Navbar />
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
};
