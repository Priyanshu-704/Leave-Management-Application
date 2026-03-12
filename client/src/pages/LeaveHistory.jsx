import { useState, useEffect } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import { Button, Input, Select, Option } from "@/components/ui";
import { format } from "date-fns";
import {
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaFilePdf,
  FaFileExcel,
  FaEye,
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaHourglassHalf,
  FaBan,
  FaClipboardList,
  FaUmbrellaBeach,
  FaUserInjured,
  FaUser,
  FaMoneyBillWave,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { leaveService, userService } from "@/services/api";
import useBodyScrollLock from "../hooks/useBodyScrollLock";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { useAuth } from "@/context/AuthContext";

const LeaveHistory = () => {
  const { user } = useAuth();
  const canViewAllLeaves = ["manager", "admin", "super_admin"].includes(
    user?.role,
  );
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    leaveType: "all",
    employeeId: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [exporting, setExporting] = useState("");
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  useBodyScrollLock(showDetails && !!selectedLeave);

  useEffect(() => {
    fetchLeaves();
  }, [canViewAllLeaves]);

  useEffect(() => {
    if (!canViewAllLeaves) return;

    const fetchEmployees = async () => {
      try {
        const response = await userService.getUsers({ limit: 500 });
        const users = Array.isArray(response?.users)
          ? response.users
          : Array.isArray(response)
            ? response
            : [];
        setEmployees(users);
      } catch (error) {
        console.error("Failed to fetch employees:", error);
        toast.error("Failed to fetch employees");
      }
    };

    fetchEmployees();
  }, [canViewAllLeaves]);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const response = await (
        canViewAllLeaves
          ? leaveService.getLeaves()
          : leaveService.getMyLeaves()
      );
      setLeaves(response);
    } catch (error) {
      toast.error(error, "Failed to fetch leave history");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "approved":
        return <FaCheckCircle className="mr-1" />;
      case "rejected":
        return <FaTimesCircle className="mr-1" />;
      case "pending":
        return <FaHourglassHalf className="mr-1" />;
      case "cancelled":
        return <FaBan className="mr-1" />;
      default:
        return <FaClipboardList className="mr-1" />;
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    if (filters.status !== "all" && leave.status !== filters.status)
      return false;
    if (filters.leaveType !== "all" && leave.leaveType !== filters.leaveType)
      return false;

    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      if (
        !leave.reason.toLowerCase().includes(searchLower) &&
        !leave.leaveType.toLowerCase().includes(searchLower) &&
        !String(leave.employee?.name || "").toLowerCase().includes(searchLower) &&
        !String(leave.employee?.employeeId || "").toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }

    if (canViewAllLeaves && filters.employeeId !== "all") {
      if (String(leave.employee?._id || "") !== filters.employeeId) {
        return false;
      }
    }

    if (
      filters.dateFrom &&
      new Date(leave.startDate) < new Date(filters.dateFrom)
    )
      return false;
    if (filters.dateTo && new Date(leave.endDate) > new Date(filters.dateTo))
      return false;

    return true;
  });

  const downloadExport = async (formatType) => {
    try {
      setExporting(formatType);

      const params = {
        format: formatType,
        ...(filters.status !== "all" && { status: filters.status }),
        ...(filters.leaveType !== "all" && { leaveType: filters.leaveType }),
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
      };

      const response = await leaveService.exportMyLeaves(params);

      const disposition = response.headers["content-disposition"] || "";
      const filenameMatch = disposition.match(/filename="?(.*)"?$/i);
      const fileName =
        filenameMatch?.[1] ||
        `leave-history-${new Date().toISOString().split("T")[0]}.${formatType === "excel" ? "xls" : "pdf"}`;

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || "application/octet-stream",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(
        `Exported to ${formatType === "excel" ? "Excel" : "PDF"} successfully`,
      );
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        `Failed to export ${formatType === "excel" ? "Excel" : "PDF"}`;
      toast.error(errorMessage);
    } finally {
      setExporting("");
    }
  };

  const cancelLeave = async (leaveId) => {
    if (!window.confirm("Are you sure you want to cancel this leave request?"))
      return;

    try {
      // Send a request body with comments
      await leaveService.cancelLeave(leaveId, {
        comments: "Cancelled by employee",
      });
      toast.success("Leave request cancelled successfully");
      fetchLeaves();
    } catch (error) {
      console.error("Error cancelling leave:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to cancel leave request";
      toast.error(errorMessage);
    }
  };
  if (loading) {
    return <PageSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leave History</h1>
        <div className="flex space-x-3">
          <Button
            onClick={() => downloadExport("pdf")}
            disabled={exporting === "pdf"}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FaFilePdf />
            <span>{exporting === "pdf" ? "Exporting..." : "PDF"}</span>
          </Button>
          <Button
            onClick={() => downloadExport("excel")}
            disabled={exporting === "excel"}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaFileExcel />
            <span>{exporting === "excel" ? "Exporting..." : "Excel"}</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div
          className={`grid grid-cols-1 gap-4 ${
            canViewAllLeaves ? "md:grid-cols-3 lg:grid-cols-6" : "md:grid-cols-2 lg:grid-cols-5"
          }`}
        >
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
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type
            </label>
            <Select
              value={filters.leaveType}
              onChange={(e) =>
                setFilters({ ...filters, leaveType: e.target.value })
              }
              className="input-field"
            >
              <Option value="all">All Types</Option>
              <Option value="annual">Annual Leave</Option>
              <Option value="sick">Sick Leave</Option>
              <Option value="personal">Personal Leave</Option>
              <Option value="unpaid">Unpaid Leave</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters({ ...filters, dateFrom: e.target.value })
              }
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters({ ...filters, dateTo: e.target.value })
              }
              className="input-field"
            />
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
                placeholder="Search reason..."
                className="input-field pl-10"
              />
            </div>
          </div>
          {canViewAllLeaves && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee
              </label>
              <Select
                value={filters.employeeId}
                onChange={(e) =>
                  setFilters({ ...filters, employeeId: e.target.value })
                }
                className="input-field"
              >
                <Option value="all">All Employees</Option>
                {employees.map((employee) => (
                  <Option key={employee._id} value={employee._id}>
                    {employee.name} ({employee.employeeId || "N/A"})
                  </Option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Leave List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {canViewAllLeaves && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeaves.map((leave) => (
                <tr key={leave._id} className="hover:bg-gray-50">
                  {canViewAllLeaves && (
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {leave.employee?.name || "--"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {leave.employee?.employeeId || "N/A"}
                        {leave.employee?.department
                          ? ` • ${leave.employee.department}`
                          : ""}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">
                          {leave.leaveType === "annual" && <FaUmbrellaBeach />}
                          {leave.leaveType === "sick" && <FaUserInjured />}
                          {leave.leaveType === "personal" && <FaUser />}
                          {leave.leaveType === "unpaid" && <FaMoneyBillWave />}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {leave.leaveType} Leave
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {leave.reason}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {format(new Date(leave.startDate), "MMM dd, yyyy")}
                    </div>
                    <div className="text-sm text-gray-500">
                      to {format(new Date(leave.endDate), "MMM dd, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">
                      {leave.days} {leave.days === 1 ? "day" : "days"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(leave.status)}`}
                    >
                      {getStatusIcon(leave.status)} {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(leave.appliedOn), "MMM dd, yyyy")}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <Button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowDetails(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <FaEye />
                    </Button>
                    {leave.status === "pending" && (
                      <Button
                        onClick={() => cancelLeave(leave._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTimes />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredLeaves.length === 0 && (
            <div className="text-center py-12">
              <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No leave records
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No leave applications found matching your criteria.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Leave Details Modal */}
      {showDetails && selectedLeave && (
        <div
          className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowDetails(false);
          }}
        >
          <div className="relative my-6 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Leave Request Details</h3>
              <Button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </Button>
            </div>

            <div className="space-y-4">
              {canViewAllLeaves && selectedLeave.employee && (
                <div>
                  <label className="text-sm text-gray-500">Employee</label>
                  <p className="font-medium">{selectedLeave.employee.name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedLeave.employee.employeeId || "N/A"}
                    {selectedLeave.employee.department
                      ? ` • ${selectedLeave.employee.department}`
                      : ""}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Leave Type</label>
                  <p className="font-medium capitalize">
                    {selectedLeave.leaveType} Leave
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p
                    className={`font-medium ${getStatusColor(selectedLeave.status)} inline-block px-2 py-1 rounded`}
                  >
                    {selectedLeave.status}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Start Date</label>
                  <p className="font-medium">
                    {format(new Date(selectedLeave.startDate), "MMMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">End Date</label>
                  <p className="font-medium">
                    {format(new Date(selectedLeave.endDate), "MMMM dd, yyyy")}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Total Days</label>
                  <p className="font-medium">{selectedLeave.days} days</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Applied On</label>
                  <p className="font-medium">
                    {format(new Date(selectedLeave.appliedOn), "MMMM dd, yyyy")}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm text-gray-500">Reason</label>
                <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                  {selectedLeave.reason}
                </p>
              </div>

              {selectedLeave.comments && (
                <div>
                  <label className="text-sm text-gray-500">
                    Comments/Remarks
                  </label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {selectedLeave.comments}
                  </p>
                </div>
              )}

              {selectedLeave.approvedBy && (
                <div>
                  <label className="text-sm text-gray-500">
                    Approved/Rejected By
                  </label>
                  <p className="font-medium">{selectedLeave.approvedBy.name}</p>
                  <p className="text-sm text-gray-500">
                    on{" "}
                    {format(
                      new Date(selectedLeave.approvedOn),
                      "MMMM dd, yyyy",
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={() => setShowDetails(false)}
                className="btn-secondary"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;
