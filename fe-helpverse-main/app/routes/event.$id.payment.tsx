import * as React from 'react';
import { useState, useEffect } from 'react';
import { useParams, Link, Form, useNavigate, useLocation } from 'react-router';
import { Navbar } from '~/components/navbar';
import { Footer } from '~/components/footer';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { useAuth } from '~/contexts/auth';
import { eventService } from '~/services/event';
import { orderService } from '~/services/order';

interface PaymentPageState {
  eventData: {
    id: string;
    name: string;
    image: string;
    date: string;
    time: string;
    location: string;
  };
  selectedSeats: string[];
  selectedSeatsLabels: string[];
  ticketType: string;
  totalPrice: number;
  isWaitlist?: boolean;
  waitlistTickets?: { _id: string; name: string }[];
}

interface PromotionalOffer {
  name: string;
  description: string;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
  _id: string;
}

// Promo code service that uses the event promotionalOffers
const PromoCodeService = {
  async validatePromoCode(code: string, eventId: string): Promise<{ valid: boolean, discount?: number, message?: string }> {
    try {
      console.log(`Validating promo code: ${code} for event: ${eventId}`);
      
      // Get event details to access promotional offers
      const eventDetails = await eventService.getEventById(eventId);
      
      console.log('Event details fetched successfully');
      console.log('Available promo codes:', eventDetails.promotionalOffers?.map(offer => offer.code));
      
      // Find the promo code in the event's promotional offers
      const promoOffer = eventDetails.promotionalOffers?.find(
        offer => offer.code === code && offer.active
      );
      
      console.log('Found promo offer:', promoOffer);
      
      if (!promoOffer) {
        console.log('Invalid promo code');
        return { valid: false, message: 'Invalid promo code' };
      }
      
      // Validate promo code date range
      const now = new Date();
      const validFrom = new Date(promoOffer.validFrom);
      const validUntil = new Date(promoOffer.validUntil);
      
      if (now < validFrom || now > validUntil) {
        console.log('Promo code has expired or not yet active');
        return { valid: false, message: 'Promo code has expired or not yet active' };
      }
      
      // Check if max uses reached
      if (promoOffer.currentUses >= promoOffer.maxUses) {
        console.log('Promo code reached maximum usage limit');
        return { valid: false, message: 'Promo code has reached maximum usage limit' };
      }
      
      console.log('Promo code validation successful');
      
      // Return valid promo code with discount
      return { 
        valid: true, 
        discount: promoOffer.discountValue,
        message: `${promoOffer.name}: ${promoOffer.discountValue}% discount applied!`
      };
    } catch (error) {
      console.error('Error validating promo code:', error);
      return { valid: false, message: 'Error validating promo code' };
    }
  }
};

export function meta() {
    return [
        { title: "Payment - Helpverse" },
        { name: "description", content: "Complete your payment for the event" },
    ];
}

export default function EventPaymentPage(): React.ReactElement {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated, user } = useAuth();
    
    // State for data from booking page
    const [paymentInfo, setPaymentInfo] = useState<PaymentPageState | null>(null);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [promoCode, setPromoCode] = useState('');
    const [appliedPromo, setAppliedPromo] = useState<{ code: string, discount: number } | null>(null);
    const [promoError, setPromoError] = useState('');
    const [promoSuccess, setPromoSuccess] = useState('');
    const [validatingPromo, setValidatingPromo] = useState(false);
    const [modalMessage, setModalMessage] = useState<{title: string, message: string, status: 'success'|'error'|'processing'|'info'}>({
        title: 'Processing Payment...',
        message: 'Please wait, we are processing your payment',
        status: 'processing'
    });
    
    // Get data from navigation state
    useEffect(() => {
        if (location.state) {
            setPaymentInfo(location.state as PaymentPageState);
        }
    }, [location]);

    // Calculate discount and final price
    const calculatePrices = () => {
        if (!paymentInfo) return { subtotal: 0, discount: 0, total: 0 };
        
        const subtotal = paymentInfo.totalPrice;
        const discount = appliedPromo ? (subtotal * appliedPromo.discount / 100) : 0;
        const total = subtotal - discount;
        
        return {
            subtotal,
            discount: Math.round(discount),
            total: Math.round(total)
        };
    };

    const prices = calculatePrices();
    
    // Handle applying promo code
    const handleApplyPromo = async () => {
        // Clear previous messages
        setPromoError('');
        setPromoSuccess('');
        
        // Check if promo code is empty
        if (!promoCode.trim()) {
            setPromoError('Please enter a promo code');
            return;
        }
        
        console.log('Applying promo code:', promoCode);
        
        // Validate promo code with the API
        setValidatingPromo(true);
        try {
            const result = await PromoCodeService.validatePromoCode(promoCode, id || '');
            console.log('Promo validation result:', result);
            
            if (result.valid && result.discount) {
                console.log('Setting applied promo:', { code: promoCode, discount: result.discount });
                setAppliedPromo({ code: promoCode, discount: result.discount });
                setPromoCode(''); // Clear the input
                setPromoSuccess(result.message || 'Promo code applied successfully!');
                console.log('Success message set:', result.message || 'Promo code applied successfully!');
            } else {
                setPromoError(result.message || 'Invalid promo code');
                console.log('Error message set:', result.message || 'Invalid promo code');
            }
        } catch (error) {
            setPromoError('Error validating promo code. Please try again.');
            console.error('Promo code validation error:', error);
        } finally {
            setValidatingPromo(false);
        }
    };

    // Handle removing promo code
    const handleRemovePromo = () => {
        setAppliedPromo(null);
        setPromoSuccess('');
    };
    
    const handlePayClick = async () => {
        if (!paymentMethod) {
            alert('Please select a payment method');
            return;
        }

        if (!paymentInfo) {
            alert('No booking data found');
            return;
        }

        // Check if user is authenticated
        if (!isAuthenticated) {
            // Redirect to login page with return URL
            navigate('/login', { 
                state: { 
                    redirectTo: `/event/${id}/payment`,
                    paymentInfo: paymentInfo
                } 
            });
            return;
        }

        setIsProcessing(true);
        setModalMessage({
            title: 'Processing Payment...',
            message: 'Please wait, we are processing your payment',
            status: 'processing'
        });
        setShowModal(true);
        
        try {
            // Extract ticket type ID and seat information
            const ticketTypeData = paymentInfo.selectedSeats.map(combinedId => {
                const [ticketTypeId, seatId] = combinedId.split(':');
                return { ticketTypeId, seatId };
            });

            // Group seats by ticket type and get ticket names
            const ticketMap = new Map();
            const ticketNameMap = new Map(); // Map untuk menyimpan nama tiket
            
            // Cari nama tiket dari event
            const getTicketNameById = (ticketId: string): string => {
                // Untuk tiket waitlist, gunakan ID tiket asli dari tiket waitlist
                if (paymentInfo.isWaitlist && paymentInfo.waitlistTickets) {
                    // Jika data waitlistTickets tersedia, cari nama berdasarkan ID
                    const waitlistTicket = paymentInfo.waitlistTickets.find(ticket => ticket._id === ticketId);
                    if (waitlistTicket) {
                        return waitlistTicket.name;
                    }
                }
                
                // Fallback ke nama tiket dari data payment jika ada
                return paymentInfo.ticketType || ticketId;
            };
            
            ticketTypeData.forEach(data => {
                const ticketName = getTicketNameById(data.ticketTypeId);
                
                if (!ticketNameMap.has(data.ticketTypeId)) {
                    ticketNameMap.set(data.ticketTypeId, ticketName);
                }
                
                if (!ticketMap.has(data.ticketTypeId)) {
                    ticketMap.set(data.ticketTypeId, []);
                }
                
                // Pastikan row dan column adalah angka yang valid
                let row = 0, col = 0;
                
                // Handle format seat seperti 'A1', 'B2', dll.
                if (data.seatId) {
                    // Format dari SeatMap dengan format "A1", "B5", dll
                    // dengan asumsi:
                    // - Huruf pertama adalah row: A=1, B=2, C=3, dst
                    // - Angka sisanya adalah column
                    
                    // Mengekstrak huruf pertama untuk baris
                    if (data.seatId.match(/^[A-Za-z]/)) {
                        const rowChar = data.seatId.charAt(0).toUpperCase();
                        // Konversi huruf ke angka (A=1, B=2, dst)
                        row = rowChar.charCodeAt(0) - 64; // ASCII 'A' adalah 65, jadi A akan menjadi 1
                        
                        // Mengekstrak angka setelah huruf untuk kolom
                        const colStr = data.seatId.substring(1);
                        col = parseInt(colStr) || 1;
                        
                        console.log(`Converted seat ${data.seatId} to row=${row}, column=${col}`);
                    } else if (data.seatId.includes('-')) {
                        // Format alternatif seperti '1-2'
                        const parts = data.seatId.split('-');
                        row = parseInt(parts[0]) || 1;
                        col = parseInt(parts[1]) || 1;
                    } else {
                        // Fallback jika format tidak dapat dikenali
                        row = 1;
                        col = 1;
                    }
                } else {
                    // Fallback jika seatId tidak ada
                    row = 1;
                    col = 1;
                }
                
                ticketMap.get(data.ticketTypeId).push({ 
                    row: row, 
                    column: col
                });
            });

            // Format booking data according to API documentation format
            const bookingData: {
                eventId: string | undefined;
                tickets: Array<{
                    ticketType: string; 
                    quantity: number; 
                    seats: Array<{row: number, column: number}>
                }>;
                paymentMethod?: string;
                paymentInfo?: {
                    method: string;
                    transactionId: string;
                };
                isWaitlist?: boolean;
                promoCode?: string;
            } = {
                eventId: id,
                tickets: [],
                paymentMethod: paymentMethod,
                paymentInfo: {
                    method: paymentMethod,
                    transactionId: `TRX-${Date.now()}`
                },
                isWaitlist: paymentInfo.isWaitlist || false
            };
            
            // Process tickets based on waitlist status
            if (paymentInfo.isWaitlist && paymentInfo.waitlistTickets) {
                // For waitlist bookings, use the exact name from waitlist tickets
                Array.from(ticketMap.entries()).forEach(([ticketTypeId, seats]) => {
                    // Find the waitlist ticket with this ID
                    const waitlistTicket = paymentInfo.waitlistTickets?.find(t => t._id === ticketTypeId);
                    
                    if (waitlistTicket) {
                        console.log(`Found matching waitlist ticket: ${waitlistTicket.name}`);
                        
                        // Use the exact name from the waitlist ticket
                        bookingData.tickets.push({
                            ticketType: waitlistTicket.name,  // Use the exact name
                            quantity: seats.length,
                            seats: seats as Array<{row: number, column: number}>
                        });
                    } else {
                        console.warn(`Could not find waitlist ticket for ID: ${ticketTypeId}`);
                        // Fallback to using "VIP waitlist" as this should exist on the server
                        bookingData.tickets.push({
                            ticketType: "VIP waitlist",
                            quantity: seats.length,
                            seats: seats as Array<{row: number, column: number}>
                        });
                    }
                });
            } else {
                // For regular bookings, use the ticket type name from the payment info
                bookingData.tickets = Array.from(ticketMap.entries()).map(([ticketTypeId, seats]) => {
                    const ticketName = ticketNameMap.get(ticketTypeId) || "Regular";
                    return {
                        ticketType: ticketName,
                        quantity: seats.length,
                        seats: seats as Array<{row: number, column: number}>
                    };
                });
            }
            
            if (appliedPromo && !paymentInfo.isWaitlist) {
                bookingData.promoCode = appliedPromo.code;
            }
            
            console.log('Sending booking data:', JSON.stringify(bookingData, null, 2));
            
            // Coba kedua format token untuk memastikan kompatibilitas
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            console.log('Token for authorization:', token ? `Token exists: ${token.substring(0, 20)}...` : 'No token found');
            console.log('User information:', user);
            
            // Send booking request using the correct API endpoint (/api/orders)
            const response = await fetch('http://localhost:5000/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(bookingData)
            });
            
            console.log('Response status:', response.status);
            const result = await response.json();
            console.log('Response data:', result);
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to create booking');
            }

            // Update modal to show success message
            setModalMessage({
                title: 'Booking Successful!',
                message: 'Your booking has been confirmed. You will be redirected to the home page shortly.',
                status: 'success'
            });
            
            // Store booking data in session storage for my-bookings page
            sessionStorage.setItem('bookingData', JSON.stringify({
                ...bookingData,
                eventName: paymentInfo.eventData.name,
                eventImage: paymentInfo.eventData.image,
                eventLocation: paymentInfo.eventData.location,
                eventDate: paymentInfo.eventData.date,
                eventTime: paymentInfo.eventData.time,
                totalPrice: prices.total,
                subtotal: prices.subtotal,
                discount: prices.discount,
                promoCode: appliedPromo?.code || null,
                promoDiscount: appliedPromo?.discount || 0
            }));
            
            // After 3 seconds, redirect to my-bookings
            setTimeout(() => {
                setShowModal(false);
                setIsProcessing(false);
                navigate('/my-bookings');
            }, 3000);
            
            // Catatan: Proses update status waitlist sudah ditangani otomatis oleh backend
            // setelah order berhasil dibuat. Tidak perlu memanggil API secara manual dari frontend.
            
        } catch (error) {
            console.error('Error creating booking:', error);
            
            // Show error message
            setModalMessage({
                title: 'Booking Failed',
                message: error instanceof Error ? error.message : 'Failed to create booking. Please try again.',
                status: 'error'
            });
            
            // After 3 seconds, hide modal but stay on the page
            setTimeout(() => {
                setShowModal(false);
                setIsProcessing(false);
            }, 3000);
        }
    };

    // Handle going back to seat selection while preserving seat selections
    const handleBackToSeats = () => {
        // Check if we came from waitlist or regular booking
        const isFromWaitlist = paymentInfo?.isWaitlist;
        
        // Navigate back to the appropriate page
        navigate(`/event/${id}/${isFromWaitlist ? 'waitlist-book' : 'book'}`, {
            state: {
                preserveSelections: true,
                selectedSeats: paymentInfo?.selectedSeats || []
            }
        });
    };

    // Fallback if no booking data
    if (!paymentInfo) {
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
                                Sorry, we couldn't find your booking data. Please return to the seat selection page.
                            </p>
                            <Link to={`/event/${id}/book`} className="bg-primary text-white px-6 py-2 rounded-full inline-block">
                                Back to Seat Selection
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
            {/* Modal Dialog */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                        <div className="text-center">
                            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                                modalMessage.status === 'processing' ? 'bg-blue-100' : 
                                modalMessage.status === 'success' ? 'bg-green-100' : 
                                modalMessage.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                                {modalMessage.status === 'processing' ? (
                                    <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : modalMessage.status === 'success' ? (
                                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                ) : modalMessage.status === 'error' ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {modalMessage.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                                {modalMessage.message}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-28">
                <div className="mb-6">
                    <button 
                        onClick={handleBackToSeats}
                        className="text-primary text-lg font-medium flex items-center"
                    >
                        ← Back to seat selection
                    </button>
                </div>

                <div className="flex flex-col md:flex-row gap-8">
                    {/* Payment Methods */}
                    <div className="md:w-2/3">
                        <div className="space-y-6">
                            {/* Virtual Account Section */}
                            <div>
                                <h3 className="text-lg font-medium mb-4">Virtual Account</h3>
                                <button
                                    onClick={() => setPaymentMethod('mandiri')}
                                    className={`w-full p-4 border rounded-lg text-left ${
                                        paymentMethod === 'mandiri' ? 'border-indigo-500' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'mandiri'}
                                            onChange={() => setPaymentMethod('mandiri')}
                                            className="mr-3"
                                        />
                                        <span>Mandiri Virtual Account</span>
                                    </div>
                                </button>
                            </div>

                            {/* E-Wallet Section */}
                            <div>
                                <h3 className="text-lg font-medium mb-4">E-Wallet</h3>
                                <button
                                    onClick={() => setPaymentMethod('shopee')}
                                    className={`w-full p-4 border rounded-lg text-left ${
                                        paymentMethod === 'shopee' ? 'border-indigo-500' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'shopee'}
                                            onChange={() => setPaymentMethod('shopee')}
                                            className="mr-3"
                                        />
                                        <span>Shopee pay</span>
                                    </div>
                                </button>
                            </div>

                            {/* Card Section */}
                            <div>
                                <h3 className="text-lg font-medium mb-4">Card</h3>
                                <button
                                    onClick={() => setPaymentMethod('credit')}
                                    className={`w-full p-4 border rounded-lg text-left ${
                                        paymentMethod === 'credit' ? 'border-indigo-500' : 'border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={paymentMethod === 'credit'}
                                            onChange={() => setPaymentMethod('credit')}
                                            className="mr-3"
                                        />
                                        <span>Credit Card</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="md:w-1/3">
                        <div className="bg-primary text-white rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-6">Order details</h2>
                            
                            <div className="flex items-start mb-6">
                                <img 
                                    src={paymentInfo.eventData.image}
                                    alt={paymentInfo.eventData.name}
                                    className="w-20 h-28 object-cover rounded"
                                />
                                <div className="ml-4">
                                    <h3 className="font-semibold line-clamp-2 text-base">{paymentInfo.eventData.name}</h3>
                                    <div className="text-sm opacity-80 mt-1 flex flex-col gap-2">
                                        <div className="flex items-center text-sm">
                                            <FaMapMarkerAlt className="w-4 h-4 mr-2" />
                                            {paymentInfo.eventData.location}
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaCalendarAlt className="w-4 h-4 mr-2" />
                                            {paymentInfo.eventData.date}
                                        </div>
                                        <div className="flex items-center text-sm">
                                            <FaClock className="w-4 h-4 mr-2" />
                                            {paymentInfo.eventData.time}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-primary py-4">
                                <div className="flex flex-col gap-2">
                                    {/* Grup tiket-tiket berdasarkan tipe */}
                                    {(() => {
                                        // Ekstrak ticket type id dari selected seats
                                        const ticketTypes = new Map();
                                        
                                        // Kelompokkan tiket berdasarkan tipe tiket
                                        paymentInfo.selectedSeats.forEach(combinedId => {
                                            const [ticketTypeId, seatId] = combinedId.split(':');
                                            
                                            if (!ticketTypes.has(ticketTypeId)) {
                                                ticketTypes.set(ticketTypeId, {
                                                    seats: [],
                                                    seatLabels: [],
                                                    ticketType: '',
                                                    pricePerSeat: 0
                                                });
                                            }
                                            
                                            // Dapatkan label kursi dari seatId
                                            const seatIndex = paymentInfo.selectedSeats.indexOf(combinedId);
                                            const seatLabel = paymentInfo.selectedSeatsLabels[seatIndex];
                                            
                                            // Update data tiket ini
                                            const typeData = ticketTypes.get(ticketTypeId);
                                            typeData.seats.push(combinedId);
                                            typeData.seatLabels.push(seatLabel);
                                        });
                                        
                                        // Ambil informasi harga dan nama tiket
                                        // Jika tiket memiliki nama berbeda, ini akan menampilkan nama yang berbeda
                                        const ticketTypeNames = paymentInfo.ticketType.split(', ');
                                        const pricePerSeat = Math.round(paymentInfo.totalPrice / paymentInfo.selectedSeats.length);
                                        
                                        // Mapping nama tiket ke tiket yang dikelompokkan
                                        // Catatan: Ini akan berfungsi dengan baik jika order group pada ticketTypes sama dengan ticketTypeNames
                                        let index = 0;
                                        ticketTypes.forEach((data) => {
                                            // Jika ada nama tiket yang tersedia, gunakan
                                            if (index < ticketTypeNames.length) {
                                                data.ticketType = ticketTypeNames[index];
                                            } else {
                                                data.ticketType = `Tiket ${index + 1}`;
                                            }
                                            
                                            // Set harga per kursi
                                            data.pricePerSeat = pricePerSeat;
                                            index++;
                                        });
                                        
                                        // Tampilkan tiket yang dikelompokkan
                                        return Array.from(ticketTypes.entries()).map(([typeId, data]) => {
                                            const totalForType = data.pricePerSeat * data.seats.length;
                                            
                                            return (
                                                <div 
                                                    key={typeId} 
                                                    className="flex justify-between items-start py-3 border-y border-secondary"
                                                >
                                                    <div className='flex items-center gap-2'>
                                                        <div className='w-10 h-10 bg-white rounded-sm flex items-center justify-center text-primary text-sm'>
                                                            {data.seats.length}
                                                        </div>
                                                        <div className='flex flex-col gap-1'>
                                                            <div className='text-sm font-bold'>{data.ticketType}</div>
                                                            <div className='text-xs text-foreground-muted'>{data.seatLabels.join(', ')}</div>
                                                        </div>
                                                    </div>
                                                    <div className='flex flex-col gap-1'>
                                                        <div className='text-sm text-foreground-muted'>{data.seats.length} x RM{data.pricePerSeat}</div>
                                                        <div className='text-xs font-bold'>RM{totalForType}</div>
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>

                                <div className="py-4">
                                    <div className="mb-2">
                                        {appliedPromo ? (
                                            <div className="flex items-center justify-between bg-green-100 text-green-800 p-2 rounded-md mb-2">
                                                <div>
                                                    <span className="font-medium">{appliedPromo.code}</span>
                                                    <span className="text-xs ml-2">(-{appliedPromo.discount}%)</span>
                                                </div>
                                                <button 
                                                    onClick={handleRemovePromo}
                                                    className="text-sm text-red-600 hover:text-red-800"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between">
                                                <input
                                                    type="text"
                                                    placeholder="Promotional Code"
                                                    className="bg-transparent border border-secondary rounded px-3 py-1 text-sm w-2/3"
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                />
                                                <button 
                                                    onClick={handleApplyPromo}
                                                    disabled={validatingPromo}
                                                    className="bg-white text-primary px-4 py-1 rounded text-sm flex items-center justify-center"
                                                >
                                                    {validatingPromo ? (
                                                        <svg className="animate-spin h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                    ) : 'Apply'}
                                                </button>
                                            </div>
                                        )}
                                        {promoError && <p className="text-red-300 text-xs mt-1">{promoError}</p>}
                                        {promoSuccess && <p className="text-green-300 text-xs mt-1 font-medium bg-green-900 bg-opacity-30 p-1 rounded">{promoSuccess}</p>}
                                    </div>
                                </div>

                                <div className="border-t border-secondary pt-4">
                                    <div className="flex justify-between mb-2">
                                        <span className='text-sm'>Subtotal</span>
                                        <span className='text-sm'>RM{prices.subtotal}</span>
                                    </div>
                                    <div className="flex justify-between mb-4">
                                        <span className='text-sm'>Discount</span>
                                        <span className='text-sm'>-RM{prices.discount}</span>
                                    </div>
                                    <div className="flex justify-between font-semibold">
                                        <span className='text-sm'>Total</span>
                                        <span className='text-sm font-bold'>RM{prices.total}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayClick}
                                    disabled={!paymentMethod || isProcessing}
                                    className={`w-full bg-white text-primary py-2 rounded-full font-medium mt-3 ${!paymentMethod || isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                                >
                                    {isProcessing ? 'Processing...' : 'Pay Now'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
} 