import About from "@/components/About";
import Contact from "@/components/Contact";
import Hero from "@/components/Hero";
import NavBar from "@/components/Navbar";

export default function Home() {
    return (
        <>
            <NavBar />
            <Hero />
            <About />
            <Contact />
        </>
    );
}
