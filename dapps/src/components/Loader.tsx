import React from "react";
import {HashLoader} from "react-spinners";

export default function Loader() {
    return (
        <div className="fixed inset-0 bg-gray-500/40 flex items-center justify-center z-50">
            <HashLoader speedMultiplier={1.5} color="#483AA0" size={100} />
        </div>
    );
}
