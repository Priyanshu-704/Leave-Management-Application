import { useState, useEffect } from 'react';
import axios from 'axios';
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
  FaExclamationTriangle
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AttendanceHistory = () => {
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: format(new Date().setDate(1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchAttendance();
  }, [filters.startDate, filters.endDate, pagination.page]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: pagination.page,
        limit: 20
      });

      const response = await axios.get(`${API_URL}/attendance/history?${params}`);
      setAttendance(response.data.data);
      setSummary(response.data.summary);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast.error('Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Attendance History</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => {/* Export PDF */}}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <FaFilePdf />
            <span>PDF</span>
          </button>
          <button
            onClick={() => {/* Export Excel */}}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <FaFileExcel />
            <span>Excel</span>
          </button>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">From Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">To Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search..."
                className="input-field pl-10"
              />
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
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
              {attendance.map((record) => (
                <tr key={record._id} className="hover:bg-gray-50">
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
                    <button
                      onClick={() => {/* View details */}}
                      className="text-primary-600 hover:text-primary-800"
                    >
                      <FaEye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-3 py-1">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 border rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHistory;