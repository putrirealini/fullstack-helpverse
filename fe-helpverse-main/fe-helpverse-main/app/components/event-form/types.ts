export interface TicketType {
  id: string;
  name: string;
  description: string;
  price: string;
  quantity: number;
  limit?: string;
  rows?: number;
  columns?: number;
  startDate?: string;
  endDate?: string;
  saleEndDate?: string;
  seatArrangement?: {
    rows: number;
    columns: number;
  };
  maxPerOrder?: number | string;
  category?: string;
}

export interface Section {
  id: string;
  name: string;
  capacity: number;
  rows: number;
  columns: number;
  seats: Seat[][];
  price: number;
}

export interface Seat {
  id: string;
  row: string;
  column: string;
  status: 'available' | 'reserved' | 'selected' | 'booked';
  price: number;
  ticketTypeId?: string;
}

export interface PromotionalOffer {
  id: string;
  name: string;
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses: number;
  currentUses: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

export interface EventDetails {
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  address?: string;
  image?: string;
  tags?: string[];
}

export interface SeatArrangement {
  rows: number;
  columns: number;
  seats: Seat[];
}

export interface BookedSeat {
  row: number;
  column: number;
  bookingId: string;
}

export interface NewSection {
  name: string;
  rows: number;
  columns: number;
  price: number;
} 