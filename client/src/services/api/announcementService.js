import { axiosInstance, serviceRequest } from "@/lib/api";

export const announcementService = {
  async getAnnouncements(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/announcements", { params });
      return response.data;
    }, "Failed to fetch announcements");
  },

  async acknowledge(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post(`/announcements/${id}/acknowledge`);
      return response.data;
    }, "Failed to acknowledge announcement");
  },

  async addComment(id, content) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post(`/announcements/${id}/comments`, { content });
      return response.data;
    }, "Failed to add announcement comment");
  },

  async create(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/announcements", payload);
      return response.data;
    }, "Failed to create announcement");
  },

  async update(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/announcements/${id}`, payload);
      return response.data;
    }, "Failed to update announcement");
  },

  async remove(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.delete(`/announcements/${id}`);
      return response.data;
    }, "Failed to delete announcement");
  },
};
