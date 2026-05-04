import { useState } from "react";
import { Bell, BellRing, CheckCheck, Loader2 } from "lucide-react";

function formatNotificationTime(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const diffInMinutes = Math.round((Date.now() - date.getTime()) / 60000);

  if (diffInMinutes <= 1) {
    return "Just now";
  }

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.round(diffInMinutes / 60);

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function NotificationBell({
  notifications = [],
  loading = false,
  onRefresh,
  onMarkRead,
}) {
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/18 text-white shadow-sm transition hover:bg-white/26"
      >
        {unreadCount > 0 ? <BellRing className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[#d08b8f] px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-3 w-[min(360px,calc(100vw-2rem))] rounded-[28px] border border-[#e1dee3] bg-[#fbfaf8] p-4 shadow-[0_24px_60px_-28px_rgba(82,82,91,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#756f7b]">Notifications</p>
              <p className="text-xs text-[#b8b4bd]">
                {unreadCount > 0
                  ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className="rounded-full border border-[#e1dee3] px-3 py-1.5 text-xs font-medium text-[#8f8a98] transition hover:bg-white"
            >
              Refresh
            </button>
          </div>

          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-[#e1dee3] bg-white px-4 py-5 text-sm text-[#8f8a98]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#ddd9e2] bg-white px-4 py-8 text-center text-sm text-[#a9a5af]">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`rounded-2xl border px-4 py-3 transition ${
                    notification.isRead
                      ? "border-[#e1dee3] bg-white text-[#8f8a98]"
                      : "border-[#e8dfca] bg-[#fcf7ed] text-[#8f8a98]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[#756f7b]">{notification.message}</p>
                      <p className="mt-1 text-xs text-[#b8b4bd]">
                        {formatNotificationTime(notification.createdAt)}
                      </p>
                    </div>

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => onMarkRead?.(notification.id)}
                        className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-[#b18648] shadow-sm transition hover:bg-[#f5efe4]"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
