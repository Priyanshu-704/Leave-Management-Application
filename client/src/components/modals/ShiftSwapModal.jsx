import { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { useAuth } from "../../context/AuthContext";
import { shiftService } from "@/services/api";
import {
  FaTimes,
  FaExchangeAlt,
  FaUserCircle,
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";
import { format } from "date-fns";
import toast from "react-hot-toast";
import ConfirmActionModal from "./ConfirmActionModal";
import useBodyScrollLock from "../../hooks/useBodyScrollLock";

const ShiftSwapModal = ({ shift, onClose, onSuccess }) => {
  useBodyScrollLock(true);
  const { user, isAdmin, isManager } = useAuth();
  const [step, setStep] = useState(1); // 1: select colleague, 2: confirm
  const [colleagues, setColleagues] = useState([]);
  const [selectedColleague, setSelectedColleague] = useState(null);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [targetShift, setTargetShift] = useState(null);
  const [swapDate, setSwapDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [swapRequests, setSwapRequests] = useState([]);
  const [actionConfirm, setActionConfirm] = useState({
    isOpen: false,
    requestId: null,
    status: "",
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCurrentAssignment();
    fetchColleagues();
    fetchSwapRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCurrentAssignment = async () => {
    try {
      const response = await shiftService.getAssignments({
        employee: user?._id,
        shift: shift._id,
        active: true,
      });
      const assignment = response.data?.[0] || null;
      setCurrentAssignment(assignment);
    } catch (error) {
      console.error("Error fetching current assignment:", error);
    }
  };

  const fetchColleagues = async () => {
    try {
      const response = await shiftService.getSwapColleagues(shift._id);
      const colleaguesList = response.data || [];
      setColleagues(colleaguesList);
    } catch (error) {
      console.error("Error fetching colleagues:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch colleagues",
      );
    }
  };

  const fetchSwapRequests = async () => {
    try {
      const response = await shiftService.getSwapRequests();
      setSwapRequests(response.data || []);
    } catch (error) {
      console.error("Error fetching swap requests:", error);
    }
  };

  const handleColleagueSelect = async (colleague) => {
    setSelectedColleague(colleague);

    // Get colleague's current shift
    try {
      const response = await shiftService.getAssignments({
        employee: colleague._id,
        active: true,
      });
      if (response.data.length > 0) {
        setTargetShift(response.data[0].shift);
        setStep(2);
      } else {
        toast.error("Selected colleague has no active shift assignment");
      }
    } catch (error) {
      console.error("Error fetching colleague shift:", error);
      toast.error("Failed to fetch colleague shift");
    }
  };

  const handleSubmit = async () => {
    if (!currentAssignment?._id) {
      toast.error("You are not assigned to this shift");
      return;
    }

    if (!selectedColleague || !targetShift) {
      toast.error("Please select a colleague and target shift");
      return;
    }

    setLoading(true);
    try {
      await shiftService.requestSwap({
        currentAssignmentId: currentAssignment._id,
        targetEmployeeId: selectedColleague._id,
        targetShiftId: targetShift._id,
        swapDate,
        reason,
      });

      toast.success("Swap request sent successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating swap request:", error);
      toast.error(
        error.response?.data?.message || "Failed to create swap request",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRespondToRequest = async (requestId, status) => {
    setActionLoading(true);
    try {
      await shiftService.respondSwapRequest(requestId, {
        status,
        comments: `Request ${status}`,
      });
      toast.success(`Request ${status}`);
      fetchSwapRequests();
      setActionConfirm({ isOpen: false, requestId: null, status: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to respond to request");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
            Pending
          </span>
        );
      case "approved":
        return (
          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-white/40 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative my-6 mx-auto w-full max-w-2xl rounded-xl border bg-white p-4 shadow-lg sm:p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold flex items-center">
            <FaExchangeAlt className="mr-2 text-primary-600" />
            Shift Swap Request
          </h3>
          <Button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FaTimes />
          </Button>
        </div>

        {/* Current Shift Info */}
        <div className="bg-blue-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-blue-700">
            Your current shift:{" "}
            <span className="font-medium">
              {currentAssignment?.shift?.name || shift.name}
            </span>{" "}
            ({currentAssignment?.shift?.startTime || shift.startTime} -{" "}
            {currentAssignment?.shift?.endTime || shift.endTime})
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div
            className={`flex items-center ${step >= 1 ? "text-primary-600" : "text-gray-400"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 1
                  ? "border-primary-600 bg-primary-50"
                  : "border-gray-300"
              }`}
            >
              1
            </div>
            <span className="ml-2 text-sm">Select Colleague</span>
          </div>
          <div
            className={`hidden h-0.5 flex-1 mx-4 sm:block ${step >= 2 ? "bg-primary-600" : "bg-gray-300"}`}
          />
          <div
            className={`flex items-center ${step >= 2 ? "text-primary-600" : "text-gray-400"}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                step >= 2
                  ? "border-primary-600 bg-primary-50"
                  : "border-gray-300"
              }`}
            >
              2
            </div>
            <span className="ml-2 text-sm">Confirm</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {!currentAssignment && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-700">
                  You cannot request a swap because you are not actively assigned to this shift.
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Select a colleague to swap shifts with:
            </p>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {colleagues.map((colleague) => (
                <Button
                  key={colleague._id}
                  onClick={() => handleColleagueSelect(colleague)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <FaUserCircle className="text-gray-400 text-2xl" />
                    <div>
                      <p className="font-medium">{colleague.name}</p>
                      <p className="text-sm text-gray-500">
                        {colleague.employeeId}
                      </p>
                    </div>
                  </div>
                </Button>
              ))}
              {colleagues.length === 0 && (
                <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                  No colleagues available for swap in this department.
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && selectedColleague && targetShift && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-medium text-green-800 mb-2">Swap Details</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Your Shift</p>
                  <p className="font-medium">{shift.name}</p>
                  <p className="text-sm text-gray-600">
                    {shift.startTime} - {shift.endTime}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Target Shift</p>
                  <p className="font-medium">{targetShift.name}</p>
                  <p className="text-sm text-gray-600">
                    {targetShift.startTime} - {targetShift.endTime}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-sm">
                  <span className="font-medium">With:</span>{" "}
                  {selectedColleague.name}
                </p>
              </div>
            </div>

            <div>
              <label className="form-label">Swap Date</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-3 text-gray-400" />
                <Input
                  type="date"
                  value={swapDate}
                  onChange={(e) => setSwapDate(e.target.value)}
                  className="input-field pl-10"
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Reason for Swap (Optional)</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows="3"
                className="input-field"
                placeholder="Explain why you want to swap shifts..."
              />
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <p className="text-xs text-yellow-700 flex items-start">
                <FaInfoCircle className="mr-2 mt-0.5 shrink-0" />
                The swap request will be sent to your manager for approval. Both
                employees will be notified of the decision.
              </p>
            </div>
          </div>
        )}

        {/* Pending Requests */}
        {swapRequests.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <h4 className="font-medium mb-3">Swap Requests</h4>
            <div className="space-y-2">
              {swapRequests.map((request) => (
                <div key={request._id} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Swap with {request.requestedWith?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Date:{" "}
                        {format(
                          new Date(request.requestedDate),
                          "MMM dd, yyyy",
                        )}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                  {(isAdmin || isManager) && request.status === "pending" && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Button
                        onClick={() =>
                          setActionConfirm({
                            isOpen: true,
                            requestId: request._id,
                            status: "approved",
                          })
                        }
                        className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200"
                      >
                        <FaCheckCircle className="inline mr-1" />
                        Approve
                      </Button>
                      <Button
                        onClick={() =>
                          setActionConfirm({
                            isOpen: true,
                            requestId: request._id,
                            status: "rejected",
                          })
                        }
                        className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200"
                      >
                        <FaTimesCircle className="inline mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {step > 1 && (
            <Button
              type="button"
              onClick={() => setStep(1)}
              className="btn-secondary w-full sm:w-auto"
            >
              Back
            </Button>
          )}
          <Button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">
            Cancel
          </Button>
          {step === 2 && (
            <Button
              onClick={handleSubmit}
              disabled={loading || !currentAssignment}
              className="btn-primary w-full sm:w-auto"
            >
              {loading ? "Sending..." : "Send Swap Request"}
            </Button>
          )}
        </div>
      </div>

      <ConfirmActionModal
        isOpen={actionConfirm.isOpen}
        title={
          actionConfirm.status === "approved"
            ? "Approve Swap Request"
            : "Reject Swap Request"
        }
        message={
          actionConfirm.status === "approved"
            ? "Are you sure you want to approve this swap request?"
            : "Are you sure you want to reject this swap request?"
        }
        confirmText={actionConfirm.status === "approved" ? "Approve" : "Reject"}
        confirmClassName={
          actionConfirm.status === "approved"
            ? "bg-green-600 hover:bg-green-700"
            : "bg-red-600 hover:bg-red-700"
        }
        loading={actionLoading}
        onCancel={() =>
          setActionConfirm({ isOpen: false, requestId: null, status: "" })
        }
        onConfirm={() =>
          handleRespondToRequest(actionConfirm.requestId, actionConfirm.status)
        }
      />
    </div>
  );
};

export default ShiftSwapModal;
