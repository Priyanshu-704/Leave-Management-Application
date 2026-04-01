/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Button, Input, Select, Option, MultiSelect } from "@/components/ui";
import PageSkeleton from "@/components/PageSkeleton";
import {
  FaUserPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaSearch,
  FaFilter,
  FaUserCircle,
  FaKey,
  FaBan,
  FaCheckCircle,
  FaEnvelope,
  FaShieldAlt,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { departmentService, userService } from "@/services/api";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import UserModal from "../components/modals/UserModal";
import LeaveBalanceModal from "../components/modals/LeaveBalanceModal";
import DeleteConfirmModal from "../components/modals/DeleteConfirmModal";
import { FEATURE_ACCESS } from "@/config/featureAccess";
import { useAuth } from "@/context/AuthContext";
import { getCreatableRoles } from "@/lib/accessControl";

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: "all",
    department: "all",
    status: "all",
    search: "",
  });
  const [departments, setDepartments] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveBalanceModal, setShowLeaveBalanceModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissionsDraft, setPermissionsDraft] = useState({
    featurePermissions: {},
    allowCrossDepartment: false,
    allowedDepartments: [],
  });
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    employeeId: "",
    department: "",
    role: "employee",
    leaveBalance: {
      annual: 20,
      sick: 10,
      personal: 5,
    },
    sendCredentialsEmail: true,
  });
  const [editingId, setEditingId] = useState(null);
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  const creatableRoles = getCreatableRoles(user);
  const visibleFilterRoles =
    user?.role === "super_admin" ? ["employee", "manager", "admin"] : ["employee", "manager"];

  const getSafeRole = (role) => {
    if (creatableRoles.includes(role)) return role;
    return creatableRoles[0] || "employee";
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [filters.role, filters.department, filters.status, debouncedSearch]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.role !== "all") params.append("role", filters.role);
      if (filters.department !== "all")
        params.append("department", filters.department);
      if (filters.status !== "all")
        params.append("isActive", filters.status === "active");
      if (debouncedSearch) params.append("search", debouncedSearch);

      const response = await userService.getUsers(Object.fromEntries(params.entries()));
      setUsers(response.users || response);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments();
      // Handle different response structures
      const departmentsData = response.data || response || [];
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setDepartments([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const safeRole = getSafeRole(formData.role);
      if (!safeRole) {
        toast.error("You are not allowed to create users");
        return;
      }

      const payload = {
        ...formData,
        role: safeRole,
      };

      if (editingId) {
        await userService.updateUser(editingId, payload);
        toast.success("User updated successfully");
      } else {
        const response = await userService.createUser(payload);
        if (response?.warning) {
          toast.success("User created");
          toast.error(response.warning);
        } else if (response?.credentialsSent) {
          toast.success("User created and credentials sent");
        } else {
          toast.success("User created successfully");
        }
      }
      setShowUserModal(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async () => {
    try {
      await userService.deleteUser(selectedUser._id);
      toast.success("User deleted successfully");
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete user");
    }
  };

  const handleUpdateLeaveBalance = async (e) => {
    e.preventDefault();
    try {
      await userService.updateLeaveBalance(selectedUser._id, formData.leaveBalance);
      toast.success("Leave balance updated successfully");
      setShowLeaveBalanceModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error("Failed to update leave balance");
      console.error(error);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await userService.toggleUserStatus(userId);
      toast.success(
        `User ${currentStatus ? "deactivated" : "activated"} successfully`,
      );
      fetchUsers();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to toggle user status",
      );
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      employeeId: "",
      department: "",
      role: getSafeRole("employee"),
      leaveBalance: {
        annual: 20,
        sick: 10,
        personal: 5,
      },
      sendCredentialsEmail: true,
    });
    setEditingId(null);
    setSelectedUser(null);
  };

  const openEditModal = (user) => {
    setEditingId(user._id);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      employeeId: user.employeeId,
      department: user.department,
      role: getSafeRole(user.role),
      leaveBalance: user.leaveBalance || {
        annual: 20,
        sick: 10,
        personal: 5,
      },
      sendCredentialsEmail: true,
    });
    setShowUserModal(true);
  };

  const sendCredentials = async (userId) => {
    try {
      const response = await userService.sendCredentials(userId);
      toast.success(response?.message || "Credentials sent successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send credentials");
    }
  };

  const openPermissionsModal = (user) => {
    setSelectedUser(user);
    setPermissionsDraft({
      featurePermissions: user.featurePermissions || {},
      allowCrossDepartment: !!user.allowCrossDepartment,
      allowedDepartments: user.allowedDepartments || [],
    });
    setShowPermissionsModal(true);
  };

  const handlePermissionToggle = (featureKey) => {
    setPermissionsDraft((prev) => {
      const next = { ...(prev.featurePermissions || {}) };
      const current = next[featureKey];
      if (current === true) next[featureKey] = false;
      else if (current === false) delete next[featureKey];
      else next[featureKey] = true;
      return { ...prev, featurePermissions: next };
    });
  };

  const savePermissions = async () => {
    if (!selectedUser?._id) return;
    try {
      await userService.updateUserPermissions(selectedUser._id, permissionsDraft);
      toast.success("Permissions updated");
      setShowPermissionsModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update permissions");
    }
  };

  const openLeaveBalanceModal = (user) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      leaveBalance: user.leaveBalance || {
        annual: 20,
        sick: 10,
        personal: 5,
      },
    });
    setShowLeaveBalanceModal(true);
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "manager":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading && users.length === 0 && !filters.search.trim()) {
    return <PageSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-title">
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Manage employees, roles, permissions, and account status with cleaner spacing across phone and desktop layouts.
          </p>
        </div>
        <div className="page-header-actions">
          <Button
            onClick={() => {
              resetForm();
              setShowUserModal(true);
            }}
            className="btn-primary inline-flex w-full items-center justify-center space-x-2 sm:w-auto"
          >
            <FaUserPlus />
            <span>Add New User</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-blue-600">Total Users</p>
              <p className="stat-value text-blue-700">{users.length}</p>
            </div>
            <FaUserCircle className="text-blue-500 text-3xl" />
          </div>
        </div>

        <div className="stat-card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-green-600">Active Users</p>
              <p className="stat-value text-green-700">
                {users.filter((u) => u.isActive).length}
              </p>
            </div>
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
        </div>

        <div className="stat-card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-yellow-600">Managers</p>
              <p className="stat-value text-yellow-700">
                {users.filter((u) => u.role === "manager").length}
              </p>
            </div>
            <FaUserCircle className="text-yellow-500 text-3xl" />
          </div>
        </div>

        <div className="stat-card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-purple-600">Admins</p>
              <p className="stat-value text-purple-700">
                {users.filter((u) => u.role === "admin").length}
              </p>
            </div>
            <FaUserCircle className="text-purple-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <Select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="input-field"
            >
              <Option value="all">All Roles</Option>
              {visibleFilterRoles.map((role) => (
                <Option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <Select
              value={filters.department}
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
              className="input-field"
            >
              <Option value="all">All Departments</Option>
              {departments.map((dept) => (
                <Option key={dept._id} value={dept.name}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="input-field"
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <FaSearch className="text-gray-400" />
              </div>
              <Input
                type="text"
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                placeholder="Name, email, or ID..."
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="responsive-table-shell">
          <table className="responsive-data-table min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4" data-label="User">
                    <div className="flex items-center">
                      <FaUserCircle className="h-8 w-8 text-gray-400" />
                      <div className="ml-3 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500" data-label="Employee ID">
                    {user.employeeId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500" data-label="Department">
                    {user.department}
                  </td>
                  <td className="px-6 py-4" data-label="Role">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4" data-label="Leave Balance">
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span>Annual:</span>
                        <span className="font-medium">
                          {user.leaveBalance?.annual || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sick:</span>
                        <span className="font-medium">
                          {user.leaveBalance?.sick || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Personal:</span>
                        <span className="font-medium">
                          {user.leaveBalance?.personal || 0}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4" data-label="Status">
                    {user.isActive ? (
                      <span className="flex items-center text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs w-fit">
                        <FaCheckCircle className="mr-1" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs w-fit">
                        <FaBan className="mr-1" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4" data-label="Actions" data-cell="actions">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-full"
                        title="Edit User"
                      >
                        <FaEdit />
                      </Button>
                      <Button
                        onClick={() => openLeaveBalanceModal(user)}
                        className="text-green-600 hover:text-green-900 bg-green-100 p-2 rounded-full"
                        title="Update Leave Balance"
                      >
                        <FaKey />
                      </Button>
                      <Button
                        onClick={() =>
                          toggleUserStatus(user._id, user.isActive)
                        }
                        className={`${
                          user.isActive
                            ? "text-yellow-600 hover:text-yellow-900 bg-yellow-100"
                            : "text-green-600 hover:text-green-900 bg-green-100"
                        } p-2 rounded-full`}
                        title={
                          user.isActive ? "Deactivate User" : "Activate User"
                        }
                      >
                        {user.isActive ? <FaToggleOn /> : <FaToggleOff />}
                      </Button>
                      <Button
                        onClick={() => sendCredentials(user._id)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 p-2 rounded-full"
                        title="Send Credentials by Email"
                      >
                        <FaEnvelope />
                      </Button>
                      <Button
                        onClick={() => openPermissionsModal(user)}
                        className="text-violet-600 hover:text-violet-900 bg-violet-100 p-2 rounded-full"
                        title="Manage Permissions"
                      >
                        <FaShieldAlt />
                      </Button>
                      <Button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-full"
                        title="Delete User"
                      >
                        <FaTrash />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <FaUserCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No users found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No users match your current filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          resetForm();
        }}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
        departments={departments}
        allowedRoles={creatableRoles}
      />

      <LeaveBalanceModal
        isOpen={showLeaveBalanceModal}
        onClose={() => {
          setShowLeaveBalanceModal(false);
          setSelectedUser(null);
          resetForm();
        }}
        onSubmit={handleUpdateLeaveBalance}
        formData={formData}
        setFormData={setFormData}
        selectedUser={selectedUser}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        onConfirm={handleDelete}
        selectedUser={selectedUser}
      />

      {showPermissionsModal && selectedUser && (
        <div
          className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowPermissionsModal(false);
              setSelectedUser(null);
            }
          }}
        >
          <div className="relative my-6 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
            <h3 className="text-lg font-semibold mb-2">Manage Permissions</h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedUser.name} ({selectedUser.role})
            </p>

            <div className="flex items-center gap-2 mb-4">
              <Input
                type="checkbox"
                checked={permissionsDraft.allowCrossDepartment}
                onChange={(e) =>
                  setPermissionsDraft((prev) => ({
                    ...prev,
                    allowCrossDepartment: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded"
              />
              <label className="text-sm text-gray-700">Allow access to all departments</label>
            </div>

            <div className="mb-4">
              <label className="form-label">Extra Department Access</label>
              <MultiSelect
                options={departments.map((dept) => ({ value: dept.name, label: dept.name }))}
                values={permissionsDraft.allowedDepartments || []}
                onChange={(selected) =>
                  setPermissionsDraft((prev) => ({ ...prev, allowedDepartments: selected }))
                }
                placeholder="Select department to add"
                summaryLabel="You selected departments"
              />
            </div>

            <div className="border rounded-lg p-3 max-h-72 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Feature Overrides</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.keys(FEATURE_ACCESS).map((featureKey) => {
                  const value = permissionsDraft.featurePermissions?.[featureKey];
                  return (
                    <Button
                      key={featureKey}
                      type="button"
                      onClick={() => handlePermissionToggle(featureKey)}
                      className={`justify-start text-sm ${
                        value === true
                          ? "bg-green-100 text-green-700"
                          : value === false
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {featureKey} ({value === true ? "allow" : value === false ? "deny" : "inherit"})
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button
                className="btn-secondary"
                onClick={() => {
                  setShowPermissionsModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button className="btn-primary" onClick={savePermissions}>
                Save Permissions
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
