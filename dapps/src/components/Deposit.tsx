"use client";

import {parseEther} from "viem";
import createPDF from "@/utils/createPdf";
import {useWriteContract} from "wagmi";
import {generateCommitments} from "@/lib/zk";
import {DENOMINATION_TYPE, useDepositStore} from "@/state/useDepositStore";
import {useState} from "react";
import mixer from "@/utils/abi.json";
import {ethers} from "ethers";

const DENOMINATION_CONTRACT_ADDRESS: DENOMINATION_TYPE[] = [
    {id: 1, value: "0.001", contractAddress: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"},
    {id: 2, value: "0.01", contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!},
];
export default function DepositSection() {
    const {data: hash, isSuccess, isPending, writeContract} = useWriteContract();
    const tokenAddress = useDepositStore((state) => state.tokenAddress);
    const setTokenAddress = useDepositStore((state) => state.setTokenAddress);
    const deno = useDepositStore((state) => state.denomination);
    const setDenomination = useDepositStore((state) => state.setDenomination);
    const [commit, setCommit] = useState<null | string>(null);
    async function handleGenerateCommitment() {
        try {
            const encoded_commitment = await generateCommitments();

            const [commitment, nullifier, secret] = ethers.AbiCoder.defaultAbiCoder().decode(
                ["bytes32", "bytes32", "bytes32"],
                encoded_commitment
            );
            setCommit(commitment);
            const blob = await createPDF(nullifier, secret);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "zk-commitment.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Error generating commitment:", err);
        }
    }

    async function handleDeposit() {
        if (!deno) return;
        try {
            console.log("writing contract: ", commit, parseEther(deno.value));
            writeContract({
                address: "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0",
                abi: mixer.abi,
                functionName: "deposit",
                args: [commit],
                value: parseEther(deno.value),
            });
        } catch (error) {
            console.error("Deposit failed:", error);
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

                    {DENOMINATION_CONTRACT_ADDRESS.map((denomination, index) => (
                        <button
                            key={index}
                            onClick={() => setDenomination(denomination)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center ring-2 transition
              ${deno?.value === denomination.value ? "bg-purple-500 ring-purple-500" : "bg-white ring-gray-400"}`}
                        >
                            {denomination.value === deno?.value && <div className="w-2 h-2 bg-white rounded-full" />}
                        </button>
                    ))}
                </div>

                <div className="w-full flex justify-around text-white text-sm">
                    <span>0.001 ETH</span>
                    <span>0.01 ETH</span>
                </div>
            </div>

            {!commit ? (
                <button
                    onClick={handleGenerateCommitment}
                    className="w-full mt-4 p-4 font-semibold ring-1 ring-white rounded-md hover:bg-white hover:text-black transition"
                >
                    Generate Commitment
                </button>
            ) : (
                <button
                    onClick={handleDeposit}
                    disabled={isPending}
                    className={`w-full mt-4 p-4 font-semibold ring-1 rounded-md transition ${
                        isPending ? "bg-gray-500 cursor-not-allowed" : "ring-white hover:bg-white hover:text-black"
                    }`}
                >
                    {isPending ? "Processing..." : `Deposit ${deno?.value} ${tokenAddress}`}
                </button>
            )}

            {isSuccess && <p className="text-green-500">Deposit confirmed! TX: {hash?.slice(0, 12)}...</p>}
        </div>
    );
}
