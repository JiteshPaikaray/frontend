import api from "../api/axios";

export async function getNotifications() {
  const response = await api.get("/notifications");
  return response.data;
}

export async function markNotificationAsRead(id) {
  const response = await api.post(`/notifications/mark-read/${id}`);
  return response.data;
}
