import { FaTrash } from 'react-icons/fa';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, selectedUser }) => {
  if (!isOpen || !selectedUser) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="text-center">
          <FaTrash className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold mt-2">Delete User</h3>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to delete {selectedUser.name}? This action
            cannot be undone.
          </p>
        </div>

        <div className="flex justify-center space-x-3 mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;