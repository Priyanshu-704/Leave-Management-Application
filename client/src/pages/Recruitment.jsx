/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import { recruitmentService, userService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const defaultJobForm = {
  title: "",
  code: "",
  department: "",
  location: "",
  employmentType: "full_time",
  openings: 1,
  description: "",
  skills: "",
  status: "open",
  closingDate: "",
};

const defaultCandidateForm = {
  jobPosting: "",
  name: "",
  email: "",
  phone: "",
  experienceYears: 0,
  source: "direct",
  resumeUrl: "",
};

const defaultInterviewForm = {
  candidateId: "",
  round: "L1",
  title: "",
  interviewer: "",
  scheduledAt: "",
  durationMinutes: 60,
  mode: "online",
};

const Recruitment = () => {
  const { user, isManager } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({ jobs: 0, candidates: 0, interviews: 0, stageStats: [] });
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [users, setUsers] = useState([]);
  const [jobForm, setJobForm] = useState(defaultJobForm);
  const [candidateForm, setCandidateForm] = useState(defaultCandidateForm);
  const [interviewForm, setInterviewForm] = useState(defaultInterviewForm);

  const canWrite = isManager;

  const stageStatsMap = useMemo(() => {
    const map = {
      applied: 0,
      screening: 0,
      interview: 0,
      offered: 0,
      onboarding: 0,
      hired: 0,
      rejected: 0,
    };

    (summary.stageStats || []).forEach((item) => {
      map[item._id] = item.count;
    });

    return map;
  }, [summary.stageStats]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [summaryRes, jobsRes, candidatesRes, interviewsRes, usersRes] = await Promise.all([
        recruitmentService.getSummary(),
        recruitmentService.getJobs(),
        recruitmentService.getCandidates(),
        recruitmentService.getInterviews(),
        canWrite ? userService.getUsers({ limit: 500 }) : Promise.resolve({ users: [] }),
      ]);

      setSummary(summaryRes.data || { jobs: 0, candidates: 0, interviews: 0, stageStats: [] });
      setJobs(jobsRes.data || []);
      setCandidates(candidatesRes.data || []);
      setInterviews(interviewsRes.data || []);
      setUsers(usersRes.users || []);

      if (!jobForm.department) {
        setJobForm((prev) => ({ ...prev, department: user?.department || "" }));
      }
    } catch (error) {
      toast.error(error.message || "Failed to load recruitment data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      await recruitmentService.createJob(jobForm);
      toast.success("Job posted successfully");
      setJobForm({ ...defaultJobForm, department: user?.department || "" });
      fetchAll();
    } catch (error) {
      toast.error(error.message || "Failed to create job posting");
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    try {
      await recruitmentService.createCandidate(candidateForm);
      toast.success("Candidate added successfully");
      setCandidateForm(defaultCandidateForm);
      fetchAll();
    } catch (error) {
      toast.error(error.message || "Failed to add candidate");
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    try {
      await recruitmentService.scheduleInterview(interviewForm);
      toast.success("Interview scheduled successfully");
      setInterviewForm(defaultInterviewForm);
      fetchAll();
    } catch (error) {
      toast.error(error.message || "Failed to schedule interview");
    }
  };

  const quickUpdateCandidate = async (candidateId, payload, method) => {
    try {
      await method(candidateId, payload);
      toast.success("Candidate updated");
      fetchAll();
    } catch (error) {
      toast.error(error.message || "Update failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
        <p className="text-gray-600 mt-1">
          Job postings, candidate tracking, interviews, offer letters, onboarding, document verification,
          background checks, and probation tracking.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-blue-50 border-blue-100"><p className="text-sm text-blue-700">Job Postings</p><p className="text-2xl font-bold">{summary.jobs}</p></div>
        <div className="card bg-green-50 border-green-100"><p className="text-sm text-green-700">Candidates</p><p className="text-2xl font-bold">{summary.candidates}</p></div>
        <div className="card bg-purple-50 border-purple-100"><p className="text-sm text-purple-700">Interviews</p><p className="text-2xl font-bold">{summary.interviews}</p></div>
        <div className="card bg-amber-50 border-amber-100"><p className="text-sm text-amber-700">Hired</p><p className="text-2xl font-bold">{stageStatsMap.hired || 0}</p></div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Candidate Funnel</h2>
        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {Object.entries(stageStatsMap).map(([stage, count]) => (
            <div key={stage} className="rounded-lg border border-gray-200 p-3 bg-white">
              <p className="text-xs uppercase tracking-wide text-gray-500">{stage}</p>
              <p className="text-xl font-semibold text-gray-900">{count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Job Postings</h2>
          {canWrite && (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" onSubmit={handleCreateJob}>
              <Input placeholder="Title" value={jobForm.title} onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })} required />
              <Input placeholder="Code" value={jobForm.code} onChange={(e) => setJobForm({ ...jobForm, code: e.target.value })} required />
              <Input placeholder="Department" value={jobForm.department} onChange={(e) => setJobForm({ ...jobForm, department: e.target.value })} required />
              <Input placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })} />
              <Select value={jobForm.employmentType} onChange={(e) => setJobForm({ ...jobForm, employmentType: e.target.value })}>
                <Option value="full_time">Full Time</Option>
                <Option value="part_time">Part Time</Option>
                <Option value="contract">Contract</Option>
                <Option value="internship">Internship</Option>
              </Select>
              <Input type="number" min="1" placeholder="Openings" value={jobForm.openings} onChange={(e) => setJobForm({ ...jobForm, openings: Number(e.target.value) })} />
              <Input className="md:col-span-2" placeholder="Description" value={jobForm.description} onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })} required />
              <Input className="md:col-span-2" placeholder="Skills (comma separated)" value={jobForm.skills} onChange={(e) => setJobForm({ ...jobForm, skills: e.target.value })} />
              <Select value={jobForm.status} onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}>
                <Option value="draft">Draft</Option>
                <Option value="open">Open</Option>
                <Option value="on_hold">On Hold</Option>
              </Select>
              <Input type="date" value={jobForm.closingDate} onChange={(e) => setJobForm({ ...jobForm, closingDate: e.target.value })} />
              <Button type="submit" className="btn-primary md:col-span-2">Create Job Posting</Button>
            </form>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {jobs.map((job) => (
              <div key={job._id} className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{job.title} <span className="text-xs text-gray-500">({job.code})</span></p>
                    <p className="text-sm text-gray-600">{job.department} • {job.location || "N/A"} • {job.openings} openings</p>
                  </div>
                  <Select
                    value={job.status}
                    onChange={(e) => quickUpdateCandidate(job._id, { status: e.target.value }, recruitmentService.updateJob)}
                    className="max-w-36"
                  >
                    <Option value="draft">Draft</Option>
                    <Option value="open">Open</Option>
                    <Option value="on_hold">On Hold</Option>
                    <Option value="closed">Closed</Option>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Candidate Tracking</h2>
          {canWrite && (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" onSubmit={handleCreateCandidate}>
              <Select value={candidateForm.jobPosting} onChange={(e) => setCandidateForm({ ...candidateForm, jobPosting: e.target.value })} required>
                <Option value="">Select Job Posting</Option>
                {jobs.map((job) => (
                  <Option key={job._id} value={job._id}>{job.title} ({job.code})</Option>
                ))}
              </Select>
              <Input placeholder="Candidate Name" value={candidateForm.name} onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })} required />
              <Input type="email" placeholder="Email" value={candidateForm.email} onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })} required />
              <Input placeholder="Phone" value={candidateForm.phone} onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })} />
              <Input type="number" min="0" placeholder="Experience (Years)" value={candidateForm.experienceYears} onChange={(e) => setCandidateForm({ ...candidateForm, experienceYears: Number(e.target.value) })} />
              <Input placeholder="Resume URL" value={candidateForm.resumeUrl} onChange={(e) => setCandidateForm({ ...candidateForm, resumeUrl: e.target.value })} />
              <Button type="submit" className="btn-primary md:col-span-2">Add Candidate</Button>
            </form>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {candidates.map((candidate) => (
              <div key={candidate._id} className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{candidate.name}</p>
                    <p className="text-sm text-gray-600">{candidate.email} • {candidate.jobPosting?.title || "N/A"}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Docs: {candidate.documentVerification?.status} • BG: {candidate.backgroundCheck?.status} • Probation: {candidate.probation?.status}
                    </p>
                  </div>
                  <div className="space-y-2 min-w-44">
                    <Select
                      value={candidate.stage}
                      onChange={(e) => quickUpdateCandidate(candidate._id, { stage: e.target.value }, recruitmentService.updateCandidateStage)}
                    >
                      <Option value="applied">Applied</Option>
                      <Option value="screening">Screening</Option>
                      <Option value="interview">Interview</Option>
                      <Option value="offered">Offered</Option>
                      <Option value="onboarding">Onboarding</Option>
                      <Option value="hired">Hired</Option>
                      <Option value="rejected">Rejected</Option>
                    </Select>
                    {canWrite && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button className="btn-secondary text-xs" onClick={() => quickUpdateCandidate(candidate._id, { status: "verified", remarks: "Verified" }, recruitmentService.updateDocumentVerification)}>Verify Docs</Button>
                        <Button className="btn-secondary text-xs" onClick={() => quickUpdateCandidate(candidate._id, { status: "clear", vendor: "Internal", remarks: "Clear" }, recruitmentService.updateBackgroundCheck)}>BG Clear</Button>
                        <Button className="btn-secondary text-xs" onClick={() => quickUpdateCandidate(candidate._id, { ctc: 800000, joiningDate: new Date().toISOString().split("T")[0] }, recruitmentService.generateOffer)}>Generate Offer</Button>
                        <Button className="btn-secondary text-xs" onClick={() => quickUpdateCandidate(candidate._id, { status: "in_progress", startDate: new Date().toISOString().split("T")[0] }, recruitmentService.updateProbation)}>Start Probation</Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Interview Scheduling</h2>
        {canWrite && (
          <form className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4" onSubmit={handleScheduleInterview}>
            <Select value={interviewForm.candidateId} onChange={(e) => setInterviewForm({ ...interviewForm, candidateId: e.target.value })} required>
              <Option value="">Select Candidate</Option>
              {candidates.map((candidate) => (
                <Option key={candidate._id} value={candidate._id}>{candidate.name}</Option>
              ))}
            </Select>
            <Input placeholder="Round (e.g. L1)" value={interviewForm.round} onChange={(e) => setInterviewForm({ ...interviewForm, round: e.target.value })} required />
            <Input placeholder="Title" value={interviewForm.title} onChange={(e) => setInterviewForm({ ...interviewForm, title: e.target.value })} />
            <Select value={interviewForm.interviewer} onChange={(e) => setInterviewForm({ ...interviewForm, interviewer: e.target.value })} required>
              <Option value="">Select Interviewer</Option>
              {users.map((u) => (
                <Option key={u._id} value={u._id}>{u.name} ({u.department})</Option>
              ))}
            </Select>
            <Input type="datetime-local" value={interviewForm.scheduledAt} onChange={(e) => setInterviewForm({ ...interviewForm, scheduledAt: e.target.value })} required />
            <Select value={interviewForm.mode} onChange={(e) => setInterviewForm({ ...interviewForm, mode: e.target.value })}>
              <Option value="online">Online</Option>
              <Option value="offline">Offline</Option>
              <Option value="phone">Phone</Option>
            </Select>
            <Button type="submit" className="btn-primary md:col-span-3">Schedule Interview</Button>
          </form>
        )}

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {interviews.map((interview) => (
            <div key={interview._id} className="rounded-lg border border-gray-200 p-3 bg-white flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{interview.candidate?.name} • {interview.round}</p>
                <p className="text-sm text-gray-600">
                  {new Date(interview.scheduledAt).toLocaleString()} • {interview.mode} • Interviewer: {interview.interviewer?.name}
                </p>
              </div>
              <Select
                value={interview.status}
                onChange={(e) => recruitmentService.updateInterview(interview._id, { status: e.target.value }).then(() => fetchAll())}
                className="max-w-40"
              >
                <Option value="scheduled">Scheduled</Option>
                <Option value="completed">Completed</Option>
                <Option value="rescheduled">Rescheduled</Option>
                <Option value="cancelled">Cancelled</Option>
              </Select>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Recruitment;
