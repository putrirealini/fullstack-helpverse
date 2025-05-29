import axios from 'axios';

// Interface for waiting list data
export interface WaitingList {
  _id: string;
  name: string;
  email: string;
  phone: string;
  event: string; // Event ID
  status: 'pending' | 'approved' | 'rejected' | 'orderCompleted';
  registeredAt: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for waiting list response data
export interface WaitingListResponse {
  success: boolean;
  count: number;
  data: WaitingList[];
  message?: string;
}

// Interface for waiting list input data
export interface WaitingListInput {
  name: string;
  email: string;
  phone?: string;
  event: string; // Event ID
}

// Interface for waitlist ticket data
export interface WaitlistTicket {
  _id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  originalTicketRef: string;
  event: string; // Event ID
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

// Interface for waitlist ticket response data
export interface WaitlistTicketResponse {
  success: boolean;
  data: WaitlistTicket[];
  message?: string;
}

// Interface for creating waitlist ticket
export interface WaitlistTicketInput {
  name: string;
  description: string;
  price: number;
  quantity: number;
  originalTicketRef: string;
}

// API Base URL
const API_URL = 'http://localhost:5000';

// Function to get token from localStorage
const getToken = () => localStorage.getItem('token');

// Waiting list service
export const waitingListService = {
  /**
   * Register to waiting list
   * @param waitingListData Waiting list data
   * @returns Response from API
   */
  async registerToWaitingList(waitingListData: WaitingListInput): Promise<WaitingListResponse> {
    try {
      const response = await fetch(`${API_URL}/api/waiting-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(waitingListData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to register to waiting list');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error registering to waiting list:', error);
      throw error;
    }
  },

  /**
   * Get waiting list based on email
   * @param email User's email
   * @returns Response from API
   */
  async getUserWaitingList(email: string): Promise<WaitingListResponse> {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('You must be logged in first');
      }
      
      const response = await fetch(`${API_URL}/api/waiting-list?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user waiting list data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching user waiting list data:', error);
      throw error;
    }
  },

  /**
   * Get all waiting list data (Admin)
   * @param filters Filters for waiting list
   * @returns Response from API
   */
  async getWaitingList(filters = {}): Promise<WaitingListResponse> {
    try {
      const queryParams = new URLSearchParams(filters as Record<string, string>);
      const token = getToken();
      
      if (!token) {
        throw new Error('You must be logged in first');
      }
      
      const response = await fetch(`${API_URL}/api/waiting-list/admin?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch waiting list data');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching waiting list data:', error);
      throw error;
    }
  },

  /**
   * Update waiting list status (Admin)
   * @param waitingListId Waiting list ID
   * @param updateData Data to update
   * @returns Response from API
   */
  async updateWaitingListStatus(
    waitingListId: string, 
    updateData: { status: 'pending' | 'approved' | 'rejected' | 'orderCompleted', notes?: string }
  ): Promise<any> {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('You must be logged in first');
      }
      
      const response = await fetch(`${API_URL}/api/waiting-list/admin/${waitingListId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update waiting list status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating waiting list status:', error);
      throw error;
    }
  },

  /**
   * Get waitlist tickets for an event - sesuai dokumentasi API
   * @param eventId Event ID
   * @returns Response from API containing waitlist tickets
   */
  async getEventWaitlistTickets(eventId: string): Promise<WaitlistTicketResponse> {
    try {
      // Menggunakan endpoint yang sesuai dengan dokumentasi API
      const response = await fetch(`${API_URL}/api/events/${eventId}/waitlist-tickets`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch waitlist tickets');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching waitlist tickets:', error);
      throw error;
    }
  },

  /**
   * Create waitlist ticket for an event - sesuai dokumentasi API
   * @param eventId Event ID
   * @param ticketData Waitlist ticket data
   * @returns Response from API containing created waitlist ticket
   */
  async createEventWaitlistTicket(eventId: string, ticketData: WaitlistTicketInput): Promise<any> {
    try {
      const token = getToken();
      
      if (!token) {
        throw new Error('You must be logged in first');
      }
      
      // Menggunakan endpoint yang sesuai dengan dokumentasi API
      const response = await fetch(`${API_URL}/api/events/${eventId}/waitlist-tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create waitlist ticket');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating waitlist ticket:', error);
      throw error;
    }
  }
}; 