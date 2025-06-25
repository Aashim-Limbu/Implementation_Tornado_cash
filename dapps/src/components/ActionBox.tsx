"use client";
import React, {useState} from "react";
import Dropdown from "./Dropdown";
import ProgressBar from "./Progressbar";
import Input from "./Input";

function ActionBox() {
    const [selectedIndex, setSelectedIndex] = useState(1);
    return (
        <div>
            <div className="grid grid-cols-2 p-2 border-2 border-white border-b-0">
                <button
                    className={`cursor-pointer px-4 py-2 font-semibold ${
                        selectedIndex === 1 ? "bg-indigo-600 text-white" : "bg-white text-black"
                    }`}
                    onClick={() => setSelectedIndex(1)}
                >
                    Deposit
                </button>
                <button
                    className={`cursor-pointer px-4 py-2 font-semibold ${
                        selectedIndex === 2 ? "bg-indigo-600 text-white" : "bg-white text-black"
                    }`}
                    onClick={() => setSelectedIndex(2)}
                >
                    Withdraw
                </button>
            </div>
            <div className="w-full max-w-2xl text-white p-6 border-2 border-gray-100 grid gap-y-8">
                {selectedIndex == 1 ? <DepositBox /> : <WithdrawBox />}
            </div>
        </div>
    );
}

function DepositBox() {
    return (
        <>
            <Dropdown />
            <ProgressBar />
            <button
                type="button"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
                Deposit
            </button>
        </>
    );
}

function WithdrawBox() {
    return (
        <>
            <Input label="Note:" id="1" placeholder="Enter your note" />
            <Input label="Recipient Address:" id="2" placeholder="Enter Recipient Address" />
            <button
                type="button"
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
                Withdraw
            </button>
        </>
    );
}

export default ActionBox;
