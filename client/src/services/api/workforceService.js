import { axiosInstance, serviceRequest } from "@/lib/api";

const downloadBlob = async (url, params = {}) => {
  const response = await axiosInstance.get(url, { params, responseType: "blob" });
  return response;
};

export const workforceService = {
  getAttendancePolicy() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/attendance-policy");
      return response.data;
    }, "Failed to load attendance policy");
  },

  updateAttendancePolicy(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/attendance-policy", payload);
      return response.data;
    }, "Failed to update attendance policy");
  },

  getLeavePolicy() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/leave-policy");
      return response.data;
    }, "Failed to load leave policy");
  },

  updateLeavePolicy(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/leave-policy", payload);
      return response.data;
    }, "Failed to update leave policy");
  },

  getPayrollPolicy() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/payroll/policy");
      return response.data;
    }, "Failed to load payroll policy");
  },

  updatePayrollPolicy(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/payroll/policy", payload);
      return response.data;
    }, "Failed to update payroll policy");
  },

  validateGeoFence(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/attendance-policy/geofence/validate", payload);
      return response.data;
    }, "Failed to validate geo-fence");
  },

  getHolidayWeekend() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/holidays");
      return response.data;
    }, "Failed to load holiday/weekend data");
  },

  updateWeekendDays(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put("/holidays/weekends", payload);
      return response.data;
    }, "Failed to update weekend days");
  },

  createHoliday(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/holidays", payload);
      return response.data;
    }, "Failed to create holiday");
  },

  deleteHoliday(id) {
    return serviceRequest(async () => {
      const response = await axiosInstance.delete(`/holidays/${id}`);
      return response.data;
    }, "Failed to delete holiday");
  },

  createWfh(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/wfh", payload);
      return response.data;
    }, "Failed to create WFH request");
  },

  getWfh(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/wfh", { params });
      return response.data;
    }, "Failed to fetch WFH requests");
  },

  updateWfhStatus(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/wfh/${id}/status`, payload);
      return response.data;
    }, "Failed to update WFH status");
  },

  exportWfh(params = {}) {
    return serviceRequest(async () => downloadBlob("/wfh/export", params), "Failed to export WFH");
  },

  getSalarySlips(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/payroll/salary-slips", { params });
      return response.data;
    }, "Failed to fetch salary slips");
  },

  generateSalary(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/payroll/salary-slips/generate", payload);
      return response.data;
    }, "Failed to generate salary");
  },

  exportSalarySlips(params = {}) {
    return serviceRequest(async () => downloadBlob("/payroll/salary-slips/export", params), "Failed to export salary slips");
  },

  getAssets() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/assets");
      return response.data;
    }, "Failed to fetch assets");
  },

  createAsset(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/assets", payload);
      return response.data;
    }, "Failed to create asset");
  },

  allocateAsset(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/assets/allocate", payload);
      return response.data;
    }, "Failed to allocate asset");
  },

  returnAsset(id, payload = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/assets/allocations/${id}/return`, payload);
      return response.data;
    }, "Failed to return asset");
  },

  getAssetAllocations(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/assets/allocations", { params });
      return response.data;
    }, "Failed to fetch asset allocations");
  },

  exportAssetAllocations() {
    return serviceRequest(async () => downloadBlob("/assets/allocations/export"), "Failed to export asset allocations");
  },

  getInventory() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/inventory");
      return response.data;
    }, "Failed to fetch inventory");
  },

  createInventory(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/inventory", payload);
      return response.data;
    }, "Failed to create inventory item");
  },

  updateInventory(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/inventory/${id}`, payload);
      return response.data;
    }, "Failed to update inventory item");
  },

  exportInventory() {
    return serviceRequest(async () => downloadBlob("/inventory/export"), "Failed to export inventory");
  },

  getProjects() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/project-ops/projects");
      return response.data;
    }, "Failed to fetch projects");
  },

  createProject(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/project-ops/projects", payload);
      return response.data;
    }, "Failed to create project");
  },

  getProjectAllocations() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/project-ops/allocations");
      return response.data;
    }, "Failed to fetch project allocations");
  },

  createProjectAllocation(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/project-ops/allocations", payload);
      return response.data;
    }, "Failed to create project allocation");
  },

  getTasks(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/project-ops/tasks", { params });
      return response.data;
    }, "Failed to fetch tasks");
  },

  createTask(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/project-ops/tasks", payload);
      return response.data;
    }, "Failed to create task");
  },

  updateTask(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/project-ops/tasks/${id}`, payload);
      return response.data;
    }, "Failed to update task");
  },

  getTimesheets(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/project-ops/timesheets", { params });
      return response.data;
    }, "Failed to fetch timesheets");
  },

  createTimesheet(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/project-ops/timesheets", payload);
      return response.data;
    }, "Failed to create timesheet");
  },

  exportTimesheets() {
    return serviceRequest(async () => downloadBlob("/project-ops/timesheets/export"), "Failed to export timesheets");
  },

  getBillings() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/project-ops/billing");
      return response.data;
    }, "Failed to fetch billings");
  },

  createBilling(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/project-ops/billing", payload);
      return response.data;
    }, "Failed to create billing record");
  },

  exportBillings() {
    return serviceRequest(async () => downloadBlob("/project-ops/billing/export"), "Failed to export billings");
  },

  getResourcePlans() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/project-ops/resource-planning");
      return response.data;
    }, "Failed to fetch resource plans");
  },

  createResourcePlan(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/project-ops/resource-planning", payload);
      return response.data;
    }, "Failed to create resource plan");
  },

  getMilestones(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/project-ops/milestones", { params });
      return response.data;
    }, "Failed to fetch milestones");
  },

  createMilestone(payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.post("/project-ops/milestones", payload);
      return response.data;
    }, "Failed to create milestone");
  },

  updateMilestone(id, payload) {
    return serviceRequest(async () => {
      const response = await axiosInstance.put(`/project-ops/milestones/${id}`, payload);
      return response.data;
    }, "Failed to update milestone");
  },

  getGantt() {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/project-ops/gantt");
      return response.data;
    }, "Failed to fetch gantt data");
  },

  getCapacity(params = {}) {
    return serviceRequest(async () => {
      const response = await axiosInstance.get("/project-ops/capacity", { params });
      return response.data;
    }, "Failed to fetch capacity planning");
  },

  exportCapacity(params = {}) {
    return serviceRequest(async () => downloadBlob("/project-ops/capacity/export", params), "Failed to export capacity planning");
  },
};
