import { useState, useEffect } from 'react';
import { Button, Input, Select, Option, MultiSelect } from "@/components/ui";
import { useAuth } from '../../context/AuthContext';
import { announcementService, departmentService } from "@/services/api";
import { FaTimes, FaPaperclip, FaBullhorn } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const CreateAnnouncementModal = ({ onClose, onSuccess, announcementToEdit = null }) => {
  useBodyScrollLock(true);
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
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
    if (announcementToEdit) {
      setFormData({
        title: announcementToEdit.title || '',
        content: announcementToEdit.content || '',
        type: announcementToEdit.type || 'general',
        priority: announcementToEdit.priority || 'medium',
        targetDepartments: announcementToEdit.targetDepartments || [],
        targetRoles: announcementToEdit.targetRoles || ['all'],
        pinned: !!announcementToEdit.pinned,
        expiryDate: announcementToEdit.expiryDate
          ? new Date(announcementToEdit.expiryDate).toISOString().split('T')[0]
          : new Date(+new Date() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
      setExistingAttachments(announcementToEdit.attachments || []);
    }
    if (!announcementToEdit) {
      setExistingAttachments([]);
    }
  }, [announcementToEdit]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments({ limit: 100 });
      setDepartments(response.data || []);
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
        // Attachments can be integrated with file upload service when needed.
      }

      const announcementData = {
        ...formData,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : existingAttachments,
        expiryDate: new Date(formData.expiryDate)
      };

      if (announcementToEdit?._id) {
        await announcementService.update(announcementToEdit._id, announcementData);
        toast.success('Announcement updated successfully');
      } else {
        await announcementService.create(announcementData);
        toast.success('Announcement created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error creating announcement:', error);
      toast.error(error.response?.data?.message || 'Failed to create announcement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <FaBullhorn className="mr-2 text-primary-600" />
            {announcementToEdit ? 'Edit Announcement' : 'Create New Announcement'}
          </h3>
          <Button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="form-label">Title *</label>
            <Input
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
              <Select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="input-field"
              >
                <Option value="general">General</Option>
                <Option value="urgent">Urgent</Option>
                <Option value="event">Event</Option>
                <Option value="holiday">Holiday</Option>
                <Option value="department">Department</Option>
                <Option value="other">Other</Option>
              </Select>
            </div>

            <div>
              <label className="form-label">Priority</label>
              <Select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="input-field"
              >
                <Option value="low">Low</Option>
                <Option value="medium">Medium</Option>
                <Option value="high">High</Option>
                <Option value="urgent">Urgent</Option>
              </Select>
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="form-label">Target Roles</label>
            <MultiSelect
              options={['all', 'admin', 'manager', 'employee']
                .filter((role) => role !== 'admin' || isAdmin)
                .map((role) => ({
                  value: role,
                  label: role === 'all' ? 'Everyone' : role.charAt(0).toUpperCase() + role.slice(1),
                }))}
              values={formData.targetRoles || []}
              onChange={(selected) => setFormData({ ...formData, targetRoles: selected })}
              placeholder="Select role to add"
              summaryLabel="You selected roles"
            />
          </div>

          {/* Target Departments */}
          {isAdmin && (
            <div>
              <label className="form-label">Target Departments</label>
              <MultiSelect
                options={departments.map((dept) => ({ value: dept.name, label: dept.name }))}
                values={formData.targetDepartments || []}
                onChange={(selected) => setFormData({ ...formData, targetDepartments: selected })}
                placeholder="Select department to add"
                summaryLabel="You selected departments"
              />
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
              <Input
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
                <Input
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
              <Input
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
            <Button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="btn-primary"
            >
              {submitting
                ? (announcementToEdit ? 'Updating...' : 'Creating...')
                : (announcementToEdit ? 'Update Announcement' : 'Create Announcement')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnouncementModal;
