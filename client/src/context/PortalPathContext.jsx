/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";

export const PORTAL_PATHS = {
  internal: {
    login: "/login",
    dashboard: "/dashboard",
  },
  candidate: {
    careers: "/careers",
    login: "/candidate/login",
    register: "/candidate/register",
    dashboard: "/candidate/dashboard",
    jobs: "/candidate/jobs",
    applications: "/candidate/applications",
    profile: "/candidate/profile",
  },
  hr: {
    home: "/recruitment/jobs",
  },
  learning: {
    home: "/learning/courses",
  },
  aliases: {
    employeeLogin: "/employee/login",
    managerLogin: "/manager/login",
    adminLogin: "/admin/login",
    portalEmployee: "/portal/employee",
    portalEmployeeLogin: "/portal/employee/login",
    portalEmployeeDashboard: "/portal/employee/dashboard",
    portalHr: "/portal/hr",
    portalLnd: "/portal/lnd",
    portalCandidate: "/portal/candidate",
    portalCandidateLogin: "/portal/candidate/login",
    portalCandidateRegister: "/portal/candidate/register",
    portalCandidateJobs: "/portal/candidate/jobs",
  },
};

const PortalPathContext = createContext(PORTAL_PATHS);

export const PortalPathProvider = ({ children }) => {
  return (
    <PortalPathContext.Provider value={PORTAL_PATHS}>
      {children}
    </PortalPathContext.Provider>
  );
};


export const usePortalPaths = () => useContext(PortalPathContext);
