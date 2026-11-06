import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { NotificationDrawer, NotificationItem } from './NotificationDrawer';
import { playNotificationChime } from '../../utils/sound';
import { toast } from '../../store/toastStore';
import { useTranslation } from '../../hooks/useTranslation';

export const NotificationBell: React.FC = () => {
  const { user, accessToken } = useAuthStore();
  const { language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('engrew_notification_sound') !== 'false';
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  // Toggle sound setting
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('engrew_notification_sound', String(next));
  };

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications?limit=30');
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Quiet fail if offline
    }
  };

  // Establish SSE Stream
  useEffect(() => {
    if (!user || !accessToken) return;

    fetchNotifications();

    // Background polling fallback every 60 seconds
    const pollInterval = setInterval(fetchNotifications, 60 * 1000);

    // Setup SSE connection
    try {
      const sseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api/v1'}/notifications/stream`;
      
      // Native EventSource sends cookies automatically with credentials
      const es = new EventSource(sseUrl, { withCredentials: true });
      eventSourceRef.current = es;

      es.addEventListener('notification', (e) => {
        try {
          const newNotif: NotificationItem = JSON.parse(e.data);

          setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
          setUnreadCount((c) => c + 1);

          // Play Audio Chime
          if (soundEnabled) {
            playNotificationChime();
          }

          // Display in-app toast notification
          const title = language === 'he' ? (newNotif.titleHe || newNotif.titleEn) : (newNotif.titleEn || newNotif.title);
          const body = language === 'he' ? (newNotif.bodyHe || newNotif.bodyEn) : (newNotif.bodyEn || newNotif.body);
          
          toast.info(`${title}: ${body || ''}`);
        } catch (err) {
          console.error('[SSE Parse Error]', err);
        }
      });

      es.onerror = () => {
        // EventSource automatically reconnects on error
      };
    } catch {
      // Fallback relies on pollInterval
    }

    return () => {
      clearInterval(pollInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [user?.id, accessToken, soundEnabled, language]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // Fail quietly
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Fail quietly
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      const deletedItem = notifications.find((n) => n.id === id);
      if (deletedItem && !deletedItem.isRead) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // Fail quietly
    }
  };

  if (!user) return null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="relative p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 hover:bg-brand-teal-50/50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-all shadow-2xs group shrink-0"
        title={language === 'he' ? 'התראות מערכת' : 'Notifications'}
        aria-label="Notifications"
      >
        <Bell className={`w-4 h-4 text-slate-700 dark:text-slate-200 transition-transform ${unreadCount > 0 ? 'group-hover:rotate-12' : ''}`} />

        {/* Luminous Pulsing Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -end-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-rose-500 text-white font-black text-[10px] flex items-center justify-center shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Slide-over Drawer */}
      <NotificationDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onDelete={handleDelete}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
      />
    </>
  );
};
