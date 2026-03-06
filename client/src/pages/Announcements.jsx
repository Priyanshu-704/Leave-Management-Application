/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Button, Input, Select, Option } from "@/components/ui";
import PageSkeleton from "@/components/PageSkeleton";
import { useAuth } from '../context/AuthContext';
import { announcementService } from "@/services/api";
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
import ConfirmActionModal from '../components/modals/ConfirmActionModal';
import useDebouncedValue from "@/hooks/useDebouncedValue";

const Announcements = () => {
  const { isAdmin, isManager } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [announcementToEdit, setAnnouncementToEdit] = useState(null);
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
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    title: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(filters.search, 300);

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

      const response = await announcementService.getAnnouncements(
        Object.fromEntries(params.entries()),
      );
      setAnnouncements(response.data);
      setUnreadCount(response.unreadCount);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await announcementService.acknowledge(id);
      toast.success('Announcement acknowledged');
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to acknowledge');
    }
  };

  const handleComment = async (id, comment) => {
    try {
      await announcementService.addComment(id, comment);
      toast.success('Comment added');
      fetchAnnouncements();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setDeleteLoading(true);
    try {
      await announcementService.remove(deleteConfirm.id);
      toast.success('Announcement deleted');
      fetchAnnouncements();
      setDeleteConfirm({ isOpen: false, id: null, title: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete');
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      announcement.title?.toLowerCase().includes(searchLower) ||
      announcement.message?.toLowerCase().includes(searchLower) ||
      announcement.type?.toLowerCase().includes(searchLower) ||
      announcement.priority?.toLowerCase().includes(searchLower)
    );
  });

  if (loading && announcements.length === 0 && !filters.search.trim()) {
    return <PageSkeleton rows={6} />;
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
          <Button
            onClick={() => {
              setAnnouncementToEdit(null);
              setShowCreateModal(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <FaPlus />
            <span>New Announcement</span>
          </Button>
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
            <Select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="input-field"
            >
              <Option value="all">All Types</Option>
              <Option value="general">General</Option>
              <Option value="urgent">Urgent</Option>
              <Option value="event">Event</Option>
              <Option value="holiday">Holiday</Option>
              <Option value="department">Department</Option>
            </Select>
          </div>

          <div>
            <label className="form-label">Priority</label>
            <Select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="input-field"
            >
              <Option value="all">All Priorities</Option>
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
              <Option value="urgent">Urgent</Option>
            </Select>
          </div>

          <div>
            <label className="form-label">Search</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <Input
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
        {filteredAnnouncements.map(announcement => (
          <AnnouncementCard
            key={announcement._id}
            announcement={announcement}
            onAcknowledge={handleAcknowledge}
            onComment={handleComment}
            onEdit={(item) => {
              setAnnouncementToEdit(item);
              setShowCreateModal(true);
            }}
            onDelete={(item) =>
              setDeleteConfirm({
                isOpen: true,
                id: item._id,
                title: item.title
              })
            }
          />
        ))}

        {filteredAnnouncements.length === 0 && (
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
          <Button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </Button>
          <span className="px-4 py-2">
            Page {pagination.page} of {pagination.pages}
          </span>
          <Button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      )}

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <CreateAnnouncementModal
          announcementToEdit={announcementToEdit}
          onClose={() => {
            setShowCreateModal(false);
            setAnnouncementToEdit(null);
          }}
          onSuccess={() => {
            fetchAnnouncements();
            setShowCreateModal(false);
            setAnnouncementToEdit(null);
          }}
        />
      )}

      <ConfirmActionModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${deleteConfirm.title}"?`}
        confirmText="Delete"
        confirmClassName="bg-red-600 hover:bg-red-700"
        loading={deleteLoading}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, title: '' })}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Announcements;
