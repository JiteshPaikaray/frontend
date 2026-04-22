import { useEffect, useState } from "react";
import signalRService from "../services/signalrService";

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    signalRService.onNotification((data) => {
      setNotifications((prev) => [data, ...prev]);
    });
  }, []);

  return (
    <div>
      🔔 {notifications.length}
    </div>
  );
}