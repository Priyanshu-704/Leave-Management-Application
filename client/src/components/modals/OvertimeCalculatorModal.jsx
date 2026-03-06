import { useState } from 'react';
import { Button, Input } from "@/components/ui";
import { shiftService, userService } from "@/services/api";
import {
  FaTimes,
  FaClock,
  FaCalendarAlt,
  FaUserCircle,
  FaFileExport,
} from 'react-icons/fa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const OvertimeCalculatorModal = ({ onClose }) => {
  useBodyScrollLock(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [overtimeData, setOvertimeData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false);

  const fetchEmployees = async () => {
    try {
      const response = await userService.getUsers({ isActive: true, limit: 100 });
      setEmployees(response.users || []);
      setShowEmployeeSelect(true);
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to fetch employees');
    }
  };

  const calculateOvertime = async () => {
    if (!selectedEmployee) {
      toast.error('Please select an employee');
      return;
    }

    setLoading(true);
    try {
      const response = await shiftService.calculateOvertime({
        employeeId: selectedEmployee._id,
        startDate,
        endDate
      });
      setOvertimeData(response);
    } catch (error) {
      console.error('Error calculating overtime:', error);
      toast.error(error.response?.data?.message || 'Failed to calculate overtime');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!overtimeData) return;

    const headers = ['Date', 'Work Hours', 'Regular Hours', 'Overtime', 'Rate', 'Amount'];
    const rows = overtimeData.data.map(item => [
      format(new Date(item.date), 'yyyy-MM-dd'),
      item.workHours.toFixed(2),
      item.regularHours.toFixed(2),
      item.overtime.toFixed(2),
      item.rate.toFixed(2),
      item.calculatedAmount.toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overtime_${selectedEmployee.name}_${startDate}_${endDate}.csv`;
    a.click();
  };

  const getRateMultiplier = (item) => {
    if (item.isHoliday) return 'Holiday Rate';
    if (item.isWeekend) return 'Weekend Rate';
    if (item.shiftType === 'night') return 'Night Differential';
    if (item.overtime > 0) return 'Overtime Rate';
    return 'Regular Rate';
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto flex items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-lg bg-white ">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <FaClock className="mr-2 text-primary-600" />
            Overtime Calculator
          </h3>
          <Button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </Button>
        </div>

        {/* Employee Selection */}
        {!selectedEmployee ? (
          <div className="text-center py-8">
            <Button
              onClick={fetchEmployees}
              className="btn-primary"
            >
              Select Employee
            </Button>

            {showEmployeeSelect && (
              <div className="mt-4 max-h-96 overflow-y-auto border rounded-lg">
                {employees.map(emp => (
                  <Button
                    key={emp._id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center space-x-3"
                  >
                    <FaUserCircle className="text-gray-400 text-2xl" />
                    <div>
                      <p className="font-medium">{emp.name}</p>
                      <p className="text-sm text-gray-500">{emp.employeeId} • {emp.department}</p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Selected Employee Info */}
            <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FaUserCircle className="text-blue-600 text-2xl" />
                <div>
                  <p className="font-medium">{selectedEmployee.name}</p>
                  <p className="text-sm text-blue-600">{selectedEmployee.employeeId} • {selectedEmployee.department}</p>
                </div>
              </div>
              <Button
                onClick={() => setSelectedEmployee(null)}
                className="text-sm text-blue-600 hover:underline"
              >
                Change
              </Button>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">End Date</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <div className="flex justify-center">
              <Button
                onClick={calculateOvertime}
                disabled={loading}
                className="btn-primary px-8"
              >
                {loading ? 'Calculating...' : 'Calculate Overtime'}
              </Button>
            </div>

            {/* Results */}
            {overtimeData && (
              <div className="space-y-4">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <p className="text-xs text-green-600">Total Overtime</p>
                    <p className="text-2xl font-bold text-green-700">
                      {overtimeData.summary.totalOvertime.toFixed(2)} hrs
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <p className="text-xs text-blue-600">Total Amount</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ₹{overtimeData.summary.totalAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-xs text-purple-600">Days</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {overtimeData.data.length}
                    </p>
                  </div>
                </div>

                {/* Export Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={exportToCSV}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <FaFileExport />
                    <span>Export CSV</span>
                  </Button>
                </div>

                {/* Detailed Table */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Work Hours</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Regular</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Overtime</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Rate</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Type</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {overtimeData.data.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm">
                            {format(new Date(item.date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-4 py-2 text-sm">{item.workHours.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm">{item.regularHours.toFixed(2)}</td>
                          <td className="px-4 py-2 text-sm font-medium text-orange-600">
                            {item.overtime.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-sm">{item.rate.toFixed(2)}x</td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              item.isHoliday ? 'bg-red-100 text-red-700' :
                              item.isWeekend ? 'bg-purple-100 text-purple-700' :
                              item.shiftType === 'night' ? 'bg-indigo-100 text-indigo-700' :
                              item.overtime > 0 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {getRateMultiplier(item)}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm font-medium">
                            ₹{item.calculatedAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OvertimeCalculatorModal;
