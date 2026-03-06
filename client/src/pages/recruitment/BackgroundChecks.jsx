import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { recruitmentService } from "@/services/api";

const BackgroundChecks = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [form, setForm] = useState({ status: "pending", vendor: "Internal" });

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await recruitmentService.getCandidates();
      setCandidates(response.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const openModal = (candidate) => {
    setActiveCandidate(candidate);
    setForm({
      status: candidate.backgroundCheck?.status || "pending",
      vendor: candidate.backgroundCheck?.vendor || "Internal",
    });
  };

  const updateStatus = async () => {
    if (!activeCandidate?._id) return;
    try {
      await recruitmentService.updateBackgroundCheck(activeCandidate._id, {
        status: form.status,
        vendor: form.vendor || "Internal",
        remarks: "Updated from background check page",
      });
      toast.success("Background check updated");
      setActiveCandidate(null);
      fetchCandidates();
    } catch (error) {
      toast.error(error.message || "Failed to update background check");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Background Check Tracking</h1>
        <p className="text-gray-600">Track and update candidate background check status.</p>
      </div>

      <div className="card space-y-3">
        {candidates.map((candidate) => (
          <div key={candidate._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{candidate.name}</p>
              <p className="text-sm text-gray-600">Current: {candidate.backgroundCheck?.status || "pending"}</p>
              <p className="text-xs text-gray-500">Vendor: {candidate.backgroundCheck?.vendor || "N/A"}</p>
            </div>
            <Button className="btn-secondary" onClick={() => openModal(candidate)}>
              Update Check
            </Button>
          </div>
        ))}
        {!candidates.length && <p className="text-sm text-gray-500">No candidates found.</p>}
      </div>

      <InsightActionModal
        isOpen={!!activeCandidate}
        title="Update Background Check"
        submitText="Save"
        onClose={() => setActiveCandidate(null)}
        onSubmit={updateStatus}
      >
        <div className="grid grid-cols-1 gap-3">
          <Input
            placeholder="Vendor"
            value={form.vendor}
            onChange={(e) => setForm({ ...form, vendor: e.target.value })}
          />
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <Option value="pending">Pending</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="clear">Clear</Option>
            <Option value="failed">Failed</Option>
          </Select>
        </div>
      </InsightActionModal>
    </div>
  );
};

export default BackgroundChecks;
