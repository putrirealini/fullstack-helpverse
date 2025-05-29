import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router";
import { Navbar } from '~/components/navbar';
import { Footer } from '~/components/footer';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaTag, FaEdit, FaTrash, FaEye, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import type { Event } from '~/services/event';
import axios from 'axios';
import { WaitlistTicketModal } from '~/components/WaitlistTicketModal';
import { ManageWaitlistModal } from '~/components/ManageWaitlistModal';

// API endpoint according to the API documentation
const API_URL = 'http://localhost:5000/api/events/my-events';

// Define type for events displayed on the page
interface DisplayEvent {
  id: string;
  _id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address: string;
  image: string;
  totalSeats: number;
  availableSeats: number;
  createdAt: string;
  published: boolean;
  approvalStatus: string;
  tickets: any[];
  tags: string[];
}

// Interface for pagination from API
interface PaginationData {
  next?: {
    page: number;
    limit: number;
  };
  prev?: {
    page: number;
    limit: number;
  };
}

export function meta() {
  return [
    { title: "My Events - HELPVerse" },
    { name: "description", content: "Manage all events you have created" },
  ];
}

export default function MyEventsPage(): React.ReactElement {
  const [events, setEvents] = useState<DisplayEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // State for waitlist modal
  const [showWaitlistTicketModal, setShowWaitlistTicketModal] = useState(false);
  const [showManageWaitlistModal, setShowManageWaitlistModal] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalEvents, setTotalEvents] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);

  const fetchEvents = async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true);
      setError(null);

      // Get user token from localStorage
      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('User not authenticated');
      }

      // Prepare query parameters for pagination only
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      // Use axios to fetch event data for the organizer
      const response = await axios.get(`${API_URL}?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API response:', response.data);

      if (response.data.success) {
        // Transform data from API
        const transformedEvents = response.data.data.map((event: any) => ({
          id: event.id || event._id,
          _id: event._id || event.id,
          name: event.name || 'Unnamed Event',
          description: event.description || 'No description',
          date: event.date ? new Date(event.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Date not available',
          time: event.time || 'Time not available',
          location: event.location || 'Location not available',
          address: event.address || '',
          image: event.image || '/logo-blue.png',
          totalSeats: event.totalSeats || 0,
          availableSeats: event.availableSeats || 0,
          createdAt: event.createdAt ? new Date(event.createdAt).toLocaleDateString('en-US') : '-',
          published: event.published || false,
          approvalStatus: event.approvalStatus || 'pending',
          tickets: event.tickets || [],
          tags: event.tags || []
        }));

        setEvents(transformedEvents);
        setCurrentPage(page);
        setTotalEvents(response.data.count || 0);
        setPagination(response.data.pagination || null);
        
        // Calculate total pages based on total events and items per page
        setTotalPages(response.data.count ? Math.ceil(response.data.count / limit) : 1);
      } else {
        throw new Error(response.data.message || 'Failed to fetch event data');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to fetch event data');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch event data');
      }
      // Set empty events array if there's an error
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1, itemsPerPage);
  }, []);

  const handleDeleteEvent = async (eventId: string) => {
    setEventToDelete(eventId);
    setShowConfirmModal(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    const eventId = eventToDelete;
    
    try {
      setDeleteLoading(eventId);
      setShowConfirmModal(false);

      const token = localStorage.getItem('token');

      if (!token) {
        throw new Error('User not authenticated');
      }

      const response = await axios.delete(`http://localhost:5000/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setEvents(prevEvents => 
          prevEvents.filter(event => event.id !== eventId)
        );
        
        setModalType('success');
        setModalMessage('Event successfully deleted');
        setShowModal(true);
        
        // Update data after deleting event
        fetchEvents(currentPage, itemsPerPage);
      } else {
        throw new Error(response.data.message || 'Failed to delete event');
      }
    } catch (err) {
      console.error('Error deleting event:', err);
      
      let errorMessage = 'Failed to delete event';
      
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setModalType('error');
      setModalMessage(errorMessage);
      setShowModal(true);
    } finally {
      setDeleteLoading(null);
      setEventToDelete(null);
    }
  };

  // Functions for pagination navigation
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      fetchEvents(currentPage + 1, itemsPerPage);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      fetchEvents(currentPage - 1, itemsPerPage);
    }
  };

  // Function to show waitlist ticket modal
  const handleShowWaitlistTicketModal = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowWaitlistTicketModal(true);
  };

  // Function to show manage waitlist modal
  const handleShowManageWaitlistModal = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowManageWaitlistModal(true);
  };

  if (loading && events.length === 0) {
    return (
      <main className="bg-secondary min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-28 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading event data...</p>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="bg-secondary min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-28 flex justify-center items-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Error Loading Events</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => fetchEvents(1, itemsPerPage)}
              className="bg-primary text-white px-6 py-2 rounded-full inline-block"
            >
              Try Again
            </button>
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
        <h1 className="text-2xl md:text-3xl font-bold mb-8">My Events</h1>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <div className="text-center mb-4">
                {modalType === 'success' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <h2 className="text-xl font-semibold mb-2 text-center">
                {modalType === 'success' ? 'Success' : 'Failed'}
              </h2>
              <p className="text-gray-600 mb-6 text-center">{modalMessage}</p>
              <div className="text-center">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-primary text-white px-6 py-2 rounded-full inline-block"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full text-center">
              <div className="text-center mb-4">
                <div className="h-16 w-16 bg-red-100 rounded-full mx-auto flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">
                Are you sure you want to<br/>delete this event?
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                This action cannot be undone and all data related to this event will be deleted.
              </p>
              
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="bg-gray-200 text-gray-800 px-8 py-2 rounded-md hover:bg-gray-300 w-24"
                >
                  No
                </button>
                <button
                  onClick={confirmDeleteEvent}
                  className="bg-red-600 text-white px-8 py-2 rounded-md hover:bg-red-700 w-24"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal for Waitlist Ticket */}
        <WaitlistTicketModal 
          isOpen={showWaitlistTicketModal}
          eventId={selectedEventId}
          onClose={() => setShowWaitlistTicketModal(false)}
        />

        {/* Modal for Manage Waitlist */}
        <ManageWaitlistModal 
          isOpen={showManageWaitlistModal}
          eventId={selectedEventId}
          onClose={() => setShowManageWaitlistModal(false)}
        />

        {loading && (
          <div className="mb-6 flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        )}

        {!loading && events.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <FaCalendarAlt className="text-gray-400 text-5xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No events found</h2>
            <p className="text-gray-600 mb-6">You haven't created any events yet.</p>
            <Link to="/event/create" className="bg-primary text-white px-6 py-2 rounded-full inline-block">
              Create New Event
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((event) => (
                <div key={event.id} className="bg-primary rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Event Image */}
                      <div className="md:w-56 h-96 md:h-auto flex-shrink-0">
                        <img
                          src={`http://localhost:5000${event.image}`}
                          alt={event.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>

                      {/* Main Information */}
                      <div className="flex-grow">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold mb-2 text-secondary">{event.name}</h3>
                          </div>
                        </div>

                        <div className="mt-4 space-y-3">
                          <div className="flex items-center gap-3 text-sm">
                            <FaMapMarkerAlt className="text-secondary w-4 h-4" />
                            <span className="text-secondary">{event.location}</span>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <FaCalendarAlt className="text-secondary w-4 h-4" />
                            <span className="text-secondary">{event.date}</span>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <FaClock className="text-secondary w-4 h-4" />
                            <span className="text-secondary">{event.time}</span>
                          </div>

                          <div className="flex items-center gap-3 text-sm">
                            <FaUsers className="text-secondary w-4 h-4" />
                            <span className="text-secondary">{event.availableSeats} seats available / {event.totalSeats} total</span>
                          </div>
                        </div>

                        {event.tags && event.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {event.tags.map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 bg-secondary text-primary text-xs rounded-full"
                              >
                                <FaTag className="mr-1" />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-secondary">
                          <div className="flex gap-3 justify-end">
                            <div className="flex">
                              <Link
                                to={`/event/${event.id}`}
                                className="bg-teal-500 text-white p-2 rounded-full mr-2 hover:bg-teal-600 transition duration-300"
                                title="View Event"
                              >
                                <FaEye className="text-sm" />
                              </Link>
                              <Link
                                to={`/event/edit/${event.id}`}
                                className="bg-blue-500 text-white p-2 rounded-full mr-2 hover:bg-blue-600 transition duration-300"
                                title="Edit Event"
                              >
                                <FaEdit className="text-sm" />
                              </Link>
                              <button
                                onClick={() => handleDeleteEvent(event.id)}
                                className={`bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition duration-300 ${
                                  deleteLoading === event.id ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                                disabled={deleteLoading === event.id}
                                title="Delete Event"
                              >
                                {deleteLoading === event.id ? (
                                  <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                                ) : (
                                  <FaTrash className="text-sm" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap mt-3 gap-2">
                            <button 
                              onClick={() => handleShowWaitlistTicketModal(event.id)}
                              className="bg-amber-500 text-white px-3 py-1 text-xs rounded-md hover:bg-amber-600 transition duration-300"
                            >
                              Add Waitlist Ticket
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {events.length > 0 && totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-4 py-2 border rounded-md mr-2 ${
                    currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <FaChevronLeft className="w-3 h-3" /> Prev
                </button>
                
                <div className="mx-2 text-sm">
                  <span className="font-medium">{currentPage}</span> of <span>{totalPages}</span> pages
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-4 py-2 border rounded-md ml-2 ${
                    currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next <FaChevronRight className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Showing total events */}
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing {events.length} of {totalEvents} events
            </div>
          </>
        )}
      </div>
      <Footer />
    </main>
  );
} 