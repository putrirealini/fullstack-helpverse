import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Navbar } from '~/components/navbar';
import { Footer } from '~/components/footer';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt, FaUser, FaEnvelope, FaPhone, FaTimesCircle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/auth';

// Waitlist item interface
interface WaitlistItem {
  _id: string;
  name: string;
  email: string;
  event?: {
    _id: string;
    title?: string;
    name?: string;
    description?: string;
    date: string;
    time?: string;
    location: string;
    image?: string;
    tags?: string[];
  };
  numberOfTickets?: number;
  preferredTicketType?: string;
  notificationMethod?: string;
  status: 'pending' | 'approved' | 'rejected' | 'orderCompleted';
  orderCompleted: boolean;
  registeredAt: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

// API endpoint
const API_URL = 'http://localhost:5000/api/waiting-list';

export function meta() {
  return [
    { title: "My Waiting List - HELPVerse" },
    { name: "description", content: "View all your event waitlist registrations" },
  ];
}

export default function MyWaitlistPage(): React.ReactElement {
  const [waitlistItems, setWaitlistItems] = useState<WaitlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);

  // Access auth context to get user data
  const { user } = useAuth();

  // Function to fetch waitlist data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Get email from localStorage as fallback if context doesn't have user data
      let userEmail = "";
      
      if (user && user.email) {
        userEmail = user.email;
      } else {
        // Try to get from userData in localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            if (parsedUserData && parsedUserData.email) {
              userEmail = parsedUserData.email;
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
      }

      if (!userEmail) {
        setError('User email not found');
        setLoading(false);
        return;
      }

      // Add email parameter according to API documentation
      const response = await axios.get(`${API_URL}?email=${encodeURIComponent(userEmail)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success && Array.isArray(response.data.data)) {
        // Validasi dan normalisasi data sebelum di-set ke state
        const validatedItems = response.data.data
          // Filter out items with status 'orderCompleted' OR orderCompleted: true
          .filter((item: any) => item.status !== 'orderCompleted' && item.orderCompleted !== true)
          .map((item: any) => {
            return {
              _id: item._id || '',
              name: item.name || '',
              email: item.email || '',
              event: item.event ? {
                _id: item.event._id || '',
                // Periksa properti yang mungkin digunakan untuk judul event
                title: item.event.title || item.event.name || '',
                name: item.event.name || item.event.title || '',
                description: item.event.description || '',
                date: item.event.date || new Date().toISOString(),
                time: item.event.time || '',
                location: item.event.location || 'No Location',
                image: item.event.image || null,
                tags: Array.isArray(item.event.tags) ? item.event.tags : []
              } : null,
              numberOfTickets: item.numberOfTickets || 0,
              preferredTicketType: item.preferredTicketType || '',
              notificationMethod: item.notificationMethod || '',
              status: item.status || 'pending',
              orderCompleted: item.orderCompleted || false,
              registeredAt: item.registeredAt || new Date().toISOString(),
              phone: item.phone || '',
              createdAt: item.createdAt || new Date().toISOString(),
              updatedAt: item.updatedAt || new Date().toISOString()
            };
          });
        
        setWaitlistItems(validatedItems);
      } else {
        setWaitlistItems([]);
      }
    } catch (err) {
      console.error('Error fetching waiting list data:', err);
      setWaitlistItems([]);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to fetch waiting list data');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch waiting list data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]); // Re-run when user data changes

  // Handler to show confirmation modal
  const handleLeaveWaitlist = (waitlistId: string) => {
    setItemToDelete(waitlistId);
    setShowConfirmModal(true);
    setDeleteError(null);
  };

  // Handler to cancel deletion
  const handleCancelDelete = () => {
    setShowConfirmModal(false);
    setItemToDelete(null);
  };

  // Handler to delete item from waiting list
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setDeleteLoading(true);
      setDeleteError(null);
      setDeleteSuccess(null);

      // Get token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setDeleteError('User not authenticated');
        setDeleteLoading(false);
        return;
      }

      // Get email from localStorage as fallback if context doesn't have user data
      let userEmail = "";
      
      if (user && user.email) {
        userEmail = user.email;
      } else {
        // Try to get from userData in localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            if (parsedUserData && parsedUserData.email) {
              userEmail = parsedUserData.email;
            }
          } catch (error) {
            console.error('Error parsing user data:', error);
          }
        }
      }

      if (!userEmail) {
        setDeleteError('User email not found');
        setDeleteLoading(false);
        return;
      }

      // Delete item from waiting list dengan endpoint yang benar
      const response = await axios.delete(`${API_URL}/${itemToDelete}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        data: { email: userEmail } // Axios menggunakan property 'data' untuk body pada request DELETE
      });

      if (response.data.success) {
        // Remove item from state
        setWaitlistItems(prevItems => prevItems.filter(item => item._id !== itemToDelete));
        setDeleteSuccess('Successfully left the waiting list');
        
        // Refresh waitlist data
        fetchData();
      } else {
        setDeleteError(response.data.message || 'Failed to leave waiting list');
      }
    } catch (err) {
      console.error('Error leaving waiting list:', err);
      if (axios.isAxiosError(err) && err.response) {
        setDeleteError(err.response.data.message || 'Failed to leave waiting list');
      } else {
        setDeleteError(err instanceof Error ? err.message : 'Failed to leave waiting list');
      }
    } finally {
      setDeleteLoading(false);
      setShowConfirmModal(false);
      setItemToDelete(null);
      
      // Show success message for a few seconds only
      if (deleteSuccess) {
        setTimeout(() => {
          setDeleteSuccess(null);
        }, 3000);
      }
    }
  };

  // Format waitlist status for display
  const getStatusLabel = (status: string) => {
    // Return empty string to remove status labels
    return '';
  };

  // Function to get event title
  const getEventTitle = (event: any) => {
    return event.title || event.name || 'No Title';
  };
  
  // Function to get event location
  const getEventLocation = (event: any) => {
    return event.location || event.venue || 'No Location';
  };
  
  // Function to safely format date
  const formatDate = (dateString: string | undefined, defaultText = 'Unknown date') => {
    if (!dateString) return defaultText;
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return defaultText;
    }
  };

  if (loading) {
    return (
      <main className="bg-secondary min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-28 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading waitlist data...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  // Tidak lagi memeriksa isAuthenticated, hanya memeriksa apakah ada token
  if (!localStorage.getItem('token')) {
    return (
      <main className="bg-secondary min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-28 flex justify-center items-center">
          <div className="text-center">
            <div className="text-yellow-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Login Required</h2>
            <p className="text-gray-600 mb-6">Please login to view your waiting list.</p>
            <Link to="/login" className="bg-primary text-white px-6 py-2 rounded-full inline-block">
              Go to Login
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
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-28">
        <h1 className="text-2xl md:text-3xl font-bold mb-8">My Waiting List</h1>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {deleteSuccess && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{deleteSuccess}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
              <div className="text-center mb-4">
                <div className="h-16 w-16 bg-red-100 rounded-full mx-auto flex items-center justify-center">
                  <FaTimesCircle className="h-8 w-8 text-red-500" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-6 text-gray-800">
                Are you sure you want to leave this waiting list?
              </h2>
              
              {deleteError && (
                <div className="mb-4 p-2 bg-red-50 text-red-700 rounded text-sm">
                  {deleteError}
                </div>
              )}
              
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={handleCancelDelete}
                  className="bg-gray-200 text-gray-800 px-8 py-2 rounded-md hover:bg-gray-300 w-24"
                  disabled={deleteLoading}
                >
                  No
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="bg-red-600 text-white px-8 py-2 rounded-md hover:bg-red-700 w-24"
                  disabled={deleteLoading}
                >
                  {deleteLoading ? (
                    <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mx-auto"></span>
                  ) : 'Yes'}
                </button>
              </div>
            </div>
          </div>
        )}

        {waitlistItems.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <FaTicketAlt className="text-gray-400 text-5xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No waitlist items found</h2>
            <p className="text-gray-600 mb-6">
              You are not on any event waiting lists.
            </p>
            <Link to="/" className="bg-primary text-white px-6 py-2 rounded-full inline-block">
              Explore Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {waitlistItems.map((item) => (
              <div key={item._id} className="bg-primary rounded-lg shadow-md overflow-hidden">
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Event Image */}
                    <div className="md:w-40 h-96 md:h-48 flex-shrink-0 flex justify-center">
                      {item.event && (item.event.image || item.event.image === '') ? (
                        <img
                          src={`http://localhost:5000${item.event.image}`}
                          alt={getEventTitle(item.event) || 'Event Image'}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <FaTicketAlt className="text-gray-400 text-5xl" />
                        </div>
                      )}
                    </div>

                    {/* Main Information */}
                    <div className="flex-grow">
                      <div className="flex flex-col md:flex-row justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2 text-secondary">
                            {item.event ? getEventTitle(item.event) : 'No Event Title'}
                          </h3>
                          <div className="mb-2">{getStatusLabel(item.status)}</div>
                        </div>
                      </div>

                      {/* Event info */}
                      <div className="mt-4 space-y-3">
                        {item.event && (
                          <div className="flex items-center gap-3 text-sm">
                            <FaMapMarkerAlt className="text-secondary w-4 h-4" />
                            <span className="text-secondary">{getEventLocation(item.event)}</span>
                          </div>
                        )}

                        {item.event && item.event.date && (
                          <div className="flex items-center gap-3 text-sm">
                            <FaCalendarAlt className="text-secondary w-4 h-4" />
                            <span className="text-secondary">
                              {formatDate(item.event.date)}
                            </span>
                          </div>
                        )}

                        {item.event && item.event.time && (
                          <div className="flex items-center gap-3 text-sm">
                            <FaClock className="text-secondary w-4 h-4" />
                            <span className="text-secondary">{item.event.time}</span>
                          </div>
                        )}

                        {item.event && item.event.tags && item.event.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {item.event.tags.map(tag => (
                              <span key={tag} className="bg-secondary text-primary px-2 py-1 rounded-full text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Personal info */}
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-3 text-sm">
                          <FaUser className="text-secondary w-4 h-4" />
                          <span className="text-secondary">{item.name || 'No Name'}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 text-sm">
                          <FaEnvelope className="text-secondary w-4 h-4" />
                          <span className="text-secondary">{item.email || 'No Email'}</span>
                        </div>
                        
                        {item.phone && item.phone !== '-' && (
                          <div className="flex items-center gap-3 text-sm">
                            <FaPhone className="text-secondary w-4 h-4" />
                            <span className="text-secondary">{item.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Additional Waitlist Info */}
                      <div className="flex mt-3 justify-between items-start mb-2 py-3 border-t border-secondary">
                        <div className="flex flex-col gap-1">
                          {item.numberOfTickets && (
                            <div className="text-sm text-secondary">
                              <strong>Tickets:</strong> {item.numberOfTickets}
                            </div>
                          )}
                          {item.preferredTicketType && (
                            <div className="text-sm text-secondary">
                              <strong>Ticket Type:</strong> {item.preferredTicketType}
                            </div>
                          )}
                          <div className="text-sm text-secondary">
                            <strong>Registered:</strong> {formatDate(item.registeredAt)}
                          </div>
                          <div className="text-sm text-secondary">
                            <strong>Created:</strong> {formatDate(item.createdAt)}
                          </div>
                          {item.notificationMethod && (
                            <div className="text-sm text-secondary">
                              <strong>Notification:</strong> {item.notificationMethod}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 space-y-2">
                        {item.status === 'approved' && item.event && item.event._id && (
                          <Link
                            to={`/event/${item.event._id}/waitlist-book`}
                            className="w-full text-center block text-white px-4 py-2 rounded-full bg-green-500 hover:bg-green-600"
                          >
                            Book Waitlist Tickets
                          </Link>
                        )}
                        
                        {/* Button for leaving waitlist */}
                        <button 
                          onClick={() => handleLeaveWaitlist(item._id)}
                          className="w-full text-center block text-white px-4 py-2 rounded-full bg-red-500 hover:bg-red-600"
                        >
                          Leave Waiting List
                        </button>

                        <div className="mt-2 text-sm text-secondary">
                          {item.status === 'pending' && (
                            <p>* You will be notified when tickets become available</p>
                          )}
                          {item.status === 'approved' && (
                            <p>* Tickets are now available for you to purchase</p>
                          )}
                          {item.status === 'rejected' && (
                            <p>* Your waitlist request was not approved</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}