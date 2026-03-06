import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { learningService } from "@/services/api";

const QuizAssessment = () => {
  const [courses, setCourses] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [answers, setAnswers] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastScore, setLastScore] = useState(null);
  const [submitOpen, setSubmitOpen] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await learningService.getCourses();
      const quizCourses = (response.data || []).filter((course) => course.quiz?.enabled);
      setCourses(quizCourses);
    } catch (error) {
      toast.error(error.message || "Failed to fetch courses for assessment");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const submit = async () => {
    try {
      const parsedAnswers = answers
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => !Number.isNaN(value));

      const response = await learningService.submitAssessment({ courseId, answers: parsedAnswers });
      setLastScore(response.data);
      toast.success("Assessment submitted");
      setAnswers("");
      setSubmitOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to submit assessment");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz / Assessment</h1>
          <p className="text-gray-600">Submit course assessments and track result.</p>
        </div>
        <Button className="btn-primary" onClick={() => setSubmitOpen(true)}>
          Submit Assessment
        </Button>
      </div>

      {lastScore && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Last Attempt</h2>
          <p className="text-sm text-gray-700">Score: <span className="font-semibold">{lastScore.score}%</span></p>
          <p className="text-sm text-gray-700">Result: <span className="font-semibold">{lastScore.passed ? "Passed" : "Failed"}</span></p>
        </div>
      )}

      <InsightActionModal
        isOpen={submitOpen}
        title="Submit Assessment"
        submitText="Submit"
        onClose={() => setSubmitOpen(false)}
        onSubmit={submit}
      >
        <div className="grid grid-cols-1 gap-3">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)} required>
            <Option value="">Select Course</Option>
            {courses.map((course) => (
              <Option key={course._id} value={course._id}>{course.title}</Option>
            ))}
          </Select>
          <Input
            placeholder="Answers as comma-separated option indexes, e.g. 0,2,1"
            value={answers}
            onChange={(e) => setAnswers(e.target.value)}
            required
          />
        </div>
      </InsightActionModal>
    </div>
  );
};

export default QuizAssessment;
