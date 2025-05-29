import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services/notification';
import type { Notification } from '../services/notification';
import { useAuth } from '../contexts/auth';

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();

  const fetchNotifications = useCallback(async () => {
    // Hanya mengambil notifikasi jika user terautentikasi dan memiliki role 'user'
    if (!isAuthenticated || user?.role !== 'user') {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await notificationService.getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter(notification => !notification.isRead).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Gagal mengambil notifikasi');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      const updatedNotification = await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id || notification._id === id 
            ? updatedNotification 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError(err instanceof Error ? err.message : 'Gagal menandai notifikasi sebagai telah dibaca');
      return false;
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      const success = await notificationService.deleteNotification(id);
      if (success) {
        const deletedNotification = notifications.find(
          notification => notification.id === id || notification._id === id
        );
        
        setNotifications(prev => 
          prev.filter(notification => 
            notification.id !== id && notification._id !== id
          )
        );
        
        // Update unread count jika yang dihapus adalah notifikasi yang belum dibaca
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
      return success;
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err instanceof Error ? err.message : 'Gagal menghapus notifikasi');
      return false;
    }
  }, [notifications]);

  // Mengambil notifikasi saat komponen dimount dan ketika status autentikasi berubah
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    deleteNotification
  };
} 