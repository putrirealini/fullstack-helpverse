import axios from 'axios';
import { authService } from './auth';

// Base URL untuk API
const API_URL = 'http://localhost:5000/api/orders';
const WAITLIST_API_URL = 'http://localhost:5000/api/waiting-list';

// Interface untuk data booking/order
export interface Order {
  id?: string;
  _id?: string;
  eventId: string;
  event?: {
    id?: string;
    _id?: string;
    name: string;
    image: string;
    location: string;
    date: string;
    time: string;
  };
  tickets: Array<{
    ticketType: string;
    quantity: number;
    seats: Array<{ row: number; column: number } | string>;
    price: number;
  }>;
  totalAmount: number;
  subtotal?: number;
  discount?: number;
  promoCode?: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentInfo: {
    method: string;
    transactionId: string;
    paidAt?: Date;
  };
  isWaitlist?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Interface untuk data pembuatan booking baru
export interface CreateOrderParams {
  eventId: string;
  tickets: Array<{
    ticketType: string;
    quantity: number;
    seats: Array<{ row: number; column: number }>;
    price?: number;
  }>;
  totalAmount?: number;
  discount?: number;
  promoCode?: string;
  paymentInfo: {
    method: string;
    transactionId: string;
  };
  isWaitlist?: boolean;
}

// Interface untuk hasil transformasi booking untuk tampilan
export interface DisplayBooking {
  id: string;
  eventId: string;
  eventName: string;
  eventImage: string;
  location: string;
  date: string;
  time: string;
  seats: string[];
  ticketType: string;
  totalPrice: number;
  subtotal?: number;
  discount?: number;
  promoCode?: string | null;
  promoDiscount?: number;
  status: 'active' | 'completed' | 'cancelled';
  paymentMethod: string;
  transactionId: string;
  bookingDate: string;
}

// Fungsi untuk mendapatkan token dari localStorage
const getToken = () => localStorage.getItem('token');

/**
 * Service untuk mengelola order/booking
 */
export const orderService = {
  /**
   * Membuat order baru
   * @param orderData Data untuk membuat order
   * @returns Order yang dibuat
   */
  async createOrder(orderData: CreateOrderParams): Promise<Order> {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('User tidak terautentikasi');
      }
      
      const response = await axios.post(API_URL, orderData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Gagal membuat order');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal membuat order');
      }
      throw error;
    }
  },
  
  /**
   * Mendapatkan daftar order pengguna yang login
   * @returns Daftar order
   */
  async getOrders(): Promise<Order[]> {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('User tidak terautentikasi');
      }
      
      const response = await axios.get(API_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Gagal mengambil data order');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal mengambil data order');
      }
      throw error;
    }
  },
  
  /**
   * Mendapatkan detail order berdasarkan ID
   * @param orderId ID order
   * @returns Detail order
   */
  async getOrderById(orderId: string): Promise<Order> {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('User tidak terautentikasi');
      }
      
      const response = await axios.get(`${API_URL}/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Gagal mengambil detail order');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal mengambil detail order');
      }
      throw error;
    }
  },
  
  /**
   * Membatalkan order
   * @param orderId ID order yang akan dibatalkan
   * @returns Order yang dibatalkan
   */
  async cancelOrder(orderId: string): Promise<Order> {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('User tidak terautentikasi');
      }
      
      const response = await axios.put(`${API_URL}/${orderId}/cancel`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        return response.data.data;
      }
      
      throw new Error(response.data.message || 'Gagal membatalkan order');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.message || 'Gagal membatalkan order');
      }
      throw error;
    }
  },
  
  /**
   * Mengubah format order dari API menjadi format yang sesuai untuk tampilan
   * @param order Order dari API
   * @returns Order dalam format tampilan
   */
  transformBookingForDisplay(order: Order): DisplayBooking {
    const id = order.id || order._id || '';
    const eventId = order.event?.id || order.event?._id || order.eventId || '';
    let status: 'active' | 'completed' | 'cancelled';
    
    // Transform status API ke status tampilan
    if (order.status === 'confirmed') {
      status = 'active';
    } else if (order.status === 'cancelled') {
      status = 'cancelled';
    } else {
      // Default untuk status yang tidak dikenal atau 'pending'
      status = 'active';
    }
    
    return {
      id,
      eventId,
      eventName: order.event?.name || 'Event',
      eventImage: order.event?.image || '/event-1.png',
      location: order.event?.location || 'Lokasi tidak tersedia',
      date: order.event?.date ? new Date(order.event.date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }) : 'Tanggal tidak tersedia',
      time: order.event?.time || 'Waktu tidak tersedia',
      seats: order.tickets?.[0]?.seats?.map((seat: any) => {
        // Handle different seat format possibilities
        if (typeof seat === 'string') {
          return seat;
        } else if (seat && typeof seat === 'object') {
          if (seat.row && seat.column) {
            return `${String.fromCharCode(65 + parseInt(seat.row) - 1)}${seat.column}`;
          } else if (seat.row && seat.col) {
            return `${String.fromCharCode(65 + parseInt(seat.row) - 1)}${seat.col}`;
          }
        }
        return 'Unknown';
      }) || [],
      ticketType: order.tickets?.[0]?.ticketType || 'Tiket Standar',
      totalPrice: order.totalAmount || 0,
      subtotal: order.subtotal || order.totalAmount || 0,
      discount: order.discount || 0,
      promoCode: order.promoCode || null,
      promoDiscount: 0, // Default value jika tidak ada di API
      status,
      paymentMethod: order.paymentInfo?.method || 'Unknown',
      transactionId: order.paymentInfo?.transactionId || 'Unknown',
      bookingDate: order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : '',
    };
  },
}; 