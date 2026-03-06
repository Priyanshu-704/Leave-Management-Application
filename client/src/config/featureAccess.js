export const FEATURE_ACCESS = {
  geofencedCheckIn: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["intern", "staff", "senior", "lead", "manager", "hr", "finance", "it", "director"] },
  weekendHoliday: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["staff", "senior", "lead", "manager", "hr", "director", "finance", "it"] },
  checkInControl: { roles: ["admin", "super_admin"], designations: ["hr", "manager", "director"] },
  requestWfh: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["intern", "staff", "senior", "lead", "manager", "hr", "it", "finance", "director"] },
  salarySlips: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["intern", "staff", "senior", "lead", "manager", "hr", "finance", "director"] },
  automaticLeaveApproval: { roles: ["admin", "super_admin"], designations: ["hr", "manager", "director"] },
  leaveDeduction: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["staff", "senior", "lead", "manager", "hr", "finance", "director"] },
  salaryCalculation: { roles: ["manager", "admin", "super_admin"], designations: ["manager", "hr", "finance", "director"] },
  companyAssets: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["staff", "senior", "lead", "manager", "hr", "it", "director"] },
  assetTracking: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["staff", "senior", "lead", "manager", "hr", "it", "director"] },
  assetReturnExit: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["staff", "senior", "lead", "manager", "hr", "it", "director"] },
  inventoryManagement: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["staff", "senior", "lead", "manager", "it", "director"] },
  projectAllocation: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["staff", "senior", "lead", "manager", "project_manager", "director"] },
  taskAssignment: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["staff", "senior", "lead", "manager", "project_manager", "director"] },
  timesheetEntry: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["intern", "staff", "senior", "lead", "manager", "project_manager", "director"] },
  projectBilling: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["manager", "project_manager", "finance", "director"] },
  resourcePlanning: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["lead", "manager", "project_manager", "director"] },
  milestoneTracking: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["staff", "senior", "lead", "manager", "project_manager", "director"] },
  ganttChart: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["staff", "senior", "lead", "manager", "project_manager", "director"] },
  capacityPlanning: { roles: ["employee", "manager", "admin", "super_admin"], designations: ["lead", "manager", "project_manager", "hr", "director"] },
};

export const ROUTE_FEATURE_MAP = [
  { prefix: "/workforce/geofenced-checkin", feature: "geofencedCheckIn" },
  { prefix: "/workforce/weekend-holiday", feature: "weekendHoliday" },
  { prefix: "/workforce/checkin-control", feature: "checkInControl" },
  { prefix: "/workforce/request-wfh", feature: "requestWfh" },
  { prefix: "/workforce/salary-slips", feature: "salarySlips" },
  { prefix: "/workforce/automatic-leave-approval", feature: "automaticLeaveApproval" },
  { prefix: "/workforce/leave-deduction", feature: "leaveDeduction" },
  { prefix: "/workforce/salary-calculation", feature: "salaryCalculation" },
  { prefix: "/workforce/company-assets", feature: "companyAssets" },
  { prefix: "/workforce/asset-allocation-tracking", feature: "assetTracking" },
  { prefix: "/workforce/asset-return-exit", feature: "assetReturnExit" },
  { prefix: "/workforce/inventory-management", feature: "inventoryManagement" },
  { prefix: "/workforce/project-allocation", feature: "projectAllocation" },
  { prefix: "/workforce/task-assignment", feature: "taskAssignment" },
  { prefix: "/workforce/timesheet-entry", feature: "timesheetEntry" },
  { prefix: "/workforce/project-billing", feature: "projectBilling" },
  { prefix: "/workforce/resource-planning", feature: "resourcePlanning" },
  { prefix: "/workforce/milestone-tracking", feature: "milestoneTracking" },
  { prefix: "/workforce/gantt-chart", feature: "ganttChart" },
  { prefix: "/workforce/capacity-planning", feature: "capacityPlanning" },
];

export const canAccessFeature = (user, featureKey) => {
  if (!user) return false;
  if (["super_admin", "admin"].includes(user.role)) return true;

  const overrideValue = user?.featurePermissions?.[featureKey];
  if (typeof overrideValue === "boolean") return overrideValue;
  if (user?.featureAccess && typeof user.featureAccess[featureKey] === "boolean") {
    return user.featureAccess[featureKey];
  }

  const rule = FEATURE_ACCESS[featureKey];
  if (!rule) return true;

  const roleAllowed = !rule.roles || rule.roles.includes(user.role);
  const designation = user.designation || "staff";
  const designationAllowed = !rule.designations || rule.designations.includes(designation);

  return roleAllowed && designationAllowed;
};
