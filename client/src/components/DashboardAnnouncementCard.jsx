import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { announcementService } from "@/services/api";
import {
  FaBullhorn,
  FaExclamationTriangle,
  FaBell,
  FaChevronRight,
  FaClock,
  FaUserCircle,
  FaBuilding,
} from "react-icons/fa";
import { formatDistanceToNow } from "date-fns";

const DashboardAnnouncementCard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchRecentAnnouncements();
  }, []);

  const fetchRecentAnnouncements = async () => {
    try {
      const response = await announcementService.getAnnouncements({ limit: 3 });
      setAnnouncements(response.data || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Error fetching announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "urgent":
        return <FaExclamationTriangle className="text-red-500 text-xs" />;
      case "high":
        return <FaExclamationTriangle className="text-orange-500 text-xs" />;
      case "medium":
        return <FaBell className="text-yellow-500 text-xs" />;
      default:
        return <FaBullhorn className="text-blue-500 text-xs" />;
    }
  };

  if (loading) {
    return (
      <div className="card bg-gradient-to-br from-purple-50 to-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="flex items-center font-semibold text-gray-800">
            <FaBullhorn className="mr-2 text-purple-600" />
            Announcements
          </h3>
        </div>
        <div className="space-y-2">
          <div className="h-10 rounded bg-gray-200 animate-pulse"></div>
          <div className="h-10 rounded bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-gradient-to-br from-purple-50 to-white transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="flex items-center font-semibold text-gray-800">
          <FaBullhorn className="mr-2 text-purple-600" />
          Announcements
          {unreadCount > 0 && (
            <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {unreadCount} new
            </span>
          )}
        </h3>
        <Link
          to="/announcements"
          className="flex items-center text-sm text-purple-600 hover:text-purple-800"
        >
          View all
          <FaChevronRight className="ml-1 text-xs" />
        </Link>
      </div>

      {/* Announcements List */}
      <div className="space-y-2">
        {announcements.length > 0 ? (
          announcements.slice(0, 2).map((announcement) => (
            <Link
              key={announcement._id}
              to={`/announcements`}
              className="block rounded-lg p-2 transition-colors hover:bg-white"
            >
              <div className="flex items-start space-x-2">
                {/* Icon based on type/priority */}
                <div
                  className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    announcement.priority === "urgent"
                      ? "bg-red-100"
                      : announcement.priority === "high"
                        ? "bg-orange-100"
                        : "bg-purple-100"
                  }`}
                >
                  {getPriorityIcon(announcement.priority)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {announcement.title}
                    </p>
                    {!announcement.readBy?.some(
                      (r) => r.user?._id === user?._id,
                    ) && (
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    )}
                  </div>

                  <div className="mt-0.5 flex items-center space-x-2 text-xs text-gray-500">
                    <span className="flex items-center">
                      <FaUserCircle className="mr-1" />
                      {announcement.createdBy?.name?.split(" ")[0]}
                    </span>

                    {announcement.targetDepartments?.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center">
                          <FaBuilding className="mr-1" />
                          {announcement.targetDepartments[0]}
                          {announcement.targetDepartments.length > 1 && " +"}
                        </span>
                      </>
                    )}

                    <span>•</span>
                    <span className="flex items-center">
                      <FaClock className="mr-1" />
                      {formatDistanceToNow(new Date(announcement.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Preview of content - first line only */}
                  <p className="mt-1 line-clamp-1 text-xs text-gray-600">
                    {announcement.content.substring(0, 60)}
                    {announcement.content.length > 60 && "..."}
                  </p>
                </div>

                {/* Priority badge for urgent */}
                {announcement.priority === "urgent" && (
                  <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded whitespace-nowrap">
                    Urgent
                  </span>
                )}
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-4">
            <FaBullhorn className="mx-auto mb-2 text-2xl text-gray-300" />
            <p className="text-sm text-gray-500">No announcements yet</p>
          </div>
        )}

        {/* Show "more" indicator if there are more than 2 */}
        {announcements.length > 2 && (
          <Link
            to="/announcements"
            className="mt-2 block border-t border-purple-100 pt-2 text-center text-xs text-purple-600 hover:text-purple-800"
          >
            + {announcements.length - 2} more announcements
          </Link>
        )}
      </div>
    </div>
  );
};

export default DashboardAnnouncementCard;
