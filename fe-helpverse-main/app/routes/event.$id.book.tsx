import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router';
import { Navbar } from '~/components/navbar';
import { Footer } from '~/components/footer';
import { FaSpinner } from 'react-icons/fa';
import { eventService } from '~/services/event';
import type { Event } from '~/services/event';
import SeatMap from '~/components/event/SeatMap';
import type { GeneratedSeat } from '~/components/event/SeatMap';
import EventSummary from '~/components/event/EventSummary';
import { generateSeatsFromTickets } from '~/utils/seats';

interface LocationState {
    preserveSelections?: boolean;
    selectedSeats?: string[];
}

export function meta() {
    return [
        { title: "Book Tickets - HELPVerse" },
        { name: "description", content: "Book tickets for this event" },
    ];
}

export default function EventBookingPage() {
    const { id } = useParams();
    const location = useLocation();
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [totalPrice, setTotalPrice] = useState(0);
    const [generatedSeats, setGeneratedSeats] = useState<GeneratedSeat[]>([]);

    // Restore selected seats if navigating back from payment page
    useEffect(() => {
        if (location.state) {
            const state = location.state as LocationState;
            if (state.preserveSelections && state.selectedSeats) {
                setSelectedSeats(state.selectedSeats);
            }
        }
    }, [location.state]);

    // Function to load event data
    useEffect(() => {
        const fetchEventDetail = async () => {
            try {
                setLoading(true);
                if (!id) {
                    setError('Event ID is required');
                    return;
                }

                // Get event data from API
                const eventData = await eventService.getEventById(id);

                // Generate seats from ticket data
                const seats = generateSeatsFromTickets(eventData);
                setGeneratedSeats(seats);

                setEvent(eventData);
            } catch (err) {
                console.error('Error fetching event details:', err);
                setError('Failed to load event details. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchEventDetail();
    }, [id]);

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

                <div className="flex flex-col md:flex-row gap-4">
                    {/* Seat map */}
                    <div className="bg-gray-200 rounded-lg p-2 md:p-4 w-full md:w-[70%] overflow-x-auto">
                        <SeatMap
                            tickets={event.tickets}
                            generatedSeats={generatedSeats}
                            selectedSeats={selectedSeats}
                            onSeatClick={handleSeatClick}
                        />
                    </div>

                    {/* Event details and seat selection */}
                    <div className="w-full md:w-[30%]">
                        <EventSummary
                            event={event}
                            selectedSeats={selectedSeats}
                            generatedSeats={generatedSeats}
                            onRemoveSelection={handleRemoveSelection}
                            eventId={id || ''}
                        />
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
} 