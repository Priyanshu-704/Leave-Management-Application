import { axiosInstance, serviceRequest } from "@/lib/api";

export const supportService = {
  async contactAdministrator(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/support/contact-admin", payload);
      return response.data;
    }, "Failed to contact administrator");
  },
};
