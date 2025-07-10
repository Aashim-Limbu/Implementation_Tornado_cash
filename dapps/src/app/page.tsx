"use client";
import DepositSection from "@/components/Deposit";
import {useState} from "react";

export default function Home() {
    const [isActive, setIsActive] = useState(1);
    function handleClick(id: number) {
        setIsActive(id);
    }
    return (
        <section className="w-full h-dvh">
            <div className="w-full grid grid-cols-2 py-30 max-w-7xl mx-auto">
                <div className="w-full">
                    <ul className="w-full flex p-1 rounded-md ring-2 ring-white font-semibold">
                        <li
                            onClick={() => handleClick(1)}
                            className={`w-full p-4 inline-flex justify-center rounded-md ${
                                isActive == 1 ? "bg-white text-black" : ""
                            } `}
                        >
                            Deposit
                        </li>
                        <li
                            onClick={() => handleClick(2)}
                            className={`w-full p-4 inline-flex justify-center rounded-md ${
                                isActive == 2 ? "bg-white text-black" : ""
                            } `}
                        >
                            Withdraw
                        </li>
                    </ul>
                    <div className="w-full space-y-6 p-6 bg-white/10 backdrop-blur-md mt-2 border border-white/20 rounded-xl">
                        <DepositSection />
                    </div>
                </div>

                <div></div>
            </div>
        </section>
    );
}
