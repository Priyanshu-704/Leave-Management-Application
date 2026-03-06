import { Navigate } from "react-router-dom";

const CandidateRoute = ({ children }) => {
  const token = localStorage.getItem("candidateToken");

  if (!token) {
    return <Navigate to="/candidate/login" replace />;
  }

  return children;
};

export default CandidateRoute;
