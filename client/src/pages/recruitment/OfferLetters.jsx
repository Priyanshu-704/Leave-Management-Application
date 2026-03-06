import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { recruitmentService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const OfferLetters = () => {
  const { isManager } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCandidate, setActiveCandidate] = useState(null);
  const [offerForm, setOfferForm] = useState({ ctc: "", joiningDate: "" });

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

  const openOfferModal = (candidate) => {
    setActiveCandidate(candidate);
    setOfferForm({
      ctc: candidate.offer?.ctc ?? "",
      joiningDate: candidate.offer?.joiningDate
        ? new Date(candidate.offer.joiningDate).toISOString().split("T")[0]
        : "",
    });
  };

  const generateOffer = async () => {
    if (!activeCandidate?._id) return;
    try {
      await recruitmentService.generateOffer(activeCandidate._id, {
        ctc: Number(offerForm.ctc || 0),
        joiningDate: offerForm.joiningDate || null,
      });
      toast.success("Offer letter generated");
      setActiveCandidate(null);
      fetchCandidates();
    } catch (error) {
      toast.error(error.message || "Failed to generate offer letter");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  const offeredCandidates = candidates.filter((c) => ["offered", "onboarding", "hired"].includes(c.stage));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Offer Letter Generation</h1>
        <p className="text-gray-600">Generate and track offer letters for selected candidates.</p>
      </div>

      <div className="card space-y-3">
        {offeredCandidates.map((candidate) => (
          <div key={candidate._id} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <p className="font-semibold text-gray-900">{candidate.name}</p>
            <p className="text-sm text-gray-600">{candidate.email} • Stage: {candidate.stage}</p>
            {isManager && (
              <Button className="btn-primary" onClick={() => openOfferModal(candidate)}>
                Generate / Update Offer
              </Button>
            )}
            {candidate.offer?.letterText && (
              <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs whitespace-pre-wrap text-gray-700">
                {candidate.offer.letterText}
              </pre>
            )}
          </div>
        ))}
        {!offeredCandidates.length && <p className="text-sm text-gray-500">No candidates in offer/onboarding/hired stage.</p>}
      </div>

      <InsightActionModal
        isOpen={!!activeCandidate}
        title="Generate Offer Letter"
        submitText="Save Offer"
        onClose={() => setActiveCandidate(null)}
        onSubmit={generateOffer}
      >
        <div className="grid grid-cols-1 gap-3">
          <Input
            type="number"
            placeholder="CTC"
            value={offerForm.ctc}
            onChange={(e) => setOfferForm({ ...offerForm, ctc: e.target.value })}
          />
          <Input
            type="date"
            value={offerForm.joiningDate}
            onChange={(e) => setOfferForm({ ...offerForm, joiningDate: e.target.value })}
          />
        </div>
      </InsightActionModal>
    </div>
  );
};

export default OfferLetters;
