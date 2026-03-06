import { axiosInstance, serviceRequest } from "@/lib/api";

export const recruitmentService = {
  async getSummary() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/recruitment/summary");
      return response.data;
    }, "Failed to fetch recruitment summary");
  },

  async getJobs(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/recruitment/jobs", { params });
      return response.data;
    }, "Failed to fetch job postings");
  },

  async createJob(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/recruitment/jobs", payload);
      return response.data;
    }, "Failed to create job posting");
  },

  async updateJob(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/recruitment/jobs/${id}`, payload);
      return response.data;
    }, "Failed to update job posting");
  },

  async removeJob(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.delete(`/recruitment/jobs/${id}`);
      return response.data;
    }, "Failed to delete job posting");
  },

  async getCandidates(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/recruitment/candidates", { params });
      return response.data;
    }, "Failed to fetch candidates");
  },

  async createCandidate(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/recruitment/candidates", payload);
      return response.data;
    }, "Failed to create candidate");
  },

  async updateCandidate(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/recruitment/candidates/${id}`, payload);
      return response.data;
    }, "Failed to update candidate");
  },

  async updateCandidateStage(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/recruitment/candidates/${id}/stage`, payload);
      return response.data;
    }, "Failed to update candidate stage");
  },

  async generateOffer(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/recruitment/candidates/${id}/offer`, payload);
      return response.data;
    }, "Failed to generate offer letter");
  },

  async updateOnboarding(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/recruitment/candidates/${id}/onboarding`, payload);
      return response.data;
    }, "Failed to update onboarding checklist");
  },

  async updateDocumentVerification(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(
        `/recruitment/candidates/${id}/document-verification`,
        payload,
      );
      return response.data;
    }, "Failed to update document verification");
  },

  async updateBackgroundCheck(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(
        `/recruitment/candidates/${id}/background-check`,
        payload,
      );
      return response.data;
    }, "Failed to update background check");
  },

  async updateProbation(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/recruitment/candidates/${id}/probation`, payload);
      return response.data;
    }, "Failed to update probation details");
  },

  async getInterviews(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/recruitment/interviews", { params });
      return response.data;
    }, "Failed to fetch interviews");
  },

  async scheduleInterview(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/recruitment/interviews", payload);
      return response.data;
    }, "Failed to schedule interview");
  },

  async updateInterview(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/recruitment/interviews/${id}`, payload);
      return response.data;
    }, "Failed to update interview");
  },
};
