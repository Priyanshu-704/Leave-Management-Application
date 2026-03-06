const BrandLogo = ({
  className = "",
  iconClassName = "h-8 w-8",
  textClassName = "text-xl font-bold",
  showText = true,
  title = "LeaveFlow",
}) => {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <img src="/brand-logo.svg" alt="LeaveFlow logo" className={iconClassName} />
      {showText ? <span className={textClassName}>{title}</span> : null}
    </div>
  );
};

export default BrandLogo;
