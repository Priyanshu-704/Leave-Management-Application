import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { recruitmentService } from "@/services/api";

const ProbationTracking = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [form, setForm] = useState({
    status: "not_started",
    startDate: "",
    endDate: "",
    reviewDate: "",
  });

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await recruitmentService.getCandidates({ stage: "hired" });
      setCandidates(response.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch probation candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const openModal = (candidate) => {
    const probation = candidate.probation || {};
    setActiveCandidate(candidate);
    setForm({
      status: probation.status || "not_started",
      startDate: probation.startDate ? new Date(probation.startDate).toISOString().split("T")[0] : "",
      endDate: probation.endDate ? new Date(probation.endDate).toISOString().split("T")[0] : "",
      reviewDate: probation.reviewDate ? new Date(probation.reviewDate).toISOString().split("T")[0] : "",
    });
  };

  const updateProbation = async () => {
    if (!activeCandidate?._id) return;
    try {
      await recruitmentService.updateProbation(activeCandidate._id, {
        status: form.status,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        reviewDate: form.reviewDate || null,
        remarks: "Updated from probation tracking",
      });
      toast.success("Probation updated");
      setActiveCandidate(null);
      fetchCandidates();
    } catch (error) {
      toast.error(error.message || "Failed to update probation");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Probation Period Tracking</h1>
        <p className="text-gray-600">Track start/end/review dates and probation status for hired candidates.</p>
      </div>

      <div className="card space-y-3">
        {candidates.map((candidate) => {
          const probation = candidate.probation || {};
          return (
            <div key={candidate._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{candidate.name}</p>
                <p className="text-sm text-gray-600">Current Status: {probation.status || "not_started"}</p>
                <p className="text-xs text-gray-500">
                  {probation.startDate ? new Date(probation.startDate).toLocaleDateString() : "-"} to {probation.endDate ? new Date(probation.endDate).toLocaleDateString() : "-"}
                </p>
              </div>
              <Button className="btn-secondary" onClick={() => openModal(candidate)}>
                Update Probation
              </Button>
            </div>
          );
        })}
        {!candidates.length && <p className="text-sm text-gray-500">No hired candidates found.</p>}
      </div>

      <InsightActionModal
        isOpen={!!activeCandidate}
        title="Update Probation"
        submitText="Save"
        onClose={() => setActiveCandidate(null)}
        onSubmit={updateProbation}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <Option value="not_started">Not Started</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="extended">Extended</Option>
            <Option value="completed">Completed</Option>
          </Select>
          <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          <Input type="date" value={form.reviewDate} onChange={(e) => setForm({ ...form, reviewDate: e.target.value })} />
        </div>
      </InsightActionModal>
    </div>
  );
};

export default ProbationTracking;
