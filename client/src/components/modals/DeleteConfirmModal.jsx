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
      <div className="relative my-6 mx-auto w-full max-w-md rounded-xl border bg-white p-4 shadow-lg sm:p-5">
        <div className="text-center">
          <FaTrash className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="text-lg font-semibold mt-2">Delete User</h3>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to delete {selectedUser.name}? This action
            cannot be undone.
          </p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={onClose}
            className="btn-secondary w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="w-full rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 sm:w-auto"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
