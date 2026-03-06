const normalizeRole = (role) => String(role || "").trim().toLowerCase();

export const canCreateRole = (actor, role) => {
  const actorRole = normalizeRole(actor?.role);
  const targetRole = normalizeRole(role);

  if (actorRole === "super_admin") {
    return ["employee", "manager", "admin", "super_admin"].includes(targetRole);
  }

  if (actorRole === "admin") {
    return ["employee", "manager"].includes(targetRole);
  }

  return false;
};

export const getCreatableRoles = (actor) =>
  ["employee", "manager", "admin"].filter((role) => canCreateRole(actor, role));

