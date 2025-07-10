import {Disclosure, DisclosureButton, DisclosurePanel} from "@headlessui/react";
import {GiHamburgerMenu} from "react-icons/gi";
import {RxCross2, RxGithubLogo} from "react-icons/rx";
import {HiOutlineExternalLink} from "react-icons/hi";
import Image from "next/image";
import Link from "next/link";

export default function NavBar() {
    return (
        <Disclosure as="nav" className="bg-black">
            <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-8">
                <div className="relative flex h-16 items-center justify-between">
                    <div className="flex justify-between px-2 lg:px-0 w-full">
                        <div className="shrink-0 inline-flex items-center justify-center text-white">
                            <Image
                                alt="Your Company"
                                src="https://tailwindui.com/plus-assets/img/logos/mark.svg?color=indigo&shade=500"
                                className="h-8 w-auto"
                                width={32}
                                height={32}
                            />
                            <span className="px-4 bg-gradient-to-r from bg-green-200 to-emerald-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
                                Tornado Cash
                            </span>
                        </div>
                        <div className="hidden lg:ml-6 lg:block">
                            <div className="flex space-x-4">
                                {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
                                <Link
                                    href="https://github.com/Aashim-Limbu/Implementation_Tornado_cash"
                                    className="rounded-md inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <RxGithubLogo className="text-green-300 text-lg" />
                                    <span className="p-2">Github</span>
                                </Link>
                                <Link
                                    href="#"
                                    className="rounded-md inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                                >
                                    <HiOutlineExternalLink className="text-lg text-green-300" />
                                    <span className="p-2"> Visit </span>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="flex lg:hidden">
                        {/* Mobile menu button */}
                        <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:ring-2 focus:ring-white focus:outline-hidden focus:ring-inset">
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Open main menu</span>
                            <GiHamburgerMenu aria-hidden="true" className="block size-6 group-data-open:hidden" />
                            <RxCross2 aria-hidden="true" className="hidden size-6 group-data-open:block" />
                        </DisclosureButton>
                    </div>
                </div>
            </div>

            <DisclosurePanel className="lg:hidden">
                <div className="space-y-1 px-2 pt-2 pb-3">
                    {/* Current: "bg-gray-900 text-white", Default: "text-gray-300 hover:bg-gray-700 hover:text-white" */}
                    <DisclosureButton
                        as="a"
                        href="#"
                        className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                        <RxGithubLogo className="text-lg !fill-current !text-green-300" />
                        <span className="px-2 ">Github</span>
                    </DisclosureButton>
                    <DisclosureButton
                        as="a"
                        href="#"
                        className="flex items-center rounded-md px-3 py-2 text-base font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                        <HiOutlineExternalLink className="text-lg text-green-300" />
                        <span className="px-2">Link</span>
                    </DisclosureButton>
                </div>
            </DisclosurePanel>
        </Disclosure>
    );
}
