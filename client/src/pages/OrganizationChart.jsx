/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import {
  FaBuilding,
  FaUsers,
  FaUserTie,
  FaUserCircle,
  FaChevronDown,
  FaChevronRight,
  FaSearch,
  FaFilter,
  FaChartPie,
  FaLayerGroup,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const OrganizationChart = () => {
  const { isAdmin, isManager } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [departmentStats, setDepartmentStats] = useState({});

  useEffect(() => {
    fetchOrganizationData();
  }, []);

  const fetchOrganizationData = async () => {
    setLoading(true);
    try {
      // Fetch all departments with employees
      const deptResponse = await axios.get(
        `${API_URL}/departments?limit=100&includeStats=true`,
      );
      const depts = deptResponse.data.data || [];

      // Fetch users to get all employees
      const usersResponse = await axios.get(`${API_URL}/users?limit=1000`);
      const users = usersResponse.data.users || [];

      // Organize users by department
      const usersByDept = {};
      users.forEach((user) => {
        if (!usersByDept[user.department]) {
          usersByDept[user.department] = [];
        }
        usersByDept[user.department].push(user);
      });

      // Combine department data with users
      const deptsWithUsers = depts.map((dept) => ({
        ...dept,
        employees: usersByDept[dept.name] || [],
        // Count by role
        managers: (usersByDept[dept.name] || []).filter(
          (u) => u.role === "manager",
        ).length,
        admins: (usersByDept[dept.name] || []).filter((u) => u.role === "admin")
          .length,
        employees_count: (usersByDept[dept.name] || []).filter(
          (u) => u.role === "employee",
        ).length,
      }));

      // Calculate department stats
      const stats = {};
      deptsWithUsers.forEach((dept) => {
        stats[dept.name] = {
          total: dept.employees.length,
          managers: dept.managers,
          admins: dept.admins,
          employees: dept.employees_count,
        };
      });

      setDepartmentStats(stats);
      setDepartments(deptsWithUsers);

      // Expand first few departments by default
      const initialExpanded = {};
      deptsWithUsers.slice(0, 3).forEach((dept) => {
        initialExpanded[dept._id] = true;
      });
      setExpandedDepts(initialExpanded);
    } catch (error) {
      console.error("Error fetching organization data:", error);
      toast.error("Failed to load organization chart");
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptId) => {
    setExpandedDepts((prev) => ({
      ...prev,
      [deptId]: !prev[deptId],
    }));
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return "👑";
      case "manager":
        return "⭐";
      default:
        return "👤";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "manager":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const filteredDepartments = departments.filter(
    (dept) =>
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.employees.some(
        (emp) =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.role.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
  );

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Organization Chart
          </h1>
          <p className="text-gray-600 mt-1">
            View department structure and team members
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-600"}`}
            title="Grid View"
          >
            <FaLayerGroup />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${viewMode === "list" ? "bg-primary-100 text-primary-600" : "bg-gray-100 text-gray-600"}`}
            title="List View"
          >
            <FaChartPie />
          </button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3">
          <div className="card">
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search departments or employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
        <div className="card bg-primary-50 border-primary-200 flex items-center justify-between">
          <div>
            <p className="text-sm text-primary-600">Total Employees</p>
            <p className="text-2xl font-bold text-primary-700">
              {departments.reduce(
                (acc, dept) => acc + dept.employees.length,
                0,
              )}
            </p>
          </div>
          <FaUsers className="text-primary-500 text-3xl" />
        </div>
      </div>

      {/* Organization Chart */}
      <div className="space-y-4">
   
        {filteredDepartments.map((dept, index) => (
          <div
            key={dept._id}
            className="card overflow-hidden hover:shadow-lg transition-shadow"
          >
            {/* Department Header */}
            <div
              className="flex items-center justify-between cursor-pointer p-4 bg-gradient-to-r from-gray-50 to-white"
              onClick={() => toggleDepartment(dept._id)}
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FaBuilding className="text-primary-600 text-xl" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {dept.name}
                  </h2>
                  <p className="text-sm text-gray-500">Code: {dept.code}</p>
                </div>
              </div>

              <div className="flex items-center space-x-6">
                {/* Department Stats */}
                <div className="flex items-center space-x-3 text-sm">
                  <span className="flex items-center space-x-1 text-purple-600">
                    <span className="font-medium">
                      {departmentStats[dept.name]?.admins || 0}
                    </span>
                    <span>Admins</span>
                  </span>
                  <span className="flex items-center space-x-1 text-blue-600">
                    <span className="font-medium">
                      {departmentStats[dept.name]?.managers || 0}
                    </span>
                    <span>Managers</span>
                  </span>
                  <span className="flex items-center space-x-1 text-green-600">
                    <span className="font-medium">
                      {departmentStats[dept.name]?.employees || 0}
                    </span>
                    <span>Employees</span>
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    Total: {dept.employees.length}
                  </span>
                  {expandedDepts[dept._id] ? (
                    <FaChevronDown className="text-gray-400" />
                  ) : (
                    <FaChevronRight className="text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Employees List */}
            {expandedDepts[dept._id] && (
              <div className="border-t border-gray-200 p-4">
                {viewMode === "grid" ? (
                  // Grid View
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {dept.employees
                      .sort((a, b) => {
                        // Sort by role priority: Admin > Manager > Employee
                        const rolePriority = {
                          admin: 1,
                          manager: 2,
                          employee: 3,
                        };
                        return (
                          (rolePriority[a.role] || 4) -
                          (rolePriority[b.role] || 4)
                        );
                      })
                      .map((emp) => (
                        <div
                          key={emp._id}
                          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                        >
                          <div className="relative">
                            <FaUserCircle className="text-gray-400 text-3xl" />
                            <span className="absolute -top-1 -right-1 text-xs">
                              {getRoleIcon(emp.role)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {emp.name}
                            </p>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(emp.role)}`}
                              >
                                {emp.role}
                              </span>
                              <span className="text-xs text-gray-500">
                                {emp.employeeId}
                              </span>
                            </div>
                          </div>
                          {(isAdmin || isManager) && (
                            <Link
                              to={`/users/${emp._id}`}
                              className="text-primary-600 hover:text-primary-800 text-sm"
                            >
                              View
                            </Link>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  // List View
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Employee
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Employee ID
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Role
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Email
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dept.employees
                          .sort((a, b) => {
                            const rolePriority = {
                              admin: 1,
                              manager: 2,
                              employee: 3,
                            };
                            return (
                              (rolePriority[a.role] || 4) -
                              (rolePriority[b.role] || 4)
                            );
                          })
                          .map((emp) => (
                            <tr key={emp._id} className="hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-3">
                                  <FaUserCircle className="text-gray-400" />
                                  <span className="font-medium">
                                    {emp.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {emp.employeeId}
                              </td>
                              <td className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${getRoleColor(emp.role)}`}
                                >
                                  {getRoleIcon(emp.role)} {emp.role}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {emp.email}
                              </td>
                              <td className="px-4 py-3">
                                {(isAdmin || isManager) && (
                                  <Link
                                    to={`/users/${emp._id}`}
                                    className="text-primary-600 hover:text-primary-800 text-sm"
                                  >
                                    View Profile
                                  </Link>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {dept.employees.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FaUsers className="mx-auto text-3xl mb-2 opacity-50" />
                    <p>No employees in this department</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredDepartments.length === 0 && (
          <div className="card text-center py-12">
            <FaBuilding className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No departments found
            </h3>
            <p className="text-gray-500 mt-1">
              Try adjusting your search criteria
            </p>
          </div>
        )}
      </div>

      {/* Department Summary */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Department Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {departments.map((dept) => (
            <div
              key={dept._id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{dept.name}</h4>
                <span className="text-xs text-gray-500">{dept.code}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{dept.employees.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Admins:</span>
                  <span className="font-medium text-purple-600">
                    {departmentStats[dept.name]?.admins || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Managers:</span>
                  <span className="font-medium text-blue-600">
                    {departmentStats[dept.name]?.managers || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Employees:</span>
                  <span className="font-medium text-green-600">
                    {departmentStats[dept.name]?.employees || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrganizationChart;
