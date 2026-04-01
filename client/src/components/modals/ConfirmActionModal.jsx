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
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto bg-white/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div className="relative w-full max-w-md rounded-xl border bg-white p-4 shadow-lg sm:p-5">
        <div className="text-center">
          <FaExclamationTriangle className="mx-auto h-12 w-12 text-amber-500" />
          <h3 className="text-lg font-semibold mt-2">{title}</h3>
          <p className="text-sm text-gray-500 mt-2">{message}</p>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onCancel} disabled={loading} className="btn-secondary w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`w-full rounded-lg px-4 py-2 text-white sm:w-auto ${confirmClassName}`}
          >
            {loading ? "Please wait..." : confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
