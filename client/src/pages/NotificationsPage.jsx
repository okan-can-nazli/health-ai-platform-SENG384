import { useEffect, useState } from "react";
import {
  getNotifications,
  markNotificationAsRead
} from "../api/authApi";
import { useAuth } from "../context/AuthContext";

function NotificationsPage() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState([]);

  async function loadNotifications() {
    try {
      const result = await getNotifications(token);
      setNotifications(result.data);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function handleRead(id) {
    try {
      await markNotificationAsRead(token, id);
      await loadNotifications();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <div className="page-container">
      <div className="card wide-card">
        <h1>Notifications</h1>

        <div className="post-list">
          {notifications.length === 0 ? (
            <p>No notifications found.</p>
          ) : (
            notifications.map((item) => (
              <div key={item.id} className="post-card">
                <p><strong>Title:</strong> {item.title}</p>
                <p><strong>Message:</strong> {item.message}</p>
                <p><strong>Type:</strong> {item.type}</p>
                <p><strong>Read:</strong> {item.is_read ? "Yes" : "No"}</p>
                {!item.is_read && (
                  <button onClick={() => handleRead(item.id)}>
                    Mark as Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationsPage;
