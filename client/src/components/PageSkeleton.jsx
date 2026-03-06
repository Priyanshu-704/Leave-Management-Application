const PageSkeleton = ({
  title = true,
  stats = 0,
  rows = 4,
  className = "",
}) => {
  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {title && (
        <div className="space-y-2">
          <div className="skeleton-shimmer h-8 w-64 rounded-lg" />
          <div className="skeleton-shimmer h-4 w-96 max-w-full rounded" />
        </div>
      )}

      {stats > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: stats }).map((_, index) => (
            <div key={`stat-${index}`} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="skeleton-shimmer h-3 w-24 rounded" />
              <div className="skeleton-shimmer mt-3 h-7 w-20 rounded" />
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 md:p-6">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={`row-${index}`} className="skeleton-shimmer h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageSkeleton;
