/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import { Button } from "@/components/ui";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { departmentService, userService } from "@/services/api";
import {
  FaBuilding,
  FaEdit,
  FaArrowLeft,
  FaTimes,
  FaUserTie,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaUserCircle,
} from "react-icons/fa";
import { format } from "date-fns";
import toast from "react-hot-toast";
import DepartmentHeadModal from "../components/modals/DepartmentHeadModal";

const DepartmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, isManager } = useAuth();
  const [department, setDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  useEffect(() => {
    fetchDepartmentDetails();
  }, [id]);

  const fetchDepartmentDetails = async () => {
    try {
      const response = await departmentService.getDepartment(id);
      setDepartment(response.data);
    } catch (error) {
      console.error("Error fetching department:", error);
      toast.error("Failed to fetch department details");
      navigate("/departments");
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    if (!department?.name) {
      toast.error("Department name not found");
      return;
    }

    setLoadingUsers(true);
    try {
      console.log("Fetching users for department:", department.name);

      const excludeUserId = department.headOfDepartment?._id || "";

      const response = await userService.getDepartmentCandidates(
        department.name,
        excludeUserId || undefined,
      );

      console.log("Candidates response:", response.data);

      // Set users from response data
      setAvailableUsers(response.data.data || []);
      setShowHeadModal(true);

      if (response.data.count === 0) {
        toast("No eligible users found in this department");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch available users",
      );
    } finally {
      setLoadingUsers(false);
    }
  };
  
  const setDepartmentHead = async (userId) => {
    try {
      await departmentService.setDepartmentHead(id, userId);
      toast.success("Department head updated successfully");
      setShowHeadModal(false);
      fetchDepartmentDetails(); // Refresh department data
    } catch (error) {
      console.error("Error setting department head:", error);
      toast.error(
        error.response?.data?.message || "Failed to set department head",
      );
    }
  };

  if (loading) {
    return <PageSkeleton rows={6} />;
  }

  if (!department) {
    return (
      <div className="text-center py-12">
        <FaBuilding className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Department not found
        </h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate("/departments")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FaArrowLeft className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {department.name}
            </h1>
            <p className="text-gray-600">Code: {department.code}</p>
          </div>
        </div>
        {isAdmin && (
          <Button
            onClick={() => navigate(`/departments/edit/${id}`)}
            className="btn-primary flex items-center space-x-2"
          >
            <FaEdit />
            <span>Edit Department</span>
          </Button>
        )}
      </div>

      {/* Department Header Card */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
              <FaBuilding className="text-3xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{department.name}</h2>
              <p className="text-white/80">
                {department.description || "No description provided"}
              </p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              department.isActive ? "bg-green-500" : "bg-gray-50"
            }`}
          >
            {department.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div>
            <p className="text-white/80 text-sm">Total Employees</p>
            <p className="text-2xl font-bold">
              {department.employees?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-white/80 text-sm">Managers</p>
            <p className="text-2xl font-bold">
              {department.employees?.filter((e) => e.role === "manager")
                .length || 0}
            </p>
          </div>
          <div>
            <p className="text-white/80 text-sm">Pending Leaves</p>
            <p className="text-2xl font-bold">
              {department.pendingApprovals?.length || 0}
            </p>
          </div>
          <div>
            <p className="text-white/80 text-sm">Total Leave Days</p>
            <p className="text-2xl font-bold">
              {department.leaveStatistics?.totalLeaves || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <Button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "overview"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </Button>
          <Button
            onClick={() => setActiveTab("employees")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "employees"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Employees
          </Button>
          <Button
            onClick={() => setActiveTab("leaves")}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === "leaves"
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Leave Statistics
          </Button>
          {(isAdmin || isManager) && (
            <Button
              onClick={() => setActiveTab("pending")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "pending"
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Pending Approvals
            </Button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 space-y-6">
              {/* Contact Information */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">
                  Contact Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {department.contactInfo?.email && (
                    <div className="flex items-center space-x-3">
                      <FaEnvelope className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">
                          {department.contactInfo.email}
                        </p>
                      </div>
                    </div>
                  )}
                  {department.contactInfo?.phone && (
                    <div className="flex items-center space-x-3">
                      <FaPhone className="text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">
                          {department.contactInfo.phone}
                          {department.contactInfo.extension &&
                            ` ext. ${department.contactInfo.extension}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Location */}
              {department.location && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">Location</h3>
                  <div className="flex items-center space-x-3">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {department.location.building &&
                          `${department.location.building}, `}
                        {department.location.floor &&
                          `Floor ${department.location.floor}, `}
                        {department.location.office &&
                          department.location.office}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Department Hierarchy */}
              {department.parentDepartment && (
                <div className="card">
                  <h3 className="text-lg font-semibold mb-4">
                    Parent Department
                  </h3>
                  <Link
                    to={`/departments/${department.parentDepartment._id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {department.parentDepartment.name}
                  </Link>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* Department Head */}
              <div className="card">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Department Head</h3>
                  {isAdmin && (
                    <Button
                      onClick={fetchAvailableUsers}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      Change
                    </Button>
                  )}
                </div>
                {department.headOfDepartment ? (
                  <div className="flex items-center space-x-3">
                    <FaUserTie className="text-2xl text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {department.headOfDepartment.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {department.headOfDepartment.email}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No head assigned</p>
                )}
              </div>

              {/* Leave Settings */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">
                  Default Leave Quota
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual:</span>
                    <span className="font-medium">
                      {department.settings?.defaultLeaveQuota?.annual || 20}{" "}
                      days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sick:</span>
                    <span className="font-medium">
                      {department.settings?.defaultLeaveQuota?.sick || 10} days
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Personal:</span>
                    <span className="font-medium">
                      {department.settings?.defaultLeaveQuota?.personal || 5}{" "}
                      days
                    </span>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span>
                      {format(new Date(department.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Updated:</span>
                    <span>
                      {format(new Date(department.updatedAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Employees Tab */}
        {activeTab === "employees" && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Department Employees</h3>
            <div className="responsive-table-shell">
              <table className="responsive-data-table min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Employee</th>
                    <th className="text-left py-3 px-4">Employee ID</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-left py-3 px-4">Leave Balance</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {department.employees?.map((emp) => (
                    <tr key={emp._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4" data-label="Employee">
                        <div className="flex items-center space-x-3">
                          <FaUserCircle className="text-gray-400 text-xl" />
                          <div>
                            <p className="font-medium">{emp.name}</p>
                            <p className="text-sm text-gray-500">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4" data-label="Employee ID">{emp.employeeId}</td>
                      <td className="py-3 px-4" data-label="Role">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            emp.role === "admin"
                              ? "bg-purple-100 text-purple-800"
                              : emp.role === "manager"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3 px-4" data-label="Leave Balance">
                        <div className="text-xs">
                          <div>A: {emp.leaveBalance?.annual || 0}</div>
                          <div>S: {emp.leaveBalance?.sick || 0}</div>
                          <div>P: {emp.leaveBalance?.personal || 0}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4" data-label="Status">
                        {emp.isActive ? (
                          <span className="flex items-center text-green-600">
                            <FaCheckCircle className="mr-1" /> Active
                          </span>
                        ) : (
                          <span className="flex items-center text-red-600">
                            <FaTimesCircle className="mr-1" /> Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Leave Statistics Tab */}
        {activeTab === "leaves" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Leave Summary</h3>
              <div className="space-y-4">
                {department.leaveStatistics?.byType?.map((stat) => (
                  <div
                    key={stat.type}
                    className="flex items-center justify-between"
                  >
                    <span className="capitalize">{stat.type} Leave</span>
                    <span className="font-medium">{stat.days} days</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="text-lg font-semibold mb-4">Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Leave Days:</span>
                  <span className="font-medium">
                    {department.leaveStatistics?.totalLeaves || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average per Employee:</span>
                  <span className="font-medium">
                    {department.employees?.length > 0
                      ? (
                          department.leaveStatistics?.totalLeaves /
                          department.employees.length
                        ).toFixed(1)
                      : 0}{" "}
                    days
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === "pending" && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">
              Pending Leave Requests
            </h3>
            <div className="responsive-table-shell">
              <table className="responsive-data-table min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Employee</th>
                    <th className="text-left py-3 px-4">Leave Type</th>
                    <th className="text-left py-3 px-4">Duration</th>
                    <th className="text-left py-3 px-4">Days</th>
                    <th className="text-left py-3 px-4">Applied On</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {department.pendingApprovals?.map((leave) => (
                    <tr key={leave._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4" data-label="Employee">
                        <div className="flex items-center">
                          <FaUserCircle className="mr-2 text-gray-400" />
                          <span>{leave.employee?.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize" data-label="Leave Type">
                        {leave.leaveType}
                      </td>
                      <td className="py-3 px-4" data-label="Duration">
                        {format(new Date(leave.startDate), "MMM dd")} -{" "}
                        {format(new Date(leave.endDate), "MMM dd")}
                      </td>
                      <td className="py-3 px-4" data-label="Days">{leave.days}</td>
                      <td className="py-3 px-4" data-label="Applied On">
                        {format(new Date(leave.appliedOn), "MMM dd, yyyy")}
                      </td>
                      <td className="py-3 px-4" data-label="Actions" data-cell="actions">
                        <Link
                          to={`/leave-requests`}
                          className="text-primary-600 hover:underline"
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Replace the old modal with this */}
      <DepartmentHeadModal
        isOpen={showHeadModal}
        onClose={() => {
          setShowHeadModal(false);
          setAvailableUsers([]);
        }}
        onSelect={setDepartmentHead}
        users={availableUsers}
        loading={loadingUsers}
      />
    </div>
  );
};

export default DepartmentDetails;
