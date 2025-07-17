"use client";

import React from "react";
import {Dialog, DialogBackdrop, DialogPanel, DialogTitle} from "@headlessui/react";
import {ExclamationTriangleIcon, CheckCircleIcon} from "@heroicons/react/24/outline";

export default function Modal({
    sendTransaction,
    isLoading,
    open,
    setOpen,
    transactionHash,
    isConfirmed,
}: {
    sendTransaction: () => void;
    open: boolean;
    setOpen: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading?: boolean;
    transactionHash?: string;
    isConfirmed?: boolean;
}) {
    const getButtonText = () => {
        if (isConfirmed) return "Withdrawal Successful!";
        if (isLoading) return "Processing...";
        return "Confirm Withdrawal";
    };

    const getButtonStyles = () => {
        if (isConfirmed) {
            return "bg-green-600 text-white cursor-not-allowed";
        }
        if (isLoading) {
            return "bg-gray-400 text-gray-700 cursor-not-allowed";
        }
        return "bg-red-600 text-white hover:bg-red-700 cursor-pointer";
    };

    return (
        <Dialog open={open} onClose={() => !isLoading && setOpen(false)} className="relative z-10">
            <DialogBackdrop
                transition
                className="fixed inset-0 bg-gray-500/75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
            />

            <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                    <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                    >
                        <div className="bg-black px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-black-100 sm:mx-0 sm:size-10">
                                    {isConfirmed ? (
                                        <CheckCircleIcon aria-hidden="true" className="size-6 text-green-500" />
                                    ) : (
                                        <ExclamationTriangleIcon aria-hidden="true" className="size-6 text-red-500" />
                                    )}
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        {isConfirmed ? "Withdrawal Successful!" : "Withdrawal Confirmation"}
                                    </DialogTitle>
                                    <div className="mt-2">
                                        {isConfirmed ? (
                                            <p className="text-sm text-green-300">
                                                Your withdrawal has been processed successfully!
                                            </p>
                                        ) : isLoading ? (
                                            <p className="text-sm text-yellow-300">
                                                {transactionHash
                                                    ? "Confirming transaction..."
                                                    : "Initiating withdrawal..."}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-gray-300">
                                                Your zk-SNARK proof has been successfully generated! <br />
                                                Please click Confirm to initiate the withdrawal.
                                            </p>
                                        )}
                                    </div>

                                    {/* Show transaction hash if available */}
                                    {transactionHash && (
                                        <div className="mt-3 p-2 bg-gray-800 rounded">
                                            <p className="text-xs text-gray-400">Transaction Hash:</p>
                                            <p className="text-xs text-gray-300 font-mono break-all">
                                                {transactionHash}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="bg-black px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                            <button
                                type="button"
                                onClick={sendTransaction}
                                disabled={isLoading || isConfirmed}
                                className={`mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-xs ring-1 ring-gray-300 ring-inset sm:mt-0 transition-colors ${getButtonStyles()}`}
                            >
                                {getButtonText()}
                            </button>

                            {/* Cancel button - only show when not loading */}
                            {!isLoading && !isConfirmed && (
                                <button
                                    type="button"
                                    onClick={() => setOpen(false)}
                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-gray-600 px-3 py-2 text-sm font-semibold text-white shadow-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-700 sm:mt-0 sm:mr-3"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    );
}
