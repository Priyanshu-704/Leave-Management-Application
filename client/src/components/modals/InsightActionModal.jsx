import { Button } from "@/components/ui";
import useBodyScrollLock from "@/hooks/useBodyScrollLock";

const InsightActionModal = ({
  isOpen,
  title,
  description,
  children,
  submitText = "Run",
  loading = false,
  onClose,
  onSubmit,
}) => {
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] bg-white/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
        </div>
        <div className="px-5 py-4 space-y-3">{children}</div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
          <Button className="btn-secondary" disabled={loading} onClick={onClose}>
            Cancel
          </Button>
          <Button className="btn-primary" disabled={loading} onClick={onSubmit}>
            {loading ? "Please wait..." : submitText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InsightActionModal;
