"use client";
import React from "react";
import {HoverEffect} from "./card-hover-effect";
import {motion, Variants} from "motion/react";

export default function About() {
    const aboutVariants: Variants = {
        offscreen: {y: 200, opacity: 0},
        onscreen: {
            y: 0,
            opacity: 1,
            transition: {
                duration: 2,
            },
        },
    };
    const projects = [
        {
            title: "Deposit Anonymously",
            description: `When you deposit, we generate a unique commitment using a hash of your secret and nullifier. This commitment is added to a Merkle tree stored on-chain. No one can link this deposit to your identity or wallet address.`,
        },
        {
            title: "Generate a ZK Proof",
            description: `Off-chain, you generate a zero-knowledge proof that: You know a valid commitment inside the Merkle tree. You haven’t withdrawn it before (via the nullifier). You are authorized to withdraw the funds. This proof is created using our trusted Honk ZK proving system.`,
        },
        {
            title: "Withdraw Privately",
            description: `You submit the proof and public inputs (root, nullifier hash, recipient) to the smart contract. The contract: Verifies the proof using the on-chain verifier. Ensures the nullifier hasn’t been used (prevents double-spending). Sends the funds to your chosen recipient address.`,
        },
        {
            title: "Preventing Attacks",
            description: `We enforce strict verification—proofs must match valid Merkle paths. Only the original commitment holder can produce a valid proof. Even if an attacker sees your proof, they can’t reuse it, because the nullifier is already spent.`,
        },
    ];
    return (
        <motion.div
            initial="offscreen"
            whileInView="onscreen"
            id="about"
            variants={aboutVariants}
            className="mx-auto max-w-7xl px-6 py-32 sm:pt-40 lg:px-8 text-white"
        >
            <h1 className="max-w-2xl bg-black md:bg-transparent py-2 text-5xl font-semibold tracking-tight text-balance text-white sm:text-7xl lg:col-span-2 xl:col-auto">
                How does it works ?
            </h1>
            <div className="max-w-7xl mx-auto">
                <HoverEffect items={projects} />
            </div>
        </motion.div>
    );
}
