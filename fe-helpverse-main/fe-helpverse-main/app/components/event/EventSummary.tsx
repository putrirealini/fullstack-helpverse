import { Link } from 'react-router';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import type { Event } from '~/services/event';
import type { GeneratedSeat } from './SeatMap';
import { useAuth } from '~/contexts/auth';

interface EventSummaryProps {
  event: Event;
  selectedSeats: string[];
  generatedSeats: GeneratedSeat[];
  onRemoveSelection: () => void;
  eventId: string;
  isWaitlist?: boolean;
  waitlistTickets?: any[];
}

export default function EventSummary({
  event,
  selectedSeats,
  generatedSeats,
  onRemoveSelection,
  eventId,
  isWaitlist = false,
  waitlistTickets = []
}: EventSummaryProps) {


  const { user, loading } = useAuth();

  const isAdmin = user?.role === "admin";
  const isEventOrganizer = user?.role === "eventOrganizer";
  const isRegularUser = !user || user.role === "user";

  // Get the actual seat IDs from the combined format "ticketTypeId:seatId"
  const getActualSeatIds = () => {
    return selectedSeats.map(combinedId => {
      const parts = combinedId.split(':');
      return parts.length > 1 ? parts[1] : combinedId;
    });
  };

  // Get the ticket names for selected seats
  const getSelectedTicketNames = () => {
    if (selectedSeats.length === 0 || generatedSeats.length === 0 || !event.tickets) {
      return '';
    }

    const ticketNames = selectedSeats.map(combinedId => {
      const parts = combinedId.split(':');
      const ticketTypeId = parts.length > 1 ? parts[0] : '';
      const seatId = parts.length > 1 ? parts[1] : combinedId;

      const seat = generatedSeats.find(s => s.id === seatId && s.ticketTypeId === ticketTypeId);
      if (!seat) return '';

      const ticket = event.tickets.find(t => t._id === seat.ticketTypeId);
      return ticket ? ticket.name : '';
    }).filter(Boolean);

    // Return unique ticket names
    return [...new Set(ticketNames)].join(', ');
  };

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!generatedSeats || generatedSeats.length === 0) return 0;

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

    return total;
  };

  // Prepare data to send to payment page
  const preparePaymentData = () => {
    // Get the clean seat IDs without the ticketType prefix
    const cleanSeatIds = getActualSeatIds();
    console.log("Selected seats for payment:", cleanSeatIds);

    // For waitlist bookings, make sure we include complete waitlist ticket info
    const fullWaitlistTickets = isWaitlist && waitlistTickets ? 
      waitlistTickets.map(ticket => ({
        _id: ticket._id,
        name: ticket.name,
        description: ticket.description || '',
        price: ticket.price || 0
      })) : undefined;

    return {
      eventData: {
        id: eventId,
        name: event.name,
        image: `http://localhost:5000${event.image}`,
        date: typeof event.date === 'object'
          ? event.date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
          : event.date,
        time: event.time,
        location: event.location
      },
      selectedSeats: selectedSeats,
      selectedSeatsLabels: cleanSeatIds,
      ticketType: getSelectedTicketNames(),
      totalPrice: calculateTotalPrice(),
      isWaitlist: isWaitlist,
      waitlistTickets: fullWaitlistTickets
    };
  };

  // Prepare data to send to waitlist page
  const prepareWaitlistData = () => {
    return {
      eventData: {
        id: eventId,
        name: event.name,
        image: `http://localhost:5000${event.image}`,
        date: typeof event.date === 'object'
          ? event.date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
          : event.date,
        time: event.time,
        location: event.location
      }
    };
  };

  return (
    <div className="bg-primary text-white rounded-lg p-4 md:p-6 h-fit">
      <div className="flex mb-4 gap-4">
        <img
          src={`http://localhost:5000${event.image}`}
          alt={event.name}
          className="w-20 h-24 object-cover rounded flex-shrink-0"
        />
        <div className="flex flex-col min-w-0">
          <h2 className="text-lg font-bold line-clamp-2">{event.name}</h2>
          <div className="mt-2 space-y-2">
            <div className="flex items-start gap-2">
              <FaMapMarkerAlt className="w-4 h-4 opacity-80 flex-shrink-0 mt-0.5" />
              <span className="text-sm line-clamp-2">{event.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="w-4 h-4 opacity-80 flex-shrink-0" />
              <span className="text-sm">
                {typeof event.date === 'object'
                  ? event.date.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
                  : event.date}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="w-4 h-4 opacity-80 flex-shrink-0" />
              <span className="text-sm">{event.time}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-6">
        <h3 className="text-sm md:text-lg mb-1 md:mb-2">Seat Numbers</h3>
        <p className="text-gray-300 text-xs md:text-sm">
          {selectedSeats.length > 0
            ? getActualSeatIds().join(', ')
            : 'No seats selected yet'}
        </p>
        <p className="text-sm mt-1 font-bold">
          {selectedSeats.length} {selectedSeats.length === 1 ? 'seat' : 'seats'} selected
        </p>
        <p className='text-xs mt-1'>
          {selectedSeats.length > 0 ? getSelectedTicketNames() : 'Please select seats'}
        </p>
      </div>

      <div className="mt-6 md:mt-8">
        <div className="flex flex-col gap-3">
          <div className='flex gap-2'>
            <button
              onClick={onRemoveSelection}
              className="bg-gray-200 p-2 text-sm rounded-full font-bold text-primary cursor-pointer w-full"
              disabled={selectedSeats.length === 0}
            >
              Clear Selection
            </button>

            <Link
              to={selectedSeats.length > 0 && !isEventOrganizer && !isAdmin ? `/event/${eventId}/payment` : '#'}
              state={selectedSeats.length > 0 && !isEventOrganizer && !isAdmin ? preparePaymentData() : undefined}
              className={`bg-[#FEB32B] p-2 rounded-full font-bold text-white cursor-pointer w-full text-center text-sm ${
                selectedSeats.length === 0 || isEventOrganizer || isAdmin ? 'cursor-not-allowed opacity-60' : 'hover:translate-y-[-2px]'
              }`}
              onClick={(e) => {
                if (selectedSeats.length === 0 || isEventOrganizer || isAdmin) {
                  e.preventDefault();
                }
              }}
            >
              Next
            </Link>
          </div>

          {/* Jangan tampilkan tombol Join Waitlist jika sudah di halaman waitlist */}
          {!isWaitlist && (
            <Link
              to={`/event/${eventId}/join-waitlist`}
              state={prepareWaitlistData()}
              className="bg-gray-200 p-2 rounded-full font-bold text-primary cursor-pointer text-center text-sm hover:bg-gray-300 transition-all"
            >
              Join Waitlist
            </Link>
          )}

          {isWaitlist && (
            <div className="mt-2 text-center">
              <p className="text-xs text-green-300 font-semibold mb-2">
                Booking from approved waitlist allocation
              </p>
              {waitlistTickets && waitlistTickets.length > 0 && (
                <div className="mt-3 bg-gray-800 p-2 rounded text-xs">
                  <p className="mb-2 text-center font-semibold">Available Waitlist Tickets</p>
                  <ul className="space-y-2">
                    {waitlistTickets.map(ticket => (
                      <li key={ticket._id} className="bg-gray-700 p-2 rounded flex justify-between">
                        <span>{ticket.name}</span>
                        <span className="font-bold">RM {ticket.price.toLocaleString('en-US')}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className='text-xs text-red-500 mt-1'>
            {isEventOrganizer ? 'Your role is event organizer, you can\'t book tickets' : ''}
            {isAdmin ? 'Your role is admin, you can\'t book tickets' : ''}
          </p>
        </div>
      </div>
    </div>
  );
} 