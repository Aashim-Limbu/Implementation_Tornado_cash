"use client";
import {useDepositStore} from "@/stores/depositStore";
import {CheckIcon} from "@heroicons/react/20/solid";
import {useState} from "react";

const steps = [
    {name: "0.01 ETH", contractAddress: "contractA"},
    {name: "0.1 ETH", contractAddress: "contractB"},
];

export default function ProgressBar() {
    const {contractAddress, setContractAddress} = useDepositStore();
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    const handleClick = (index: number) => {
        setSelectedIndex(index);
        setContractAddress(steps[index].contractAddress);
        console.log(useDepositStore.getState().contractAddress);
    };

    return (
        <nav aria-label="Progress">
            <div className="font-semibold py-4">Amount: </div>

            <ol role="list" className="flex items-center relative justify-around">
                <div aria-hidden="true" className="absolute inset-0 flex items-center">
                    <div className="h-0.5 w-full bg-indigo-600" />
                </div>

                {steps.map((step, stepIdx) => (
                    <li key={stepIdx} className="z-10">
                        {selectedIndex === stepIdx ? (
                            <div
                                className="relative flex size-8 items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-900 cursor-pointer"
                                onClick={() => handleClick(stepIdx)}
                            >
                                <CheckIcon aria-hidden="true" className="size-5 text-white" />
                                <span className="sr-only">{step.name}</span>
                            </div>
                        ) : (
                            <div
                                className="group relative flex size-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white hover:border-gray-400 cursor-pointer"
                                onClick={() => handleClick(stepIdx)}
                            >
                                <span
                                    aria-hidden="true"
                                    className="size-2.5 rounded-full bg-transparent group-hover:bg-gray-300"
                                />
                                <span className="sr-only">{step.name}</span>
                            </div>
                        )}
                    </li>
                ))}
            </ol>

            <div className="w-full flex justify-around mt-2 text-sm font-medium">
                {steps.map((step, idx) => (
                    <div key={idx} className={selectedIndex === idx ? "text-indigo-600" : "text-gray-500"}>
                        {step.name}
                    </div>
                ))}
            </div>
        </nav>
    );
}
