"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Gavel,
  Clock,
  ShoppingCart,
  ArrowRightLeft,
  Tag,
  Info,
  Settings,
} from "lucide-react";
import Link from "next/link";
import {
  useNotificationStore,
  type Notification,
  type NotificationType,
} from "@/stores/useNotificationStore";
import { formatDistanceToNow } from "@/lib/utils";
import { useState } from "react";
import { useAccount } from "wagmi";

const TYPE_CONFIG: Record<
  NotificationType,
  { icon: typeof Bell; color: string; bg: string }
> = {
  outbid: { icon: Gavel, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  auction_ending: { icon: Clock, color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
  sale: { icon: ShoppingCart, color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  transfer: { icon: ArrowRightLeft, color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  listing: { icon: Tag, color: "#8B5CF6", bg: "rgba(139,92,246,0.1)" },
  bid: { icon: Gavel, color: "#06B6D4", bg: "rgba(6,182,212,0.1)" },
  system: { icon: Info, color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
};

function NotificationItem({ n }: { n: Notification }) {
  const { markRead } = useNotificationStore();
  const cfg = TYPE_CONFIG[n.type];
  const Icon = cfg.icon;

  const content = (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 transition-colors ${
        n.read ? "border-transparent" : "border-primary/20 bg-primary/[0.03]"
      }`}
    >
      <div
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ background: cfg.bg }}
      >
        <Icon size={16} style={{ color: cfg.color }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-text-primary">{n.title}</p>
        <p className="mt-0.5 text-xs text-text-muted line-clamp-2">{n.message}</p>
        <p className="mt-1 text-[10px] text-text-muted">
          {formatDistanceToNow(n.timestamp)}
        </p>
      </div>
      {!n.read && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            markRead(n.id);
          }}
          className="shrink-0 rounded-md p-1 text-text-muted hover:text-primary"
          title="Mark as read"
        >
          <Check size={14} />
        </button>
      )}
    </div>
  );

  if (n.link) {
    return (
      <Link href={n.link} onClick={() => markRead(n.id)}>
        {content}
      </Link>
    );
  }

  return content;
}

export function NotificationPanel() {
  const { address } = useAccount();
  const {
    notifications,
    isPanelOpen,
    setPanel,
    markAllRead,
    clearAll,
    unreadCount,
    preferences,
    updatePreference,
  } = useNotificationStore();
  const [showSettings, setShowSettings] = useState(false);

  const filteredNotifications = notifications.filter(
    (n) => !n.recipientAddress || n.recipientAddress.toLowerCase() === address?.toLowerCase()
  );
  const filteredUnreadCount = filteredNotifications.filter((n) => !n.read).length;

  const PREF_LABELS: Record<NotificationType, string> = {
    outbid: "Outbid alerts",
    auction_ending: "Auction ending soon",
    sale: "Sale completed",
    transfer: "NFT transfers",
    listing: "New listings",
    bid: "Đặt giá NFT của bạn",
    system: "System updates",
  };

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPanel(false)}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell size={18} className="text-primary" />
                <h2 className="text-base font-bold text-text-primary">Notifications</h2>
                {filteredUnreadCount > 0 && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {filteredUnreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
                  title="Settings"
                >
                  <Settings size={16} />
                </button>
                {filteredUnreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-primary"
                    title="Mark all read"
                  >
                    <CheckCheck size={16} />
                  </button>
                )}
                {filteredNotifications.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-error"
                    title="Clear all"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={() => setPanel(false)}
                  className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Settings */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-b border-border"
                >
                  <div className="px-5 py-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                      Notification Preferences
                    </p>
                    {(Object.keys(PREF_LABELS) as NotificationType[]).map((type) => (
                      <label
                        key={type}
                        className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-surface/50 cursor-pointer"
                      >
                        <span className="text-sm text-text-secondary">{PREF_LABELS[type]}</span>
                        <input
                          type="checkbox"
                          checked={preferences[type]}
                          onChange={(e) => updatePreference(type, e.target.checked)}
                          className="accent-primary h-4 w-4"
                        />
                      </label>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 py-3 scrollbar-thin">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-surface">
                    <BellOff size={24} className="text-text-muted" />
                  </div>
                  <p className="text-sm font-medium text-text-primary">No notifications</p>
                  <p className="mt-1 text-xs text-text-muted">
                    You&apos;ll be notified about bids, sales, and more.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNotifications.map((n) => (
                    <NotificationItem key={n.id} n={n} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function NotificationBell() {
  const { address } = useAccount();
  const { togglePanel, notifications } = useNotificationStore();
  const count = notifications.filter(
    (n) => !n.read && (!n.recipientAddress || n.recipientAddress.toLowerCase() === address?.toLowerCase())
  ).length;

  return (
    <button
      onClick={togglePanel}
      className="relative p-2 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
      aria-label={`Notifications${count > 0 ? `, ${count} unread` : ""}`}
    >
      <Bell size={20} />
      {count > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-danger text-[10px] font-bold text-white"
        >
          {count > 9 ? "9+" : count}
        </motion.span>
      )}
    </button>
  );
}
