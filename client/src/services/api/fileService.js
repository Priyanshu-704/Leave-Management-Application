import { axiosInstance, serviceRequest } from "@/lib/api";

export const fileService = {
  async getFiles(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/files", { params });
      return response.data;
    }, "Failed to fetch files");
  },

  async getStats() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/files/stats");
      return response.data;
    }, "Failed to fetch file statistics");
  },

  async downloadFile(id) {
    return serviceRequest(async () => (
      axiosInstance.get(`/files/${id}/download`, { responseType: "blob" })
    ), "Failed to download file");
  },

  async upload(formData) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/files/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    }, "Failed to upload file");
  },

  async remove(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.delete(`/files/${id}`);
      return response.data;
    }, "Failed to delete file");
  },
};
