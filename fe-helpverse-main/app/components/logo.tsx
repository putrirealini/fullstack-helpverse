import { Link } from "react-router";


export function Logo() {
    return (
        <Link to="/" className="flex items-center gap-2">
            <img src="/logo-blue.png" alt="logo" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-primary">HELPVerse</h1>
        </Link>
    );
}
