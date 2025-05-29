import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router';
import { Navbar } from '~/components/navbar';
import { Footer } from '~/components/footer';
import { FaSpinner, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import { eventService } from '~/services/event';
import { waitingListService } from '~/services/waitingList';
import type { Event, Ticket } from '~/services/event';
import type { WaitingList } from '~/services/waitingList';
import SeatMap from '~/components/event/SeatMap';
import type { GeneratedSeat } from '~/components/event/SeatMap';
import EventSummary from '~/components/event/EventSummary';
import { generateSeatsFromTickets } from '~/utils/seats';
import { useAuth } from '~/contexts/auth';

// Interface for the location state from the router
interface LocationState {
    preserveSelections?: boolean;
    selectedSeats?: string[];
}

// Interface for waitlist ticket data
interface WaitlistTicket {
    _id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    originalTicketRef: string;
    event: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export function meta() {
    return [
        { title: "Waitlist Tickets - HELPVerse" },
        { name: "description", content: "Book tickets from the waitlist allocation for this event" },
    ];
}

export default function EventWaitlistBookingPage() {
    const { id } = useParams();
    const location = useLocation();
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const [event, setEvent] = useState<Event | null>(null);
    const [waitlist, setWaitlist] = useState<WaitingList | null>(null);
    const [waitlistTickets, setWaitlistTickets] = useState<WaitlistTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [generatedSeats, setGeneratedSeats] = useState<GeneratedSeat[]>([]);
    const [isPendingDemo, setIsPendingDemo] = useState(false);

    // Restore selected seats if navigating back from payment page
    useEffect(() => {
        if (location.state) {
            const state = location.state as LocationState;
            if (state.preserveSelections && state.selectedSeats) {
                setSelectedSeats(state.selectedSeats);
            }
        }
    }, [location.state]);

    // Function to load event data and waitlist data
    useEffect(() => {
        // Wait until authentication process is complete
        if (authLoading) {
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                if (!id) {
                    setError('Event ID is required');
                    return;
                }

                // Verify user is authenticated
                if (!isAuthenticated || !user) {
                    setError('User not logged in. Please login first to access waitlist tickets.');
                    setLoading(false);
                    return;
                }

                const userEmail = user.email;

                // Get event data from API
                const eventData = await eventService.getEventById(id);
                setEvent(eventData);

                // Get waitlist tickets from API
                const waitlistTicketsResponse = await eventService.getEventWaitlistTickets(id);
                if (waitlistTicketsResponse.success && waitlistTicketsResponse.data && waitlistTicketsResponse.data.length > 0) {
                    setWaitlistTickets(waitlistTicketsResponse.data);
                } else {
                    setError('No waitlist tickets are available for this event.');
                    setLoading(false);
                    return;
                }

                // Get waitlist data for this user and event
                // Note: This is commented out for the demo, we don't need to check waitlist status
                // We only need to display available waitlist tickets
                /*
                const waitlistResponse = await waitingListService.getUserWaitingList(userEmail);
                
                // Find any waitlist entry for this event (approved or pending)
                const userWaitlistForEvent = waitlistResponse.data.find(
                    wl => wl.event === id
                );

                if (!userWaitlistForEvent) {
                    // If waitlist data is empty
                    if (waitlistResponse.data.length === 0) {
                        setError('You do not have any waitlist entries for events.');
                    } 
                    // If no waitlist for this event at all
                    else {
                        setError('You do not have a waitlist entry for this event.');
                    }
                    setLoading(false);
                    return;
                }

                // Set pending demo flag if status is pending
                if (userWaitlistForEvent.status === 'pending') {
                    setIsPendingDemo(true);
                }

                setWaitlist(userWaitlistForEvent);
                */

                // Enable demo mode since we're not checking waitlist status
                setIsPendingDemo(true);

                // Format waitlist tickets to be compatible with SeatMap
                const formattedWaitlistTickets: Ticket[] = waitlistTicketsResponse.data.map((wt: WaitlistTicket) => {
                    // Hitung jumlah kolom dan baris secara dinamis
                    // Maksimal 10 kursi per baris
                    const maxColumns = 10;
                    const totalSeats = wt.quantity;
                    const rows = Math.ceil(totalSeats / maxColumns);
                    // Perhitungan kolom hanya untuk baris terakhir yang mungkin tidak penuh
                    const lastRowColumns = totalSeats % maxColumns || maxColumns;

                    return {
                        _id: wt._id,
                        id: wt._id, // Add required id field
                        name: wt.name,
                        description: wt.description,
                        price: wt.price,
                        quantity: wt.quantity,
                        seatArrangement: {
                            rows: rows,
                            columns: maxColumns,
                            lastRowColumns: lastRowColumns // Tambahkan informasi kolom di baris terakhir
                        },
                        bookedSeats: [],  // Assume all seats are available for waitlist
                        event: wt.event
                    }
                });

                // Generate seat maps specifically for waitlist tickets
                const waitlistSeats = generateSeatsFromTickets({
                    ...eventData,
                    tickets: formattedWaitlistTickets
                });

                setGeneratedSeats(waitlistSeats);
            } catch (err) {
                console.error('Error fetching event details:', err);
                setError('Failed to load event and waitlist details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, isAuthenticated, user, authLoading]);

    // Handle seat click
    const handleSeatClick = (seatId: string, ticketTypeId: string) => {
        const combinedId = `${ticketTypeId}:${seatId}`;

        if (selectedSeats.includes(combinedId)) {
            setSelectedSeats(selectedSeats.filter(seat => seat !== combinedId));
        } else {
            // Limit number of seats based on ticket quantity
            const ticketType = event?.tickets.find(t => t._id === ticketTypeId);
            const maxSeats = ticketType?.quantity || 10;

            // Count how many seats are selected from this ticket type
            const sameTicketSeats = selectedSeats.filter(seat =>
                seat.startsWith(`${ticketTypeId}:`)
            ).length;

            if (sameTicketSeats < maxSeats) {
                setSelectedSeats([...selectedSeats, combinedId]);
            } else {
                // Add notification that exceeds maximum
                alert(`Maximum booking for this ticket type is ${maxSeats} seats`);
            }
        }
    };

    // Remove all selected seats
    const handleRemoveSelection = () => {
        setSelectedSeats([]);
    };

    // Calculate total price based on selected seats
    useEffect(() => {
        if (!generatedSeats || generatedSeats.length === 0) return;

        // Calculate total based on selected seat prices
        let total = 0;

        // Find price for each selected seat
        selectedSeats.forEach(combinedId => {
            const parts = combinedId.split(':');
            if (parts.length < 2) return;

            const ticketTypeId = parts[0];
            const seatId = parts[1];

            const seat = generatedSeats.find(s =>
                s.id === seatId && s.ticketTypeId === ticketTypeId
            );

            if (seat) {
                total += seat.price;
            }
        });

        setTotalPrice(total);
    }, [selectedSeats, generatedSeats]);

    // Loading view - tambahkan kondisi authLoading
    if (authLoading || loading) {
        return (
            <main>
                <Navbar />
                <div className="py-48 px-4 max-w-6xl mx-auto flex items-center justify-center">
                    <div className="flex flex-col items-center">
                        <FaSpinner className="animate-spin text-primary text-4xl mb-4" />
                        <p>{authLoading ? 'Verifying your session...' : 'Loading event information...'}</p>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    // Error view - show specific messages for different waitlist statuses
    if (error || !event) {
        return (
            <main>
                <Navbar />
                <div className="py-6 md:py-28 px-4 max-w-6xl mx-auto">
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error || 'Event not found'}</span>
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
        <main className='bg-secondary'>
            <Navbar />
            <div className="py-28 px-4 mx-auto bg-secondary">
                <div className="flex items-center mb-4 md:mb-8">
                    <Link to={`/event/${id}`} className="text-primary font-medium flex items-center text-sm md:text-base">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                        Back to Event Details
                    </Link>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-4">Waitlist Booking</h2>

                <div className="flex flex-col md:flex-row gap-4">
                    {/* Seat map */}
                    <div className="bg-gray-200 rounded-lg p-2 md:p-4 w-full md:w-[70%] overflow-x-auto">
                        {generatedSeats.length > 0 ? (
                            <SeatMap
                                tickets={waitlistTickets.map(wt => {
                                    // Hitung jumlah kolom dan baris secara dinamis
                                    // Maksimal 10 kursi per baris
                                    const maxColumns = 10;
                                    const totalSeats = wt.quantity;
                                    const rows = Math.ceil(totalSeats / maxColumns);
                                    // Perhitungan kolom hanya untuk baris terakhir yang mungkin tidak penuh
                                    const lastRowColumns = totalSeats % maxColumns || maxColumns;

                                    return {
                                        _id: wt._id,
                                        id: wt._id,
                                        name: wt.name,
                                        description: wt.description,
                                        price: wt.price,
                                        quantity: wt.quantity,
                                        seatArrangement: {
                                            rows: rows,
                                            columns: maxColumns,
                                            lastRowColumns: lastRowColumns // Tambahkan informasi kolom di baris terakhir
                                        },
                                        bookedSeats: []
                                    }
                                })}
                                generatedSeats={generatedSeats}
                                selectedSeats={selectedSeats}
                                onSeatClick={handleSeatClick}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
                                <FaInfoCircle className="text-blue-500 text-4xl mb-3" />
                                <p className="text-gray-700 text-center font-medium">
                                    No seats available for waitlist at this time.
                                </p>
                                <p className="text-gray-500 text-sm text-center mt-2 max-w-md">
                                    Please check back later or contact the event organizer for more information.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Event details and seat selection */}
                    <div className="w-full md:w-[30%]">
                        <EventSummary
                            event={event}
                            selectedSeats={selectedSeats}
                            generatedSeats={generatedSeats}
                            onRemoveSelection={handleRemoveSelection}
                            eventId={id || ''}
                            isWaitlist={true}
                            waitlistTickets={waitlistTickets.map(ticket => ({
                                _id: ticket._id,
                                name: ticket.name,
                                description: ticket.description,
                                price: ticket.price
                            }))}
                        />
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
} 