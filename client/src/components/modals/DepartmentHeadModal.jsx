/* eslint-disable no-unused-vars */
import { FaTimes, FaUserCircle, FaUserTie } from 'react-icons/fa';

const DepartmentHeadModal = ({ isOpen, onClose, onSelect, users, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <FaUserTie className="mr-2 text-primary-600" />
            Select Department Head
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <div className="mb-3">
          <input
            type="text"
            placeholder="Search users..."
            className="input-field"
            onChange={(e) => {
              // You can implement search here if needed
            }}
          />
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No eligible users found in this department
            </div>
          ) : (
            users.map((user) => (
              <button
                key={user._id}
                onClick={() => onSelect(user._id)}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center space-x-3 border border-gray-100 hover:border-primary-200 transition-all"
              >
                <FaUserCircle className="text-gray-400 text-2xl" />
                <div className="flex-1">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      user.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                    <span className="text-xs text-gray-400">ID: {user.employeeId}</span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="mt-4 pt-3 border-t text-sm text-gray-500">
          <p>Only employees and managers from this department are shown.</p>
        </div>
      </div>
    </div>
  );
};

export default DepartmentHeadModal;