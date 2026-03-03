import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { FaTimes, FaPaperclip, FaBullhorn } from 'react-icons/fa';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CreateAnnouncementModal = ({ onClose, onSuccess }) => {
  const { user, isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'general',
    priority: 'medium',
    targetDepartments: [],
    targetRoles: ['all'],
    pinned: false,
    expiryDate: new Date(+new Date() + 30*24*60*60*1000).toISOString().split('T')[0]
  });
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await axios.get(`${API_URL}/departments?limit=100`);
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleDepartmentChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData({
      ...formData,
      targetDepartments: selected
    });
  };

  const handleRoleChange = (role) => {
    let newRoles = [...formData.targetRoles];
    if (newRoles.includes(role)) {
      newRoles = newRoles.filter(r => r !== role);
    } else {
      newRoles.push(role);
    }
    setFormData({ ...formData, targetRoles: newRoles });
  };

  const handleFileChange = (e) => {
    setAttachments([...e.target.files]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Upload files first if any
      const uploadedFiles = [];
      if (attachments.length > 0) {
        // Implement file upload logic here
        // const formData = new FormData();
        // attachments.forEach(file => formData.append('files', file));
        // const uploadRes = await axios.post(`${API_URL}/upload`, formData);
        // uploadedFiles = uploadRes.data.files;
      }

      const announcementData = {
        ...formData,
        attachments: uploadedFiles,
        expiryDate: new Date(formData.expiryDate)
      };

      await axios.post(`${API_URL}/announcements`, announcementData);
      toast.success('Announcement created successfully');
      onSuccess();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <FaBullhorn className="mr-2 text-primary-600" />
            Create New Announcement
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="input-field"
              required
              placeholder="Announcement title"
            />
          </div>

          {/* Content */}
          <div>
            <label className="form-label">Content *</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleInputChange}
              rows="5"
              className="input-field"
              required
              placeholder="Write your announcement here..."
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="general">General</option>
                <option value="urgent">Urgent</option>
                <option value="event">Event</option>
                <option value="holiday">Holiday</option>
                <option value="department">Department</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="form-label">Target Roles</label>
            <div className="flex flex-wrap gap-3 mt-2">
              {['all', 'admin', 'manager', 'employee'].map(role => (
                <label key={role} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.targetRoles.includes(role)}
                    onChange={() => handleRoleChange(role)}
                    disabled={role === 'admin' && !isAdmin}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span className="text-sm capitalize">{role === 'all' ? 'Everyone' : role}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Departments */}
          {isAdmin && (
            <div>
              <label className="form-label">Target Departments</label>
              <select
                multiple
                value={formData.targetDepartments}
                onChange={handleDepartmentChange}
                className="input-field h-32"
              >
                {departments.map(dept => (
                  <option key={dept._id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
            </div>
          )}

          {/* For Managers - restrict to their department */}
          {!isAdmin && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">
                This announcement will be sent to your department: <strong>{user?.department}</strong>
              </p>
            </div>
          )}

          {/* Expiry Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Expiry Date</label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="pinned"
                  checked={formData.pinned}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span className="text-sm">Pin this announcement</span>
              </label>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="form-label">Attachments</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <FaPaperclip className="text-gray-400 text-2xl mb-2" />
                <span className="text-sm text-gray-500">Click to upload files</span>
              </label>
              {attachments.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {attachments.length} file(s) selected
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;