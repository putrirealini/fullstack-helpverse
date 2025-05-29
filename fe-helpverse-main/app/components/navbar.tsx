import { Link, useNavigate } from "react-router";
import { FaSearch, FaUserCircle, FaBell } from "react-icons/fa";
import { useState, useRef, useEffect } from "react";
import { Logo } from "./logo";
import { useAuth } from "../contexts/auth";
import { useNotification } from "../hooks/useNotification";
import { NotificationPopover } from "./NotificationPopover";

const linksByRole = {
    user: [
        {
            to: "/my-bookings",
            label: "My Bookings",
        },
        {
            to: "/my-waiting-list",
            label: "My Waiting List",
        },
    ],
    eventOrganizer: [
        {
            to: "/my-events",
            label: "My Events",
        },
        {
            to: "/event/create",
            label: "Create Event",
        },
    ],
    admin: [
        // {
        //     to: "/admin/dashboard",
        //     label: "Admin Dashboard",
        // },
    ]
};

export function Navbar() {
    const { user, logout } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    
    // Hanya ambil notifikasi jika user adalah role 'user'
    const { 
        notifications, 
        unreadCount, 
        loading: loadingNotifications,
        markAsRead,
        deleteNotification
    } = useNotification();

    const roleLinks = user?.role && linksByRole[user.role as keyof typeof linksByRole] 
        ? linksByRole[user.role as keyof typeof linksByRole] 
        : [];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Tutup notifikasi saat menu mobile ditutup
    useEffect(() => {
        if (!isMobileMenuOpen) {
            setShowNotifications(false);
        }
    }, [isMobileMenuOpen]);

    const handleLogout = () => {
        logout();
        setShowDropdown(false);
        navigate("/");
    };
    
    // Toggle notifications
    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };
    
    // Close notifications
    const closeNotifications = () => {
        setShowNotifications(false);
    };

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        const newState = !isMobileMenuOpen;
        setIsMobileMenuOpen(newState);
        
        // If menu is closed, also close notifications
        if (!newState) {
            setShowNotifications(false);
        }
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex flex-col md:flex-row justify-between items-center px-4 md:px-10 py-4 bg-secondary">
            <div className="flex w-full md:w-auto justify-between items-center">
                <Logo />
                <button
                    className="md:hidden text-primary"
                    onClick={toggleMobileMenu}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                    </svg>
                </button>
            </div>

            <div className="relative w-full md:w-auto hidden md:block">
                <input type="text" placeholder="Search" className="rounded-md p-2 pl-10 border-2 border-primary w-full md:w-96" />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
            </div>

            <div className={`${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row w-full md:w-auto items-center mt-4 md:mt-0 gap-4`}>
                <div className="relative w-full md:w-auto md:hidden">
                    <input type="text" placeholder="Search" className="rounded-md p-2 pl-10 border-2 border-primary w-full md:w-96" />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary" />
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center w-full md:w-auto mt-4 md:mt-0">
                    {user ? (
                        <>
                            {/* Notification Button (only for users) - Display at top for mobile */}
                            {user.role === 'user' && (
                                <div className="relative order-first md:order-none w-full md:w-auto flex justify-center md:block mb-4 md:mb-0">
                                    <button
                                        onClick={toggleNotifications}
                                        className="text-primary hover:opacity-80 relative"
                                        aria-label="Notifications"
                                    >
                                        <FaBell size={24} />
                                        {unreadCount > 0 && (
                                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                                {unreadCount > 9 ? '9+' : unreadCount}
                                            </span>
                                        )}
                                    </button>
                                    
                                    {/* Notification Popover */}
                                    <NotificationPopover 
                                        notifications={notifications}
                                        loading={loadingNotifications}
                                        isOpen={showNotifications}
                                        onClose={closeNotifications}
                                        onMarkAsRead={markAsRead}
                                        onDelete={deleteNotification}
                                    />
                                </div>
                            )}
                            
                            {/* Menu berdasarkan role */}
                            <div className="w-full md:w-auto flex flex-col md:flex-row items-center gap-4">
                                {roleLinks.map((link) => (
                                    <Link 
                                        key={link.to} 
                                        to={link.to} 
                                        className="text-primary hover:underline w-full md:w-auto text-center"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                            
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    className="text-primary hover:opacity-80"
                                >
                                    <FaUserCircle size={24} />
                                </button>
                                {showDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                            Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-primary hover:underline">Login</Link>
                            <Link to="/register" className="text-primary hover:underline">Register</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
