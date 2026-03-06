import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button } from "@/components/ui";
import { candidatePortalService } from "@/services/api";

const CandidateJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await candidatePortalService.getOpenJobs();
      setJobs(response.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch open jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const apply = async (jobPostingId) => {
    try {
      await candidatePortalService.apply(jobPostingId);
      toast.success("Application submitted");
    } catch (error) {
      toast.error(error.message || "Failed to apply for job");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Open Jobs</h1>
        <p className="text-gray-600">Apply directly from the candidate portal.</p>
      </div>

      <div className="card space-y-3">
        {jobs.map((job) => (
          <div key={job._id} className="border border-gray-200 rounded-lg p-3 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{job.title} <span className="text-xs text-gray-500">({job.code})</span></p>
              <p className="text-sm text-gray-600">{job.department} • {job.location || "N/A"} • {job.employmentType}</p>
              <p className="text-xs text-gray-500 mt-1">{job.description}</p>
            </div>
            <Button className="btn-primary" onClick={() => apply(job._id)}>Apply</Button>
          </div>
        ))}
        {!jobs.length && <p className="text-sm text-gray-500">No open jobs found.</p>}
      </div>
    </div>
  );
};

export default CandidateJobs;
