import { useState, useEffect } from 'react';
import { eventService } from '~/services/event';
import type { Event, BookingParams } from '~/services/event';
import { orderService } from '~/services/order';
import type { Order, CreateOrderParams, DisplayBooking } from '~/services/order';

// Custom hook untuk mengambil daftar event
export const useEventList = (page = 1, limit = 10, search = '') => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(page);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await eventService.getAllEvents(page, limit, search);
        setEvents(response.events);
        setTotal(response.total);
        setCurrentPage(response.page);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError(err instanceof Error ? err.message : 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [page, limit, search]);

  return { events, loading, error, total, currentPage };
};

// Custom hook untuk mengambil detail event berdasarkan ID
export const useEventDetail = (id: string | undefined) => {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventDetail = async () => {
      if (!id) {
        setError('Event ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const eventData = await eventService.getEventById(id);
        setEvent(eventData);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err instanceof Error ? err.message : 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetail();
  }, [id]);

  return { event, loading, error };
};

// Custom hook untuk membuat event baru
export const useCreateEvent = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [createdEvent, setCreatedEvent] = useState<Event | null>(null);

  const createEvent = async (eventData: Omit<Event, 'id' | '_id'>) => {
    try {
      setLoading(true);
      setError(null);
      const newEvent = await eventService.createEvent(eventData);
      setCreatedEvent(newEvent);
      return newEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Failed to create event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createEvent, loading, error, createdEvent };
};

// Custom hook untuk membuat booking
export const useCreateBooking = (eventId: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);

  const createBooking = async (bookingData: BookingParams) => {
    try {
      setLoading(true);
      setError(null);
      const newBooking = await eventService.createBooking(eventId, bookingData);
      setBooking(newBooking);
      return newBooking;
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err instanceof Error ? err.message : 'Failed to create booking');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createBooking, loading, error, booking };
};

// Custom hook untuk operasi order/booking
export const useOrders = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<DisplayBooking[]>([]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrders();
      const transformedOrders = response.map(order => 
        orderService.transformBookingForDisplay(order)
      );
      setOrders(transformedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      await orderService.cancelOrder(orderId);
      // Refresh orders after cancellation
      await fetchOrders();
    } catch (err) {
      console.error('Error cancelling order:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel order');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { orders, loading, error, fetchOrders, cancelOrder };
};

// Custom hook untuk detail order
export const useOrderDetail = (orderId: string) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<DisplayBooking | null>(null);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await orderService.getOrderById(orderId);
      setOrder(orderService.transformBookingForDisplay(response));
    } catch (err) {
      console.error('Error fetching order detail:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch order detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  return { order, loading, error, fetchOrderDetail };
}; 