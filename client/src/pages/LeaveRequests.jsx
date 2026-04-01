import { useState, useEffect } from 'react';
import { Button, Input, Select, Option } from "@/components/ui";
import PageSkeleton from "@/components/PageSkeleton";
import { format } from 'date-fns';
import {
  FaCheckCircle,
  FaTimesCircle,
  FaClock,
  FaFilter,
  FaSearch,
  FaUserCircle,
  FaComment
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { departmentService, leaveService } from "@/services/api";
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import useDebouncedValue from "@/hooks/useDebouncedValue";

const LeaveRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'pending',
    department: 'all',
    search: ''
  });
  const [departments, setDepartments] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionData, setActionData] = useState({
    status: '',
    comments: ''
  });
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  useBodyScrollLock(showActionModal && !!selectedRequest);

  useEffect(() => {
    fetchRequests();
    fetchDepartments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.department]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.department !== 'all') params.append('department', filters.department);
      
      const response = await leaveService.getLeaves(
        Object.fromEntries(params.entries()),
      );
      setRequests(response);
    } catch (error) {
      toast.error(error, 'Failed to fetch leave requests');
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
      console.error(error, 'Failed to fetch departments');
      setDepartments([]);
    }
  };

  const handleAction = async () => {
    try {
      await leaveService.updateStatus(selectedRequest._id, {
        status: actionData.status,
        comments: actionData.comments
      });
      
      toast.success(`Leave request ${actionData.status} successfully`);
      setShowActionModal(false);
      fetchRequests();
      setActionData({ status: '', comments: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process request');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending':
        return <span className="flex items-center space-x-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full text-xs"><FaClock /> <span>Pending</span></span>;
      case 'approved':
        return <span className="flex items-center space-x-1 text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs"><FaCheckCircle /> <span>Approved</span></span>;
      case 'rejected':
        return <span className="flex items-center space-x-1 text-red-600 bg-red-100 px-2 py-1 rounded-full text-xs"><FaTimesCircle /> <span>Rejected</span></span>;
      default:
        return <span className="text-xs">{status}</span>;
    }
  };

  const filteredRequests = requests.filter(request => {
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      return (
        request.employee?.name?.toLowerCase().includes(searchLower) ||
        request.employee?.employeeId?.toLowerCase().includes(searchLower) ||
        request.reason?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (loading && requests.length === 0 && !filters.search.trim()) {
    return <PageSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-title">
          <h1 className="page-title">Leave Requests</h1>
          <p className="page-subtitle">
            Approve or reject team leave quickly with cleaner mobile spacing, readable filters, and compact action rows.
          </p>
        </div>
        <div className="page-header-actions">
          <Button
            onClick={() => fetchRequests()}
            className="btn-secondary w-full justify-center sm:w-auto"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h2 className="text-lg font-semibold">Filter Requests</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <Option value="all">All Status</Option>
              <Option value="pending">Pending</Option>
              <Option value="approved">Approved</Option>
              <Option value="rejected">Rejected</Option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <Select
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              className="input-field"
            >
              <Option value="all">All Departments</Option>
              {departments.map((dept) => (
                <Option key={dept._id || dept} value={dept.name || dept}>
                  {dept.name || dept}
                </Option>
              ))}
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
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search employee or reason..."
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <div className="stat-card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-yellow-600">Pending</p>
              <p className="stat-value text-yellow-700">
                {requests.filter(r => r.status === 'pending').length}
              </p>
            </div>
            <FaClock className="text-yellow-500 text-3xl" />
          </div>
        </div>

        <div className="stat-card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-green-600">Approved</p>
              <p className="stat-value text-green-700">
                {requests.filter(r => r.status === 'approved').length}
              </p>
            </div>
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
        </div>

        <div className="stat-card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-red-600">Rejected</p>
              <p className="stat-value text-red-700">
                {requests.filter(r => r.status === 'rejected').length}
              </p>
            </div>
            <FaTimesCircle className="text-red-500 text-3xl" />
          </div>
        </div>

        <div className="stat-card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="stat-label text-blue-600">Total Days</p>
              <p className="stat-value text-blue-700">
                {requests.reduce((acc, r) => acc + (r.days || 0), 0)}
              </p>
            </div>
            <FaClock className="text-blue-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="card overflow-hidden">
        <div className="responsive-table-shell">
          <table className="responsive-data-table min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
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
                  Applied
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <tr key={request._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4" data-label="Employee">
                    <div className="flex items-center">
                      <FaUserCircle className="h-8 w-8 text-gray-400" />
                      <div className="ml-3 min-w-0">
                        <div className="text-sm font-medium text-gray-900">
                          {request.employee?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.employee?.employeeId || 'N/A'} • {request.employee?.department || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4" data-label="Leave Details">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {request.leaveType} Leave
                    </div>
                    <div className="max-w-xs text-sm text-gray-500 sm:truncate">
                      {request.reason}
                    </div>
                  </td>
                  <td className="px-6 py-4" data-label="Duration">
                    <div className="text-sm text-gray-900">
                      {request.startDate ? format(new Date(request.startDate), 'MMM dd') : 'N/A'} - {request.endDate ? format(new Date(request.endDate), 'MMM dd, yyyy') : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4" data-label="Days">
                    <span className="text-sm font-medium text-gray-900">
                      {request.days} {request.days === 1 ? 'day' : 'days'}
                    </span>
                  </td>
                  <td className="px-6 py-4" data-label="Status">
                    {getStatusBadge(request.status)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500" data-label="Applied">
                    {request.appliedOn ? format(new Date(request.appliedOn), 'MMM dd, yyyy') : 'N/A'}
                  </td>
                  <td className="px-6 py-4" data-label="Actions" data-cell="actions">
                    {request.status === 'pending' && (
                      <div className="flex flex-wrap justify-end gap-2">
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionData({ ...actionData, status: 'approved' });
                            setShowActionModal(true);
                          }}
                          className="text-green-600 hover:text-green-900 bg-green-100 p-2 rounded-full"
                          title="Approve"
                        >
                          <FaCheckCircle />
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionData({ ...actionData, status: 'rejected' });
                            setShowActionModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 bg-red-100 p-2 rounded-full"
                          title="Reject"
                        >
                          <FaTimesCircle />
                        </Button>
                      </div>
                    )}
                    {request.status !== 'pending' && (
                      <Button
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowActionModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <FaComment />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <FaClock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No leave requests match your current filters.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && selectedRequest && (
        <div
          className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowActionModal(false);
              setActionData({ status: '', comments: '' });
            }
          }}
        >
          <div className="relative my-6 mx-auto w-full max-w-md rounded-xl border bg-white p-4 shadow-lg sm:p-5">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {actionData.status ? `${actionData.status === 'approved' ? 'Approve' : 'Reject'} Leave Request` : 'Request Details'}
              </h3>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{selectedRequest.employee?.name}</p>
                <p className="text-sm text-gray-600">{selectedRequest.leaveType} Leave • {selectedRequest.days} days</p>
                <p className="text-sm text-gray-600 mt-2">{selectedRequest.reason}</p>
              </div>

              {actionData.status && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    rows="3"
                    value={actionData.comments}
                    onChange={(e) => setActionData({ ...actionData, comments: e.target.value })}
                    className="input-field"
                    placeholder="Add any comments or remarks..."
                  />
                </div>
              )}

              {!actionData.status && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Status:</span> {selectedRequest.status}</p>
                  {selectedRequest.comments && (
                    <p><span className="font-medium">Comments:</span> {selectedRequest.comments}</p>
                  )}
                  {selectedRequest.approvedBy && (
                    <p><span className="font-medium">Processed by:</span> {selectedRequest.approvedBy.name}</p>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  onClick={() => {
                    setShowActionModal(false);
                    setActionData({ status: '', comments: '' });
                  }}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </Button>
                {actionData.status && (
                  <Button
                    onClick={handleAction}
                    className={`btn-primary w-full sm:w-auto ${
                      actionData.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    {actionData.status === 'approved' ? 'Approve' : 'Reject'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveRequests;
