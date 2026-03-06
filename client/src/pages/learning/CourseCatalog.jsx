import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { learningService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const initialForm = {
  title: "",
  code: "",
  department: "",
  category: "general",
  mode: "online",
  description: "",
  durationHours: "",
  provider: "In-house",
  courseUrl: "",
  certificationOffered: false,
  quiz: { enabled: false, passingScore: 70, questions: [] },
};

const CourseCatalog = () => {
  const { user, isManager } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await learningService.getCourses();
      setCourses(response.data || []);
      setForm((prev) => ({ ...prev, department: prev.department || user?.department || "" }));
    } catch (error) {
      toast.error(error.message || "Failed to fetch courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const createCourse = async () => {
    try {
      await learningService.createCourse(form);
      toast.success("Course created");
      setForm({ ...initialForm, department: user?.department || "" });
      setCreateOpen(false);
      fetchCourses();
    } catch (error) {
      toast.error(error.message || "Failed to create course");
    }
  };

  const updateCourse = async () => {
    if (!activeCourse?._id) return;
    try {
      await learningService.updateCourse(activeCourse._id, activeCourse);
      toast.success("Course updated");
      setActiveCourse(null);
      fetchCourses();
    } catch (error) {
      toast.error(error.message || "Failed to update course");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Catalog</h1>
          <p className="text-gray-600">Manage online/classroom courses and metadata.</p>
        </div>
        {isManager && (
          <Button className="btn-primary" onClick={() => setCreateOpen(true)}>
            Create Course
          </Button>
        )}
      </div>

      <div className="card space-y-3">
        {courses.map((course) => (
          <div key={course._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{course.title} <span className="text-xs text-gray-500">({course.code})</span></p>
              <p className="text-sm text-gray-600">{course.department} • {course.mode} • {course.durationHours}h</p>
              <p className="text-xs text-gray-500">Quiz: {course.quiz?.enabled ? "Enabled" : "Disabled"} • Certification: {course.certificationOffered ? "Yes" : "No"}</p>
            </div>
            {isManager && (
              <Button className="btn-secondary" onClick={() => setActiveCourse({ ...course })}>
                Update
              </Button>
            )}
          </div>
        ))}
        {!courses.length && <p className="text-sm text-gray-500">No courses found.</p>}
      </div>

      <InsightActionModal
        isOpen={createOpen}
        title="Create Course"
        submitText="Create"
        onClose={() => setCreateOpen(false)}
        onSubmit={createCourse}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Course Title</label>
            <Input placeholder="Course Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Course Code</label>
            <Input placeholder="Course Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Department</label>
            <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Category</label>
            <Input placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Mode</label>
            <Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
              <Option value="online">Online</Option>
              <Option value="classroom">Classroom</Option>
              <Option value="blended">Blended</Option>
            </Select>
          </div>
          <div>
            <label className="form-label">Duration (Hours)</label>
            <Input
              type="number"
              min="1"
              placeholder="Duration (Hours)"
              value={form.durationHours}
              onChange={(e) => setForm({ ...form, durationHours: e.target.value === "" ? "" : Number(e.target.value) })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Description</label>
            <Input className="md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Provider</label>
            <Input placeholder="Provider" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Course URL</label>
            <Input placeholder="Course URL" value={form.courseUrl} onChange={(e) => setForm({ ...form, courseUrl: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!form.certificationOffered}
              onChange={(e) => setForm({ ...form, certificationOffered: e.target.checked })}
            />
            Certification Offered
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!form.quiz?.enabled}
              onChange={(e) => setForm({ ...form, quiz: { ...form.quiz, enabled: e.target.checked } })}
            />
            Enable Quiz/Assessment
          </label>
        </div>
      </InsightActionModal>

      <InsightActionModal
        isOpen={!!activeCourse}
        title="Update Course"
        submitText="Update"
        onClose={() => setActiveCourse(null)}
        onSubmit={updateCourse}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Course Title</label>
            <Input placeholder="Course Title" value={activeCourse?.title || ""} onChange={(e) => setActiveCourse((prev) => ({ ...prev, title: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Course Code</label>
            <Input placeholder="Course Code" value={activeCourse?.code || ""} onChange={(e) => setActiveCourse((prev) => ({ ...prev, code: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Department</label>
            <Input placeholder="Department" value={activeCourse?.department || ""} onChange={(e) => setActiveCourse((prev) => ({ ...prev, department: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Category</label>
            <Input placeholder="Category" value={activeCourse?.category || ""} onChange={(e) => setActiveCourse((prev) => ({ ...prev, category: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Mode</label>
            <Select value={activeCourse?.mode || "online"} onChange={(e) => setActiveCourse((prev) => ({ ...prev, mode: e.target.value }))}>
              <Option value="online">Online</Option>
              <Option value="classroom">Classroom</Option>
              <Option value="blended">Blended</Option>
            </Select>
          </div>
          <div>
            <label className="form-label">Duration (Hours)</label>
            <Input
              type="number"
              min="1"
              placeholder="Duration (Hours)"
              value={activeCourse?.durationHours ?? ""}
              onChange={(e) =>
                setActiveCourse((prev) => ({
                  ...prev,
                  durationHours: e.target.value === "" ? "" : Number(e.target.value),
                }))
              }
            />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Description</label>
            <Input className="md:col-span-2" placeholder="Description" value={activeCourse?.description || ""} onChange={(e) => setActiveCourse((prev) => ({ ...prev, description: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Provider</label>
            <Input placeholder="Provider" value={activeCourse?.provider || ""} onChange={(e) => setActiveCourse((prev) => ({ ...prev, provider: e.target.value }))} />
          </div>
          <div>
            <label className="form-label">Course URL</label>
            <Input placeholder="Course URL" value={activeCourse?.courseUrl || ""} onChange={(e) => setActiveCourse((prev) => ({ ...prev, courseUrl: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!activeCourse?.certificationOffered}
              onChange={(e) => setActiveCourse((prev) => ({ ...prev, certificationOffered: e.target.checked }))}
            />
            Certification Offered
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={!!activeCourse?.quiz?.enabled}
              onChange={(e) => setActiveCourse((prev) => ({ ...prev, quiz: { ...(prev.quiz || {}), enabled: e.target.checked } }))}
            />
            Enable Quiz/Assessment
          </label>
        </div>
      </InsightActionModal>
    </div>
  );
};

export default CourseCatalog;
