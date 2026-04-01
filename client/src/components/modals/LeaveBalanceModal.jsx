import { FaTimes } from 'react-icons/fa';
import { Button, Input } from "@/components/ui";
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const LeaveBalanceModal = ({ isOpen, onClose, onSubmit, formData, setFormData, selectedUser }) => {
  useBodyScrollLock(isOpen && !!selectedUser);
  if (!isOpen || !selectedUser) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      leaveBalance: {
        ...formData.leaveBalance,
        [name]: value === '' ? '' : parseInt(value, 10),
      },
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto justify-center flex items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 mx-auto w-full max-w-md rounded-xl border bg-white p-4 shadow-lg sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Update Leave Balance</h3>
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium">{selectedUser.name}</p>
            <p className="text-sm text-gray-600">{selectedUser.email}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual
              </label>
              <Input
                type="number"
                name="annual"
                value={formData.leaveBalance.annual}
                onChange={handleInputChange}
                className="input-field"
                min="0"
                placeholder="Annual balance"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sick
              </label>
              <Input
                type="number"
                name="sick"
                value={formData.leaveBalance.sick}
                onChange={handleInputChange}
                className="input-field"
                min="0"
                placeholder="Sick balance"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal
              </label>
              <Input
                type="number"
                name="personal"
                value={formData.leaveBalance.personal}
                onChange={handleInputChange}
                className="input-field"
                min="0"
                placeholder="Personal balance"
              />
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
              Update Balance
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveBalanceModal;
