const Input = ({
  className = "",
  type = "text",
  placeholder,
  preserveZero = false,
  value,
  max,
  ...props
}) => {
  const compactTypes = new Set([
    "checkbox",
    "radio",
    "file",
    "color",
    "range",
    "hidden",
  ]);

  const baseClass = compactTypes.has(type)
    ? className
    : `input-field rounded-lg border border-gray-300 bg-white/95 px-3 py-2 text-gray-900 shadow-sm focus:border-primary-400 focus:ring-2 focus:ring-primary-200 ${className}`;

  const normalizedValue =
    type === "number" && !preserveZero && (value === 0 || value === "0")
      ? ""
      : value;

  const resolvedMax =
    max ??
    (type === "date"
      ? "9999-12-31"
      : type === "datetime-local"
        ? "9999-12-31T23:59"
        : undefined);

  const valueProps = value !== undefined ? { value: normalizedValue } : {};

  return (
    <input
      type={type}
      className={baseClass}
      placeholder={placeholder ?? (compactTypes.has(type) ? undefined : "Enter value")}
      max={resolvedMax}
      {...props}
      {...valueProps}
    />
  );
};

export default Input;
