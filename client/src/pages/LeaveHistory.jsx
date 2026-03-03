import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaFilePdf,
  FaFileExcel,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import toast from "react-hot-toast";
import instance from "../services/axios";

const LeaveHistory = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "all",
    leaveType: "all",
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await instance.get("/leaves/my-leaves");
      setLeaves(response.data);
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
        return "✅";
      case "rejected":
        return "❌";
      case "pending":
        return "⏳";
      case "cancelled":
        return "🚫";
      default:
        return "📝";
    }
  };

  const filteredLeaves = leaves.filter((leave) => {
    if (filters.status !== "all" && leave.status !== filters.status)
      return false;
    if (filters.leaveType !== "all" && leave.leaveType !== filters.leaveType)
      return false;

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !leave.reason.toLowerCase().includes(searchLower) &&
        !leave.leaveType.toLowerCase().includes(searchLower)
      ) {
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

  const exportToPDF = () => {
    toast.success("Exporting to PDF...");
    // Implement PDF export logic
  };

  const exportToExcel = () => {
    toast.success("Exporting to Excel...");
    // Implement Excel export logic
  };

  const cancelLeave = async (leaveId) => {
    if (!window.confirm("Are you sure you want to cancel this leave request?"))
      return;

    try {
      // Send a request body with comments
      await instance.put(`/leaves/${leaveId}/cancel`, {
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
        <h1 className="text-2xl font-bold text-gray-900">Leave History</h1>
        <div className="flex space-x-3">
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FaFilePdf />
            <span>PDF</span>
          </button>
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaFileExcel />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Leave Type
            </label>
            <select
              value={filters.leaveType}
              onChange={(e) =>
                setFilters({ ...filters, leaveType: e.target.value })
              }
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="annual">Annual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="personal">Personal Leave</option>
              <option value="unpaid">Unpaid Leave</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
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
            <input
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
              <input
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
        </div>
      </div>

      {/* Leave List */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">
                          {leave.leaveType === "annual" && "🏖️"}
                          {leave.leaveType === "sick" && "🤒"}
                          {leave.leaveType === "personal" && "👤"}
                          {leave.leaveType === "unpaid" && "💰"}
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
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowDetails(true);
                      }}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <FaEye />
                    </button>
                    {leave.status === "pending" && (
                      <button
                        onClick={() => cancelLeave(leave._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <FaTimes />
                      </button>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Leave Request Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4">
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
              <button
                onClick={() => setShowDetails(false)}
                className="btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveHistory;
