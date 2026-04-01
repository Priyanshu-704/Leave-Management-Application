import { useState, useEffect } from 'react';
import PageSkeleton from '@/components/PageSkeleton';
import { Button } from "@/components/ui";
import { departmentService } from "@/services/api";
import {
  FaDownload,
  FaUsers,
  FaBuilding,
  FaCheckCircle,
  FaClock,
  FaArrowLeft
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const DepartmentAnalytics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await departmentService.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(analytics, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `department-analytics-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (loading) {
    return <PageSkeleton rows={6} />;
  }

  // Calculate totals
  const totals = analytics.reduce((acc, dept) => ({
    employees: acc.employees + (dept.employeeCount || 0),
    activeEmployees: acc.activeEmployees + (dept.activeEmployees || 0),
    managers: acc.managers + (dept.managerCount || 0),
    leaves: acc.leaves + (dept.totalLeaves || 0),
    approvedLeaves: acc.approvedLeaves + (dept.approvedLeaves || 0),
    pendingLeaves: acc.pendingLeaves + (dept.pendingLeaves || 0),
    leaveDays: acc.leaveDays + (dept.totalLeaveDays || 0)
  }), {
    employees: 0,
    activeEmployees: 0,
    managers: 0,
    leaves: 0,
    approvedLeaves: 0,
    pendingLeaves: 0,
    leaveDays: 0
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate('/departments')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FaArrowLeft className="text-gray-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Department Analytics</h1>
            <p className="text-gray-600">Comprehensive overview of all departments</p>
          </div>
        </div>
        <Button
          onClick={exportData}
          className="btn-outline flex items-center space-x-2"
        >
          <FaDownload />
          <span>Export Data</span>
        </Button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">Total Employees</p>
              <p className="text-2xl font-bold text-blue-700">{totals.employees}</p>
            </div>
            <FaUsers className="text-blue-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">Active Employees</p>
              <p className="text-2xl font-bold text-green-700">{totals.activeEmployees}</p>
            </div>
            <FaCheckCircle className="text-green-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm">Total Managers</p>
              <p className="text-2xl font-bold text-purple-700">{totals.managers}</p>
            </div>
            <FaBuilding className="text-purple-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-yellow-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm">Pending Approvals</p>
              <p className="text-2xl font-bold text-yellow-700">{totals.pendingLeaves}</p>
            </div>
            <FaClock className="text-yellow-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Employee Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Employee Distribution by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="employeeCount" fill="#2563eb" name="Total Employees" />
              <Bar dataKey="activeEmployees" fill="#10b981" name="Active Employees" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Leave Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.map(dept => ({
                  name: dept.name,
                  value: dept.totalLeaveDays || 0
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {analytics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Department Size Comparison */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Department Size Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="employeeCount" fill="#8b5cf6" name="Employees" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leave Status Overview */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Leave Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="approvedLeaves" fill="#10b981" name="Approved" />
              <Bar dataKey="pendingLeaves" fill="#f59e0b" name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Detailed Department Metrics</h3>
        <div className="responsive-table-shell">
          <table className="responsive-data-table min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Department</th>
                <th className="text-left py-3 px-4">Code</th>
                <th className="text-right py-3 px-4">Total Emp</th>
                <th className="text-right py-3 px-4">Active Emp</th>
                <th className="text-right py-3 px-4">Managers</th>
                <th className="text-right py-3 px-4">Total Leaves</th>
                <th className="text-right py-3 px-4">Approved</th>
                <th className="text-right py-3 px-4">Pending</th>
                <th className="text-right py-3 px-4">Total Days</th>
                <th className="text-right py-3 px-4">Avg Days/Emp</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((dept) => (
                <tr key={dept._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium" data-label="Department">{dept.name}</td>
                  <td className="py-3 px-4" data-label="Code">{dept.code}</td>
                  <td className="py-3 px-4 text-right" data-label="Total Emp">{dept.employeeCount || 0}</td>
                  <td className="py-3 px-4 text-right" data-label="Active Emp">{dept.activeEmployees || 0}</td>
                  <td className="py-3 px-4 text-right" data-label="Managers">{dept.managerCount || 0}</td>
                  <td className="py-3 px-4 text-right" data-label="Total Leaves">{dept.totalLeaves || 0}</td>
                  <td className="py-3 px-4 text-right" data-label="Approved">{dept.approvedLeaves || 0}</td>
                  <td className="py-3 px-4 text-right" data-label="Pending">{dept.pendingLeaves || 0}</td>
                  <td className="py-3 px-4 text-right" data-label="Total Days">{dept.totalLeaveDays || 0}</td>
                  <td className="py-3 px-4 text-right" data-label="Avg Days/Emp">
                    {dept.employeeCount > 0 
                      ? ((dept.totalLeaveDays || 0) / dept.employeeCount).toFixed(1)
                      : 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentAnalytics;
