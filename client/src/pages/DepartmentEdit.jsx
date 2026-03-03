/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import {
  FaBuilding,
  FaSave,
  FaTimes,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaGlobe,
  FaUsers
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DepartmentEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
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
    },
    parentDepartment: '',
    budget: 0,
    isActive: true
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('You do not have permission to edit departments');
      navigate('/departments');
      return;
    }
    fetchDepartmentDetails();
    fetchAllDepartments();
  }, [id]);

  const fetchDepartmentDetails = async () => {
    try {
      const response = await axios.get(`${API_URL}/departments/${id}`);
      const dept = response.data.data;
      setFormData({
        name: dept.name || '',
        code: dept.code || '',
        description: dept.description || '',
        location: dept.location || { building: '', floor: '', office: '' },
        contactInfo: dept.contactInfo || { email: '', phone: '', extension: '' },
        settings: dept.settings || {
          defaultLeaveQuota: { annual: 20, sick: 10, personal: 5 }
        },
        parentDepartment: dept.parentDepartment?._id || '',
        budget: dept.budget || 0,
        isActive: dept.isActive !== undefined ? dept.isActive : true
      });
    } catch (error) {
      console.error('Error fetching department:', error);
      toast.error('Failed to fetch department details');
      navigate('/departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/departments?limit=100`);
      const allDepts = response.data.data || [];
      // Filter out current department to prevent self-reference
      setDepartments(allDepts.filter(dept => dept._id !== id));
    } catch (error) {
      console.error('Error fetching departments:', error);
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
    setSaving(true);
    
    try {
      await axios.put(`${API_URL}/departments/${id}`, formData);
      toast.success('Department updated successfully');
      navigate(`/departments/${id}`);
    } catch (error) {
      console.error('Error updating department:', error);
      toast.error(error.response?.data?.message || 'Failed to update department');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/departments/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Department</h1>
            <p className="text-gray-600">Update department information and settings</p>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaBuilding className="mr-2 text-primary-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Department Name *</label>
                <input
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
                <input
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
              <div className="col-span-2">
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
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaMapMarkerAlt className="mr-2 text-primary-600" />
              Location
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Building</label>
                <input
                  type="text"
                  name="location.building"
                  value={formData.location.building}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Building A"
                />
              </div>
              <div>
                <label className="form-label">Floor</label>
                <input
                  type="text"
                  name="location.floor"
                  value={formData.location.floor}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., 3rd Floor"
                />
              </div>
              <div>
                <label className="form-label">Office/Room</label>
                <input
                  type="text"
                  name="location.office"
                  value={formData.location.office}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="e.g., Room 301"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaPhone className="mr-2 text-primary-600" />
              Contact Information
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <FaEnvelope className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="contactInfo.email"
                    value={formData.contactInfo.email}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="dept@company.com"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="contactInfo.phone"
                    value={formData.contactInfo.phone}
                    onChange={handleInputChange}
                    className="input-field pl-10"
                    placeholder="+1 234 567 8900"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Extension</label>
                <input
                  type="text"
                  name="contactInfo.extension"
                  value={formData.contactInfo.extension}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="101"
                />
              </div>
            </div>
          </div>

          {/* Department Settings */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaGlobe className="mr-2 text-primary-600" />
              Department Settings
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Parent Department</label>
                <select
                  name="parentDepartment"
                  value={formData.parentDepartment}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">None (Top Level)</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="form-label">Annual Budget</label>
                <input
                  type="number"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  className="input-field"
                  min="0"
                  step="1000"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Leave Quota Settings */}
          <div className="border-t pt-4">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <FaUsers className="mr-2 text-primary-600" />
              Default Leave Quota
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Annual Leave (days)</label>
                <input
                  type="number"
                  name="settings.defaultLeaveQuota.annual"
                  value={formData.settings.defaultLeaveQuota.annual}
                  onChange={handleInputChange}
                  className="input-field"
                  min="0"
                />
              </div>
              <div>
                <label className="form-label">Sick Leave (days)</label>
                <input
                  type="number"
                  name="settings.defaultLeaveQuota.sick"
                  value={formData.settings.defaultLeaveQuota.sick}
                  onChange={handleInputChange}
                  className="input-field"
                  min="0"
                />
              </div>
              <div>
                <label className="form-label">Personal Leave (days)</label>
                <input
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

          {/* Status */}
          <div className="border-t pt-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Department is active
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 border-t pt-4">
            <button
              type="button"
              onClick={() => navigate(`/departments/${id}`)}
              className="btn-secondary flex items-center space-x-2"
            >
              <FaTimes />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              <FaSave />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DepartmentEdit;