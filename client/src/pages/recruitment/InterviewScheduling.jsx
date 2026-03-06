import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { recruitmentService, userService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const initialForm = {
  candidateId: "",
  round: "L1",
  title: "",
  interviewer: "",
  scheduledAt: "",
  durationMinutes: 60,
  mode: "online",
};

const InterviewScheduling = () => {
  const { isManager } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [users, setUsers] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeInterview, setActiveInterview] = useState(null);
  const [statusDraft, setStatusDraft] = useState("scheduled");

  const fetchData = async () => {
    setLoading(true);
    try {
      const tasks = [recruitmentService.getCandidates(), recruitmentService.getInterviews()];
      if (isManager) tasks.push(userService.getUsers({ limit: 500 }));
      const [candidatesRes, interviewsRes, usersRes] = await Promise.all(tasks);
      setCandidates(candidatesRes.data || []);
      setInterviews(interviewsRes.data || []);
      setUsers(usersRes?.users || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch interview data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isManager]);

  const schedule = async () => {
    try {
      await recruitmentService.scheduleInterview(form);
      toast.success("Interview scheduled");
      setForm(initialForm);
      setCreateOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to schedule interview");
    }
  };

  const updateStatus = async () => {
    if (!activeInterview?._id) return;
    try {
      await recruitmentService.updateInterview(activeInterview._id, { status: statusDraft });
      toast.success("Interview updated");
      setActiveInterview(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to update interview");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Interview Scheduling</h1>
          <p className="text-gray-600">Schedule and manage interview rounds.</p>
        </div>
        {isManager && (
          <Button className="btn-primary" onClick={() => setCreateOpen(true)}>
            Schedule Interview
          </Button>
        )}
      </div>

      <div className="card space-y-3">
        {interviews.map((interview) => (
          <div key={interview._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{interview.candidate?.name} • {interview.round}</p>
              <p className="text-sm text-gray-600">{new Date(interview.scheduledAt).toLocaleString()} • {interview.mode} • {interview.interviewer?.name}</p>
              <p className="text-xs text-gray-500">Status: {interview.status}</p>
            </div>
            <Button
              className="btn-secondary"
              onClick={() => {
                setActiveInterview(interview);
                setStatusDraft(interview.status || "scheduled");
              }}
            >
              Update Status
            </Button>
          </div>
        ))}
        {!interviews.length && <p className="text-sm text-gray-500">No interviews scheduled.</p>}
      </div>

      <InsightActionModal
        isOpen={createOpen}
        title="Schedule Interview"
        submitText="Schedule"
        onClose={() => setCreateOpen(false)}
        onSubmit={schedule}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.candidateId} onChange={(e) => setForm({ ...form, candidateId: e.target.value })} required>
            <Option value="">Select Candidate</Option>
            {candidates.map((c) => (
              <Option key={c._id} value={c._id}>{c.name}</Option>
            ))}
          </Select>
          <Input placeholder="Round" value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} required />
          <Input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.interviewer} onChange={(e) => setForm({ ...form, interviewer: e.target.value })} required>
            <Option value="">Select Interviewer</Option>
            {users.map((u) => (
              <Option key={u._id} value={u._id}>{u.name} ({u.department})</Option>
            ))}
          </Select>
          <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} required />
          <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
            <Option value="online">Online</Option>
            <Option value="offline">Offline</Option>
            <Option value="phone">Phone</Option>
          </Select>
        </div>
      </InsightActionModal>

      <InsightActionModal
        isOpen={!!activeInterview}
        title="Update Interview Status"
        submitText="Update"
        onClose={() => setActiveInterview(null)}
        onSubmit={updateStatus}
      >
        <Select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
          <Option value="scheduled">Scheduled</Option>
          <Option value="completed">Completed</Option>
          <Option value="rescheduled">Rescheduled</Option>
          <Option value="cancelled">Cancelled</Option>
        </Select>
      </InsightActionModal>
    </div>
  );
};

export default InterviewScheduling;
