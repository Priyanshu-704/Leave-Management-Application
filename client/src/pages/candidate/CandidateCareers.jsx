import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import { candidatePortalService } from "@/services/api";
import useDebouncedValue from "@/hooks/useDebouncedValue";

const CandidateCareers = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("candidateToken");

  useEffect(() => {
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

    fetchJobs();
  }, []);

  const apply = async (jobPostingId) => {
    if (!isLoggedIn) {
      navigate("/candidate/login");
      return;
    }

    try {
      await candidatePortalService.apply(jobPostingId);
      toast.success("Application submitted");
    } catch (error) {
      toast.error(error.message || "Failed to apply for job");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  const visibleJobs = jobs.filter((job) => {
    if (!debouncedSearch) return true;
    const searchLower = debouncedSearch.toLowerCase();
    return (
      job.title?.toLowerCase().includes(searchLower) ||
      job.code?.toLowerCase().includes(searchLower) ||
      job.department?.toLowerCase().includes(searchLower) ||
      job.location?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Careers</h1>
            <p className="text-gray-600">Explore open positions and apply online.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/candidate/login" className="btn-secondary px-3 py-2 rounded-md text-sm">Candidate Login</Link>
            <Link to="/candidate/register" className="btn-primary px-3 py-2 rounded-md text-sm">Candidate Register</Link>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search jobs by title, code, department or location"
              className="input-field"
            />
          </div>
          {visibleJobs.map((job) => (
            <div key={job._id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{job.title} <span className="text-xs text-gray-500">({job.code})</span></h2>
                  <p className="text-sm text-gray-600">{job.department} • {job.location || "N/A"} • {job.employmentType}</p>
                  <p className="text-sm text-gray-700 mt-2">{job.description}</p>
                </div>
                <Button className="btn-primary" onClick={() => apply(job._id)}>Apply Now</Button>
              </div>
            </div>
          ))}
        </div>

        {!visibleJobs.length && <p className="text-sm text-gray-500">No open jobs at the moment.</p>}
      </div>
    </div>
  );
};

export default CandidateCareers;
