import { useState } from 'react';
import { Button, Input } from "@/components/ui";
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { FaCalendarAlt, FaUserMd, FaUser, FaWallet, FaTimes } from "react-icons/fa";
import { leaveService } from "@/services/api";

const ApplyLeave = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    leaveType: 'annual',
    startDate: new Date(),
    endDate: new Date(),
    reason: '',
    halfDay: false
  });
  const [loading, setLoading] = useState(false);

  const leaveTypes = [
    { value: 'annual', label: 'Annual Leave', icon: <FaCalendarAlt /> },
    { value: 'sick', label: 'Sick Leave', icon: <FaUserMd /> },
    { value: 'personal', label: 'Personal Leave', icon: <FaUser /> },
    { value: 'unpaid', label: 'Unpaid Leave', icon: <FaWallet /> }
  ];

  const calculateDays = () => {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const days = calculateDays();
    
    // Check leave balance
    if (formData.leaveType !== 'unpaid' && 
        user?.leaveBalance[formData.leaveType] < days) {
      toast.error(`Insufficient ${formData.leaveType} leave balance`);
      return;
    }

    setLoading(true);
    try {
      await leaveService.createLeave({
        ...formData,
        days
      });
      toast.success('Leave application submitted successfully');
      navigate('/leave-history');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-white/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="mb-4 flex justify-end">
          <Button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary !p-2"
            aria-label="Close"
          >
            <FaTimes />
          </Button>
        </div>
        <h1 className="text-2xl font-bold mb-6">Apply for Leave</h1>
        
        {/* Leave Balance Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <span className="text-sm text-gray-600">Annual Leave</span>
            <p className="text-xl font-semibold text-blue-600">
              {user?.leaveBalance.annual} days
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Sick Leave</span>
            <p className="text-xl font-semibold text-green-600">
              {user?.leaveBalance.sick} days
            </p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Personal Leave</span>
            <p className="text-xl font-semibold text-purple-600">
              {user?.leaveBalance.personal} days
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type */}
          <div>
            <label className="required-label block text-sm font-medium text-gray-700 mb-2">
              Leave Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {leaveTypes.map((type) => (
                <Button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, leaveType: type.value })}
                  className={`p-3 border rounded-lg text-center transition ${
                    formData.leaveType === type.value
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  <span className="text-2xl mb-1 block flex items-center justify-center">{type.icon}</span>
                  <span className="text-sm">{type.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="required-label block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <DatePicker
                selected={formData.startDate}
                onChange={(date) => setFormData({ ...formData, startDate: date })}
                minDate={new Date()}
                className="input-field"
                dateFormat="MMMM d, yyyy"
              />
            </div>
            <div>
              <label className="required-label block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <DatePicker
                selected={formData.endDate}
                onChange={(date) => setFormData({ ...formData, endDate: date })}
                minDate={formData.startDate}
                className="input-field"
                dateFormat="MMMM d, yyyy"
              />
            </div>
          </div>

          {/* Days Summary */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-blue-800">
              Total Days: <span className="font-bold">{calculateDays()}</span>
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="required-label block text-sm font-medium text-gray-700 mb-2">
              Reason for Leave
            </label>
            <textarea
              rows="4"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="input-field"
              placeholder="Please provide a detailed reason for your leave request..."
              required
            />
          </div>

          {/* Half Day Option */}
          <div className="flex items-center">
            <Input
              type="checkbox"
              id="halfDay"
              checked={formData.halfDay}
              onChange={(e) => setFormData({ ...formData, halfDay: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="halfDay" className="ml-2 text-sm text-gray-700">
              Half Day Leave
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              onClick={() => navigate(-1)}
              className="btn-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApplyLeave;
