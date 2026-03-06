import { useState, useEffect } from 'react';
import PageSkeleton from '@/components/PageSkeleton';
import { Button, Select, Option } from "@/components/ui";
import { useAuth } from '../context/AuthContext';
import { departmentService, shiftService } from "@/services/api";
import {
  FaClock,
  FaPlus,
  FaEdit,
  FaTrash,
  FaUsers,
  FaExchangeAlt,
  FaMoon,
  FaSun,
  FaCloudMoon,
  FaCalendarAlt,
  FaClock as FaOvertime
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import CreateShiftModal from '../components/modals/CreateShiftModal';
import AssignEmployeesModal from '../components/modals/AssignEmployeesModal';
import ShiftSwapModal from '../components/modals/ShiftSwapModal';
import OvertimeCalculatorModal from '../components/modals/OvertimeCalculatorModal';
import ConfirmActionModal from '../components/modals/ConfirmActionModal';

const ShiftManagement = () => {
  const { user, isAdmin, isManager } = useAuth();
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    id: null,
    name: ''
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    department: user?.department || 'all'
  });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchShifts();
    fetchDepartments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.department !== 'all' && { department: filters.department })
      });
      
      const response = await shiftService.getShifts(Object.fromEntries(params.entries()));
      setShifts(response.data);
    } catch (error) {
      console.error('Error fetching shifts:', error);
      toast.error('Failed to fetch shifts');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await departmentService.getDepartments({ limit: 100 });
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;

    setDeleteLoading(true);
    try {
      await shiftService.deleteShift(deleteConfirm.id);
      toast.success('Shift deleted successfully');
      fetchShifts();
      setDeleteConfirm({ isOpen: false, id: null, name: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete shift');
    } finally {
      setDeleteLoading(false);
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

  const getShiftColor = (type) => {
    switch(type) {
      case 'morning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'evening': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'night': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return <PageSkeleton rows={6} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shift Management</h1>
          <p className="text-gray-600 mt-1">Manage work shifts, rotations, and allowances</p>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowOvertimeModal(true)}
            className="btn-secondary flex items-center space-x-2"
          >
            <FaOvertime />
            <span>Calculate Overtime</span>
          </Button>
          {(isAdmin || isManager) && (
            <Button
              onClick={() => {
                setSelectedShift(null);
                setShowCreateModal(true);
              }}
              className="btn-primary flex items-center space-x-2"
            >
              <FaPlus />
              <span>Create Shift</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm">Total Shifts</p>
              <p className="text-2xl font-bold text-blue-700">{shifts.length}</p>
            </div>
            <FaClock className="text-blue-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-600 text-sm">Morning</p>
              <p className="text-2xl font-bold text-yellow-700">
                {shifts.filter(s => s.type === 'morning').length}
              </p>
            </div>
            <FaSun className="text-yellow-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-orange-50 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm">Evening</p>
              <p className="text-2xl font-bold text-orange-700">
                {shifts.filter(s => s.type === 'evening').length}
              </p>
            </div>
            <FaCloudMoon className="text-orange-500 text-3xl" />
          </div>
        </div>

        <div className="card bg-indigo-50 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-600 text-sm">Night</p>
              <p className="text-2xl font-bold text-indigo-700">
                {shifts.filter(s => s.type === 'night').length}
              </p>
            </div>
            <FaMoon className="text-indigo-500 text-3xl" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Shift Type</label>
            <Select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="input-field"
            >
              <Option value="all">All Types</Option>
              <Option value="morning">Morning</Option>
              <Option value="evening">Evening</Option>
              <Option value="night">Night</Option>
              <Option value="general">General</Option>
            </Select>
          </div>
          {(isAdmin) && (
            <div>
              <label className="form-label">Department</label>
              <Select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                className="input-field"
              >
                <Option value="all">All Departments</Option>
                {departments.map(dept => (
                  <Option key={dept._id} value={dept.name}>{dept.name}</Option>
                ))}
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {shifts.map(shift => (
          <div key={shift._id} className="card hover:shadow-lg transition-shadow">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${getShiftColor(shift.type)}`}>
                  {getShiftIcon(shift.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{shift.name}</h3>
                  <p className="text-sm text-gray-500">Code: {shift.code}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                shift.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {shift.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Timing */}
            <div className="bg-gray-50 p-3 rounded-lg mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Start:</span>
                <span className="font-medium">{shift.startTime}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">End:</span>
                <span className="font-medium">{shift.endTime}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Hours:</span>
                <span className="font-medium">{shift.totalHours?.toFixed(1)} hrs</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Break:</span>
                <span className="font-medium">{shift.breakDuration} min</span>
              </div>
            </div>

            {/* Allowances */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-green-50 p-2 rounded text-center">
                <p className="text-xs text-green-600">Base Rate</p>
                <p className="font-semibold">{shift.allowances?.baseRate}x</p>
              </div>
              <div className="bg-yellow-50 p-2 rounded text-center">
                <p className="text-xs text-yellow-600">OT Rate</p>
                <p className="font-semibold">{shift.allowances?.overtimeRate}x</p>
              </div>
              {shift.type === 'night' && (
                <div className="bg-indigo-50 p-2 rounded text-center col-span-2">
                  <p className="text-xs text-indigo-600">Night Differential</p>
                  <p className="font-semibold">{shift.allowances?.nightDifferential}x</p>
                </div>
              )}
            </div>

            {/* Department & Employees */}
            <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
              <span className="flex items-center">
                <FaUsers className="mr-1" />
                {shift.assignedEmployees?.length || 0} Employees
              </span>
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                {shift.department}
              </span>
            </div>

            {/* Rotation Status */}
            {shift.rotationEnabled && (
              <div className="bg-purple-50 p-2 rounded-lg mb-3">
                <p className="text-xs text-purple-700 flex items-center">
                  <FaCalendarAlt className="mr-1" />
                  Rotates {shift.rotationFrequency} (Group {shift.rotationGroup})
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t">
              <Button
                onClick={() => {
                  setSelectedShift(shift);
                  setShowAssignModal(true);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                title="Assign Employees"
              >
                <FaUsers />
              </Button>
              <Button
                onClick={() => {
                  setSelectedShift(shift);
                  setShowSwapModal(true);
                }}
                className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                title="Request Swap"
              >
                <FaExchangeAlt />
              </Button>
              {(isAdmin || (isManager && shift.department === user?.department)) && (
                <>
                  <Button
                    onClick={() => {
                      setSelectedShift(shift);
                      setShowCreateModal(true);
                    }}
                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                    title="Edit"
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    onClick={() =>
                      setDeleteConfirm({
                        isOpen: true,
                        id: shift._id,
                        name: shift.name
                      })
                    }
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <FaTrash />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateShiftModal
          shiftToEdit={selectedShift}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedShift(null);
          }}
          onSuccess={() => {
            fetchShifts();
            setShowCreateModal(false);
            setSelectedShift(null);
          }}
          departments={departments}
        />
      )}

      {showAssignModal && selectedShift && (
        <AssignEmployeesModal
          shift={selectedShift}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedShift(null);
          }}
          onSuccess={() => {
            fetchShifts();
            setShowAssignModal(false);
            setSelectedShift(null);
          }}
        />
      )}

      {showSwapModal && selectedShift && (
        <ShiftSwapModal
          shift={selectedShift}
          onClose={() => {
            setShowSwapModal(false);
            setSelectedShift(null);
          }}
          onSuccess={() => {
            fetchShifts();
            setShowSwapModal(false);
            setSelectedShift(null);
          }}
        />
      )}

      {showOvertimeModal && (
        <OvertimeCalculatorModal
          onClose={() => setShowOvertimeModal(false)}
        />
      )}

      <ConfirmActionModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Shift"
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

export default ShiftManagement;
