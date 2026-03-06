import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { recruitmentService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const OnboardingChecklist = () => {
  const { isManager } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [draftChecklist, setDraftChecklist] = useState([]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const response = await recruitmentService.getCandidates({ stage: "onboarding" });
      setCandidates(response.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch onboarding candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const openUpdateModal = (candidate) => {
    setActiveCandidate(candidate);
    setDraftChecklist(candidate.onboardingChecklist || []);
  };

  const saveChecklist = async () => {
    if (!activeCandidate?._id) return;
    try {
      await recruitmentService.updateOnboarding(activeCandidate._id, { checklist: draftChecklist });
      toast.success("Onboarding checklist updated");
      setActiveCandidate(null);
      fetchCandidates();
    } catch (error) {
      toast.error(error.message || "Failed to update onboarding checklist");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Onboarding Checklist</h1>
        <p className="text-gray-600">Track onboarding tasks per candidate.</p>
      </div>

      <div className="card space-y-4">
        {candidates.map((candidate) => (
          <div key={candidate._id} className="border border-gray-200 rounded-lg p-3">
            <p className="font-semibold text-gray-900 mb-2">{candidate.name}</p>
            <div className="space-y-2">
              {(candidate.onboardingChecklist || []).map((item) => (
                <div key={`${candidate._id}-${item.item}`} className="flex items-center justify-between gap-3">
                  <p className={`text-sm ${item.completed ? "text-green-700" : "text-gray-700"}`}>{item.item}</p>
                  <p className="text-xs text-gray-500">{item.completed ? "Done" : "Pending"}</p>
                </div>
              ))}
            </div>
            {isManager && (
              <Button className="btn-secondary mt-3" onClick={() => openUpdateModal(candidate)}>
                Update Checklist
              </Button>
            )}
          </div>
        ))}
        {!candidates.length && <p className="text-sm text-gray-500">No onboarding candidates found.</p>}
      </div>

      <InsightActionModal
        isOpen={!!activeCandidate}
        title="Update Onboarding Checklist"
        submitText="Save"
        onClose={() => setActiveCandidate(null)}
        onSubmit={saveChecklist}
      >
        <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
          {draftChecklist.map((item, index) => (
            <label key={`${item.item}-${index}`} className="flex items-center gap-2 text-sm text-gray-700">
              <Input
                type="checkbox"
                checked={!!item.completed}
                onChange={(e) => {
                  const next = [...draftChecklist];
                  next[index] = { ...next[index], completed: e.target.checked };
                  setDraftChecklist(next);
                }}
              />
              <span>{item.item}</span>
            </label>
          ))}
          {!draftChecklist.length && <p className="text-sm text-gray-500">No checklist items available.</p>}
        </div>
      </InsightActionModal>
    </div>
  );
};

export default OnboardingChecklist;
