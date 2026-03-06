import { FaTrash } from 'react-icons/fa';
import { Button } from "@/components/ui";
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, selectedUser }) => {
  useBodyScrollLock(isOpen && !!selectedUser);
  if (!isOpen || !selectedUser) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto flex justify-center items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="text-center">
          <FaTrash className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold mt-2">Delete User</h3>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to delete {selectedUser.name}? This action
            cannot be undone.
          </p>
        </div>

        <div className="flex justify-center space-x-3 mt-6">
          <Button
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
