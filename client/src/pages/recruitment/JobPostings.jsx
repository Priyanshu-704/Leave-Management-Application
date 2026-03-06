import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { recruitmentService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const initialForm = {
  title: "",
  code: "",
  department: "",
  location: "",
  employmentType: "full_time",
  openings: "",
  description: "",
  skills: "",
  status: "open",
  closingDate: "",
};

const JobPostings = () => {
  const { user, isManager } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [editForm, setEditForm] = useState(null);
  const [statusDraft, setStatusDraft] = useState("open");
  const [activeCreate, setActiveCreate] = useState(false);
  const [activeEditId, setActiveEditId] = useState(null);
  const [activeStatus, setActiveStatus] = useState(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const response = await recruitmentService.getJobs();
      setJobs(response.data || []);
      setForm((prev) => ({ ...prev, department: prev.department || user?.department || "" }));
    } catch (error) {
      toast.error(error.message || "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const normalizePayload = (source) => ({
    ...source,
    openings: Number(source.openings || 1),
    skills: (source.skills || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  });

  const handleCreate = async () => {
    try {
      await recruitmentService.createJob(normalizePayload(form));
      toast.success("Job posting created");
      setActiveCreate(false);
      setForm({ ...initialForm, department: user?.department || "" });
      fetchJobs();
    } catch (error) {
      toast.error(error.message || "Failed to create job posting");
    }
  };

  const openEdit = (job) => {
    setActiveEditId(job._id);
    setEditForm({
      ...job,
      skills: Array.isArray(job.skills) ? job.skills.join(", ") : job.skills || "",
      closingDate: job.closingDate ? new Date(job.closingDate).toISOString().split("T")[0] : "",
    });
  };

  const handleEdit = async () => {
    if (!activeEditId || !editForm) return;
    try {
      await recruitmentService.updateJob(activeEditId, normalizePayload(editForm));
      toast.success("Job posting updated");
      setActiveEditId(null);
      setEditForm(null);
      fetchJobs();
    } catch (error) {
      toast.error(error.message || "Failed to update job posting");
    }
  };

  const handleStatusUpdate = async () => {
    if (!activeStatus?._id) return;
    try {
      await recruitmentService.updateJob(activeStatus._id, { status: statusDraft });
      toast.success("Status updated");
      setActiveStatus(null);
      fetchJobs();
    } catch (error) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const removeJob = async (id) => {
    try {
      await recruitmentService.removeJob(id);
      toast.success("Job posting removed");
      fetchJobs();
    } catch (error) {
      toast.error(error.message || "Failed to delete job posting");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
          <p className="text-gray-600">Create and manage open job positions.</p>
        </div>
        {isManager && (
          <Button className="btn-primary" onClick={() => setActiveCreate(true)}>
            Create Job Posting
          </Button>
        )}
      </div>

      <div className="card space-y-3">
        {jobs.map((job) => (
          <div key={job._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{job.title} <span className="text-xs text-gray-500">({job.code})</span></p>
              <p className="text-sm text-gray-600">{job.department} • {job.location || "N/A"} • {job.openings} openings • {job.status}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button className="btn-secondary" onClick={() => {
                setActiveStatus(job);
                setStatusDraft(job.status || "open");
              }}>
                Update Status
              </Button>
              {isManager && (
                <>
                  <Button className="btn-secondary" onClick={() => openEdit(job)}>Edit</Button>
                  <Button className="btn-danger" onClick={() => removeJob(job._id)}>Delete</Button>
                </>
              )}
            </div>
          </div>
        ))}
        {!jobs.length && <p className="text-sm text-gray-500">No job postings found.</p>}
      </div>

      <InsightActionModal
        isOpen={activeCreate}
        title="Create Job Posting"
        submitText="Create"
        onClose={() => setActiveCreate(false)}
        onSubmit={handleCreate}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Job Title</label>
            <Input placeholder="Job Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Job Code</label>
            <Input placeholder="Job Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Department</label>
            <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Location</label>
            <Input placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Employment Type</label>
            <Select value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
              <Option value="full_time">Full Time</Option>
              <Option value="part_time">Part Time</Option>
              <Option value="contract">Contract</Option>
              <Option value="internship">Internship</Option>
            </Select>
          </div>
          <div>
            <label className="form-label">Openings</label>
            <Input
              type="number"
              min="1"
              placeholder="Openings"
              value={form.openings}
              onChange={(e) => setForm({ ...form, openings: e.target.value === "" ? "" : Number(e.target.value) })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Description</label>
            <Input className="md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Skills</label>
            <Input className="md:col-span-2" placeholder="Skills (comma separated)" value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <Option value="draft">Draft</Option>
              <Option value="open">Open</Option>
              <Option value="on_hold">On Hold</Option>
            </Select>
          </div>
          <div>
            <label className="form-label">Closing Date</label>
            <Input type="date" value={form.closingDate} onChange={(e) => setForm({ ...form, closingDate: e.target.value })} />
          </div>
        </div>
      </InsightActionModal>

      <InsightActionModal
        isOpen={!!activeEditId}
        title="Update Job Posting"
        submitText="Update"
        onClose={() => {
          setActiveEditId(null);
          setEditForm(null);
        }}
        onSubmit={handleEdit}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Job Title</label>
            <Input placeholder="Job Title" value={editForm?.title || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Job Code</label>
            <Input placeholder="Job Code" value={editForm?.code || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, code: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Department</label>
            <Input placeholder="Department" value={editForm?.department || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Location</label>
            <Input placeholder="Location" value={editForm?.location || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Employment Type</label>
            <Select value={editForm?.employmentType || "full_time"} onChange={(e) => setEditForm((prev) => ({ ...prev, employmentType: e.target.value }))}>
              <Option value="full_time">Full Time</Option>
              <Option value="part_time">Part Time</Option>
              <Option value="contract">Contract</Option>
              <Option value="internship">Internship</Option>
            </Select>
          </div>
          <div>
            <label className="form-label">Openings</label>
            <Input
              type="number"
              min="1"
              placeholder="Openings"
              value={editForm?.openings ?? ""}
              onChange={(e) =>
                setEditForm((prev) => ({
                  ...prev,
                  openings: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Description</label>
            <Input className="md:col-span-2" placeholder="Description" value={editForm?.description || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))} required />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Skills</label>
            <Input className="md:col-span-2" placeholder="Skills (comma separated)" value={editForm?.skills || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, skills: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <Select value={editForm?.status || "open"} onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}>
              <Option value="draft">Draft</Option>
              <Option value="open">Open</Option>
              <Option value="on_hold">On Hold</Option>
              <Option value="closed">Closed</Option>
            </Select>
          </div>
          <div>
            <label className="form-label">Closing Date</label>
            <Input type="date" value={editForm?.closingDate || ""} onChange={(e) => setEditForm((prev) => ({ ...prev, closingDate: e.target.value }))} />
          </div>
        </div>
      </InsightActionModal>

      <InsightActionModal
        isOpen={!!activeStatus}
        title="Update Job Status"
        submitText="Update"
        onClose={() => setActiveStatus(null)}
        onSubmit={handleStatusUpdate}
      >
        <Select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
          <Option value="draft">Draft</Option>
          <Option value="open">Open</Option>
          <Option value="on_hold">On Hold</Option>
          <Option value="closed">Closed</Option>
        </Select>
      </InsightActionModal>
    </div>
  );
};

export default JobPostings;
