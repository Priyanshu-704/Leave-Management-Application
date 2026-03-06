const normalize = (value) => String(value || "").trim().toLowerCase();

const isSuperAdmin = (user) => normalize(user?.role) === "super_admin";
const isAdmin = (user) => normalize(user?.role) === "admin";
const isManager = (user) => normalize(user?.role) === "manager";

const isHrOrFinance = (user) => {
  const dept = normalize(user?.department);
  const designation = normalize(user?.designation);
  return ["hr", "finance"].includes(dept) || ["hr", "finance"].includes(designation);
};

const getAccessibleDepartments = (user) => {
  if (!user) return [];

  if (isSuperAdmin(user) || isAdmin(user) || isHrOrFinance(user) || user?.allowCrossDepartment) {
    return null; // null means all departments
  }

  const base = new Set();
  if (user.department) base.add(user.department);

  if (Array.isArray(user.allowedDepartments)) {
    user.allowedDepartments.filter(Boolean).forEach((dept) => base.add(dept));
  }

  return Array.from(base);
};

const canAccessDepartment = (user, department) => {
  const accessible = getAccessibleDepartments(user);
  if (accessible === null) return true;
  return accessible.includes(department);
};

const canCreateRole = (actor, role) => {
  const normalizedRole = normalize(role);
  if (isSuperAdmin(actor)) return ["employee", "manager", "admin", "super_admin"].includes(normalizedRole);
  if (isAdmin(actor)) return ["employee", "manager"].includes(normalizedRole);
  return false;
};

const canManageTargetUser = (actor, targetUser) => {
  if (!actor || !targetUser) return false;

  if (isSuperAdmin(actor)) return true;

  if (isAdmin(actor)) {
    if (["admin", "super_admin"].includes(normalize(targetUser.role))) return false;
    return true;
  }

  if (isManager(actor)) {
    return normalize(targetUser.role) === "employee" && canAccessDepartment(actor, targetUser.department);
  }

  return false;
};

module.exports = {
  normalize,
  isSuperAdmin,
  isAdmin,
  isManager,
  isHrOrFinance,
  getAccessibleDepartments,
  canAccessDepartment,
  canCreateRole,
  canManageTargetUser,
};
