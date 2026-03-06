import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { learningService } from "@/services/api";

const initialForm = {
  courseId: "",
  rating: 5,
  feedback: "",
  recommend: true,
};

const FeedbackForms = () => {
  const [courses, setCourses] = useState([]);
  const [feedbackList, setFeedbackList] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, feedbackRes] = await Promise.all([
        learningService.getCourses(),
        learningService.getFeedback(),
      ]);
      setCourses(coursesRes.data || []);
      setFeedbackList(feedbackRes.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to load feedback data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const submitFeedback = async () => {
    try {
      await learningService.submitFeedback(form);
      toast.success("Feedback submitted");
      setForm(initialForm);
      setCreateOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to submit feedback");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feedback Forms</h1>
          <p className="text-gray-600">Submit and review training feedback.</p>
        </div>
        <Button className="btn-primary" onClick={() => setCreateOpen(true)}>
          Submit Feedback
        </Button>
      </div>

      <div className="card space-y-3">
        {feedbackList.map((item) => (
          <div key={item._id} className="border border-gray-200 rounded-lg p-3">
            <p className="font-semibold text-gray-900">{item.course?.title}</p>
            <p className="text-sm text-gray-600">Rating: {item.rating}/5 • Recommend: {item.recommend ? "Yes" : "No"}</p>
            <p className="text-xs text-gray-500">{item.feedback || "No feedback text"}</p>
          </div>
        ))}
        {!feedbackList.length && <p className="text-sm text-gray-500">No feedback submitted yet.</p>}
      </div>

      <InsightActionModal
        isOpen={createOpen}
        title="Submit Feedback"
        submitText="Submit"
        onClose={() => setCreateOpen(false)}
        onSubmit={submitFeedback}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Course</label>
            <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
              <Option value="">Select Course</Option>
              {courses.map((course) => (
                <Option key={course._id} value={course._id}>{course.title}</Option>
              ))}
            </Select>
          </div>
          <div>
            <label className="form-label">Rating (1-5)</label>
            <Input
              type="number"
              min="1"
              max="5"
              placeholder="Rating"
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value === "" ? "" : Number(e.target.value) })}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Feedback</label>
            <Input className="md:col-span-2" placeholder="Feedback" value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
            <input type="checkbox" checked={!!form.recommend} onChange={(e) => setForm({ ...form, recommend: e.target.checked })} />
            I recommend this training
          </label>
        </div>
      </InsightActionModal>
    </div>
  );
};

export default FeedbackForms;
