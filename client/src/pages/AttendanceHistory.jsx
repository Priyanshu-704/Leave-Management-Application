import { useState, useEffect, useCallback } from 'react';
import { Button, Input, Select } from "@/components/ui";
import PageSkeleton from "@/components/PageSkeleton";
import { format } from 'date-fns';
import {
  FaCalendarAlt,
  FaFilter,
  FaSearch,
  FaFilePdf,
  FaFileExcel,
  FaEye,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaTimes,
  FaMapMarkerAlt,
  FaCoffee
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { attendanceService, userService } from "@/services/api";
import useDebouncedValue from "@/hooks/useDebouncedValue";
import { useAuth } from "@/context/AuthContext";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";

const normalizeSummary = (summary) => {
  if (!Array.isArray(summary)) {
    return summary;
  }

  return summary.reduce(
    (acc, item) => {
      const count = Number(item?.count || 0);
      const totalHours = Number(item?.totalHours || 0);

      acc.totalDays += count;
      acc.totalWorkHours += totalHours;

      if (item?._id === 'present') acc.presentDays += count;
      if (item?._id === 'absent') acc.absentDays += count;
      if (item?._id === 'on-leave') acc.onLeaveDays += count;

      return acc;
    },
    {
      totalDays: 0,
      presentDays: 0,
      lateDays: 0,
      absentDays: 0,
      onLeaveDays: 0,
      totalWorkHours: 0,
    },
  );
};

const AttendanceHistory = () => {
  const { user } = useAuth();
  const canViewAllAttendance = ['manager', 'admin', 'super_admin'].includes(user?.role);
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [filters, setFilters] = useState({
    startDate: format(new Date().setDate(1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    employeeId: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const debouncedSearch = useDebouncedValue(filters.search, 300);
  useBodyScrollLock(!!selectedAttendance);

  useEffect(() => {
    if (!canViewAllAttendance) return;

    const fetchEmployees = async () => {
      try {
        const response = await userService.getUsers({ limit: 500 });
        const users = Array.isArray(response?.users) ? response.users : Array.isArray(response) ? response : [];
        setEmployees(users);
      } catch (error) {
        console.error('Error fetching employees:', error);
        toast.error('Failed to fetch employees');
      }
    };

    fetchEmployees();
  }, [canViewAllAttendance]);

  const fetchAttendance = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: pagination.page,
        limit: 20
      });
      if (canViewAllAttendance && filters.employeeId !== 'all') {
        params.append('employeeId', filters.employeeId);
      }

      const response = await (canViewAllAttendance
        ? attendanceService.getAll(Object.fromEntries(params.entries()))
        : attendanceService.getHistory(
        Object.fromEntries(params.entries()),
      ));
      setAttendance(response.data);
      setSummary(normalizeSummary(response.summary));
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  }, [canViewAllAttendance, filters.employeeId, filters.startDate, filters.endDate, pagination.page]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const getStatusIcon = (status, isLate) => {
    if (isLate) return <FaExclamationTriangle className="text-yellow-500" />;
    switch(status) {
      case 'present': return <FaCheckCircle className="text-green-500" />;
      case 'absent': return <FaTimesCircle className="text-red-500" />;
      case 'on-leave': return <FaCalendarAlt className="text-blue-500" />;
      default: return <FaClock className="text-gray-500" />;
    }
  };

  const getStatusColor = (status, isLate) => {
    if (isLate) return 'text-yellow-700 bg-yellow-50';
    switch(status) {
      case 'present': return 'text-green-700 bg-green-50';
      case 'absent': return 'text-red-700 bg-red-50';
      case 'on-leave': return 'text-blue-700 bg-blue-50';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const formatDateTime = (value) => (
    value ? format(new Date(value), 'MMM dd, yyyy hh:mm:ss a') : '--'
  );

  const formatShortTime = (value) => (
    value ? format(new Date(value), 'hh:mm:ss a') : '--'
  );

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '--';
    const durationMs = new Date(endTime).getTime() - new Date(startTime).getTime();
    const totalMinutes = Math.max(0, Math.floor(durationMs / 60000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const filteredAttendance = attendance.filter((record) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    const dateStr = format(new Date(record.date), "MMM dd, yyyy").toLowerCase();
    const status = String(record.status || "").toLowerCase();
    const employeeName = String(record.employee?.name || "").toLowerCase();
    const employeeCode = String(record.employee?.employeeId || "").toLowerCase();
    return (
      dateStr.includes(searchLower) ||
      status.includes(searchLower) ||
      employeeName.includes(searchLower) ||
      employeeCode.includes(searchLower)
    );
  });

  if (loading && attendance.length === 0 && !filters.search.trim()) {
    return <PageSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <div className="flex space-x-3">
          <Button
            onClick={() => {/* Export PDF */}}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FaFilePdf />
            <span>PDF</span>
          </Button>
          <Button
            onClick={() => {/* Export Excel */}}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaFileExcel />
            <span>Excel</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="card bg-blue-50">
            <p className="text-sm text-blue-600">Total Days</p>
            <p className="text-2xl font-bold text-blue-700">{summary.totalDays || 0}</p>
          </div>
          <div className="card bg-green-50">
            <p className="text-sm text-green-600">Present</p>
            <p className="text-2xl font-bold text-green-700">{summary.presentDays || 0}</p>
          </div>
          <div className="card bg-yellow-50">
            <p className="text-sm text-yellow-600">Late</p>
            <p className="text-2xl font-bold text-yellow-700">{summary.lateDays || 0}</p>
          </div>
          <div className="card bg-red-50">
            <p className="text-sm text-red-600">Absent</p>
            <p className="text-2xl font-bold text-red-700">{summary.absentDays || 0}</p>
          </div>
          <div className="card bg-purple-50">
            <p className="text-sm text-purple-600">Total Hours</p>
            <p className="text-2xl font-bold text-purple-700">
              {summary.totalWorkHours?.toFixed(1) || 0}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className={`grid grid-cols-1 gap-4 ${canViewAllAttendance ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <div>
            <label className="form-label">From Date</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <Input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search..."
                className="input-field pl-10"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
          {canViewAllAttendance && (
            <div>
              <label className="form-label">Employee</label>
              <Select
                value={filters.employeeId}
                onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
              >
                <option value="all">All Employees</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.name} ({employee.employeeId || 'N/A'})
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {canViewAllAttendance && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAttendance.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
                  {canViewAllAttendance && (
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{record.employee?.name || '--'}</div>
                      <div className="text-xs text-gray-500">
                        {record.employee?.employeeId || 'N/A'}{record.employee?.department ? ` • ${record.employee.department}` : ''}
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4">
                    {format(new Date(record.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    {format(new Date(record.date), 'EEEE')}
                  </td>
                  <td className="px-6 py-4">
                    {record.checkIn?.time ? (
                      <div>
                        <span className="font-medium">
                          {format(new Date(record.checkIn.time), 'hh:mm:ss a')}
                        </span>
                        {record.isLate && (
                          <span className="ml-2 text-xs text-yellow-600">
                            (Late: {record.lateMinutes} min)
                          </span>
                        )}
                      </div>
                    ) : '--'}
                  </td>
                  <td className="px-6 py-4">
                    {record.checkOut?.time ? 
                      format(new Date(record.checkOut.time), 'hh:mm:ss a') : '--'}
                  </td>
                  <td className="px-6 py-4">
                    {record.workHours ? record.workHours.toFixed(2) : '0.00'} hrs
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs w-fit ${getStatusColor(record.status, record.isLate)}`}>
                      {getStatusIcon(record.status, record.isLate)}
                      <span className="capitalize">
                        {record.isLate ? 'Late' : record.status}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      onClick={() => setSelectedAttendance(record)}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <FaEye />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <Button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </Button>
            <span className="px-3 py-1">
              Page {pagination.page} of {pagination.pages}
            </span>
            <Button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {selectedAttendance && (
        <div
          className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelectedAttendance(null);
          }}
        >
          <div className="relative my-6 mx-auto w-full max-w-3xl rounded-lg border bg-white p-5 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Attendance Details</h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(selectedAttendance.date), 'MMMM dd, yyyy')}
                </p>
              </div>
              <Button
                onClick={() => setSelectedAttendance(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </Button>
            </div>

            <div className="space-y-5">
              {canViewAllAttendance && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-medium text-gray-900">{selectedAttendance.employee?.name || '--'}</p>
                  <p className="text-sm text-gray-500">
                    {selectedAttendance.employee?.employeeId || 'N/A'}
                    {selectedAttendance.employee?.department ? ` • ${selectedAttendance.employee.department}` : ''}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <p className="text-sm text-green-700">Check In</p>
                  <p className="mt-1 text-lg font-semibold text-green-900">
                    {formatDateTime(selectedAttendance.checkIn?.time)}
                  </p>
                  <p className="mt-1 text-sm text-green-800">
                    Note: {selectedAttendance.checkIn?.note?.trim() || 'No note'}
                  </p>
                  {selectedAttendance.checkIn?.location?.address && (
                    <p className="mt-1 flex items-center text-xs text-green-800">
                      <FaMapMarkerAlt className="mr-1" />
                      {selectedAttendance.checkIn.location.address}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-700">Check Out</p>
                  <p className="mt-1 text-lg font-semibold text-red-900">
                    {formatDateTime(selectedAttendance.checkOut?.time)}
                  </p>
                  <p className="mt-1 text-sm text-red-800">
                    Note: {selectedAttendance.checkOut?.note?.trim() || 'No note'}
                  </p>
                  {selectedAttendance.checkOut?.location?.address && (
                    <p className="mt-1 flex items-center text-xs text-red-800">
                      <FaMapMarkerAlt className="mr-1" />
                      {selectedAttendance.checkOut.location.address}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Status</p>
                  <p className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(selectedAttendance.status, selectedAttendance.isLate)}`}>
                    {selectedAttendance.isLate ? 'Late' : selectedAttendance.status}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Work Hours</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedAttendance.workHours ? `${selectedAttendance.workHours.toFixed(2)} hrs` : '0.00 hrs'}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Late By</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedAttendance.isLate ? `${selectedAttendance.lateMinutes || 0} min` : 'On time'}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm text-gray-500">Early Departure</p>
                  <p className="mt-1 font-semibold text-gray-900">
                    {selectedAttendance.earlyDeparture ? `${selectedAttendance.earlyDepartureMinutes || 0} min` : 'No'}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="mb-3 flex items-center">
                  <FaCoffee className="mr-2 text-yellow-600" />
                  <h4 className="font-semibold text-gray-900">Breaks</h4>
                </div>
                {selectedAttendance.breaks?.length ? (
                  <div className="space-y-3">
                    {selectedAttendance.breaks.map((breakItem, index) => (
                      <div key={`${breakItem.startTime || index}-${index}`} className="rounded-lg bg-gray-50 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium capitalize text-gray-900">
                            Break {index + 1} {breakItem.type ? `• ${breakItem.type}` : ''}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDuration(breakItem.startTime, breakItem.endTime)}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {formatShortTime(breakItem.startTime)} - {formatShortTime(breakItem.endTime)}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                          Note: {breakItem.note?.trim() || 'No note'}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No breaks recorded for this day.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHistory;
