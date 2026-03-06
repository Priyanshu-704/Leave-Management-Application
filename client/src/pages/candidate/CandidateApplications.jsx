import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { candidatePortalService } from "@/services/api";

const CandidateApplications = () => {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      try {
        const response = await candidatePortalService.getApplications();
        setApplications(response.data || []);
        setStats(response.stats || {});
      } catch (error) {
        toast.error(error.message || "Failed to fetch applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
        <p className="text-gray-600">View all applications and their current stage.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="card"><p className="text-xs text-gray-500">Total</p><p className="text-xl font-bold">{stats.total || 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Applied</p><p className="text-xl font-bold">{stats.applied || 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Interview</p><p className="text-xl font-bold">{stats.interview || 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Offered</p><p className="text-xl font-bold">{stats.offered || 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Hired</p><p className="text-xl font-bold">{stats.hired || 0}</p></div>
        <div className="card"><p className="text-xs text-gray-500">Rejected</p><p className="text-xl font-bold">{stats.rejected || 0}</p></div>
      </div>

      <div className="card space-y-3">
        {applications.map((application) => (
          <div key={application._id} className="border border-gray-200 rounded-lg p-3">
            <p className="font-semibold text-gray-900">{application.jobPosting?.title} <span className="text-xs text-gray-500">({application.jobPosting?.code})</span></p>
            <p className="text-sm text-gray-600">Department: {application.department}</p>
            <p className="text-sm text-gray-700">Stage: <span className="font-semibold capitalize">{application.stage}</span></p>
            <p className="text-xs text-gray-500">Applied on: {new Date(application.createdAt).toLocaleDateString()}</p>
          </div>
        ))}
        {!applications.length && <p className="text-sm text-gray-500">No applications submitted yet.</p>}
      </div>
    </div>
  );
};

export default CandidateApplications;
