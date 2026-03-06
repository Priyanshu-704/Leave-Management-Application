import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { learningService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const initialForm = {
  name: "",
  department: "",
  description: "",
  courses: "",
};

const LearningPaths = () => {
  const { user, isManager } = useAuth();
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [activePath, setActivePath] = useState(null);

  const fetchPaths = async () => {
    setLoading(true);
    try {
      const response = await learningService.getLearningPaths();
      setPaths(response.data || []);
      setForm((prev) => ({ ...prev, department: prev.department || user?.department || "" }));
    } catch (error) {
      toast.error(error.message || "Failed to fetch learning paths");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaths();
  }, []);

  const parseCourses = (value) =>
    (value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

  const createPath = async () => {
    try {
      await learningService.createLearningPath({
        name: form.name,
        department: form.department,
        description: form.description,
        courses: parseCourses(form.courses),
        targetRoles: ["employee", "manager"],
      });

      toast.success("Learning path created");
      setForm({ ...initialForm, department: user?.department || "" });
      setCreateOpen(false);
      fetchPaths();
    } catch (error) {
      toast.error(error.message || "Failed to create learning path");
    }
  };

  const updatePath = async () => {
    if (!activePath?._id) return;
    try {
      await learningService.updateLearningPath(activePath._id, {
        name: activePath.name,
        department: activePath.department,
        description: activePath.description,
        courses: parseCourses(activePath.coursesText),
      });
      toast.success("Learning path updated");
      setActivePath(null);
      fetchPaths();
    } catch (error) {
      toast.error(error.message || "Failed to update learning path");
    }
  };

  const enroll = async (id) => {
    try {
      await learningService.enrollInPath(id, {});
      toast.success("Enrolled in learning path");
      fetchPaths();
    } catch (error) {
      toast.error(error.message || "Failed to enroll in learning path");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Paths</h1>
          <p className="text-gray-600">Build and enroll in structured learning paths.</p>
        </div>
        {isManager && (
          <Button className="btn-primary" onClick={() => setCreateOpen(true)}>
            Create Learning Path
          </Button>
        )}
      </div>

      <div className="card space-y-3">
        {paths.map((path) => (
          <div key={path._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{path.name}</p>
              <p className="text-sm text-gray-600">{path.department} • {path.courses?.length || 0} courses</p>
            </div>
            <div className="flex items-center gap-2">
              {isManager && (
                <Button
                  className="btn-secondary"
                  onClick={() => setActivePath({
                    ...path,
                    coursesText: (path.courses || []).map((course) => (typeof course === "string" ? course : course?._id)).filter(Boolean).join(", "),
                  })}
                >
                  Update
                </Button>
              )}
              <Button className="btn-secondary" onClick={() => enroll(path._id)}>Enroll</Button>
            </div>
          </div>
        ))}
        {!paths.length && <p className="text-sm text-gray-500">No learning paths found.</p>}
      </div>

      <InsightActionModal
        isOpen={createOpen}
        title="Create Learning Path"
        submitText="Create"
        onClose={() => setCreateOpen(false)}
        onSubmit={createPath}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Path Name</label>
            <Input placeholder="Path Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">Department</label>
            <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Description</label>
            <Input className="md:col-span-2" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Course IDs</label>
            <Input className="md:col-span-2" placeholder="Course IDs (comma separated)" value={form.courses} onChange={(e) => setForm({ ...form, courses: e.target.value })} />
          </div>
        </div>
      </InsightActionModal>

      <InsightActionModal
        isOpen={!!activePath}
        title="Update Learning Path"
        submitText="Update"
        onClose={() => setActivePath(null)}
        onSubmit={updatePath}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="form-label">Path Name</label>
            <Input placeholder="Path Name" value={activePath?.name || ""} onChange={(e) => setActivePath((prev) => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div>
            <label className="form-label">Department</label>
            <Input placeholder="Department" value={activePath?.department || ""} onChange={(e) => setActivePath((prev) => ({ ...prev, department: e.target.value }))} required />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Description</label>
            <Input className="md:col-span-2" placeholder="Description" value={activePath?.description || ""} onChange={(e) => setActivePath((prev) => ({ ...prev, description: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="form-label">Course IDs</label>
            <Input className="md:col-span-2" placeholder="Course IDs (comma separated)" value={activePath?.coursesText || ""} onChange={(e) => setActivePath((prev) => ({ ...prev, coursesText: e.target.value }))} />
          </div>
        </div>
      </InsightActionModal>
    </div>
  );
};

export default LearningPaths;
