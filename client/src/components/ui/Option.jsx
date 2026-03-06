const Option = ({ className = "", children, ...props }) => {
  return (
    <option className={`bg-white text-gray-900 py-2 ${className}`} {...props}>
      {children}
    </option>
  );
};

export default Option;
