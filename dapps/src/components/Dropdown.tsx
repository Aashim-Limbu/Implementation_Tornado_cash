"use client";
import {Tokens, useDepositStore} from "@/stores/depositStore";
import {ChevronDownIcon} from "@heroicons/react/16/solid";
import React from "react";

function Dropdown() {
    const {token, setToken} = useDepositStore();
    const options = [
        {id: 1, name: "ETH"},
        {id: 2, name: "DAI"},
    ];
    return (
        <fieldset>
            <legend className="block text-sm/6 font-medium text-white">Token: </legend>
            <div className="mt-2">
                <div className="grid grid-cols-1 focus-within:relative">
                    <select
                        id="token"
                        name="token"
                        value={token}
                        onChange={(e) => {
                            setToken(e.target.value as Tokens);
                            console.log(useDepositStore.getState().token);
                        }}
                        aria-label="Token"
                        className="col-start-1 row-start-1 w-full appearance-none rounded-t-md bg-white py-1.5 pr-10 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    >
                        <option value="" disabled>
                            Select a token
                        </option>

                        {options.map((opt) => (
                            <option key={opt.id} value={opt.name}>
                                {opt.name}
                            </option>
                        ))}
                    </select>
                    <ChevronDownIcon
                        aria-hidden="true"
                        className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4"
                    />
                </div>
            </div>
        </fieldset>
    );
}

export default Dropdown;
