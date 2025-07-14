"use client";
import React, {ChangeEvent, useCallback, useState} from "react";
import {useDropzone} from "react-dropzone";
import {isAddress} from "viem";
import * as pdfjs from "pdfjs-dist";
import type {TextItem} from "pdfjs-dist/types/src/display/api";

// Worker setup (only needed if you are not using bundler magic)
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

type ParsedValues = {
    nullifier: string;
    secret: string;
};

export default function Withdraw() {
    const [input, setInput] = useState("");
    const [isValid, setIsValid] = useState(true);

    const [values, setValues] = useState<ParsedValues | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file || file.type !== "application/pdf") return;

        setLoading(true);
        setError(null);
        setValues(null);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjs.getDocument({data: arrayBuffer}).promise;

            let fullText = "";

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();

                const pageText = textContent.items
                .map((item) => ("str" in item ? (item as TextItem).str : ""))
                .join(" ");

                fullText += pageText + "\n";
            }

            const nullifierMatch = fullText.match(/Nullifier:\s*(0x[a-fA-F0-9]+)/);
            const secretMatch = fullText.match(/Secret:\s*(0x[a-fA-F0-9]+)/);

            const nullifier = nullifierMatch?.[1] || "";
            const secret = secretMatch?.[1] || "";

            if (!nullifier || !secret) {
                throw new Error("Could not find Nullifier or Secret in the document.");
            }

            setValues({nullifier, secret});
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Failed to parse PDF.");
            }
            console.error("PDF parsing error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept: {
            "application/pdf": [".pdf"],
        },
        multiple: false,
    });

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        setInput(value);
        setIsValid(isAddress(value));
    }

    return (
        <div className="py-4 flex flex-col space-y-6">
            <div className="w-full">
                <input
                    type="text"
                    value={input}
                    onChange={handleChange}
                    className={`bg-white w-full rounded-md p-2 text-black hover:bg-white/80 focus:outline-none border-white focus:ring-4 focus:ring-purple-500 ${
                        !isValid && "focus:ring-red-400"
                    }`}
                    placeholder="Recipient Address"
                />
                {!isValid && <p className="text-red-400">Address is not valid</p>}
            </div>

            <div
                {...getRootProps()}
                className={`border-dashed border-4 p-10 text-center rounded-lg transition ${
                    loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
            >
                <input {...getInputProps()} disabled={loading} />
                {isDragActive ? (
                    <p>Drop the PDF file here...</p>
                ) : loading ? (
                    <p>Parsing PDF...</p>
                ) : (
                    <p>Drag n drop a PDF file here, or click to select</p>
                )}
            </div>

            {error && <p className="text-red-500 font-medium text-sm">Error: {error}</p>}

            {values && (
                <div className="bg-white/10 border border-white/20 p-4 rounded-md text-sm space-y-2">
                    <p>
                        <strong>Nullifier:</strong> {values.nullifier}
                    </p>
                    <p>
                        <strong>Secret:</strong> {values.secret}
                    </p>
                </div>
            )}

            <button
                disabled={!isValid || loading}
                className={`w-full mt-4 p-4 font-semibold rounded-md transition
        ${
            isValid && !loading
                ? "bg-purple-600 text-white hover:bg-purple-700 active:bg-purple-800 focus:ring-4 focus:ring-purple-300"
                : "bg-gray-400 text-gray-200 cursor-not-allowed"
        }`}
            >
                {loading ? "Parsing..." : "Generate Proof"}
            </button>
        </div>
    );
}
