import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router';
import { Navbar } from '~/components/navbar';
import { Footer } from '~/components/footer';
import { FaSpinner, FaCheckCircle, FaTimesCircle, FaUser, FaEnvelope, FaInfoCircle } from 'react-icons/fa';
import { eventService } from '~/services/event';
import type { Event } from '~/services/event';
import { waitingListService } from '~/services/waitingList';
import type { WaitingListInput } from '~/services/waitingList';
import { useAuth } from '~/contexts/auth';

// Interface for location state
interface LocationState {
    eventData?: {
        id: string;
        name: string;
        image: string;
    };
}

// Interface for modal
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    status: 'success' | 'error';
}

// Modal component
function Modal({ isOpen, onClose, title, message, status }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative z-10">
                <div className="text-center">
                    {status === 'success' ? (
                        <FaCheckCircle className="mx-auto text-green-500 text-5xl mb-4" />
                    ) : (
                        <FaTimesCircle className="mx-auto text-red-500 text-5xl mb-4" />
                    )}
                    <h2 className="text-xl font-bold mb-2">{title}</h2>
                    <p className="mb-6 text-gray-600">{message}</p>
                    <button
                        onClick={onClose}
                        className="bg-primary text-white py-2 px-6 rounded-md hover:bg-primary-dark"
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
}

export function meta() {
    return [
        { title: "Join Waiting List - HELPVerse" },
        { name: "description", content: "Join the waiting list for this event" },
    ];
}

export default function JoinWaitlistPage() {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // State for modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalData, setModalData] = useState({
        title: '',
        message: '',
        status: 'success' as 'success' | 'error'
    });

    // State for waiting list form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
    });

    // Get event data from location state or fetch from API
    useEffect(() => {
        const fetchEventDetail = async () => {
            try {
                setLoading(true);
                if (!id) {
                    setError('Event ID is required');
                    return;
                }

                // Check if event data exists in location state
                const state = location.state as LocationState;

                const eventData = await eventService.getEventById(id);
                setEvent(eventData);
            } catch (err) {
                console.error('Error fetching event details:', err);
                setError('Failed to load event details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetail();
    }, [id, location.state]);

    // Pre-fill form data if user is logged in
    useEffect(() => {
        if (isAuthenticated && user) {
            setFormData({
                name: user.fullName || '',
                email: user.email || '',
            });
        }
    }, [isAuthenticated, user]);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle modal close
    const handleModalClose = () => {
        setIsModalOpen(false);
        // If success, redirect to my-waiting-list page
        if (modalData.status === 'success') {
            navigate('/my-waiting-list');
        }
    };

    // Handle login redirect
    const handleLoginRedirect = () => {
        navigate('/login', { 
            state: { 
                redirectTo: `/event/${id}/join-waitlist` 
            } 
        });
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isAuthenticated) {
            // Redirect to login if not authenticated
            handleLoginRedirect();
            return;
        }

        if (!id || !event) {
            setError('Event information is missing');
            return;
        }

        try {
            setSubmitting(true);
            setError(null);

            // Waiting list data to send to API
            const waitingListData: WaitingListInput = {
                name: formData.name,
                email: formData.email,
                event: id
            };

            // Use waiting list service to register
            const result = await waitingListService.registerToWaitingList(waitingListData);

            // Handle success
            // Show success modal
            setModalData({
                title: 'Registration Successful!',
                message: 'You have been registered to the waiting list for this event. We will send a notification when tickets become available.',
                status: 'success'
            });
            setIsModalOpen(true);

        } catch (error: any) {
            console.error('Error registering to waiting list:', error);

            // Show error modal
            setModalData({
                title: 'Registration Failed',
                message: error.message || 'An error occurred during registration. Please try again.',
                status: 'error'
            });
            setIsModalOpen(true);
        } finally {
            setSubmitting(false);
        }
    };

    // Loading view
    if (loading) {
        return (
            <main>
                <Navbar />
                <div className="py-48 px-4 max-w-6xl mx-auto flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
                        <p>Loading event information...</p>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    // Error view
    if (error) {
        return (
            <main>
                <Navbar />
                <div className="py-6 md:py-28 px-4 max-w-6xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                        <Link to="/" className="block mt-2 text-red-800 font-semibold hover:underline">
                            Back to Home Page
                        </Link>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="bg-secondary min-h-screen">
            <Navbar />
            <div className="py-28 px-4 max-w-6xl mx-auto">
                <div className="mb-6">
                    <Link to={`/event/${id}`} className="text-primary font-medium flex items-center text-sm md:text-base">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Event Details
                    </Link>
                </div>

                {event && (
                    <div className="bg-secondary overflow-hidden flex flex-col items-center">
                        <div className="p-6 w-full text-center">
                            <h1 className="text-2xl font-bold mb-2 text-gray-800">Join Waiting List</h1>
                        </div>

                        <div className='flex justify-center items-center mb-8'>
                            <div className='w-[200px] h-[200px] bg-primary rounded-full flex items-center justify-center p-8'>
                                <img src="/logo-white.png" alt={event.name} className="w-full h-full object-contain" />
                            </div>
                        </div>

                        <h2 className='text-center text-xl md:text-3xl font-bold text-primary mb-12'>Join the waitlist
                            for this event!</h2>

                        {!isAuthenticated && (
                            <div className="w-full max-w-md mx-auto mb-6 bg-blue-50 border border-blue-200 rounded-md p-4 flex items-start">
                                <FaInfoCircle className="text-blue-500 mt-1 mr-3 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-blue-700 font-medium mb-1">Login Required</p>
                                    <p className="text-sm text-blue-600">
                                        You need to login first to join the waitlist for this event.
                                    </p>
                                    <button 
                                        onClick={handleLoginRedirect}
                                        className="mt-2 text-sm text-blue-700 font-medium hover:underline"
                                    >
                                        Login Now
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col md:flex-row w-full max-w-5xl mx-auto">
                            {/* Left column - Form */}
                            <div className="md:w-1/2 p-6">
                                <form onSubmit={handleSubmit} className="max-w-md mx-auto">
                                    <div className="mb-4">
                                        <label htmlFor="name" className="block text-gray-700 font-medium mb-1">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaUser className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!isAuthenticated}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500"
                                                placeholder="Enter your full name"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <label htmlFor="email" className="block text-gray-700 font-medium mb-1">
                                            Email <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <FaEnvelope className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                disabled={!isAuthenticated}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:text-gray-500"
                                                placeholder="Enter your email address"
                                            />
                                        </div>
                                        <p className="text-gray-500 text-xs mt-1">
                                            We will send notifications to this email address
                                        </p>
                                    </div>

                                    <div className="flex justify-center mt-8">
                                        <button
                                            type="submit"
                                            disabled={submitting || !isAuthenticated}
                                            className="w-full bg-primary text-white py-3 px-6 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg"
                                        >
                                            {submitting ? (
                                                <>
                                                    <FaSpinner className="animate-spin mr-2" />
                                                    Processing...
                                                </>
                                            ) : (
                                                'Join Waiting List'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Right column - Event Image */}
                            <div className="md:w-1/2 p-6 flex justify-center items-center">
                                {event.image && (
                                    <div className="max-w-md">
                                        <img
                                            src={`http://localhost:5000${event.image}`}
                                            alt={event.name}
                                            className="w-full h-auto object-contain rounded-md shadow-md"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                title={modalData.title}
                message={modalData.message}
                status={modalData.status}
            />

            <Footer />
        </main>
    );
} 