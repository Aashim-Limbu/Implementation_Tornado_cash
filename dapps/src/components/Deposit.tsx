"use client";

import {generateCommitments} from "@/lib/zk";
import {useDepositStore} from "@/state/useDepositStore";
import {ethers} from "ethers";
import {useState} from "react";

export default function DepositSection() {
    const tokenAddress = useDepositStore((state) => state.tokenAddress);
    const setTokenAddress = useDepositStore((state) => state.setTokenAddress);

    // const contractAddress = useDepositStore((state) => state.contractAddress);
    // const setContractAddress = useDepositStore((state) => state.setContractAddress);
    const [selectedDenom, setSelectedDenom] = useState("0.01");
    async function handleClick() {
        try {
            const encoded_commitment = await generateCommitments();

            const [commitment, nullifier, secret] = ethers.AbiCoder.defaultAbiCoder().decode(
                ["bytes32", "bytes32", "bytes32"],
                encoded_commitment
            );
            

        } catch (err) {
            console.error("Error generating commitment:", err);
        }
    }

    return (
        <div className="py-4 flex flex-col space-y-6">
            <div className="flex flex-col space-y-2">
                <label className="text-white text-sm font-medium">Select Token :</label>
                <select
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    className="w-full p-3 bg-black/40 text-white rounded-md border border-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                    <option value="ETH">ETH</option>
                    <option value="DAI">DAI</option>
                </select>
            </div>

            <div className="flex flex-col space-y-2">
                <label className="text-white text-sm font-medium">Select Denomination :</label>

                <div className="w-full relative flex items-center justify-around">
                    <div className="w-full absolute -z-10 top-1/2 -translate-y-1/2 h-1 bg-gray-200" />

                    <button
                        onClick={() => setSelectedDenom("0.01")}
                        className={`w-6 h-6 rounded-full flex items-center justify-center ring-2 transition
              ${selectedDenom === "0.01" ? "bg-purple-500 ring-purple-500" : "bg-white ring-gray-400"}`}
                    >
                        {selectedDenom === "0.01" && <div className="w-2 h-2 bg-white rounded-full" />}
                    </button>

                    <button
                        onClick={() => setSelectedDenom("0.001")}
                        className={`w-6 h-6 rounded-full flex items-center justify-center ring-2 transition
              ${selectedDenom === "0.001" ? "bg-purple-500 ring-purple-500" : "bg-white ring-gray-400"}`}
                    >
                        {selectedDenom === "0.001" && <div className="w-2 h-2 bg-white rounded-full" />}
                    </button>
                </div>

                <div className="w-full flex justify-around text-white text-sm">
                    <span>0.01 ETH</span>
                    <span>0.001 ETH</span>
                </div>
            </div>

            <button
                onClick={() => handleClick()}
                className="w-full mt-4 p-4 font-semibold ring-1 ring-white rounded-md hover:bg-white hover:text-black transition"
            >
                Deposit {selectedDenom}
            </button>
        </div>
    );
}
