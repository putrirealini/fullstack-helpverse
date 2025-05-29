import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { Navbar } from '~/components/navbar';
import { Footer } from '~/components/footer';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaCheck, FaTicketAlt, FaDownload, FaTag } from 'react-icons/fa';

// Booking data type
interface BookingData {
  eventId: string;
  eventName: string;
  eventImage: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  seats: string[];
  seatsWithType?: string[];
  ticketType: string;
  totalPrice: number;
  subtotal: number;
  discount: number;
  promoCode: string | null;
  promoDiscount: number;
  paymentMethod: string;
  paymentStatus: string;
  transactionId: string;
}

// Mock event data (in real app, this would be fetched from API)
const eventData = {
  id: 1,
  image: "/event-1.png",
  title: "Music Festival 2025",
  date: "August,10 2025",
  time: "10AM",
  location: "HELP Auditorium",
};

export function meta() {
  return [
    { title: "Booking Confirmation - HELPVerse" },
    { name: "description", content: "Booking confirmation details" },
  ];
}

export default function BookingConfirmationPage(): React.ReactElement {
  const { id } = useParams();
  const [bookingData, setBookingData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get booking data from session storage
    const storedData = sessionStorage.getItem('bookingData');
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setBookingData(parsedData);
      } catch (error) {
        console.error('Error parsing booking data:', error);
      }
    }
    
    setLoading(false);
  }, [id]);

  // Format payment method for display
  const formatPaymentMethod = (method: string) => {
    switch (method) {
      case 'mandiri': return 'Mandiri Virtual Account';
      case 'shopee': return 'ShopeePay';
      case 'credit': return 'Credit Card';
      default: return method;
    }
  };

  // Generate simple booking code
  const bookingCode = bookingData?.transactionId || `BK-${Date.now().toString().slice(-6)}`;

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

  if (!bookingData) {
    return (
      <main className="bg-secondary min-h-screen">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-28">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-4">Booking data not found</h2>
              <p className="mb-6">
                Sorry, we couldn't find your booking data. This may be because your session has expired or an error occurred.
              </p>
              <Link to={`/event/${id}`} className="bg-primary text-white px-6 py-2 rounded-full inline-block">
                Back to Event Page
              </Link>
            </div>
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
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
          {/* Header with booking status */}
          <div className="flex flex-col items-center justify-center mb-8 text-center">
            <div className="flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <FaCheck className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Booking Successful!</h1>
            <p className="text-gray-600">
              Thank you, your booking has been confirmed.
            </p>
            <div className="mt-4 px-4 py-2 bg-gray-100 rounded-md">
              <span className="text-sm text-gray-500">Booking Code:</span>
              <p className="text-lg font-bold font-mono">{bookingCode}</p>
            </div>
          </div>

          {/* Event Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Event Details</h2>
            <div className="flex flex-col md:flex-row gap-6">
              <img 
                src={bookingData.eventImage} 
                alt={bookingData.eventName}
                className="w-full md:w-48 h-48 object-cover rounded-lg"
              />
              <div className="flex flex-col">
                <h3 className="text-xl font-bold mb-3">{bookingData.eventName}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-primary" />
                    <span>{bookingData.eventDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="text-primary" />
                    <span>{bookingData.eventTime}</span>
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <FaMapMarkerAlt className="text-primary" />
                    <span>{bookingData.eventLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Ticket Details</h2>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <FaTicketAlt className="text-primary" />
                  <span className="font-medium">{bookingData.ticketType}</span>
                </div>
                <span className="text-sm font-medium">{bookingData.seats.length} x RM{(bookingData.subtotal / bookingData.seats.length).toFixed(0)}</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {bookingData.seats.map((seat, index) => (
                  <div key={index} className="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm">
                    {seat}
                  </div>
                ))}
              </div>
              
              {/* Promo Code */}
              {bookingData.promoCode && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2 text-green-600">
                    <FaTag className="text-green-600" />
                    <span className="font-medium">Promo Code Applied: {bookingData.promoCode}</span>
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {bookingData.promoDiscount}% OFF
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 pb-2 border-b">Payment Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Method</p>
                <p className="font-medium">{formatPaymentMethod(bookingData.paymentMethod)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Status</p>
                <p className="font-medium text-green-600">Successful</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Transaction ID</p>
                <p className="font-medium font-mono">{bookingData.transactionId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Date</p>
                <p className="font-medium">{new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
            </div>
            
            <div className="mt-6 border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal</span>
                <span>RM{bookingData.subtotal}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Discount</span>
                {bookingData.discount > 0 ? (
                  <span className="text-green-600">-RM{bookingData.discount}</span>
                ) : (
                  <span>RM0</span>
                )}
              </div>
              <div className="flex justify-between items-center font-bold">
                <span>Total</span>
                <span>RM{bookingData.totalPrice}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col md:flex-row gap-4 mt-8">
            <button className="bg-primary text-white px-6 py-3 rounded-full flex-1 flex items-center justify-center gap-2">
              <FaDownload />
              <span>Download Ticket</span>
            </button>
            <Link to="/my-bookings" className="bg-gray-100 text-gray-800 px-6 py-3 rounded-full flex-1 text-center">
              View All Bookings
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
} 