"use client"
import { ConnectButton } from "@rainbow-me/rainbowkit";

function Navbar() {
  return (
    <div className="w-full bg-black text-white">
        <nav className="w-full max-w-7xl p-2 flex mx-auto justify-between items-center" >
        <div>Mixer Cash</div>
        <ConnectButton label="Connect Wallet"/>
        </nav>
    </div>
  )
}

export default Navbar
