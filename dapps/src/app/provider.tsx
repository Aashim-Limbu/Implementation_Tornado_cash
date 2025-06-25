"use client";
import React, {ReactNode} from "react";
import {WagmiProvider} from "wagmi";
import getWalletConfig from "../config";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {RainbowKitProvider} from "@rainbow-me/rainbowkit";

function Provider({children}: {children: ReactNode}) {
    const queryClient = new QueryClient();
    const config = getWalletConfig()
    return (
        <WagmiProvider config={getWalletConfig()}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>{children}</RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
}

export default Provider;
