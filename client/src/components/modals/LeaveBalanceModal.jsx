import { FaTimes } from 'react-icons/fa';

const LeaveBalanceModal = ({ isOpen, onClose, onSubmit, formData, setFormData, selectedUser }) => {
  if (!isOpen || !selectedUser) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      leaveBalance: {
        ...formData.leaveBalance,
        [name]: parseInt(value) || 0,
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Update Leave Balance</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium">{selectedUser.name}</p>
            <p className="text-sm text-gray-600">{selectedUser.email}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Annual
              </label>
              <input
                type="number"
                name="annual"
                value={formData.leaveBalance.annual}
                onChange={handleInputChange}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sick
              </label>
              <input
                type="number"
                name="sick"
                value={formData.leaveBalance.sick}
                onChange={handleInputChange}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal
              </label>
              <input
                type="number"
                name="personal"
                value={formData.leaveBalance.personal}
                onChange={handleInputChange}
                className="input-field"
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Update Balance
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LeaveBalanceModal;