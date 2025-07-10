"use client";

import Image from "next/image";
import Ellipse from "../../public/Ellipse 9.svg";
import Money from "../../public/Money.svg";
import {motion, Variants} from "motion/react";
import {ContainerTextFlip} from "./container-text-flip";
import Link from "next/link";
export default function Hero() {
    const containerVariants = {
        hidden: {opacity: 0},
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3,
                duration: 0.5,
            },
        },
    };
    const itemVariants: Variants = {
        hidden: {y: 20, opacity: 0},
        visible: {
            y: 0,
            opacity: 1,
            transition: {type: "spring", damping: 10},
        },
    };

    return (
        <div className="bg-black">
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="relative isolate overflow-hidden"
            >
                <div
                    aria-hidden="true"
                    className="absolute inset-y-0  right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-black ring-1 shadow-xl shadow-indigo-600/10 ring-indigo-50 sm:-mr-80 lg:-mr-96"
                />
                <div className="mx-auto  max-w-7xl px-6 py-16 sm:py-32 lg:px-8">
                    <div className="max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-8 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
                        <div className="relative aspect-[4/3] mx-auto lg:mx-0 w-full lg:max-w-lg mb-16  xl:row-span-2 xl:row-end-2 bg-black z-10 lg:order-first order-last">
                            <motion.div
                                initial={{scale: 0.3, opacity: 0}}
                                animate={{scale: 0.8, opacity: 1}}
                                transition={{duration: 0.5}}
                                className="absolute inset-0 z-10"
                            >
                                <Image fill alt="Money" src={Money} />
                            </motion.div>

                            {[1.0, 0.9, 0.75, 0.5, 0.3].map((scale, i) => (
                                <motion.div
                                    key={i}
                                    initial={{opacity: 0, scale: scale}}
                                    animate={{
                                        opacity: [0.2, 0.6, 0.2],
                                    }}
                                    transition={{
                                        delay: i * 0.2,
                                        duration: 2,
                                        repeat: Infinity,
                                        repeatType: "loop",
                                        ease: "easeOut",
                                    }}
                                    className="absolute object-cover inset-0"
                                >
                                    <Image fill alt="" src={Ellipse} />
                                </motion.div>
                            ))}
                        </div>
                        <motion.h1
                            variants={itemVariants}
                            className="max-w-2xl bg-black md:bg-transparent py-2 text-5xl font-semibold tracking-tight text-balance text-white sm:text-7xl lg:col-span-2 xl:col-auto"
                        >
                            <ContainerTextFlip words={["Untracable", "Secure", "Privacy"]} />
                            <div>Crypto Transactions</div>
                        </motion.h1>
                        <motion.div
                            variants={itemVariants}
                            className="mt-6 max-w-xl col-end-2 bg-black/50 py-4 lg:mt-0 xl:col-end-1 xl:row-start-1"
                        >
                            <span className="block mt-3 text-xl text-emerald-400">Zero-Knowledge</span>
                            <p className="text-lg font-medium text-pretty text-gray-400 sm:text-xl/8">
                                Your transactions. Your privacy. No compromises.
                                <br />
                                Powered by <strong>Zero-Knowledge Proofs</strong> using <code>Poseidon hash</code> and{" "}
                                <code>Noir</code>, our mixer ensures total anonymity without needing a trusted setup. We
                                leverage PLONK-based SNARKs — fast, scalable, and secure.
                                <br />
                                <br />
                                With a simple deposit and withdrawal flow, your funds are unlinkable on-chain. The proof
                                verifies that you’re allowed to withdraw — without revealing who you are or where it
                                came from.
                                <br />
                                <br />
                                No more data leaks. No more traceable trails. Just cryptographic certainty and privacy,
                                by design.
                            </p>
                            <div className="mt-10 flex items-center gap-x-6">
                                <Link
                                    href="#"
                                    className="rounded-md bg-emerald-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                                >
                                    Secure Transaction
                                </Link>
                                <Link href="#about" className="text-sm/6 font-semibold text-white">
                                    How It Works <span aria-hidden="true">→</span>
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
                <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-linear-to-t from-black sm:h-32" />
            </motion.div>
        </div>
    );
}
