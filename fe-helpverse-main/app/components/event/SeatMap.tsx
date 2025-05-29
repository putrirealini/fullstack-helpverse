import { useMemo } from 'react';
import type { Ticket } from '~/services/event';

// Interface for generated seat
export interface GeneratedSeat {
  id: string;
  row: string;
  column: string;
  status: 'available' | 'reserved' | 'booked' | 'selected';
  price: number;
  ticketTypeId: string;
}

// Seat status types for UI display
type SeatStatus = 'available' | 'selected' | 'sold';

interface SeatMapProps {
  tickets: Ticket[];
  generatedSeats: GeneratedSeat[];
  selectedSeats: string[];
  onSeatClick: (seatId: string, ticketTypeId: string) => void;
}

export default function SeatMap({ tickets, generatedSeats, selectedSeats, onSeatClick }: SeatMapProps) {
  // Function to format Malaysian Ringgit currency
  const formatRinggit = (amount: number | string) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `RM ${numAmount.toFixed(0)}`;
  };

  // Determine seat status
  const getSeatStatus = (seatId: string, ticketTypeId: string): SeatStatus => {
    // Check if this exact seat (with ticketTypeId) is selected
    if (selectedSeats.includes(`${ticketTypeId}:${seatId}`)) return 'selected';

    // Find the seat in generatedSeats
    const seat = generatedSeats.find(seat => seat.id === seatId && seat.ticketTypeId === ticketTypeId);

    // If seat is found and status is 'reserved' or 'booked', then seat is sold/reserved
    if (seat) {
      const seatStatus = seat.status;
      if (seatStatus === 'reserved' || seatStatus === 'booked') {
        return 'sold';
      }
    }

    return 'available';
  };

  // Render a single seat
  const renderSeat = (seat: GeneratedSeat) => {
    const status = getSeatStatus(seat.id, seat.ticketTypeId);
    const displayNumber = seat.column;
    const uniqueSeatId = `${seat.ticketTypeId}:${seat.id}`;

    return (
      <div
        key={uniqueSeatId}
        onClick={() => status !== 'sold' ? onSeatClick(seat.id, seat.ticketTypeId) : null}
        className={`w-6 h-6 rounded-sm text-[10px] flex items-center justify-center cursor-pointer mx-0.5 ${
          status === 'available' ? 'bg-gray-300 hover:bg-gray-400' :
          status === 'selected' ? 'bg-blue-500 text-white' :
          'bg-red-700 text-white cursor-not-allowed'
        }`}
        title={`Seat ${seat.id} - ${formatRinggit(seat.price)}`}
      >
        {displayNumber}
      </div>
    );
  };

  // Group seats by ticket type
  const seatsByTicketType = useMemo(() => {
    const result: Record<string, Record<string, GeneratedSeat[]>> = {};

    // Include all seats, including booked ones - remove this filter
    const visibleSeats = generatedSeats;

    // Group seats by ticketTypeId and row
    visibleSeats.forEach(seat => {
      if (!result[seat.ticketTypeId]) {
        result[seat.ticketTypeId] = {};
      }
      
      if (!result[seat.ticketTypeId][seat.row]) {
        result[seat.ticketTypeId][seat.row] = [];
      }
      
      result[seat.ticketTypeId][seat.row].push(seat);
    });

    // Sort seats in each row by column
    Object.keys(result).forEach(ticketId => {
      Object.keys(result[ticketId]).forEach(row => {
        result[ticketId][row].sort((a, b) => {
          return parseInt(a.column) - parseInt(b.column);
        });
      });
    });

    return result;
  }, [generatedSeats, selectedSeats]);

  // Check if there are any seats
  const hasSeats = generatedSeats.length > 0;

  if (!hasSeats) {
    return (
      <div className="text-center p-4 bg-yellow-100 rounded-lg">
        <p>No seats available for this event.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Legend for seat colors */}
      <div className="flex justify-between items-center mb-2 md:mb-4 w-full">
        <div className="flex mx-auto space-x-2 md:space-x-4">
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="w-3 h-3 md:w-4 md:h-4 bg-gray-300 rounded-sm"></div>
            <span className="text-xs md:text-sm">Available</span>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="w-3 h-3 md:w-4 md:h-4 bg-blue-500 rounded-sm"></div>
            <span className="text-xs md:text-sm">Selected</span>
          </div>
          <div className="flex items-center space-x-1 md:space-x-2">
            <div className="w-3 h-3 md:w-4 md:h-4 bg-red-700 rounded-sm"></div>
            <span className="text-xs md:text-sm">Sold</span>
          </div>
        </div>
      </div>

      {/* STAGE area */}
      <div className="bg-gray-300 text-center py-1 md:py-2 mb-2 md:mb-4 text-gray-700 font-medium max-w-2xl mx-auto text-sm md:text-base w-full">
        STAGE
      </div>

      {/* Render seats for each ticket type */}
      {tickets.map(ticket => {
        const ticketId = ticket._id;
        const ticketSeats = seatsByTicketType[ticketId];
        
        if (!ticketSeats || Object.keys(ticketSeats).length === 0) return null;

        // Sort rows
        const rowLabels = Object.keys(ticketSeats).sort();

        // Choose header color based on ticket type
        let headerClass = 'bg-primary';
        
        if (ticket.name === 'VIP' || ticket.name?.includes('VIP')) {
          headerClass = 'bg-purple-600';
        } else if (ticket.name === 'Regular' || ticket.name?.includes('Regular')) {
          headerClass = 'bg-indigo-600';
        } else if (ticket.name === 'Economy' || ticket.name?.includes('Economy')) {
          headerClass = 'bg-gray-600';
        }

        const ticketName = ticket.name || `Ticket ${formatRinggit(ticket.price)}`;

        return (
          <div key={`ticket-${ticketId}`} className="w-full mb-8">
            <div className={`text-center py-2 mb-4 ${headerClass} text-white font-medium w-full rounded-sm`}>
              <span>{ticketName} - {formatRinggit(ticket.price)}</span>
            </div>

            {rowLabels.map((rowLabel, rowIndex) => {
              const rowSeats = ticketSeats[rowLabel];
              // Tentukan jumlah kolom yang harus ditampilkan berdasarkan baris
              const isLastRow = rowIndex === rowLabels.length - 1;
              const columnsToShow = isLastRow && ticket.seatArrangement?.lastRowColumns 
                ? ticket.seatArrangement.lastRowColumns 
                : ticket.seatArrangement?.columns || 10;

              return (
                <div className="flex items-center justify-center my-1.5" key={`${ticketId}-${rowLabel}`}>
                  <div className="w-6 h-6 flex items-center justify-center text-[10px] font-bold">
                    {rowLabel}
                  </div>
                  <div className="flex flex-wrap justify-center">
                    {/* Create a grid with seats according to the calculated columns for this row */}
                    {Array.from({ length: columnsToShow }).map((_, index) => {
                      const columnNumber = index + 1;
                      const seatForThisPosition = rowSeats.find(seat => parseInt(seat.column) === columnNumber);
                      
                      // If seat exists, render it
                      if (seatForThisPosition) {
                        return renderSeat(seatForThisPosition);
                      }
                      
                      // If no seat is found for this position, render placeholder or sold seat
                      return (
                        <div
                          key={`placeholder-${rowLabel}-${columnNumber}`}
                          className="w-6 h-6 rounded-sm text-[10px] flex items-center justify-center mx-0.5 bg-red-700 text-white cursor-not-allowed"
                          title={`Seat ${rowLabel}${columnNumber} - Sold/Unavailable`}
                        >
                          {columnNumber}
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center text-[10px] font-bold">
                    {rowLabel}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
} 