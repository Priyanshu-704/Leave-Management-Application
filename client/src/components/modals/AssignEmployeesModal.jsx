import { useState, useEffect } from 'react';
import { Button, Input } from "@/components/ui";
import { shiftService, userService } from "@/services/api";
import {
  FaTimes,
  FaUsers,
  FaSearch,
  FaCalendarAlt,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const AssignEmployeesModal = ({ shift, onClose, onSuccess }) => {
  useBodyScrollLock(true);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [isPermanent, setIsPermanent] = useState(true);
  const [conflicts, setConflicts] = useState([]);

  useEffect(() => {
    fetchEmployees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await userService.getUsers({
        department: shift.department,
        isActive: true,
        limit: 1000,
      });
      setEmployees(response.users || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const handleSelectAll = () => {
    if (selectedEmployees.length === filteredEmployees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(filteredEmployees.map(emp => emp._id));
    }
  };

  const handleEmployeeSelect = (employeeId) => {
    setSelectedEmployees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const checkConflicts = async () => {
    // Check for shift conflicts (already assigned to another shift)
    const conflictsList = [];
    for (const empId of selectedEmployees) {
      try {
        const response = await shiftService.getAssignments({
          employee: empId,
          active: true,
        });
        if (response.data.length > 0) {
          const employee = employees.find(e => e._id === empId);
          conflictsList.push({
            employee: employee?.name || 'Unknown',
            currentShift: response.data[0].shift?.name || 'Another shift'
          });
        }
      } catch (error) {
        console.error('Error checking conflicts:', error);
      }
    }
    setConflicts(conflictsList);
    return conflictsList.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    // Check for conflicts
    const hasConflicts = await checkConflicts();
    if (!hasConflicts) {
      const proceed = window.confirm(
        'Some employees are already assigned to other shifts. Continue anyway?'
      );
      if (!proceed) return;
    }

    setLoading(true);
    try {
      await shiftService.assignEmployees(shift._id, {
        employeeIds: selectedEmployees,
        startDate,
        isPermanent
      });
      
      toast.success(`Successfully assigned ${selectedEmployees.length} employees`);
      onSuccess();
    } catch (error) {
      console.error('Error assigning employees:', error);
      toast.error(error.response?.data?.message || 'Failed to assign employees');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 mx-auto w-full max-w-3xl rounded-xl border bg-white p-4 shadow-lg sm:p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold flex items-center">
            <FaUsers className="mr-2 text-primary-600" />
            Assign Employees to {shift.name}
          </h3>
          <Button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </Button>
        </div>

        {/* Shift Info */}
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3 sm:gap-4">
            <div>
              <span className="text-blue-600">Shift:</span>
              <span className="ml-2 font-medium">{shift.name} ({shift.code})</span>
            </div>
            <div>
              <span className="text-blue-600">Timing:</span>
              <span className="ml-2 font-medium">{shift.startTime} - {shift.endTime}</span>
            </div>
            <div>
              <span className="text-blue-600">Department:</span>
              <span className="ml-2 font-medium">{shift.department}</span>
            </div>
          </div>
        </div>

        {/* Assignment Details */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="form-label">Start Date</label>
            <div className="relative">
              <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-field pl-10"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>
          <div className="flex items-center">
            <label className="flex items-center space-x-2">
              <Input
                type="checkbox"
                checked={isPermanent}
                onChange={(e) => setIsPermanent(e.target.checked)}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <span>Permanent Assignment</span>
            </label>
          </div>
        </div>

        {/* Conflict Warning */}
        {conflicts.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <FaExclamationTriangle className="text-red-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">Assignment Conflicts Detected</p>
                <ul className="text-xs text-red-600 mt-1 list-disc list-inside">
                  {conflicts.map((conflict, index) => (
                    <li key={index}>
                      {conflict.employee} is already assigned to {conflict.currentShift}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-3 text-gray-400" />
            <Input
              type="text"
              placeholder="Search employees by name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>

        {/* Employee List */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Input
                type="checkbox"
                checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-primary-600 rounded"
              />
              <span className="text-sm font-medium">Select All</span>
            </div>
            <span className="text-sm text-gray-500">
              {selectedEmployees.length} of {filteredEmployees.length} selected
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredEmployees.map(emp => (
              <div
                key={emp._id}
                className="flex flex-col gap-3 border-b p-3 hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <Input
                    type="checkbox"
                    checked={selectedEmployees.includes(emp._id)}
                    onChange={() => handleEmployeeSelect(emp._id)}
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{emp.name}</p>
                    <p className="text-sm text-gray-500">{emp.email} • {emp.employeeId}</p>
                  </div>
                </div>
                <span className="w-fit rounded-full bg-gray-100 px-2 py-1 text-xs">
                  {emp.department}
                </span>
              </div>
            ))}

            {filteredEmployees.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No employees found
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || selectedEmployees.length === 0}
            className="btn-primary w-full sm:w-auto"
          >
            {loading ? 'Assigning...' : `Assign to ${selectedEmployees.length} Employees`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssignEmployeesModal;
