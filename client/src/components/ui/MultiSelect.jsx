import { useMemo, useState } from "react";
import Select from "./Select";
import Option from "./Option";

const MultiSelect = ({
  options = [],
  values = [],
  onChange,
  placeholder = "Select option",
  summaryLabel = "Selected",
}) => {
  const [pendingValue, setPendingValue] = useState("");

  const selectedSet = useMemo(() => new Set(values), [values]);
  const selectedItems = useMemo(
    () => options.filter((item) => selectedSet.has(item.value)),
    [options, selectedSet],
  );

  const addValue = (value) => {
    if (!value) return;
    if (selectedSet.has(value)) {
      setPendingValue("");
      return;
    }
    onChange([...(values || []), value]);
    setPendingValue("");
  };

  const removeValue = (value) => {
    onChange((values || []).filter((item) => item !== value));
  };

  const clearAll = () => {
    onChange([]);
    setPendingValue("");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Select
            value={pendingValue}
            onChange={(e) => {
              const value = e.target.value;
              setPendingValue(value);
              addValue(value);
            }}
          >
            <Option value="">{placeholder}</Option>
            {options.map((item) => (
              <Option key={item.value} value={item.value}>
                {item.label}
              </Option>
            ))}
          </Select>
        </div>
        {values.length > 0 && (
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={clearAll}
          >
            Clear
          </button>
        )}
      </div>

      <div className="rounded-md border border-gray-200 bg-gray-50 p-2">
        <p className="text-xs text-gray-600">
          {summaryLabel}: {selectedItems.length}
        </p>
        {selectedItems.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedItems.map((item) => (
              <span
                key={item.value}
                className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs text-primary-700"
              >
                {item.label}
                <button
                  type="button"
                  className="text-primary-700"
                  onClick={() => removeValue(item.value)}
                  aria-label={`Remove ${item.label}`}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-xs text-gray-500">No items selected yet.</p>
        )}
      </div>
    </div>
  );
};

export default MultiSelect;
