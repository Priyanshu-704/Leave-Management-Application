const FEATURE_ACCESS = {
  geofencedCheckIn: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["intern", "staff", "senior", "lead", "manager", "hr", "finance", "it", "director"],
  },
  weekendHoliday: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["staff", "senior", "lead", "manager", "hr", "director", "finance", "it"],
  },
  checkInControl: {
    roles: ["admin", "super_admin"],
    designations: ["hr", "manager", "director"],
  },
  requestWfh: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["intern", "staff", "senior", "lead", "manager", "hr", "it", "finance", "director"],
  },
  salarySlips: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["intern", "staff", "senior", "lead", "manager", "hr", "finance", "director"],
  },
  automaticLeaveApproval: {
    roles: ["admin", "super_admin"],
    designations: ["hr", "manager", "director"],
  },
  leaveDeduction: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["staff", "senior", "lead", "manager", "hr", "finance", "director"],
  },
  salaryCalculation: {
    roles: ["manager", "admin", "super_admin"],
    designations: ["manager", "hr", "finance", "director"],
  },
  companyAssets: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["staff", "senior", "lead", "manager", "hr", "it", "director"],
  },
  assetTracking: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["staff", "senior", "lead", "manager", "hr", "it", "director"],
  },
  assetReturnExit: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["staff", "senior", "lead", "manager", "hr", "it", "director"],
  },
  inventoryManagement: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["staff", "senior", "lead", "manager", "it", "director"],
  },
  projectAllocation: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["staff", "senior", "lead", "manager", "project_manager", "director"],
  },
  taskAssignment: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["staff", "senior", "lead", "manager", "project_manager", "director"],
  },
  timesheetEntry: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["intern", "staff", "senior", "lead", "manager", "project_manager", "director"],
  },
  projectBilling: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["manager", "project_manager", "finance", "director"],
  },
  resourcePlanning: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["lead", "manager", "project_manager", "director"],
  },
  milestoneTracking: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["staff", "senior", "lead", "manager", "project_manager", "director"],
  },
  ganttChart: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["staff", "senior", "lead", "manager", "project_manager", "director"],
  },
  capacityPlanning: {
    roles: ["employee", "manager", "admin", "super_admin"],
    designations: ["lead", "manager", "project_manager", "hr", "director"],
  },
};

const hasFeatureAccess = (user, featureKey) => {
  if (!user) return false;
  if (["super_admin", "admin"].includes(user.role)) return true;

  const rule = FEATURE_ACCESS[featureKey];
  const userOverrides = user.featurePermissions || {};
  const overrideValue =
    userOverrides?.get?.(featureKey) ??
    userOverrides?.[featureKey];

  if (typeof overrideValue === "boolean") {
    return overrideValue;
  }

  if (!rule) return true;

  const roleAllowed = !rule.roles || rule.roles.includes(user.role);
  const designation = user.designation || "staff";
  const designationAllowed = !rule.designations || rule.designations.includes(designation);

  return roleAllowed && designationAllowed;
};

module.exports = {
  FEATURE_ACCESS,
  hasFeatureAccess,
};
