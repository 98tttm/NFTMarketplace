import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationType = "outbid" | "auction_ending" | "sale" | "transfer" | "listing" | "bid" | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  link?: string;
  /** Địa chỉ ví người nhận (chủ sở hữu); nếu có thì chỉ hiển thị cho ví đó */
  recipientAddress?: string;
}

interface NotificationState {
  notifications: Notification[];
  isPanelOpen: boolean;
  preferences: Record<NotificationType, boolean>;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  togglePanel: () => void;
  setPanel: (open: boolean) => void;
  updatePreference: (type: NotificationType, enabled: boolean) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      isPanelOpen: false,
      preferences: {
        outbid: true,
        auction_ending: true,
        sale: true,
        transfer: true,
        listing: true,
        bid: true,
        system: true,
      },

      addNotification: (n) =>
        set((state) => ({
          notifications: [
            { ...n, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now(), read: false },
            ...state.notifications,
          ].slice(0, 100),
        })),

      markRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      markAllRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),

      clearAll: () => set({ notifications: [] }),

      togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
      setPanel: (open) => set({ isPanelOpen: open }),

      updatePreference: (type, enabled) =>
        set((state) => ({
          preferences: { ...state.preferences, [type]: enabled },
        })),

      unreadCount: () => get().notifications.filter((n) => !n.read).length,
    }),
    {
      name: "nft-marketplace-notifications",
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
      }),
    }
  )
);
