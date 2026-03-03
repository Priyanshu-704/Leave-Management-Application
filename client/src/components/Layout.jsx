import { useState } from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FaTachometerAlt,
  FaCalendarPlus,
  FaHistory,
  FaClipboardList,
  FaUsers,
  FaBuilding,
  FaBars,
  FaClock,
  FaBell,
  FaUserCircle,
  FaBullhorn,
  FaLayerGroup,
  FaFolder,
} from "react-icons/fa";

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout, isManager, isAdmin } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" />;
  }

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: FaTachometerAlt,
      access: "all",
    },
    {
      name: "Users",
      href: "/users",
      icon: FaUsers,
      access: "admin",
    },
    {
      name: "Organization",
      href: "/organization",
      icon: FaLayerGroup,
      access: "all",
    },
    { name: "Attendance", href: "/attendance", icon: FaClock, access: "all" },
    {
      name: "Apply Leave",
      href: "/apply-leave",
      icon: FaCalendarPlus,
      access: "all",
    },
    {
      name: "Leave History",
      href: "/leave-history",
      icon: FaHistory,
      access: "all",
    },
    {
      name: "Leave Requests",
      href: "/leave-requests",
      icon: FaClipboardList,
      access: "manager",
    },
    {
      name: "Departments",
      href: "/departments",
      icon: FaBuilding,
      access: "all", // All users can view departments, but actions are role-based
    },
    {
      name: "Announcements",
      href: "/announcements",
      icon: FaBullhorn,
      access: "all",
    },
    {
      name: "Files",
      href: "/files",
      icon: FaFolder,
      access: "all", // All users can access files with permissions
    },
  ];

  const filteredNavigation = navigation.filter((item) => {
    if (item.access === "all") return true;
    if (item.access === "manager" && isManager) return true;
    if (item.access === "admin" && isAdmin) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-200 ease-in-out z-30`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center bg-primary-600">
          <h1 className="text-xl font-bold text-white">LeaveFlow</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-5 px-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md mb-1 ${
                  isActive
                    ? "bg-primary-100 text-primary-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`mr-3 h-5 w-5 ${
                    isActive
                      ? "text-primary-500"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="absolute bottom-0 w-full p-4 border-t">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <FaUserCircle className="h-8 w-8 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate capitalize">
                {user?.role} • {user?.department}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <nav className="bg-white shadow-sm h-16 fixed top-0 right-0 left-0 lg:left-64 z-10">
          <div className="px-4 sm:px-6 lg:px-8 h-full">
            <div className="flex justify-between items-center h-full">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-600"
              >
                <FaBars className="h-6 w-6" />
              </button>

              <div className="flex-1" />

              {/* Right side items */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                <button className="text-gray-400 hover:text-gray-500 relative">
                  <FaBell className="h-6 w-6" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center space-x-3 text-sm focus:outline-none"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="hidden md:block text-gray-700">
                        {user?.name}
                      </span>
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </button>

                  {/* Dropdown menu */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        to="/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        Settings
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Page content */}
        <main className="pt-16 min-h-screen">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
