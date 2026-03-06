import { FaExclamationTriangle } from "react-icons/fa";
import { Button } from "@/components/ui";

const PageErrorState = ({ title = "Failed to load data", message, onRetry }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
    <p className="flex items-center gap-2 font-semibold">
      <FaExclamationTriangle />
      {title}
    </p>
    {message ? <p className="mt-1 text-sm">{message}</p> : null}
    {onRetry ? (
      <Button className="mt-3 bg-red-700 text-white hover:bg-red-800" onClick={onRetry}>
        Retry
      </Button>
    ) : null}
  </div>
);

export default PageErrorState;
