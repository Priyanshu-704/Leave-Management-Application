import { axiosInstance, serviceRequest } from "@/lib/api";

export const aiService = {
  async leavePrediction(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/ai/leave-prediction", payload);
      return response.data;
    }, "Failed to generate leave prediction");
  },

  async attendanceAnomalyDetection(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/ai/attendance-anomaly-detection", { params });
      return response.data;
    }, "Failed to detect attendance anomalies");
  },

  async employeeChurnPrediction(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/ai/employee-churn-prediction", { params });
      return response.data;
    }, "Failed to generate churn prediction");
  },

  async smartScheduling(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/ai/smart-scheduling", payload);
      return response.data;
    }, "Failed to generate smart schedule");
  },

  async chatbot(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/ai/chatbot", payload);
      return response.data;
    }, "Failed to get chatbot response");
  },

  async resumeParsing(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/ai/resume-parsing", payload);
      return response.data;
    }, "Failed to parse resume");
  },

  async sentimentAnalysis(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/ai/sentiment-analysis", payload);
      return response.data;
    }, "Failed to analyze sentiment");
  },

  async performancePrediction(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/ai/performance-prediction", { params });
      return response.data;
    }, "Failed to predict performance");
  },
};
