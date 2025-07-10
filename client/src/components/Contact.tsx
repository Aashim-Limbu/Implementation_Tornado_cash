import {IoLogoGithub} from "react-icons/io";
import {GrLinkedin} from "react-icons/gr";
import {RiTwitterXFill} from "react-icons/ri";
function Contact() {
    const navigation = {
        social: [
            {
                name: "GitHub",
                href: "https://github.com/Aashim-Limbu/",
                icon: <IoLogoGithub />,
            },
            {
                name: "Linkedin",
                href: "https://www.linkedin.com/in/aashimlimbu",
                icon: <GrLinkedin />,
            },
            {
                name: "Twitter",
                href: "https://x.com/Aashim_Limbu",
                icon: <RiTwitterXFill />,
            },
        ],
    };
    return (
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8 lg:py-32">
            <div className="mt-12 border-t border-white/10 pt-8 md:flex md:items-center md:justify-between">
                <div className="flex gap-x-6 md:order-2">
                    {navigation.social.map((item) => (
                        <a key={item.name} href={item.href} className="text-gray-400 hover:text-gray-300">
                            <span className="sr-only">{item.name}</span>
                            {item.icon}
                        </a>
                    ))}
                </div>
                <p className="mt-8 text-sm/6 text-gray-400 md:order-1 md:mt-0">
                    &copy; 2024 MIT License, Inc. All rights reserved.
                </p>
            </div>
        </div>
    );
}
export default Contact;
