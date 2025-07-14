"use client";
import dynamic from "next/dynamic";

export const DynamicRainbowProvider = dynamic(
    () => import("./wagmiProviders").then((mod) => ({default: mod.RainbowProvider})),
    {
        ssr: false,
        loading: () => <div>Loading...</div>,
    }
);
