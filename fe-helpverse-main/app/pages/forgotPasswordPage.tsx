import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../contexts/auth";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function ChangePasswordPage() {
    const [formData, setFormData] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        // Redirect to login page if not authenticated
        if (!isAuthenticated) {
            navigate("/login", { 
                replace: true,
                state: { redirectTo: "/change-password" }
            });
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const togglePasswordVisibility = (field: 'oldPassword' | 'newPassword' | 'confirmPassword') => {
        if (field === 'oldPassword') {
            setShowOldPassword(!showOldPassword);
        } else if (field === 'newPassword') {
            setShowNewPassword(!showNewPassword);
        } else {
            setShowConfirmPassword(!showConfirmPassword);
        }
    };

    const validateForm = () => {
        if (formData.newPassword !== formData.confirmPassword) {
            setError("New password and confirmation do not match");
            return false;
        }
        
        if (formData.newPassword.length < 8) {
            setError("New password must be at least 8 characters");
            return false;
        }
        
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            const response = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({
                    currentPassword: formData.oldPassword,
                    newPassword: formData.newPassword
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to change password');
            }
            
            const data = await response.json();
            
            // Update token if a new token is provided
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            
            // Show success message
            setSuccess(true);
            // Reset form
            setFormData({
                oldPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to change password. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // If not authenticated, show a message (this will be briefly visible before redirect)
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                    <div className="text-center">
                        <img src="/logo-blue.png" alt="HELPVerse Logo" className="mx-auto h-16 w-16" />
                        <h2 className="mt-6 text-3xl font-extrabold text-primary">Authentication Required</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            You must be logged in to change your password
                        </p>
                        <div className="mt-6">
                            <Link to="/login" className="font-medium text-primary hover:text-primary/80">
                                Go to Login Page
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
                <div className="text-center">
                    <img src="/logo-blue.png" alt="HELPVerse Logo" className="mx-auto h-16 w-16" />
                    <h2 className="mt-6 text-3xl font-extrabold text-primary">Change Password</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Update your account password
                    </p>
                </div>
                
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}
                
                {success ? (
                    <div className="mt-8 space-y-6">
                        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded relative" role="alert">
                            <p className="font-medium">Password successfully changed!</p>
                            <p className="text-sm mt-2">
                                Your password has been updated. You can now use your new password to log in.
                            </p>
                        </div>
                        <div className="text-center mt-6">
                            <Link to="/" className="font-medium text-primary hover:text-primary/80">
                                Return to Home
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="rounded-md -space-y-px">
                            <div className="mb-4">
                                <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="oldPassword"
                                        name="oldPassword"
                                        type={showOldPassword ? "text" : "password"}
                                        required
                                        value={formData.oldPassword}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                        placeholder="Enter your current password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => togglePasswordVisibility('oldPassword')}
                                    >
                                        {showOldPassword ? (
                                            <FaEyeSlash className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <FaEye className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="newPassword"
                                        name="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        required
                                        value={formData.newPassword}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => togglePasswordVisibility('newPassword')}
                                    >
                                        {showNewPassword ? (
                                            <FaEyeSlash className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <FaEye className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                                        placeholder="Confirm your new password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => togglePasswordVisibility('confirmPassword')}
                                    >
                                        {showConfirmPassword ? (
                                            <FaEyeSlash className="h-5 w-5 text-gray-400" />
                                        ) : (
                                            <FaEye className="h-5 w-5 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-primary/60 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? "Updating..." : "Update Password"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
} 