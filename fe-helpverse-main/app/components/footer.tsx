import { Link } from "react-router";
import { FaFacebookF, FaInstagram, FaGoogle } from "react-icons/fa";

export function Footer() {
    return (
        <footer className="bg-primary shadow-md py-4 px-4 md:px-10">
            <div className="container mx-auto">
                <div className="flex flex-col gap-6 md:flex-row md:justify-between md:items-center">
                    <Link to="/" className="flex items-center gap-2">
                        <img src="/logo-white.png" alt="logo" className="w-12 h-12" />
                        <h1 className="text-2xl font-bold text-secondary">HELPVerse</h1>
                    </Link>

                    <div className="flex flex-col gap-3 md:flex-row md:gap-8">
                        <Link to="/about" className="text-secondary hover:text-secondary/80 font-medium transition-colors">About us</Link>
                        <Link to="/faq" className="text-secondary hover:text-secondary/80 font-medium transition-colors">FAQ</Link>
                        <Link to="/contact" className="text-secondary hover:text-secondary/80 font-medium transition-colors">Contact us</Link>
                    </div>

                    <div className="flex gap-4 items-center">
                        <Link to="#" className="bg-secondary text-primary p-2 rounded-full hover:bg-secondary/90 transition-colors">
                            <FaFacebookF className="text-lg" />
                        </Link>
                        <Link to="#" className="bg-secondary text-primary p-2 rounded-full hover:bg-secondary/90 transition-colors">
                            <FaInstagram className="text-lg" />
                        </Link>
                        <Link to="#" className="bg-secondary text-primary p-2 rounded-full hover:bg-secondary/90 transition-colors">
                            <FaGoogle className="text-lg" />
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}
