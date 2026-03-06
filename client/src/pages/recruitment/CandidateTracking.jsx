import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { recruitmentService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const initialForm = {
  jobPosting: "",
  name: "",
  email: "",
  phone: "",
  experienceYears: 0,
  source: "direct",
  resumeUrl: "",
};

const CandidateTracking = () => {
  const { isManager } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [stageDraft, setStageDraft] = useState("applied");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [jobsRes, candidatesRes] = await Promise.all([
        recruitmentService.getJobs({ status: "open" }),
        recruitmentService.getCandidates(),
      ]);
      setJobs(jobsRes.data || []);
      setCandidates(candidatesRes.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch candidate data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async () => {
    try {
      await recruitmentService.createCandidate(form);
      toast.success("Candidate added");
      setForm(initialForm);
      setCreateOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to add candidate");
    }
  };

  const handleStageUpdate = async () => {
    if (!activeCandidate?._id) return;
    try {
      await recruitmentService.updateCandidateStage(activeCandidate._id, { stage: stageDraft });
      toast.success("Candidate stage updated");
      setActiveCandidate(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to update stage");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidate Tracking</h1>
          <p className="text-gray-600">Track all candidates and their hiring stage.</p>
        </div>
        {isManager && (
          <Button className="btn-primary" onClick={() => setCreateOpen(true)}>
            Add Candidate
          </Button>
        )}
      </div>

      <div className="card space-y-3">
        {candidates.map((candidate) => (
          <div key={candidate._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{candidate.name}</p>
              <p className="text-sm text-gray-600">{candidate.email} • {candidate.jobPosting?.title || "N/A"} • {candidate.stage}</p>
            </div>
            <Button
              className="btn-secondary"
              onClick={() => {
                setActiveCandidate(candidate);
                setStageDraft(candidate.stage || "applied");
              }}
            >
              Update Stage
            </Button>
          </div>
        ))}
        {!candidates.length && <p className="text-sm text-gray-500">No candidates found.</p>}
      </div>

      <InsightActionModal
        isOpen={createOpen}
        title="Add Candidate"
        submitText="Create"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Job Posting</label>
            <Select value={form.jobPosting} onChange={(e) => setForm({ ...form, jobPosting: e.target.value })} required>
              <Option value="">Select Job Posting</Option>
              {jobs.map((job) => (
                <Option key={job._id} value={job._id}>{job.title} ({job.code})</Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="form-label">Candidate Name</label>
            <Input placeholder="Candidate Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Email</label>
            <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Experience Years</label>
            <Input
              type="number"
              min="0"
              placeholder="Experience Years"
              value={form.experienceYears}
              onChange={(e) => setForm({ ...form, experienceYears: e.target.value === "" ? "" : Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="form-label">Resume URL</label>
            <Input placeholder="Resume URL" value={form.resumeUrl} onChange={(e) => setForm({ ...form, resumeUrl: e.target.value })} />
          </div>
        </div>
      </InsightActionModal>

      <InsightActionModal
        isOpen={!!activeCandidate}
        title="Update Candidate Stage"
        submitText="Update"
        onClose={() => setActiveCandidate(null)}
        onSubmit={handleStageUpdate}
      >
        <Select value={stageDraft} onChange={(e) => setStageDraft(e.target.value)}>
          <Option value="applied">Applied</Option>
          <Option value="screening">Screening</Option>
          <Option value="interview">Interview</Option>
          <Option value="offered">Offered</Option>
          <Option value="onboarding">Onboarding</Option>
          <Option value="hired">Hired</Option>
          <Option value="rejected">Rejected</Option>
        </Select>
      </InsightActionModal>
    </div>
  );
};

export default CandidateTracking;
