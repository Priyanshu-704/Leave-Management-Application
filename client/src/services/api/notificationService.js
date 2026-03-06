import { axiosInstance, serviceRequest } from "@/lib/api";

export const notificationService = {
  getNotifications(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/notifications", { params });
      return response.data;
    }, "Failed to fetch notifications");
  },

  markRead(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/notifications/${id}/read`);
      return response.data;
    }, "Failed to mark notification as read");
  },

  markAllRead() {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/notifications/read-all");
      return response.data;
    }, "Failed to mark all notifications as read");
  },
};
