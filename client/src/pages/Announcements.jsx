/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  FaBullhorn,
  FaPlus,
  FaFilter,
  FaSearch,
  FaBell,
  FaCheckCircle,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaUsers,
  FaBuilding
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import AnnouncementCard from '../components/AnnouncementCard';
import CreateAnnouncementModal from '../components/modals/CreateAnnouncementModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Announcements = () => {
  const { isAdmin, isManager } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    search: ''
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  useEffect(() => {
    fetchAnnouncements();
  }, [filters, pagination.page]);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 10,
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.priority !== 'all' && { priority: filters.priority })
      });

      const response = await axios.get(`${API_URL}/announcements?${params}`);
      setAnnouncements(response.data.data);
      setUnreadCount(response.data.unreadCount);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await axios.post(`${API_URL}/announcements/${id}/acknowledge`);
      toast.success('Announcement acknowledged');
      fetchAnnouncements();
    } catch (error) {
      toast.error(error,'Failed to acknowledge');
    }
  };

  const handleComment = async (id, comment) => {
    try {
      await axios.post(`${API_URL}/announcements/${id}/comments`, { content: comment });
      toast.success('Comment added');
      fetchAnnouncements();
    } catch (error) {
      toast.error(error, 'Failed to add comment');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await axios.delete(`${API_URL}/announcements/${id}`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (error) {
      toast.error(error, 'Failed to delete');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-600 mt-1">Stay updated with company news and updates</p>
        </div>
        {(isAdmin || isManager) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center space-x-2"
          >
            <FaPlus />
            <span>New Announcement</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">Total</p>
              <p className="text-2xl font-bold text-blue-700">{pagination.total}</p>
            </div>
            <FaBullhorn className="text-blue-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">Unread</p>
              <p className="text-2xl font-bold text-green-700">{unreadCount}</p>
            </div>
            <FaBell className="text-green-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm">Urgent</p>
              <p className="text-2xl font-bold text-yellow-700">
                {announcements.filter(a => a.priority === 'urgent').length}
              </p>
            </div>
            <FaExclamationTriangle className="text-yellow-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm">Department</p>
              <p className="text-2xl font-bold text-purple-700">
                {announcements.filter(a => a.type === 'department').length}
              </p>
            </div>
            <FaBuilding className="text-purple-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FaFilter className="text-gray-500" />
          <h2 className="text-lg font-semibold">Filters</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="input-field"
            >
              <option value="all">All Types</option>
              <option value="general">General</option>
              <option value="urgent">Urgent</option>
              <option value="event">Event</option>
              <option value="holiday">Holiday</option>
              <option value="department">Department</option>
            </select>
          </div>

          <div>
            <label className="form-label">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="input-field"
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Search announcements..."
                className="input-field pl-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map(announcement => (
          <AnnouncementCard
            key={announcement._id}
            announcement={announcement}
            onAcknowledge={handleAcknowledge}
            onComment={handleComment}
            onDelete={handleDelete}
          />
        ))}

        {announcements.length === 0 && (
          <div className="card text-center py-12">
            <FaBullhorn className="mx-auto text-4xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No announcements</h3>
            <p className="text-gray-500 mt-1">Check back later for updates</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchAnnouncements();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Announcements;