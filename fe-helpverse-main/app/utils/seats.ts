import type { Event, Ticket } from '~/services/event';
import type { GeneratedSeat } from '~/components/event/SeatMap';

/**
 * Generates seats from available tickets in an event
 * @param event Event data
 * @returns Array of GeneratedSeat
 */
export function generateSeatsFromTickets(event: Event): GeneratedSeat[] {
  if (!event.tickets || event.tickets.length === 0) return [];

  const allSeats: GeneratedSeat[] = [];

  // For each ticket type, create seats based on rows and columns
  event.tickets.forEach(ticket => {
    if (!ticket.seatArrangement) return;

    const { rows, columns } = ticket.seatArrangement;
    const lastRowColumns = ticket.seatArrangement.lastRowColumns || columns;
    
    // Use letters for rows (A, B, C, ...)
    const rowLabels = Array.from({ length: rows }, (_, i) => 
      String.fromCharCode(65 + i)
    );
    
    // Map for numeric row to letter row (1 => 'A', 2 => 'B', etc.)
    const numericToLetterMap = new Map();
    for (let i = 1; i <= rows; i++) {
      numericToLetterMap.set(i, String.fromCharCode(64 + i)); // ASCII 'A' is 65
    }

    // For each row and column, create a seat
    rowLabels.forEach((row, rowIndex) => {
      // Tentukan jumlah kolom untuk baris ini
      const isLastRow = rowIndex === rows - 1;
      const columnsForThisRow = isLastRow ? lastRowColumns : columns;
      
      for (let col = 1; col <= columnsForThisRow; col++) {
        const seatId = `${row}${col}`;
        const numericRow = rowIndex + 1; // 1-based row number

        // Check if seat is already booked
        const isBooked = ticket.bookedSeats?.some(bookedSeat => {
          // Check for different formats of booked seats
          if (typeof bookedSeat === 'string') {
            return bookedSeat === seatId;
          } else if (typeof bookedSeat === 'object') {
            // Match both ways: numeric row to letter AND letter to numeric
            const bookedRow = bookedSeat.row;
            const bookedCol = bookedSeat.column;
            
            // Check if numeric row matches with the current row letter
            if (typeof bookedRow === 'number') {
              return bookedRow === numericRow && bookedCol.toString() === col.toString();
            }
            
            // Or if row is already a letter like 'A', 'B', etc.
            return String(bookedRow) === row && String(bookedCol) === String(col);
          }
          return false;
        }) || false;

        allSeats.push({
          id: seatId,
          row,
          column: String(col),
          status: isBooked ? 'booked' : 'available',
          price: ticket.price,
          ticketTypeId: ticket._id
        });
      }
    });
  });

  return allSeats;
}

/**
 * Formats currency to Malaysian Ringgit format
 * @param amount Amount in number or string
 * @returns Formatted string (e.g., "RM 25.00")
 */
export function formatRinggit(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `RM ${numAmount.toFixed(0)}`;
}

/**
 * Formats date to a more readable format
 * @param dateString Date as string or Date object
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return String(dateString);
  }
} 