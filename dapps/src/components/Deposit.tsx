"use client";

import {Address, parseEther} from "viem";
import createPDF from "@/utils/createPdf";
import {useWriteContract, useWaitForTransactionReceipt} from "wagmi";
import {generateCommitments} from "@/lib/zk";
import {DENOMINATION_TYPE, useDepositStore} from "@/state/useDepositStore";
import {useState, useEffect} from "react";
import mixer from "@/utils/abi.json";
import {ethers} from "ethers";

export const DENOMINATION_CONTRACT_ADDRESS: DENOMINATION_TYPE[] = [
    {id: 1, value: "0.001", contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_1!},
    {id: 2, value: "0.01", contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS_2!},
];

type LoadingState = "idle" | "generating-commitment" | "submitting-transaction" | "confirming-transaction" | "success";

export default function DepositSection() {
    const {data: hash, isPending, writeContract, error: writeError, reset} = useWriteContract();
    const {
        isLoading: isConfirming,
        isSuccess: isConfirmed,
        error: receiptError,
    } = useWaitForTransactionReceipt({
        hash,
    });

    const tokenAddress = useDepositStore((state) => state.tokenAddress);
    const setTokenAddress = useDepositStore((state) => state.setTokenAddress);
    const deno = useDepositStore((state) => state.denomination);
    const setDenomination = useDepositStore((state) => state.setDenomination);

    const [commit, setCommit] = useState<null | string>(null);
    const [loadingState, setLoadingState] = useState<LoadingState>("idle");
    const [error, setError] = useState<string | null>(null);

    // Handle transaction states
    useEffect(() => {
        if (isPending) {
            setLoadingState("submitting-transaction");
            setError(null);
        } else if (isConfirming) {
            setLoadingState("confirming-transaction");
        } else if (isConfirmed) {
            setLoadingState("success");
            setError(null);
            // Reset after 3 seconds
            setTimeout(() => {
                resetForm();
            }, 3000);
        } else if (writeError || receiptError) {
            setLoadingState("idle");
            const errorMessage = writeError?.message || receiptError?.message || "Transaction failed";
            setError(errorMessage);
        }
    }, [isPending, isConfirming, isConfirmed, writeError, receiptError]);

    const resetForm = () => {
        setCommit(null);
        setLoadingState("idle");
        setError(null);
        reset(); // Reset wagmi contract write state
    };

    async function handleGenerateCommitment() {
        if (!deno) return;

        setLoadingState("generating-commitment");
        setError(null);

        try {
            const encoded_commitment = await generateCommitments();

            const [commitment, nullifier, secret] = ethers.AbiCoder.defaultAbiCoder().decode(
                ["bytes32", "bytes32", "bytes32"],
                encoded_commitment
            );

            setCommit(commitment);

            // Generate and download PDF
            const blob = await createPDF(deno.id, nullifier, secret);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "zk-commitment.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            setLoadingState("idle");
        } catch (err) {
            console.error("Error generating commitment:", err);
            setError(`Failed to generate commitment: ${err instanceof Error ? err.message : "Unknown error"}`);
            setLoadingState("idle");
        }
    }

    async function handleDeposit() {
        if (!deno || !commit) return;

        setError(null);

        try {
            console.log("Writing contract with:");
            console.log("- Value:", parseEther(deno.value).toString());
            console.log("- Contract Address:", deno.contractAddress);
            console.log("- Commitment:", commit);

            writeContract({
                address: deno.contractAddress as Address,
                abi: mixer.abi,
                functionName: "deposit",
                args: [commit],
                value: parseEther(deno.value),
            });
        } catch (error) {
            console.error("Deposit failed:", error);
            setError(`Deposit preparation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }

    const isLoading = loadingState !== "idle";
    const canGenerateCommitment = deno && !isLoading;
    const canDeposit = commit && !isLoading;

    const getButtonText = () => {
        switch (loadingState) {
            case "generating-commitment":
                return "Generating Commitment...";
            case "submitting-transaction":
                return "Submitting Transaction...";
            case "confirming-transaction":
                return "Confirming Transaction...";
            case "success":
                return "Deposit Successful!";
            default:
                if (!commit) return "Generate Commitment";
                return `Deposit ${deno?.value} ${tokenAddress}`;
        }
    };

    const getButtonStyles = () => {
        if (loadingState === "success") {
            return "bg-green-600 text-white";
        }
        if (isLoading) {
            return "bg-gray-500 text-white cursor-not-allowed";
        }
        if ((canGenerateCommitment && !commit) || canDeposit) {
            return "ring-white hover:bg-white hover:text-black";
        }
        return "bg-gray-400 text-gray-200 cursor-not-allowed";
    };

    return (
        <div className="py-4 flex flex-col space-y-6">
            <div className="flex flex-col space-y-2">
                <label className="text-white text-sm font-medium">Select Token :</label>
                <select
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    disabled={isLoading}
                    className="w-full p-3 bg-black/40 text-white rounded-md border border-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
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
                            disabled={isLoading}
                            className={`w-6 h-6 rounded-full flex items-center justify-center ring-2 transition disabled:opacity-50
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

            {/* Transaction Hash Display */}
            {hash && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-blue-800 text-sm">Transaction Hash:</p>
                    <p className="text-blue-600 text-xs font-mono break-all">{hash}</p>
                    {isConfirming && <p className="text-yellow-600 text-sm mt-1">⏳ Confirming...</p>}
                    {isConfirmed && <p className="text-green-600 text-sm mt-1">✓ Confirmed!</p>}
                </div>
            )}

            {/* Success Message */}
            {commit && !error && loadingState === "idle" && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-green-800 text-sm">✓ Commitment generated successfully</p>
                    <p className="text-green-600 text-xs">PDF downloaded - ready to deposit</p>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-800 text-sm">❌ {error}</p>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-600 text-xs underline hover:no-underline mt-1"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            <button
                onClick={!commit ? handleGenerateCommitment : handleDeposit}
                disabled={(!canGenerateCommitment && !canDeposit) || isLoading}
                className={`w-full mt-4 p-4 font-semibold ring-1 rounded-md transition ${getButtonStyles()}`}
            >
                {getButtonText()}
            </button>

            {loadingState === "success" && (
                <button
                    onClick={resetForm}
                    className="w-full p-2 text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50 transition"
                >
                    Start New Deposit
                </button>
            )}
        </div>
    );
}
