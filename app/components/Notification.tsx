import { useEffect } from "react";

interface NotificationProps {
  id: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  onClose: (id: string) => void;
  duration?: number;
}

export function Notification({
  id,
  message,
  type,
  onClose,
  duration = 5000,
}: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), duration);
    return () => clearTimeout(timer);
  }, [id, onClose, duration]);

  const bgColor = {
    info: "bg-[#865DFF]",
    warning: "bg-[#f0883e]",
    error: "bg-[#f85149]",
    success: "bg-[#6ee7a8]",
  }[type];

  const textColor = {
    info: "text-[#865DFF]",
    warning: "text-[#f0883e]",
    error: "text-[#f85149]",
    success: "text-[#6ee7a8]",
  }[type];

  return (
    <div
      className={`${bgColor}/20 border ${textColor} border-current rounded px-4 py-2 text-sm mb-2 flex items-center justify-between animate-slideDown`}
    >
      <span>{message}</span>
      <button
        onClick={() => onClose(id)}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
      >
        ✕
      </button>
    </div>
  );
}

interface NotificationsContainerProps {
  notifications: Array<{
    id: string;
    message: string;
    type: "info" | "warning" | "error" | "success";
  }>;
  onClose: (id: string) => void;
}

export function NotificationsContainer({
  notifications,
  onClose,
}: NotificationsContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={onClose}
        />
      ))}
    </div>
  );
}
