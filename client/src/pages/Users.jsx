/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
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
} from "react-icons/fa";
import toast from "react-hot-toast";
import instance from "../services/axios";
import UserModal from "../components/modals/UserModal";
import LeaveBalanceModal from "../components/modals/LeaveBalanceModal";
import DeleteConfirmModal from "../components/modals/DeleteConfirmModal";

const Users = () => {
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
  const [selectedUser, setSelectedUser] = useState(null);
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
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, [filters]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.role !== "all") params.append("role", filters.role);
      if (filters.department !== "all")
        params.append("department", filters.department);
      if (filters.status !== "all")
        params.append("isActive", filters.status === "active");
      if (filters.search) params.append("search", filters.search);

      const response = await instance.get(`/users?${params.toString()}`);
      setUsers(response.data.users || response.data);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await instance.get("/departments");
      // Handle different response structures
      const departmentsData = response.data.data || response.data || [];
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    } catch (error) {
      console.error("Failed to fetch departments:", error);
      setDepartments([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await instance.put(`/users/${editingId}`, formData);
        toast.success("User updated successfully");
      } else {
        await instance.post("/users", formData);
        toast.success("User created successfully");
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
      await instance.delete(`/users/${selectedUser._id}`);
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
      await instance.put(
        `/users/${selectedUser._id}/leave-balance`,
        formData.leaveBalance,
      );
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
      await instance.put(`/users/${userId}/toggle-status`);
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
      role: "employee",
      leaveBalance: {
        annual: 20,
        sick: 10,
        personal: 5,
      },
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
      role: user.role,
      leaveBalance: user.leaveBalance || {
        annual: 20,
        sick: 10,
        personal: 5,
      },
    });
    setShowUserModal(true);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => {
            resetForm();
            setShowUserModal(true);
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <FaUserPlus />
          <span>Add New User</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-blue-700">{users.length}</p>
            </div>
            <FaUserCircle className="text-blue-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-green-700">
                {users.filter((u) => u.isActive).length}
              </p>
            </div>
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm">Managers</p>
              <p className="text-2xl font-bold text-yellow-700">
                {users.filter((u) => u.role === "manager").length}
              </p>
            </div>
            <FaUserCircle className="text-yellow-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm">Admins</p>
              <p className="text-2xl font-bold text-purple-700">
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="input-field"
            >
              <option value="all">All Roles</option>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) =>
                setFilters({ ...filters, department: e.target.value })
              }
              className="input-field"
            >
              <option value="all">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <FaSearch className="text-gray-400" />
              </div>
              <input
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
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
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <FaUserCircle className="h-8 w-8 text-gray-400" />
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.employeeId}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.department}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleBadgeColor(user.role)}`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-100 p-2 rounded-full"
                        title="Edit User"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => openLeaveBalanceModal(user)}
                        className="text-green-600 hover:text-green-900 bg-green-100 p-2 rounded-full"
                        title="Update Leave Balance"
                      >
                        <FaKey />
                      </button>
                      <button
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
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-full"
                        title="Delete User"
                      >
                        <FaTrash />
                      </button>
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
    </div>
  );
};

export default Users;
