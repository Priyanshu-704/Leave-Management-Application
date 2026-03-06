import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { candidatePortalService } from "@/services/api";

const CandidateDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const response = await candidatePortalService.getDashboard();
        setData(response.data);
      } catch (error) {
        toast.error(error.message || "Failed to fetch dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) return <PageSkeleton rows={6} />;

  const metrics = data?.metrics || { openJobs: 0, totalApplications: 0, stageSummary: {} };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Candidate Dashboard</h1>
        <p className="text-gray-600">Track your applications and hiring progress.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card"><p className="text-sm text-gray-600">Open Jobs</p><p className="text-2xl font-bold text-gray-900">{metrics.openJobs}</p></div>
        <div className="card"><p className="text-sm text-gray-600">My Applications</p><p className="text-2xl font-bold text-gray-900">{metrics.totalApplications}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Interviews</p><p className="text-2xl font-bold text-gray-900">{metrics.stageSummary?.interview || 0}</p></div>
        <div className="card"><p className="text-sm text-gray-600">Offers</p><p className="text-2xl font-bold text-gray-900">{metrics.stageSummary?.offered || 0}</p></div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Application Stage Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(metrics.stageSummary || {}).map(([stage, count]) => (
            <div key={stage} className="rounded-lg border border-gray-200 p-3 bg-white">
              <p className="text-xs uppercase text-gray-500">{stage}</p>
              <p className="text-lg font-semibold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
