const LoadingSpinner = ({ fullScreen = false }) => {
  const spinner = (
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  );

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {spinner}
    </div>
  );
};

export default LoadingSpinner;