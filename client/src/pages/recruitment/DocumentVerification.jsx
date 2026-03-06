import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { recruitmentService } from "@/services/api";

const DocumentVerification = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [statusDraft, setStatusDraft] = useState("pending");

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

  const updateStatus = async () => {
    if (!activeCandidate?._id) return;
    try {
      await recruitmentService.updateDocumentVerification(activeCandidate._id, {
        status: statusDraft,
        remarks: statusDraft === "verified" ? "All documents verified" : "Updated",
      });
      toast.success("Document verification updated");
      setActiveCandidate(null);
      fetchCandidates();
    } catch (error) {
      toast.error(error.message || "Failed to update document verification");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Document Verification</h1>
        <p className="text-gray-600">Verify candidate documents and track status.</p>
      </div>

      <div className="card space-y-3">
        {candidates.map((candidate) => (
          <div key={candidate._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{candidate.name}</p>
              <p className="text-sm text-gray-600">{candidate.email}</p>
              <p className="text-xs text-gray-500">Status: {candidate.documentVerification?.status || "pending"}</p>
            </div>
            <Button
              className="btn-secondary"
              onClick={() => {
                setActiveCandidate(candidate);
                setStatusDraft(candidate.documentVerification?.status || "pending");
              }}
            >
              Update Status
            </Button>
          </div>
        ))}
        {!candidates.length && <p className="text-sm text-gray-500">No candidates found.</p>}
      </div>

      <InsightActionModal
        isOpen={!!activeCandidate}
        title="Update Document Verification"
        submitText="Update"
        onClose={() => setActiveCandidate(null)}
        onSubmit={updateStatus}
      >
        <Select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
          <Option value="pending">Pending</Option>
          <Option value="in_progress">In Progress</Option>
          <Option value="verified">Verified</Option>
          <Option value="rejected">Rejected</Option>
        </Select>
      </InsightActionModal>
    </div>
  );
};

export default DocumentVerification;
