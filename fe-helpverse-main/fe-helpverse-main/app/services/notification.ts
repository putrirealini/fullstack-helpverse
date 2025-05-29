import axios from 'axios';

// Definisi tipe untuk notifikasi
export interface Notification {
  _id: string;
  id: string;
  recipient: string | {
    _id: string;
    username: string;
    email: string;
  };
  title: string;
  message: string;
  type: 'waitlist_ticket' | 'event_update' | 'order_confirmation' | 'system';
  eventId?: string;
  ticketId?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Interface untuk response dari API notifikasi
export interface NotificationResponse {
  success: boolean;
  count: number;
  data: Notification[];
  message?: string;
}

// Base URL dari API
const API_URL = 'http://localhost:5000';

// Fungsi untuk mengambil token dari localStorage
const getToken = () => localStorage.getItem('token');

// Axios instance dengan header Authorization
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token pada setiap request
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Fungsi untuk normalisasi data notifikasi
const normalizeNotification = (notificationData: any): Notification => {
  // Pastikan eventId adalah string
  let eventId = notificationData.eventId;
  if (eventId && typeof eventId === 'object') {
    // Jika eventId adalah objek, ambil properti id atau _id
    eventId = eventId._id || eventId.id || '';
  }

  return {
    _id: notificationData._id || notificationData.id || '',
    id: notificationData.id || notificationData._id || '',
    recipient: notificationData.recipient || '',
    title: notificationData.title || '',
    message: notificationData.message || '',
    type: notificationData.type || 'system',
    eventId: eventId || undefined,
    ticketId: notificationData.ticketId || undefined,
    isRead: notificationData.isRead || false,
    createdAt: notificationData.createdAt ? new Date(notificationData.createdAt) : new Date(),
    updatedAt: notificationData.updatedAt ? new Date(notificationData.updatedAt) : new Date()
  };
};

// Service notifikasi
export const notificationService = {
  /**
   * Mendapatkan semua notifikasi untuk user yang sedang login
   * @returns Array notifikasi
   */
  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get<NotificationResponse>('/api/notifications');
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return response.data.data.map(notification => normalizeNotification(notification));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Menandai notifikasi sebagai telah dibaca
   * @param id ID notifikasi
   * @returns Notifikasi yang diperbarui
   */
  async markAsRead(id: string): Promise<Notification> {
    try {
      const response = await api.put<{ success: boolean; data: any }>(`/api/notifications/${id}/read`);
      
      if (response.data.success && response.data.data) {
        return normalizeNotification(response.data.data);
      }
      
      throw new Error('Failed to mark notification as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Menghapus notifikasi
   * @param id ID notifikasi
   * @returns Success status
   */
  async deleteNotification(id: string): Promise<boolean> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/api/notifications/${id}`);
      
      return response.data.success;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}; 