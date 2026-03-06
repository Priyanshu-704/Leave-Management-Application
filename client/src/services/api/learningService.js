import { axiosInstance, serviceRequest } from "@/lib/api";

export const learningService = {
  async getSummary() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/learning/summary");
      return response.data;
    }, "Failed to fetch learning summary");
  },

  async getCourses(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/learning/courses", { params });
      return response.data;
    }, "Failed to fetch courses");
  },

  async createCourse(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/learning/courses", payload);
      return response.data;
    }, "Failed to create course");
  },

  async updateCourse(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/learning/courses/${id}`, payload);
      return response.data;
    }, "Failed to update course");
  },

  async removeCourse(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.delete(`/learning/courses/${id}`);
      return response.data;
    }, "Failed to delete course");
  },

  async getNominations(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/learning/nominations", { params });
      return response.data;
    }, "Failed to fetch training nominations");
  },

  async createNomination(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/learning/nominations", payload);
      return response.data;
    }, "Failed to create nomination");
  },

  async updateNominationStatus(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/learning/nominations/${id}/status`, payload);
      return response.data;
    }, "Failed to update nomination status");
  },

  async getCalendar(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/learning/calendar", { params });
      return response.data;
    }, "Failed to fetch training calendar");
  },

  async createCalendarEvent(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/learning/calendar", payload);
      return response.data;
    }, "Failed to create training calendar event");
  },

  async updateCalendarEvent(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/learning/calendar/${id}`, payload);
      return response.data;
    }, "Failed to update training calendar event");
  },

  async removeCalendarEvent(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.delete(`/learning/calendar/${id}`);
      return response.data;
    }, "Failed to delete training calendar event");
  },

  async getCertifications(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/learning/certifications", { params });
      return response.data;
    }, "Failed to fetch certifications");
  },

  async createCertification(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/learning/certifications", payload);
      return response.data;
    }, "Failed to create certification");
  },

  async updateCertification(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/learning/certifications/${id}`, payload);
      return response.data;
    }, "Failed to update certification");
  },

  async submitFeedback(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/learning/feedback", payload);
      return response.data;
    }, "Failed to submit training feedback");
  },

  async getFeedback(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/learning/feedback", { params });
      return response.data;
    }, "Failed to fetch training feedback");
  },

  async submitAssessment(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/learning/assessments", payload);
      return response.data;
    }, "Failed to submit assessment");
  },

  async getLearningPaths(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/learning/paths", { params });
      return response.data;
    }, "Failed to fetch learning paths");
  },

  async createLearningPath(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/learning/paths", payload);
      return response.data;
    }, "Failed to create learning path");
  },

  async updateLearningPath(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/learning/paths/${id}`, payload);
      return response.data;
    }, "Failed to update learning path");
  },

  async enrollInPath(id, payload = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post(`/learning/paths/${id}/enroll`, payload);
      return response.data;
    }, "Failed to enroll in learning path");
  },
};
