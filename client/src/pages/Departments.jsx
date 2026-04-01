/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { Button, Input, Select, Option } from "@/components/ui";
import PageSkeleton from "@/components/PageSkeleton";
import { useAuth } from '../context/AuthContext';
import { departmentService } from "@/services/api";
import { 
  FaBuilding, 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaEye,
  FaSearch,
  FaFilter,
  FaUsers,
  FaChartBar,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaChevronRight,
  FaTimes
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmActionModal from '../components/modals/ConfirmActionModal';
import useBodyScrollLock from '../hooks/useBodyScrollLock';
import useDebouncedValue from "@/hooks/useDebouncedValue";

const Departments = () => {
  const {  isAdmin } = useAuth();
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    isActive: 'true'
  });
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    location: {
      building: '',
      floor: '',
      office: ''
    },
    contactInfo: {
      email: '',
      phone: '',
      extension: ''
    },
    settings: {
      defaultLeaveQuota: {
        annual: 20,
        sick: 10,
        personal: 5
      }
    }
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    name: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const debouncedSearch = useDebouncedValue(filters.search, 350);
  useBodyScrollLock(showModal);

  useEffect(() => {
    fetchDepartments();
  }, [debouncedSearch, filters.isActive, pagination.page]);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: 10,
        includeStats: 'true',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(filters.isActive !== 'all' && { isActive: filters.isActive })
      });

      const response = await departmentService.getDepartments(
        Object.fromEntries(params.entries()),
      );
      setDepartments(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child, grandChild] = name.split('.');
      if (grandChild) {
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: {
              ...formData[parent]?.[child],
              [grandChild]: value
            }
          }
        });
      } else {
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent],
            [child]: value
          }
        });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDept) {
        await departmentService.updateDepartment(editingDept._id, formData);
        toast.success('Department updated successfully');
      } else {
        await departmentService.createDepartment(formData);
        toast.success('Department created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchDepartments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setDeleteLoading(true);
    try {
      await departmentService.deleteDepartment(deleteConfirm.id);
      toast.success('Department deleted successfully');
      fetchDepartments();
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    } finally {
      setDeleteLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      location: { building: '', floor: '', office: '' },
      contactInfo: { email: '', phone: '', extension: '' },
      settings: {
        defaultLeaveQuota: { annual: 20, sick: 10, personal: 5 }
      }
    });
    setEditingDept(null);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
      location: dept.location || { building: '', floor: '', office: '' },
      contactInfo: dept.contactInfo || { email: '', phone: '', extension: '' },
      settings: dept.settings || {
        defaultLeaveQuota: { annual: 20, sick: 10, personal: 5 }
      }
    });
    setShowModal(true);
  };

  if (loading && departments.length === 0 && !filters.search.trim()) {
    return <PageSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
          <p className="text-gray-600 mt-1">Manage organization departments and settings</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <FaPlus />
            <span>Add Department</span>
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">Total Departments</p>
              <p className="text-2xl font-bold text-blue-700">{pagination.total}</p>
            </div>
            <FaBuilding className="text-blue-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm">Active Departments</p>
              <p className="text-2xl font-bold text-green-700">
                {departments.filter(d => d.isActive).length}
              </p>
            </div>
            <FaBuilding className="text-green-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm">Total Employees</p>
              <p className="text-2xl font-bold text-purple-700">
                {departments.reduce((acc, dept) => acc + (dept.employeeCount || 0), 0)}
              </p>
            </div>
            <FaUsers className="text-purple-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm">Avg Department Size</p>
              <p className="text-2xl font-bold text-orange-700">
                {departments.length > 0 
                  ? Math.round(departments.reduce((acc, dept) => acc + (dept.employeeCount || 0), 0) / departments.length)
                  : 0}
              </p>
            </div>
            <FaChartBar className="text-orange-500 text-3xl" />
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
                placeholder="Search by name or code..."
                className="input-field pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <Select
              value={filters.isActive}
              onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
              className="input-field"
            >
              <Option value="all">All Departments</Option>
              <Option value="true">Active Only</Option>
              <Option value="false">Inactive Only</Option>
            </Select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={() => navigate('/departments/analytics')}
              className="btn-outline flex items-center space-x-2"
            >
              <FaChartBar />
              <span>View Analytics</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div key={dept._id} className="card hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FaBuilding className="text-primary-600 text-xl" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{dept.name}</h3>
                  <p className="text-sm text-gray-500">Code: {dept.code}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                dept.isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {dept.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Description */}
            {dept.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {dept.description}
              </p>
            )}

            {/* Location & Contact */}
            <div className="space-y-2 mb-4">
              {dept.location?.building && (
                <div className="flex items-center text-sm text-gray-600">
                  <FaMapMarkerAlt className="mr-2 text-gray-400" />
                  <span>
                    {dept.location.building}, Floor {dept.location.floor}, {dept.location.office}
                  </span>
                </div>
              )}
              {dept.contactInfo?.email && (
                <div className="flex items-center text-sm text-gray-600">
                  <FaEnvelope className="mr-2 text-gray-400" />
                  <span>{dept.contactInfo.email}</span>
                </div>
              )}
              {dept.contactInfo?.phone && (
                <div className="flex items-center text-sm text-gray-600">
                  <FaPhone className="mr-2 text-gray-400" />
                  <span>{dept.contactInfo.phone} {dept.contactInfo.extension && `ext. ${dept.contactInfo.extension}`}</span>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-gray-50 p-2 rounded text-center">
                <p className="text-xs text-gray-500">Employees</p>
                <p className="font-semibold">{dept.employeeCount || 0}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded text-center">
                <p className="text-xs text-gray-500">Managers</p>
                <p className="font-semibold">
                  {dept.employees?.filter(e => e.role === 'manager').length || 0}
                </p>
              </div>
            </div>

            {/* Leave Quota Preview */}
            {dept.settings?.defaultLeaveQuota && (
              <div className="text-xs text-gray-500 mb-4">
                <span className="font-medium">Default Leave:</span>{' '}
                A: {dept.settings.defaultLeaveQuota.annual} | 
                S: {dept.settings.defaultLeaveQuota.sick} | 
                P: {dept.settings.defaultLeaveQuota.personal}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Link
                to={`/departments/${dept._id}`}
                className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
              >
                View Details
                <FaChevronRight className="ml-1 text-xs" />
              </Link>
              
              {isAdmin && (
                <div className="flex space-x-2">
                  <Button
                    onClick={() => openEditModal(dept)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        id: dept._id,
                        name: dept.name
                      })
                    }
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <FaTrash />
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
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

      {/* Add/Edit Department Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              resetForm();
            }
          }}
        >
          <div className="relative my-6 mx-auto w-full max-w-3xl rounded-xl border bg-white p-4 shadow-lg sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">
                {editingDept ? 'Edit Department' : 'Add New Department'}
              </h3>
              <Button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FaTimes />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="font-medium mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="form-label">Department Name *</label>
                    <Input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Department Code *</label>
                    <Input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="input-field"
                      required
                      maxLength="10"
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="form-label">Description</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="input-field"
                      placeholder="Brief description of department..."
                    />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h4 className="font-medium mb-3">Location</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="form-label">Building</label>
                    <Input
                      type="text"
                      name="location.building"
                      value={formData.location.building}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="form-label">Floor</label>
                    <Input
                      type="text"
                      name="location.floor"
                      value={formData.location.floor}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="form-label">Office</label>
                    <Input
                      type="text"
                      name="location.office"
                      value={formData.location.office}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-medium mb-3">Contact Information</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="form-label">Email</label>
                    <Input
                      type="email"
                      name="contactInfo.email"
                      value={formData.contactInfo.email}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="form-label">Phone</label>
                    <Input
                      type="text"
                      name="contactInfo.phone"
                      value={formData.contactInfo.phone}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="form-label">Extension</label>
                    <Input
                      type="text"
                      name="contactInfo.extension"
                      value={formData.contactInfo.extension}
                      onChange={handleInputChange}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Leave Settings */}
              <div>
                <h4 className="font-medium mb-3">Default Leave Quota</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="form-label">Annual Leave</label>
                    <Input
                      type="number"
                      name="settings.defaultLeaveQuota.annual"
                      value={formData.settings.defaultLeaveQuota.annual}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="form-label">Sick Leave</label>
                    <Input
                      type="number"
                      name="settings.defaultLeaveQuota.sick"
                      value={formData.settings.defaultLeaveQuota.sick}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="form-label">Personal Leave</label>
                    <Input
                      type="number"
                      name="settings.defaultLeaveQuota.personal"
                      value={formData.settings.defaultLeaveQuota.personal}
                      onChange={handleInputChange}
                      className="input-field"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="btn-primary w-full sm:w-auto"
                >
                  {editingDept ? 'Update Department' : 'Create Department'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmActionModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Department"
        message={`Are you sure you want to delete "${deleteConfirm.name}"?`}
        confirmText="Delete"
        confirmClassName="bg-red-600 hover:bg-red-700"
        loading={deleteLoading}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null, name: '' })}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default Departments;
