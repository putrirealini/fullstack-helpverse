import { useRef, useEffect, useState } from 'react';
import { FaCheckCircle, FaTrash, FaTimes, FaTicketAlt } from 'react-icons/fa';
import type { Notification } from '../services/notification';
import { Link } from 'react-router';

interface NotificationPopoverProps {
  notifications: Notification[];
  loading: boolean;
  isOpen: boolean;
  onClose: () => void;
  onMarkAsRead: (id: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

export function NotificationPopover({
  notifications,
  loading,
  isOpen,
  onClose,
  onMarkAsRead,
  onDelete
}: NotificationPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Deteksi ukuran layar untuk responsivitas
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Deteksi klik di luar popover untuk menutup popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={`
        absolute mt-2 bg-white rounded-md shadow-lg overflow-hidden z-10 border border-gray-200
        w-[95vw] max-w-[360px] md:right-0 
        ${isMobile ? 'left-1/2 -translate-x-1/2' : 'right-0'}
      `}
    >
      <div className="flex justify-between items-center p-3 bg-primary text-white">
        <h3 className="font-semibold">Notifications</h3>
        <button onClick={onClose} className="hover:opacity-80">
          <FaTimes />
        </button>
      </div>

      <div className="max-h-[50vh] md:max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notifications</div>
        ) : (
          <ul>
            {notifications.map((notification) => (
              <li
                key={notification._id || notification.id}
                className={`border-b border-gray-100 last:border-b-0 p-3 ${!notification.isRead ? 'bg-blue-50' : ''}`}
              >
                <div className="flex justify-between">
                  <div className="flex-1 pr-2">
                    <h4 className="font-semibold text-sm">{notification.title}</h4>
                    <p className="text-sm text-gray-600 mb-1 break-words">{notification.message}</p>
                    <span className="text-xs text-gray-500">
                      {formatDate(new Date(notification.createdAt))}
                    </span>
                    
                    {/* Link ke halaman waitlist-book untuk notifikasi tipe waitlist_ticket */}
                    {notification.type === 'waitlist_ticket' && notification.eventId && (
                      <div className="mt-2">
                        <Link 
                          to={`/event/${notification.eventId}/waitlist-book`}
                          onClick={onClose}
                          className="flex items-center text-xs text-primary font-medium hover:underline"
                        >
                          <FaTicketAlt className="mr-1" /> Book Waitlist Ticket
                        </Link>
                      </div>
                    )}
                  </div>
                  <div className="flex items-start space-x-1 ml-2">
                    {!notification.isRead && (
                      <button
                        onClick={() => onMarkAsRead(notification._id || notification.id)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Mark as read"
                      >
                        <FaCheckCircle size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(notification._id || notification.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete notification"
                    >
                      <FaTrash size={16} />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
} 