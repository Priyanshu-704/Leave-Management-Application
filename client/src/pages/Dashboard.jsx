import { useState, useEffect, useCallback } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import { useAuth } from "../context/AuthContext";
import {
  FaClock,
  FaUmbrellaBeach,
  FaHeartbeat,
  FaUserTie,
} from "react-icons/fa";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { leaveService } from "@/services/api";
import AttendanceCard from "../components/AttendanceCard";
import DashboardAnnouncementCard from "../components/DashboardAnnouncementCard";

const Dashboard = () => {
  const { user, isManager } = useAuth();
  const [summary, setSummary] = useState(null);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [summaryRes, leavesRes] = await Promise.all([
        leaveService.getSummary(),
        leaveService.getMyLeaves(),
      ]);

      setSummary(summaryRes);
      setRecentLeaves(leavesRes.slice(0, 5));

      if (isManager) {
        const pendingRes = await leaveService.getLeaves({ status: "pending" });
        setPendingRequests(pendingRes.length);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "text-green-600 bg-green-100";
      case "rejected":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return <PageSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
        <p className="mt-2 opacity-90">
          {format(new Date(), "EEEE, MMMM do, yyyy")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Card */}
        <AttendanceCard />

        {/* Announcement Card - New */}
        <DashboardAnnouncementCard />
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <FaUmbrellaBeach className="text-blue-600 text-xl" />
          </div>
          <div>
            <p className="text-gray-600">Annual Leave</p>
            <p className="text-2xl font-bold">
              {summary?.balance.annual || 0}{" "}
              <span className="text-sm text-gray-500">days</span>
            </p>
            <p className="text-sm text-gray-500">
              Used: {summary?.used.annual || 0}
            </p>
          </div>
        </div>

        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full">
            <FaHeartbeat className="text-green-600 text-xl" />
          </div>
          <div>
            <p className="text-gray-600">Sick Leave</p>
            <p className="text-2xl font-bold">
              {summary?.balance.sick || 0}{" "}
              <span className="text-sm text-gray-500">days</span>
            </p>
            <p className="text-sm text-gray-500">
              Used: {summary?.used.sick || 0}
            </p>
          </div>
        </div>

        <div className="card flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <FaUserTie className="text-purple-600 text-xl" />
          </div>
          <div>
            <p className="text-gray-600">Personal Leave</p>
            <p className="text-2xl font-bold">
              {summary?.balance.personal || 0}{" "}
              <span className="text-sm text-gray-500">days</span>
            </p>
            <p className="text-sm text-gray-500">
              Used: {summary?.used.personal || 0}
            </p>
          </div>
        </div>

        {isManager && (
          <div className="card flex items-center space-x-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaClock className="text-yellow-600 text-xl" />
            </div>
            <div>
              <p className="text-gray-600">Pending Requests</p>
              <p className="text-2xl font-bold">{pendingRequests}</p>
              <Link
                to="/leave-requests"
                className="text-sm text-primary-600 hover:underline"
              >
                View all →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Recent Leave Applications */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Leave Applications</h2>
          <Link
            to="/leave-history"
            className="text-primary-600 hover:underline"
          >
            View all
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">Leave Type</th>
                <th className="text-left py-3 px-4">Duration</th>
                <th className="text-left py-3 px-4">Days</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Applied On</th>
              </tr>
            </thead>
            <tbody>
              {recentLeaves.map((leave) => (
                <tr key={leave._id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 capitalize">{leave.leaveType}</td>
                  <td className="py-3 px-4">
                    {format(new Date(leave.startDate), "MMM dd")} -{" "}
                    {format(new Date(leave.endDate), "MMM dd, yyyy")}
                  </td>
                  <td className="py-3 px-4">{leave.days}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(leave.status)}`}
                    >
                      {leave.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {format(new Date(leave.appliedOn), "MMM dd, yyyy")}
                  </td>
                </tr>
              ))}
              {recentLeaves.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No leave applications yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
