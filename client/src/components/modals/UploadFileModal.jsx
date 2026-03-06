import { useState, useEffect } from 'react';
import { Button, Input, Select, Option, MultiSelect } from "@/components/ui";
import { useAuth } from '../../context/AuthContext';
import { departmentService, fileService, userService } from "@/services/api";
import { FaTimes, FaUpload, FaTags, FaLock, FaGlobe, FaUsers } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const UploadFileModal = ({ onClose, onSuccess }) => {
  useBodyScrollLock(true);
  const { user, isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    category: 'document',
    description: '',
    tags: '',
    accessType: isAdmin ? 'restricted' : 'department',
    allowedRoles: ['employee'],
    allowedDepartments: isAdmin ? [] : [user?.department],
    allowedUsers: [],
    allowDownload: true,
    expiryDate: ''
  });

  useEffect(() => {
    fetchDepartments();
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments({ limit: 100 });
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userService.getUsers({ limit: 1000 });
      setUsers(response.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleRoleChange = (role) => {
    let newRoles = [...formData.allowedRoles];
    if (newRoles.includes(role)) {
      newRoles = newRoles.filter(r => r !== role);
    } else {
      newRoles.push(role);
    }
    setFormData({ ...formData, allowedRoles: newRoles });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);

    const form = new FormData();
    form.append('file', selectedFile);
    form.append('category', formData.category);
    form.append('description', formData.description);
    form.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim()).filter(t => t)));
    form.append('accessType', formData.accessType);
    form.append('allowedRoles', JSON.stringify(formData.allowedRoles));
    form.append('allowedDepartments', JSON.stringify(formData.allowedDepartments));
    form.append('allowedUsers', JSON.stringify(formData.allowedUsers));
    form.append('allowDownload', formData.allowDownload);
    if (formData.expiryDate) {
      form.append('expiryDate', formData.expiryDate);
    }

    try {
      await fileService.upload(form);
      toast.success('File uploaded successfully');
      onSuccess();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(error.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <FaUpload className="mr-2 text-primary-600" />
            Upload File
          </h3>
          <Button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Selection */}
          <div>
            <label className="form-label">Select File *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                required
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <FaUpload className="text-gray-400 text-3xl mb-2" />
                <span className="text-sm text-gray-500">
                  {selectedFile ? selectedFile.name : 'Click to select a file'}
                </span>
                {selectedFile && (
                  <span className="text-xs text-gray-400 mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                )}
              </label>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="form-label">Category</label>
            <Select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="input-field"
            >
              <Option value="document">Document</Option>
              <Option value="policy">Policy</Option>
              <Option value="form">Form</Option>
              <Option value="report">Report</Option>
              <Option value="training">Training Material</Option>
              <Option value="employee-document">Employee Document</Option>
              <Option value="contract">Contract</Option>
              <Option value="other">Other</Option>
            </Select>
          </div>

          {/* Description */}
          <div>
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className="input-field"
              placeholder="Describe the file..."
            />
          </div>

          {/* Tags */}
          <div>
            <label className="form-label flex items-center">
              <FaTags className="mr-1 text-gray-400" /> Tags
            </label>
            <Input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              className="input-field"
              placeholder="Enter tags separated by commas"
            />
          </div>

          {/* Access Control */}
          <div>
            <label className="form-label">Access Type</label>
            <div className="grid grid-cols-3 gap-2">
              {isAdmin && (
                <label className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <Input
                    type="radio"
                    name="accessType"
                    value="public"
                    checked={formData.accessType === 'public'}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600"
                  />
                  <FaGlobe className="text-green-600" />
                  <span className="text-sm">Public</span>
                </label>
              )}
              <label className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <Input
                  type="radio"
                  name="accessType"
                  value="restricted"
                  checked={formData.accessType === 'restricted'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600"
                />
                <FaLock className="text-yellow-600" />
                <span className="text-sm">Restricted</span>
              </label>
              <label className="flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50">
                <Input
                  type="radio"
                  name="accessType"
                  value="department"
                  checked={formData.accessType === 'department'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600"
                />
                <FaUsers className="text-blue-600" />
                <span className="text-sm">Department</span>
              </label>
            </div>
          </div>

          {/* Allowed Roles */}
          {formData.accessType === 'restricted' && (
            <div>
              <label className="form-label">Allowed Roles</label>
              <MultiSelect
                options={['admin', 'manager', 'employee'].map((role) => ({
                  value: role,
                  label: role.charAt(0).toUpperCase() + role.slice(1),
                }))}
                values={formData.allowedRoles || []}
                onChange={(selected) => setFormData({ ...formData, allowedRoles: selected })}
                placeholder="Select role to add"
                summaryLabel="You selected roles"
              />
            </div>
          )}

          {/* Allowed Departments */}
          {(formData.accessType === 'restricted' || isAdmin) && (
            <div>
              <label className="form-label">Allowed Departments</label>
              <MultiSelect
                options={departments.map((dept) => ({ value: dept.name, label: dept.name }))}
                values={formData.allowedDepartments || []}
                onChange={(selected) => setFormData({ ...formData, allowedDepartments: selected })}
                placeholder="Select department to add"
                summaryLabel="You selected departments"
              />
            </div>
          )}

          {/* Allowed Users (Admin only) */}
          {isAdmin && formData.accessType === 'restricted' && (
            <div>
              <label className="form-label">Specific Users</label>
              <MultiSelect
                options={users.map((item) => ({
                  value: item._id,
                  label: `${item.name} (${item.email})`,
                }))}
                values={formData.allowedUsers || []}
                onChange={(selected) => setFormData({ ...formData, allowedUsers: selected })}
                placeholder="Select user to add"
                summaryLabel="You selected users"
              />
            </div>
          )}

          {/* Options */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <label className="flex items-center space-x-2">
                <Input
                  type="checkbox"
                  name="allowDownload"
                  checked={formData.allowDownload}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 rounded"
                />
                <span className="text-sm">Allow Download</span>
              </label>
            </div>

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
              disabled={uploading || !selectedFile}
              className="btn-primary flex items-center space-x-2"
            >
              <FaUpload />
              <span>{uploading ? 'Uploading...' : 'Upload File'}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadFileModal;
