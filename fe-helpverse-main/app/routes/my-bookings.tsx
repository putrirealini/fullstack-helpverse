import * as React from 'react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Navbar } from '~/components/navbar';
import { Footer } from '~/components/footer';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTicketAlt, FaSearch, FaTag } from 'react-icons/fa';
import { orderService } from '~/services/order';
import type { DisplayBooking } from '~/services/order';
import { useOrders } from '~/hooks/useEvent';

// API endpoint yang sesuai dengan dokumentasi API
const API_URL = 'http://localhost:5000/api/orders';

export function meta() {
  return [
    { title: "My Bookings - HELPVerse" },
    { name: "description", content: "View all your bookings and tickets" },
  ];
}

export default function MyBookingsPage(): React.ReactElement {
  const { orders: apiOrders, loading: apiLoading, error: apiError, fetchOrders, cancelOrder } = useOrders();
  const [bookings, setBookings] = useState<DisplayBooking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null);

  // Memperbarui state bookings ketika apiOrders berubah
  useEffect(() => {
    if (apiOrders.length > 0) {
      setBookings(apiOrders);
      setLoading(false);
    } else {
      // Jika tidak ada booking dari API, set array kosong
      setBookings([]);
      setLoading(false);
    }
  }, [apiOrders]);

  // Memperbarui state error ketika apiError berubah
  useEffect(() => {
    if (apiError) {
      setError(apiError);
      setLoading(false);
    }
  }, [apiError]);

  // Memperbarui state loading ketika apiLoading berubah
  useEffect(() => {
    setLoading(apiLoading);
  }, [apiLoading]);

  useEffect(() => {
    // Fungsi untuk mengambil data booking dari API
    fetchOrders();
    
    // Bagian pengambilan data dari sessionStorage dihapus
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    setBookingToCancel(bookingId);
    setShowConfirmModal(true);
  };

  const confirmCancelBooking = async () => {
    if (!bookingToCancel) return;
    
    const bookingId = bookingToCancel;
    
    try {
      setCancelLoading(bookingId);
      setCancelError(null);
      setCancelSuccess(null);
      setShowConfirmModal(false);

      // Menggunakan cancelOrder dari hook useOrders
      await cancelOrder(bookingId);
      
      // Update state bookings dengan menandai booking yang dibatalkan
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' } 
            : booking
        )
      );
      
      setCancelSuccess(bookingId);
      
      setModalType('success');
      setModalMessage('Booking successfully cancelled');
      setShowModal(true);
    } catch (err) {
      console.error('Error cancelling booking:', err);
      
      let errorMessage = 'Failed to cancel booking';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setCancelError(errorMessage);
      
      setModalType('error');
      setModalMessage(errorMessage);
      setShowModal(true);
    } finally {
      setCancelLoading(null);
      setBookingToCancel(null);
    }
  };

  // Filter bookings by status and search term
  const filteredBookings = bookings
    .filter(booking =>
      filterStatus === 'all' || booking.status === filterStatus
    )
    .filter(booking =>
      booking.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (booking.promoCode && booking.promoCode.toLowerCase().includes(searchTerm.toLowerCase()))
    );

  // Format booking status for display
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
            Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  // Function to check if event date is less than 7 days from now
  const isLessThan7DaysBeforeEvent = (eventDateStr: string): boolean => {
    try {
      // If date format from API is a timestamp or ISO string, use Date.parse
      // Try parsing with Date.parse first
      let eventDate = new Date(Date.parse(eventDateStr));
      
      // If parsing is not valid, try with manual approach
      if (isNaN(eventDate.getTime())) {
        // Try to detect common date formats
        // Possible formats: "10 August 2025", "August 10, 2025", etc.
        
        // Try for format "DD Month YYYY"
        const datePattern1 = /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/;
        const match1 = eventDateStr.match(datePattern1);
        
        // Try for format "Month DD, YYYY"
        const datePattern2 = /([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/;
        const match2 = eventDateStr.match(datePattern2);
        
        if (match1) {
          const day = parseInt(match1[1]);
          const monthName = match1[2];
          const year = parseInt(match1[3]);
          
          // Mapping month names to indices
          const monthIndex = getMonthIndex(monthName);
          if (monthIndex !== -1) {
            eventDate = new Date(year, monthIndex, day);
          }
        } else if (match2) {
          const monthName = match2[1];
          const day = parseInt(match2[2]);
          const year = parseInt(match2[3]);
          
          // Mapping month names to indices
          const monthIndex = getMonthIndex(monthName);
          if (monthIndex !== -1) {
            eventDate = new Date(year, monthIndex, day);
          }
        }
      }
      
      // If date is still not valid, return false
      if (isNaN(eventDate.getTime())) {
        console.error('Invalid date after parsing:', eventDateStr);
        return false;
      }
      
      const today = new Date();
      
      // Calculate day difference
      const diffTime = eventDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays < 7;
    } catch (error) {
      console.error('Error parsing date:', error);
      return false; // Default to false if there's an error
    }
  };
  
  // Helper function to get month index from month name
  const getMonthIndex = (monthName: string): number => {
    const monthsEN = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    
    const lowerMonthName = monthName.toLowerCase();
    
    const enIndex = monthsEN.indexOf(lowerMonthName);
    if (enIndex !== -1) return enIndex;
    
    return -1;
  };

  if (loading) {
    return (
      <main className="bg-secondary min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-28 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading booking data...</p>
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
            <h2 className="text-xl font-semibold mb-2">Error Loading Bookings</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
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
        <h1 className="text-2xl md:text-3xl font-bold mb-8">My Bookings</h1>

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
                <div className="h-16 w-16 bg-blue-100 rounded-full mx-auto flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-6 text-center text-gray-800">
                Are you sure you want to<br/>cancel your ticket?
              </h2>
              
              <div className="flex justify-center gap-4 mt-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="bg-gray-200 text-gray-800 px-8 py-2 rounded-md hover:bg-gray-300 w-24"
                >
                  No
                </button>
                <button
                  onClick={confirmCancelBooking}
                  className="bg-red-600 text-white px-8 py-2 rounded-md hover:bg-red-700 w-24"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        )}

        {filteredBookings.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <div className="flex justify-center mb-4">
              <FaTicketAlt className="text-gray-400 text-5xl" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No bookings found</h2>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterStatus !== 'all'
                ? 'No bookings match your filters.'
                : 'You haven\'t made any ticket bookings yet.'}
            </p>
            <Link to="/" className="bg-primary text-white px-6 py-2 rounded-full inline-block">
              Explore Events
            </Link>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-primary rounded-lg shadow-md overflow-hidden">
                <div className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Event Image */}
                    <div className="md:w-56 h-96 md:h-auto flex-shrink-0">
                      <img
                        src={`http://localhost:5000${booking.eventImage}`}
                        alt={booking.eventName}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>

                    {/* Main Information */}
                    <div className="flex-grow">
                      <div className="flex flex-col md:flex-row justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2 text-secondary">{booking.eventName}</h3>
                          <div className="mb-2">{getStatusLabel(booking.status)}</div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <FaMapMarkerAlt className="text-secondary w-4 h-4" />
                          <span className='text-secondary'>{booking.location}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <FaCalendarAlt className="text-secondary w-4 h-4" />
                          <span className='text-secondary'>{booking.date}</span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <FaClock className="text-secondary w-4 h-4" />
                          <span className='text-secondary'>{booking.time}</span>
                        </div>
                      </div>

                      <div className="flex mt-3 justify-between items-start mb-2 py-3 border-t border-secondary">
                        <div className='flex items-center gap-2'>
                          <div className='w-10 h-10 bg-white rounded-sm flex items-center justify-center text-primary text-sm'>{booking.seats.length}</div>
                          <div className='flex flex-col gap-1'>
                            <div className='text-sm font-bold text-secondary'>{booking.ticketType}</div>
                            <div className='text-xs text-secondary'>{booking.seats.length > 0 ? booking.seats.map(seat => seat).join(', ') : 'No seat information'}</div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        {booking.status === 'active' && !isLessThan7DaysBeforeEvent(booking.date) && (
                          <button 
                            className="w-full text-white px-4 py-2 rounded-full bg-red-500 hover:bg-red-600"
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancelLoading === booking.id}
                          >
                            {cancelLoading === booking.id ? 'Processing...' : 'Cancel Booking'}
                          </button>
                        )}
                        {booking.status === 'active' && isLessThan7DaysBeforeEvent(booking.date) && (
                          <div className="text-sm bg-yellow-100 text-yellow-800 p-3 rounded-md mb-3">
                            Cancellations are not allowed within 7 days of the event.
                          </div>
                        )}
                        <div className="mt-2 text-sm text-secondary">
                          <p>* Tickets are non-refundable</p>
                          <p>* Ticket cancellation is only allowed up to 7 days before the event</p>
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