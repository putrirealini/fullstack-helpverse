import { useState } from "react";


export function Hero() {
    const [userRole, setUserRole] = useState<"user" | "eventOrganizer" | "admin" | null>(null);
    return (
        <div className="bg-secondary py-24 md:py-36 px-4 md:px-20">
            <div className="flex flex-col md:items-center md:justify-center md:flex-row">
                {userRole === "admin" && (
                    <h1 className="md:text-6xl text-4xl font-bold text-primary max-w-3xl text-center md:text-left">Hello! This is Admin Home Page</h1>
                )}
                {userRole === "eventOrganizer" && (
                    <h1 className="md:text-6xl text-4xl font-bold text-primary max-w-3xl text-center md:text-left">Hello! This is Event Organizer Home Page</h1>
                )}
                {userRole === "user" && (
                    <h1 className="md:text-6xl text-4xl font-bold text-primary max-w-3xl text-center md:text-left">Your Ticket to Unforgettable Moments!</h1>
                )}
                {userRole === null && (
                    <h1 className="md:text-6xl text-4xl font-bold text-primary max-w-3xl text-center md:text-left">Your Ticket to Unforgettable Moments!</h1>
                )}

                <div className="flex justify-center items-center md:h-[300px] md:w-[300px] h-[200px] w-[200px] rounded-full bg-primary">
                    <img src="/logo-white.png" alt="hero-image" className="h-40 w-40 object-cover" />
                </div>
            </div>
        </div>
    );
}
