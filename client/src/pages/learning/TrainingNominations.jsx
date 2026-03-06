import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Select, Option, Input } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { learningService, userService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const initialForm = { courseId: "", employeeId: "", remarks: "" };

const TrainingNominations = () => {
  const { isManager } = useAuth();
  const [courses, setCourses] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeNomination, setActiveNomination] = useState(null);
  const [statusDraft, setStatusDraft] = useState("nominated");

  const fetchData = async () => {
    setLoading(true);
    try {
      const tasks = [learningService.getCourses(), learningService.getNominations()];
      if (isManager) tasks.push(userService.getUsers({ limit: 500, role: "employee" }));
      const [coursesRes, nominationsRes, usersRes] = await Promise.all(tasks);
      setCourses(coursesRes.data || []);
      setNominations(nominationsRes.data || []);
      setEmployees(usersRes?.users || []);
    } catch (error) {
      toast.error(error.message || "Failed to load nominations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isManager]);

  const createNomination = async () => {
    try {
      await learningService.createNomination(form);
      toast.success("Nomination created");
      setForm(initialForm);
      setCreateOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to create nomination");
    }
  };

  const updateStatus = async () => {
    if (!activeNomination?._id) return;
    try {
      await learningService.updateNominationStatus(activeNomination._id, { status: statusDraft });
      toast.success("Nomination status updated");
      setActiveNomination(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to update nomination status");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Nominations</h1>
          <p className="text-gray-600">Nominate employees and track nomination status.</p>
        </div>
        {isManager && (
          <Button className="btn-primary" onClick={() => setCreateOpen(true)}>
            Create Nomination
          </Button>
        )}
      </div>

      <div className="card space-y-3">
        {nominations.map((nomination) => (
          <div key={nomination._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{nomination.employee?.name} • {nomination.course?.title}</p>
              <p className="text-sm text-gray-600">{nomination.department}</p>
              <p className="text-xs text-gray-500">Status: {nomination.status}</p>
            </div>
            <Button
              className="btn-secondary"
              onClick={() => {
                setActiveNomination(nomination);
                setStatusDraft(nomination.status || "nominated");
              }}
            >
              Update Status
            </Button>
          </div>
        ))}
        {!nominations.length && <p className="text-sm text-gray-500">No nominations found.</p>}
      </div>

      <InsightActionModal
        isOpen={createOpen}
        title="Create Training Nomination"
        submitText="Create"
        onClose={() => setCreateOpen(false)}
        onSubmit={createNomination}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
            <Option value="">Select Course</Option>
            {courses.map((course) => (
              <Option key={course._id} value={course._id}>{course.title}</Option>
            ))}
          </Select>
          <Select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
            <Option value="">Select Employee</Option>
            {employees.map((employee) => (
              <Option key={employee._id} value={employee._id}>{employee.name}</Option>
            ))}
          </Select>
          <Input className="md:col-span-2" placeholder="Remarks" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} />
        </div>
      </InsightActionModal>

      <InsightActionModal
        isOpen={!!activeNomination}
        title="Update Nomination Status"
        submitText="Update"
        onClose={() => setActiveNomination(null)}
        onSubmit={updateStatus}
      >
        <Select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
          <Option value="nominated">Nominated</Option>
          <Option value="approved">Approved</Option>
          <Option value="rejected">Rejected</Option>
          <Option value="in_progress">In Progress</Option>
          <Option value="completed">Completed</Option>
        </Select>
      </InsightActionModal>
    </div>
  );
};

export default TrainingNominations;
