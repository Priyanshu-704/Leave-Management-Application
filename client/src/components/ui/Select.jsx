import { FaChevronDown } from "react-icons/fa";
import { mergeClassNames } from "@/lib/utils";

const Select = ({ className = "", children, errorText = "", ...props }) => {
  return (
    <div className="w-full">
      <div className="relative">
        <select
          className={mergeClassNames(
            "input-field flex h-10 w-full appearance-none items-center justify-between rounded-md border bg-white px-3 py-2 pr-10 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            errorText ? "border-red-500" : "border-gray-300",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-500">
          <FaChevronDown className="h-3 w-3" />
        </span>
      </div>
      <p className="mt-1 text-xs text-red-500">{errorText || ""}</p>
    </div>
  );
};

export default Select;
