"use client";

import {ConnectButton} from "@rainbow-me/rainbowkit";

export default function Navbar() {
    return (
        <div className="w-full p-4 fixed top-0">
            <div
                className="w-full flex justify-between items-center max-w-7xl mx-auto
                bg-white/10 backdrop-blur-md border border-white/20
                rounded-xl px-6 py-3 shadow-md"
            >
                <div className="text-white font-semibold text-lg">Tornado Cash</div>
                <ConnectButton chainStatus="icon" showBalance={false} />
            </div>
        </div>
    );
}
