import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { aiService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const initialForms = {
  leavePrediction: { employeeId: "", months: 3 },
  attendanceAnomaly: { employeeId: "", days: 30 },
  churnPrediction: { employeeId: "" },
  smartScheduling: { department: "", startDate: "", endDate: "" },
  chatbot: { query: "" },
  resumeParsing: { resumeText: "" },
  sentiment: { text: "" },
  performancePrediction: { employeeId: "" },
};

const AIInsights = () => {
  const { user, isManager } = useAuth();
  const [activeTab, setActiveTab] = useState("predictive");
  const [modal, setModal] = useState({ key: null, open: false });
  const [forms, setForms] = useState({
    ...initialForms,
    smartScheduling: { ...initialForms.smartScheduling, department: user?.department || "" },
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const featureCards = useMemo(
    () => [
      {
        key: "leavePrediction",
        title: "Leave Prediction",
        subtitle: "Forecast leave demand from historical trends",
        tab: "predictive",
        explanation:
          "Uses historical leave volume to estimate near-term leave demand, useful for workforce capacity planning.",
        run: async () => aiService.leavePrediction(forms.leavePrediction),
      },
      {
        key: "attendanceAnomaly",
        title: "Attendance Anomaly Detection",
        subtitle: "Find unusual attendance patterns",
        tab: "predictive",
        explanation:
          "Scans attendance records for absences, recurring lateness, and unusual low work-hours to flag risky patterns.",
        run: async () => aiService.attendanceAnomalyDetection(forms.attendanceAnomaly),
      },
      {
        key: "churnPrediction",
        title: "Employee Churn Prediction",
        subtitle: "Estimate attrition risk with risk bands",
        tab: "predictive",
        explanation:
          "Combines absence trends, leave behavior, and tenure to estimate potential attrition risk by employee.",
        run: async () => aiService.employeeChurnPrediction(forms.churnPrediction),
      },
      {
        key: "smartScheduling",
        title: "Smart Scheduling",
        subtitle: "Generate department-wise shift suggestions",
        tab: "operations",
        explanation:
          "Recommends shift allocation based on attendance quality and average work behavior for a target period.",
        run: async () => aiService.smartScheduling(forms.smartScheduling),
      },
      {
        key: "chatbot",
        title: "Chatbot for Queries",
        subtitle: "Ask HR/leave/shift related questions",
        tab: "assistant",
        explanation:
          "Internal assistant that answers common leave, attendance, and shift queries using live system context.",
        run: async () => aiService.chatbot(forms.chatbot),
      },
      {
        key: "resumeParsing",
        title: "Resume Parsing",
        subtitle: "Extract structured profile from resume text",
        tab: "talent",
        explanation:
          "Converts raw resume text into structured candidate fields like contact details, experience, and detected skills.",
        run: async () => aiService.resumeParsing(forms.resumeParsing),
      },
      {
        key: "sentiment",
        title: "Sentiment Analysis",
        subtitle: "Analyze feedback sentiment from text",
        tab: "talent",
        explanation:
          "Evaluates text polarity and signal strength to identify positive, neutral, or negative sentiment.",
        run: async () => aiService.sentimentAnalysis(forms.sentiment),
      },
      {
        key: "performancePrediction",
        title: "Performance Prediction",
        subtitle: "Predict employee performance score/band",
        tab: "predictive",
        explanation:
          "Estimates performance score from punctuality, attendance consistency, work-hours, and leave behavior.",
        run: async () => aiService.performancePrediction(forms.performancePrediction),
      },
    ],
    [forms],
  );

  const tabs = [
    {
      key: "predictive",
      label: "Predictive",
      description:
        "Forecast-oriented models for leave demand, attrition, attendance anomalies, and performance outlook.",
    },
    {
      key: "operations",
      label: "Operations",
      description:
        "Operational optimization tools such as smart scheduling recommendations for department workforce planning.",
    },
    {
      key: "assistant",
      label: "Assistant",
      description:
        "Conversational helper for everyday employee and manager queries around leaves, attendance, and shifts.",
    },
    {
      key: "talent",
      label: "Talent",
      description:
        "Talent intelligence tools including resume parsing and sentiment analysis for recruitment and feedback.",
    },
  ];

  const activeTabInfo = tabs.find((tab) => tab.key === activeTab);
  const visibleFeatures = featureCards.filter((feature) => feature.tab === activeTab);

  const openModal = (key) => setModal({ key, open: true });
  const closeModal = () => setModal({ key: null, open: false });

  const executeFeature = async () => {
    if (!modal.key) return;
    setLoading(true);
    try {
      const card = featureCards.find((f) => f.key === modal.key);
      const response = await card.run();
      setResult({ key: modal.key, title: card.title, response });
      toast.success(`${card.title} completed`);
      closeModal();
    } catch (error) {
      toast.error(error.message || "Failed to run insight");
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (key, patch) => {
    setForms((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
  };

  const renderModalBody = () => {
    switch (modal.key) {
      case "leavePrediction":
        return (
          <>
            <Input
              placeholder="Employee ID (optional)"
              value={forms.leavePrediction.employeeId}
              onChange={(e) => updateForm("leavePrediction", { employeeId: e.target.value })}
            />
            <Input
              type="number"
              min="1"
              max="12"
              value={forms.leavePrediction.months}
              onChange={(e) => updateForm("leavePrediction", { months: Number(e.target.value) })}
            />
          </>
        );
      case "attendanceAnomaly":
        return (
          <>
            <Input
              placeholder="Employee ID (optional)"
              value={forms.attendanceAnomaly.employeeId}
              onChange={(e) => updateForm("attendanceAnomaly", { employeeId: e.target.value })}
            />
            <Input
              type="number"
              min="7"
              max="180"
              value={forms.attendanceAnomaly.days}
              onChange={(e) => updateForm("attendanceAnomaly", { days: Number(e.target.value) })}
            />
          </>
        );
      case "churnPrediction":
        return (
          <Input
            placeholder="Employee ID (optional)"
            value={forms.churnPrediction.employeeId}
            onChange={(e) => updateForm("churnPrediction", { employeeId: e.target.value })}
          />
        );
      case "smartScheduling":
        return (
          <>
            <Input
              placeholder="Department"
              value={forms.smartScheduling.department}
              onChange={(e) => updateForm("smartScheduling", { department: e.target.value })}
              required
            />
            <Input
              type="date"
              value={forms.smartScheduling.startDate}
              onChange={(e) => updateForm("smartScheduling", { startDate: e.target.value })}
            />
            <Input
              type="date"
              value={forms.smartScheduling.endDate}
              onChange={(e) => updateForm("smartScheduling", { endDate: e.target.value })}
            />
          </>
        );
      case "chatbot":
        return (
          <Input
            placeholder="Ask a question..."
            value={forms.chatbot.query}
            onChange={(e) => updateForm("chatbot", { query: e.target.value })}
          />
        );
      case "resumeParsing":
        return (
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            rows={8}
            placeholder="Paste resume text here..."
            value={forms.resumeParsing.resumeText}
            onChange={(e) => updateForm("resumeParsing", { resumeText: e.target.value })}
          />
        );
      case "sentiment":
        return (
          <textarea
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-200"
            rows={6}
            placeholder="Paste feedback or text..."
            value={forms.sentiment.text}
            onChange={(e) => updateForm("sentiment", { text: e.target.value })}
          />
        );
      case "performancePrediction":
        return (
          <Input
            placeholder="Employee ID (optional)"
            value={forms.performancePrediction.employeeId}
            onChange={(e) => updateForm("performancePrediction", { employeeId: e.target.value })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">AI Insights</h1>
        <p className="text-gray-600 mt-1">
          Leave prediction, anomaly detection, churn risk, smart scheduling, chatbot, resume parsing, sentiment and performance prediction.
        </p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.key}
              className={`px-3 py-2 rounded-md text-sm ${
                activeTab === tab.key
                  ? "bg-primary-100 text-primary-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-3">{activeTabInfo?.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleFeatures.map((feature) => (
          <div key={feature.key} className="card border border-gray-200">
            <h3 className="font-semibold text-gray-900">{feature.title}</h3>
            <p className="text-sm text-gray-600 mt-1 min-h-[40px]">{feature.subtitle}</p>
            <p className="text-xs text-gray-500 mt-2 min-h-[48px]">{feature.explanation}</p>
            <Button className="btn-primary mt-3 w-full" onClick={() => openModal(feature.key)}>
              Run via Modal
            </Button>
          </div>
        ))}
      </div>

      {result && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Latest Result: {result.title}</h2>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs whitespace-pre-wrap overflow-x-auto">
            {JSON.stringify(result.response, null, 2)}
          </pre>
        </div>
      )}

      <InsightActionModal
        isOpen={modal.open}
        title={featureCards.find((f) => f.key === modal.key)?.title || "Run Insight"}
        description="Provide inputs and submit. All create/update-style interactions in this module are modal-based."
        submitText="Run"
        loading={loading}
        onClose={closeModal}
        onSubmit={executeFeature}
      >
        {renderModalBody()}
      </InsightActionModal>
    </div>
  );
};

export default AIInsights;
