import { useState, useEffect } from 'react';
import { Button, Input, Select, Option } from "@/components/ui";
import { useAuth } from '../../context/AuthContext';
import { departmentService, shiftService, userService } from "@/services/api";
import {
  FaTimes,
  FaClock,
  FaSun,
  FaCloudMoon,
  FaMoon,
  FaDollarSign,
  FaCalendarAlt,
  FaUsers,
  FaInfoCircle
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const CreateShiftModal = ({ onClose, onSuccess, shiftToEdit = null }) => {
  useBodyScrollLock(true);
  const { user, isAdmin } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // basic, allowances, assignment

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'morning',
    startTime: '09:00',
    endTime: '18:00',
    gracePeriod: 15,
    latePenaltyAfter: 30,
    requiresNextDay: false,
    breakDuration: 60,
    applicableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    allowances: {
      baseRate: 1.0,
      overtimeRate: 1.5,
      nightDifferential: 1.1,
      weekendRate: 1.5,
      holidayRate: 2.0,
      shiftAllowance: 0,
      mealAllowance: 0,
      transportAllowance: 0
    },
    department: user?.department || '',
    assignedEmployees: [],
    rotationEnabled: false,
    rotationFrequency: 'weekly',
    rotationGroup: 'A',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
    
    if (shiftToEdit) {
      setFormData(shiftToEdit);
    }
  }, [shiftToEdit]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments({ limit: 100 });
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await userService.getUsers({ limit: 1000, isActive: true });
      setEmployees(response.users || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleAllowanceChange = (field, value) => {
    setFormData({
      ...formData,
      allowances: {
        ...formData.allowances,
        [field]: parseFloat(value) || 0
      }
    });
  };

  const handleDayToggle = (day) => {
    const currentDays = formData.applicableDays;
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    
    setFormData({ ...formData, applicableDays: newDays });
  };

  const handleEmployeeSelect = (employeeId) => {
    const currentEmployees = formData.assignedEmployees;
    const newEmployees = currentEmployees.includes(employeeId)
      ? currentEmployees.filter(id => id !== employeeId)
      : [...currentEmployees, employeeId];
    
    setFormData({ ...formData, assignedEmployees: newEmployees });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (shiftToEdit) {
        await shiftService.updateShift(shiftToEdit._id, formData);
        toast.success('Shift updated successfully');
      } else {
        await shiftService.createShift(formData);
        toast.success('Shift created successfully');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving shift:', error);
      toast.error(error.response?.data?.message || 'Failed to save shift');
    } finally {
      setLoading(false);
    }
  };

  const getShiftIcon = (type) => {
    switch(type) {
      case 'morning': return <FaSun className="text-yellow-500" />;
      case 'evening': return <FaCloudMoon className="text-orange-500" />;
      case 'night': return <FaMoon className="text-indigo-500" />;
      default: return <FaClock className="text-blue-500" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-lg bg-white">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            {getShiftIcon(formData.type)}
            <span className="ml-2">{shiftToEdit ? 'Edit Shift' : 'Create New Shift'}</span>
          </h3>
          <Button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </Button>
        </div>

        {/* Tabs */}
        <div className="border-b mb-4">
          <nav className="flex space-x-8">
            <Button
              onClick={() => setActiveTab('basic')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'basic'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaClock className="inline mr-2" />
              Basic Info
            </Button>
            <Button
              onClick={() => setActiveTab('allowances')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'allowances'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaDollarSign className="inline mr-2" />
              Allowances & Rates
            </Button>
            <Button
              onClick={() => setActiveTab('assignment')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'assignment'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaUsers className="inline mr-2" />
              Assignment
            </Button>
            <Button
              onClick={() => setActiveTab('rotation')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rotation'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FaCalendarAlt className="inline mr-2" />
              Rotation
            </Button>
          </nav>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Shift Name *</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    placeholder="e.g., Morning Shift"
                  />
                </div>
                <div>
                  <label className="form-label">Shift Code *</label>
                  <Input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                    placeholder="e.g., MRN001"
                    maxLength="10"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div>
                  <label className="form-label">Shift Type</label>
                  <Select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <Option value="morning">Morning</Option>
                    <Option value="evening">Evening</Option>
                    <Option value="night">Night</Option>
                    <Option value="general">General</Option>
                  </Select>
                </div>
                <div>
                  <label className="form-label">Department</label>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  >
                    <Option value="">Select Department</Option>
                    {departments.map(dept => (
                      <Option key={dept._id} value={dept.name}>{dept.name}</Option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="form-label">Start Time</label>
                  <Input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">End Time</label>
                  <Input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Grace Period (minutes)</label>
                  <Input
                    type="number"
                    name="gracePeriod"
                    value={formData.gracePeriod}
                    onChange={handleInputChange}
                    className="input-field"
                    min="0"
                    step="5"
                  />
                </div>
                <div>
                  <label className="form-label">Late Penalty After (minutes)</label>
                  <Input
                    type="number"
                    name="latePenaltyAfter"
                    value={formData.latePenaltyAfter}
                    onChange={handleInputChange}
                    className="input-field"
                    min="0"
                    step="5"
                  />
                </div>
                <div>
                  <label className="form-label">Break Duration (minutes)</label>
                  <Input
                    type="number"
                    name="breakDuration"
                    value={formData.breakDuration}
                    onChange={handleInputChange}
                    className="input-field"
                    min="0"
                    step="15"
                  />
                </div>
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <Input
                      type="checkbox"
                      name="requiresNextDay"
                      checked={formData.requiresNextDay}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-primary-600 rounded"
                    />
                    <span>Requires Next Day (Night Shift)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="form-label">Applicable Days</label>
                <div className="flex flex-wrap gap-3 mt-2">
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                    <label key={day} className="flex items-center space-x-2">
                      <Input
                        type="checkbox"
                        checked={formData.applicableDays.includes(day)}
                        onChange={() => handleDayToggle(day)}
                        className="h-4 w-4 text-primary-600 rounded"
                      />
                      <span className="text-sm capitalize">{day}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="input-field"
                  placeholder="Shift description..."
                />
              </div>

              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <Input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>
          )}

          {/* Allowances Tab */}
          {activeTab === 'allowances' && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-700 flex items-center">
                  <FaInfoCircle className="mr-2" />
                  Rates are multipliers applied to base pay. 1.0 = 100% of base rate.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Base Rate (x)</label>
                  <Input
                    type="number"
                    value={formData.allowances.baseRate}
                    onChange={(e) => handleAllowanceChange('baseRate', e.target.value)}
                    className="input-field"
                    min="0"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="form-label">Overtime Rate (x)</label>
                  <Input
                    type="number"
                    value={formData.allowances.overtimeRate}
                    onChange={(e) => handleAllowanceChange('overtimeRate', e.target.value)}
                    className="input-field"
                    min="1"
                    step="0.1"
                  />
                </div>
                {formData.type === 'night' && (
                  <div>
                    <label className="form-label">Night Differential (x)</label>
                    <Input
                      type="number"
                      value={formData.allowances.nightDifferential}
                      onChange={(e) => handleAllowanceChange('nightDifferential', e.target.value)}
                      className="input-field"
                      min="1"
                      step="0.1"
                    />
                  </div>
                )}
                <div>
                  <label className="form-label">Weekend Rate (x)</label>
                  <Input
                    type="number"
                    value={formData.allowances.weekendRate}
                    onChange={(e) => handleAllowanceChange('weekendRate', e.target.value)}
                    className="input-field"
                    min="1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="form-label">Holiday Rate (x)</label>
                  <Input
                    type="number"
                    value={formData.allowances.holidayRate}
                    onChange={(e) => handleAllowanceChange('holidayRate', e.target.value)}
                    className="input-field"
                    min="1"
                    step="0.1"
                  />
                </div>
              </div>

              <h3 className="font-medium mt-4">Fixed Allowances (₹ per shift)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="form-label">Shift Allowance</label>
                  <Input
                    type="number"
                    value={formData.allowances.shiftAllowance}
                    onChange={(e) => handleAllowanceChange('shiftAllowance', e.target.value)}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">Meal Allowance</label>
                  <Input
                    type="number"
                    value={formData.allowances.mealAllowance}
                    onChange={(e) => handleAllowanceChange('mealAllowance', e.target.value)}
                    className="input-field"
                    min="0"
                  />
                </div>
                <div>
                  <label className="form-label">Transport Allowance</label>
                  <Input
                    type="number"
                    value={formData.allowances.transportAllowance}
                    onChange={(e) => handleAllowanceChange('transportAllowance', e.target.value)}
                    className="input-field"
                    min="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Assignment Tab */}
          {activeTab === 'assignment' && (
            <div className="space-y-4">
              <div className="mb-4">
                <Input
                  type="text"
                  placeholder="Search employees..."
                  className="input-field"
                  // eslint-disable-next-line no-unused-vars
                  onChange={(e) => {
                    // Implement search
                  }}
                />
              </div>

              <div className="max-h-96 overflow-y-auto border rounded-lg">
                <table className="min-w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Select</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Employee</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Department</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Current Shift</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {employees
                      .filter(emp => isAdmin || emp.department === formData.department)
                      .map(emp => (
                        <tr key={emp._id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <Input
                              type="checkbox"
                              checked={formData.assignedEmployees.includes(emp._id)}
                              onChange={() => handleEmployeeSelect(emp._id)}
                              className="h-4 w-4 text-primary-600 rounded"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div>
                              <p className="font-medium">{emp.name}</p>
                              <p className="text-xs text-gray-500">{emp.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm">{emp.employeeId}</td>
                          <td className="px-4 py-2 text-sm">{emp.department}</td>
                          <td className="px-4 py-2 text-sm">
                            {/* Show current shift if any */}
                            <span className="text-gray-400">Not assigned</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <p className="text-sm text-gray-500">
                Selected: {formData.assignedEmployees.length} employees
              </p>
            </div>
          )}

          {/* Rotation Tab */}
          {activeTab === 'rotation' && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <label className="flex items-center space-x-2">
                  <Input
                    type="checkbox"
                    name="rotationEnabled"
                    checked={formData.rotationEnabled}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <span>Enable Shift Rotation</span>
                </label>
              </div>

              {formData.rotationEnabled && (
                <div className="space-y-4 pl-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">Rotation Frequency</label>
                      <Select
                        name="rotationFrequency"
                        value={formData.rotationFrequency}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <Option value="weekly">Weekly</Option>
                        <Option value="biweekly">Bi-Weekly</Option>
                        <Option value="monthly">Monthly</Option>
                      </Select>
                    </div>
                    <div>
                      <label className="form-label">Rotation Group</label>
                      <Select
                        name="rotationGroup"
                        value={formData.rotationGroup}
                        onChange={handleInputChange}
                        className="input-field"
                      >
                        <Option value="A">Group A</Option>
                        <Option value="B">Group B</Option>
                        <Option value="C">Group C</Option>
                        <Option value="D">Group D</Option>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-700">
                      <FaInfoCircle className="inline mr-2" />
                      Shifts will rotate every {formData.rotationFrequency} between groups.
                      Employees in Group A will move to next shift in rotation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <Button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="btn-primary"
            >
              {loading ? 'Saving...' : shiftToEdit ? 'Update Shift' : 'Create Shift'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateShiftModal;
