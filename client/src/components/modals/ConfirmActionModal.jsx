import { FaExclamationTriangle } from "react-icons/fa";
import { Button } from "@/components/ui";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

const ConfirmActionModal = ({
  isOpen,
  title = "Confirm Action",
  message = "Are you sure you want to continue?",
  confirmText = "Confirm",
  confirmClassName = "bg-primary-600 hover:bg-primary-700",
  loading = false,
  onCancel,
  onConfirm,
}) => {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-white/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="relative p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h3 className="text-lg font-semibold mt-2">{title}</h3>
          <p className="text-sm text-gray-500 mt-2">{message}</p>
        </div>

        <div className="flex justify-center space-x-3 mt-6">
          <Button onClick={onCancel} disabled={loading} className="btn-secondary">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`text-white px-4 py-2 rounded-lg ${confirmClassName}`}
          >
            {loading ? "Please wait..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
