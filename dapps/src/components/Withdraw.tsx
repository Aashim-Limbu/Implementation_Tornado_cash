// Enhanced Withdraw component with transaction simulation and proper error handling

"use client";
import React, {ChangeEvent, useCallback, useState, useEffect} from "react";
import {useDropzone} from "react-dropzone";
import {Address, getAddress, isAddress} from "viem";
import * as pdfjs from "pdfjs-dist";
import type {TextItem} from "pdfjs-dist/types/src/display/api";
import {fetchLeaves} from "@/lib/indexer";
import {generateProofs} from "@/lib/zk";
import mixerAbi from "@/utils/abi.json";
import {useWaitForTransactionReceipt, useWriteContract, usePublicClient, useAccount} from "wagmi";
import {ethers} from "ethers";
import Modal from "./Modal";
import {ErrorState, ErrorType, parseContractError} from "@/utils/parseError";
import {DENOMINATION_CONTRACT_ADDRESS} from "./Deposit";

// Worker setup
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type ParsedValues = {
    nullifier: string;
    secret: string;
};

interface ProofData {
    proof: string;
    root: string;
    nullifierHash: string;
    publicRecipient: string;
}

type LoadingState =
    | "idle"
    | "parsing-pdf"
    | "generating-proof"
    | "simulating-transaction"
    | "confirming-transaction"
    | "success";

const initialState = {
    recipient: "",
    isValid: true,
    values: null as ParsedValues | null,
    proofData: null as ProofData | null,
    error: null as ErrorState | null,
    loadingState: "idle" as LoadingState,
};

export default function Withdraw({setIsLoading}: {setIsLoading: React.Dispatch<React.SetStateAction<boolean>>}) {
    const [state, setState] = useState(initialState);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [contractAddress, setContractAddress] = useState<string | null>(null);

    const publicClient = usePublicClient();
    const {address: account} = useAccount();
    const {writeContract, data: hash, error: writeError, isPending} = useWriteContract();
    const {isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError} = useWaitForTransactionReceipt({hash});

    const isLoading = state.loadingState !== "idle";
    const canGenerateProof = state.isValid && state.values && state.recipient && !isLoading;
    const canWithdraw = state.proofData && !isLoading;

    const resetForm = useCallback(() => {
        setState(initialState);
        setIsModalOpen(false);
    }, []);

    useEffect(() => {
        if (isPending) {
            setState((prev) => ({...prev, loadingState: "confirming-transaction", error: null}));
        } else if (isConfirming) {
            setState((prev) => ({...prev, loadingState: "confirming-transaction", error: null}));
        } else if (isConfirmed) {
            setState((prev) => ({...prev, loadingState: "success", error: null}));
            setIsModalOpen(false);
            setTimeout(() => {
                resetForm();
            }, 3000);
        } else if (writeError || receiptError) {
            const error = writeError || receiptError;
            const parsedError = parseContractError(error, false);
            setState((prev) => ({
                ...prev,
                loadingState: "idle",
                error: parsedError,
            }));
            setIsModalOpen(false);
        }
    }, [isPending, isConfirming, isConfirmed, writeError, receiptError, resetForm]);

    const handleRecipientChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setState((prev) => ({
            ...prev,
            recipient: value,
            isValid: value === "" || isAddress(value),
            error: null,
        }));
    }, []);

    const parsePDF = useCallback(async (file: File): Promise<ParsedValues> => {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({data: arrayBuffer}).promise;
            const page = await pdf.getPage(1);
            const textContent = await page.getTextContent();
            const fullText = textContent.items.map((item) => ("str" in item ? (item as TextItem).str : "")).join(" ");

            console.log("🔍 DEBUG: Full PDF text:", fullText);

            const idMatch = fullText.match(/id:\s*(\d+)/i);
            const nullifierMatch = fullText.match(/Nullifier:\s*(0x[a-fA-F0-9]+)/);
            const secretMatch = fullText.match(/Secret:\s*(0x[a-fA-F0-9]+)/);

            console.log("🔍 DEBUG: Extracted values:");
            console.log("  - ID:", idMatch?.[1]);
            console.log("  - Nullifier:", nullifierMatch?.[1]);
            console.log("  - Secret:", secretMatch?.[1]);

            const id = idMatch?.[1] || "";
            const nullifier = nullifierMatch?.[1] || "";
            const secret = secretMatch?.[1] || "";

            const contract = DENOMINATION_CONTRACT_ADDRESS.find((el) => el.id === Number(id))?.contractAddress;

            if (!contract) throw new Error("Cannot parse the contract");

            setContractAddress(contract);
            console.log("🔍 DEBUG: Contract address from PDF:", contract);

            if (!nullifier || !secret) {
                throw new Error("Could not find Nullifier or Secret in the document.");
            }

            return {
                nullifier,
                secret,
            };
        } catch (error) {
            console.error("🔍 DEBUG: PDF parsing error:", error);
            throw error;
        }
    }, []);

    const onDrop = useCallback(
        async (acceptedFiles: File[]) => {
            const file = acceptedFiles[0];
            if (!file || file.type !== "application/pdf") {
                setState((prev) => ({
                    ...prev,
                    error: {
                        message: "Please select a valid PDF file.",
                        type: "validation",
                    },
                }));
                return;
            }

            setState((prev) => ({
                ...prev,
                loadingState: "parsing-pdf",
                error: null,
                values: null,
            }));

            try {
                const parsedValues = await parsePDF(file);
                setState((prev) => ({
                    ...prev,
                    values: parsedValues,
                    loadingState: "idle",
                }));
            } catch (err) {
                setState((prev) => ({
                    ...prev,
                    error: {
                        message: err instanceof Error ? err.message : "Failed to parse PDF.",
                        type: "pdf-parse",
                        details: "Make sure you're using the correct deposit receipt PDF.",
                    },
                    loadingState: "idle",
                }));
            }
        },
        [parsePDF]
    );

    // Enhanced proof generation with better error handling
    const handleGenerateProof = async () => {
        if (!state.values || !state.recipient) return;

        setState((prev) => ({...prev, loadingState: "generating-proof", error: null}));

        try {
            // Validate recipient address format
            if (!isAddress(state.recipient)) {
                throw new Error("Invalid recipient address format.");
            }
            if (!contractAddress) throw new Error("Contract Address can't be parsed");

            const deposits = await fetchLeaves(contractAddress, 0, "latest");

            if (!deposits || deposits.length === 0) {
                throw new Error("No deposits found. The mixer contract may be empty or there's a network issue.");
            }

            const leaves = deposits.sort((a, b) => a.index - b.index).map((deposit) => deposit.commitment);
            setIsLoading(true);
            if (!state.proofData) {
                const result = await generateProofs({
                    nullifier: state.values.nullifier,
                    secret: state.values.secret,
                    _recipient: state.recipient,
                    leaves,
                });
                const [proof, publicInputs] = ethers.AbiCoder.defaultAbiCoder().decode(["bytes", "bytes32[]"], result);

                if (!proof || !publicInputs || publicInputs.length !== 3) {
                    throw new Error("Invalid proof format received from proof generation.");
                }

                const proofData: ProofData = {
                    proof,
                    root: publicInputs[0],
                    nullifierHash: publicInputs[1],
                    publicRecipient: publicInputs[2],
                };
                console.log("✅ ProofData: ", proofData);

                setState((prev) => ({
                    ...prev,
                    proofData,
                    loadingState: "idle",
                }));
                //Automatically simulate the transaction after proof generation
                await simulateWithdrawal(proofData);
            } else {
                await simulateWithdrawal(state.proofData);
            }
        } catch (err) {
            setState((prev) => ({
                ...prev,
                error: {
                    message: err instanceof Error ? err.message : "Failed to generate proof.",
                    type: "proof-generation",
                    details:
                        "This could be due to an invalid deposit, network issues, or the deposit not being included in the current merkle tree.",
                },
                loadingState: "idle",
            }));
        } finally {
            setIsLoading(false);
        }
    };

    // New function to simulate withdrawal transaction
    const simulateWithdrawal = useCallback(
        async (proofData: ProofData) => {
            if (!publicClient || !account || !contractAddress) {
                console.log("PUBLIC CLIENT: ", publicClient);
                console.log("Account: ", account);
                console.log("contract Address: ", contractAddress);
                setState((prev) => ({
                    ...prev,
                    error: {
                        message: "Wallet not connected or public client not available.",
                        type: "validation",
                    },
                    loadingState: "idle",
                }));
                return;
            }

            setState((prev) => ({...prev, loadingState: "simulating-transaction"}));

            try {
                const convertedRecipient = convertToAddressViem(proofData.publicRecipient);

                // Simulate the contract call
                const simulationResult = await publicClient.simulateContract({
                    address: contractAddress as Address,
                    abi: mixerAbi.abi,
                    functionName: "withdraw",
                    args: [proofData.proof, proofData.root, proofData.nullifierHash, convertedRecipient],
                    account,
                    gas: BigInt(3_000_000),
                });

                console.log("Simulation successful:", simulationResult);

                setState((prev) => ({
                    ...prev,
                    loadingState: "idle",
                    error: null,
                }));

                // Open modal after successful simulation
                setIsModalOpen(true);
            } catch (err) {
                console.error("Simulation failed:", err);
                const parsedError = parseContractError(err, true);
                setState((prev) => ({
                    ...prev,
                    error: parsedError,
                    loadingState: "idle",
                }));
            }
        },
        [publicClient, account, contractAddress]
    );

    // Enhanced withdrawal with pre-simulation validation
    const handleWithdraw = useCallback(() => {
        if (!state.proofData) return;

        try {
            // Convert and validate the recipient address
            const convertedRecipient = convertToAddressViem(state.proofData.publicRecipient);

            console.log("Executing withdrawal...");
            console.log("Recipient: ", convertedRecipient);
            console.log("Root: ", state.proofData.root);
            console.log("Nullifier Hash: ", state.proofData.nullifierHash);

            writeContract({
                address: contractAddress as Address,
                abi: mixerAbi.abi,
                functionName: "withdraw",
                args: [state.proofData.proof, state.proofData.root, state.proofData.nullifierHash, convertedRecipient],
                gas: BigInt(3_000_000),
            });
        } catch (err) {
            setState((prev) => ({
                ...prev,
                error: {
                    message: "Failed to prepare withdrawal transaction.",
                    type: "validation",
                    details: err instanceof Error ? err.message : "Unknown error occurred.",
                },
            }));
        }
    }, [state.proofData, writeContract, contractAddress]);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept: {"application/pdf": [".pdf"]},
        multiple: false,
        disabled: isLoading,
    });

    function convertToAddressViem(paddedAddress: string): string {
        try {
            const cleanAddress = "0x" + paddedAddress.slice(-40);
            return getAddress(cleanAddress as `0x${string}`);
        } catch (err) {
            throw new Error("Invalid address format in proof data.");
        }
    }

    const getLoadingMessage = () => {
        switch (state.loadingState) {
            case "parsing-pdf":
                return "Parsing PDF...";
            case "generating-proof":
                return "Generating Proof...";
            case "simulating-transaction":
                return "Validating Transaction...";
            case "confirming-transaction":
                return "Confirming Transaction...";
            case "success":
                return "Withdrawal Successful!";
            default:
                return "";
        }
    };

    const getButtonText = () => {
        if (state.loadingState === "success") return "Withdrawal Successful!";
        if (isLoading) return getLoadingMessage();
        return "Generate Proof & Validate";
    };

    const getButtonStyles = () => {
        if (state.loadingState === "success") {
            return "bg-green-600 text-white";
        }
        if (canGenerateProof && !isLoading) {
            return "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 focus:ring-4 focus:ring-purple-300";
        }
        return "bg-gray-400 text-gray-200 cursor-not-allowed";
    };

    // Enhanced error display component
    const ErrorDisplay = ({error}: {error: ErrorState}) => {
        const getErrorColor = (type: ErrorType) => {
            switch (type) {
                case "validation":
                    return "bg-yellow-50 border-yellow-200 text-yellow-800";
                case "simulation":
                    return "bg-orange-50 border-orange-200 text-orange-800";
                case "network":
                    return "bg-blue-50 border-blue-200 text-blue-800";
                case "transaction":
                    return "bg-red-50 border-red-200 text-red-800";
                default:
                    return "bg-red-50 border-red-200 text-red-800";
            }
        };

        const getErrorIcon = (type: ErrorType) => {
            switch (type) {
                case "validation":
                    return "⚠️";
                case "simulation":
                    return "🔍";
                case "network":
                    return "🌐";
                case "transaction":
                    return "❌";
                default:
                    return "❌";
            }
        };

        return (
            <div className={`border rounded-md p-3 ${getErrorColor(error.type)}`}>
                <div className="flex items-center">
                    <span className="text-lg mr-2">{getErrorIcon(error.type)}</span>
                    <p className="font-medium">{error.message}</p>
                </div>
                {error.details && <p className="text-sm mt-1 opacity-80">{error.details}</p>}
                {error.errorName && <p className="text-xs mt-1 opacity-70 font-mono">Error: {error.errorName}</p>}
                <button
                    onClick={() => setState((prev) => ({...prev, error: null}))}
                    className="text-sm underline mt-2 hover:no-underline"
                >
                    Dismiss
                </button>
            </div>
        );
    };

    return (
        <div className="py-4 flex flex-col space-y-6">
            {canWithdraw && (
                <Modal
                    sendTransaction={handleWithdraw}
                    open={isModalOpen}
                    setOpen={setIsModalOpen}
                    isLoading={isPending || isConfirming}
                    transactionHash={hash}
                    isConfirmed={isConfirmed}
                />
            )}

            <div className="w-full">
                <input
                    type="text"
                    value={state.recipient}
                    onChange={handleRecipientChange}
                    disabled={isLoading}
                    className={`bg-white w-full rounded-md p-2 text-black hover:bg-white/80 focus:outline-none border-white focus:ring-4 focus:ring-purple-500 disabled:opacity-50 ${
                        !state.isValid && "focus:ring-red-400"
                    }`}
                    placeholder="Recipient Address (0x...)"
                />
                {!state.isValid && <p className="text-red-400 text-sm mt-1">Please enter a valid Ethereum address</p>}
            </div>

            <div
                {...getRootProps()}
                className={`border-dashed border-4 p-10 text-center rounded-lg transition ${
                    isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-purple-400"
                } ${isDragActive ? "border-purple-500 bg-purple-50" : "border-gray-400"}`}
            >
                <input {...getInputProps()} />
                {isDragActive ? (
                    <p className="text-purple-600">Drop the PDF file here...</p>
                ) : state.loadingState === "parsing-pdf" ? (
                    <p className="text-blue-600">Parsing PDF...</p>
                ) : (
                    <p>Drag & drop your deposit receipt PDF here, or click to select</p>
                )}
            </div>

            {state.values && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                    <p className="text-green-800 text-sm">✓ PDF parsed successfully</p>
                    <p className="text-green-600 text-xs">Nullifier and Secret extracted from deposit receipt</p>
                </div>
            )}

            {state.proofData && state.loadingState === "idle" && !state.error && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-blue-800 text-sm">✓ Proof generated and validated successfully</p>
                    <p className="text-blue-600 text-xs">Transaction simulation passed - ready to withdraw</p>
                </div>
            )}

            {hash && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-blue-800 text-sm">Transaction Hash:</p>
                    <p className="text-blue-600 text-xs font-mono break-all">{hash}</p>
                    {isConfirming && <p className="text-yellow-600 text-sm mt-1">⏳ Confirming...</p>}
                    {isConfirmed && <p className="text-green-600 text-sm mt-1">✓ Confirmed!</p>}
                </div>
            )}

            {state.error && <ErrorDisplay error={state.error} />}

            <button
                disabled={!canGenerateProof || isLoading}
                className={`w-full mt-4 p-4 font-semibold rounded-md transition ${getButtonStyles()}`}
                onClick={handleGenerateProof}
            >
                {getButtonText()}
            </button>

            {state.loadingState === "success" && (
                <button
                    onClick={resetForm}
                    className="w-full p-2 text-purple-600 border border-purple-600 rounded-md hover:bg-purple-50 transition"
                >
                    Start New Withdrawal
                </button>
            )}
        </div>
    );
}
