import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-red-700">Unauthorized Access</h1>
        <p className="mt-3 text-gray-600">
          You do not have permission to access this page based on your role/designation.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-6 rounded-md bg-primary-600 px-4 py-2 text-white"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;
