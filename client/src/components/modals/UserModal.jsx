import { FaTimes } from 'react-icons/fa';
import { Button, Input, Select, Option } from "@/components/ui";
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const roleLabels = {
  employee: "Employee",
  manager: "Manager",
  admin: "Admin",
};

const UserModal = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingId,
  departments,
  allowedRoles = ["employee", "manager"],
}) => {
  useBodyScrollLock(isOpen);
  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('leave.')) {
      const leaveType = name.split('.')[1];
      setFormData({
        ...formData,
        leaveBalance: {
          ...formData.leaveBalance,
          [leaveType]: value === '' ? '' : parseInt(value, 10),
        },
      });
    } else {
      setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 mx-auto w-full max-w-2xl rounded-xl border bg-white p-4 shadow-lg sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">
            {editingId ? "Edit User" : "Add New User"}
          </h3>
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Employee ID *
              </label>
              <Input
                type="text"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <Select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                <Option value="">Select Department</Option>
                {departments.map((dept) => (
                  <Option key={dept._id} value={dept.name}>
                    {dept.name}
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="input-field"
                required
              >
                {allowedRoles.map((role) => (
                  <Option key={role} value={role}>
                    {roleLabels[role] || role}
                  </Option>
                ))}
              </Select>
            </div>

            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="input-field"
                  minLength="6"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to auto-generate a temporary password.
                </p>
              </div>
            )}
          </div>

          {!editingId && (
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <Input
                type="checkbox"
                name="sendCredentialsEmail"
                checked={formData.sendCredentialsEmail}
                onChange={handleInputChange}
                className="h-4 w-4 rounded"
              />
              Send credentials to user by email
            </label>
          )}

          {/* Leave Balance */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Initial Leave Balance</h4>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Leave
                </label>
                <Input
                  type="number"
                  name="leave.annual"
                  value={formData.leaveBalance.annual}
                  onChange={handleInputChange}
                  className="input-field"
                  min="0"
                  placeholder="Enter annual leave"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sick Leave
                </label>
                <Input
                  type="number"
                  name="leave.sick"
                  value={formData.leaveBalance.sick}
                  onChange={handleInputChange}
                  className="input-field"
                  min="0"
                  placeholder="Enter sick leave"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personal Leave
                </label>
                <Input
                  type="number"
                  name="leave.personal"
                  value={formData.leaveBalance.personal}
                  onChange={handleInputChange}
                  className="input-field"
                  min="0"
                  placeholder="Enter personal leave"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              onClick={onClose}
              className="btn-secondary w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="btn-primary w-full sm:w-auto">
              {editingId ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
