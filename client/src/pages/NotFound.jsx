import { Link } from "react-router-dom";
import { FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card max-w-md w-full text-center">
        <FaExclamationTriangle className="mx-auto text-4xl text-amber-500 mb-3" />
        <h1 className="text-2xl font-bold text-gray-900">404</h1>
        <p className="text-gray-600 mt-2">Page not found</p>
        <p className="text-sm text-gray-500 mt-1">
          The page you are looking for does not exist.
        </p>
        <Link to="/dashboard" className="btn-primary mt-5 inline-flex">
          <FaArrowLeft />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
