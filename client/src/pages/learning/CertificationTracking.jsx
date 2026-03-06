import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { learningService, userService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const initialForm = {
  employeeId: "",
  courseId: "",
  name: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
  certificateUrl: "",
};

const CertificationTracking = () => {
  const { isManager } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [courses, setCourses] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeCertification, setActiveCertification] = useState(null);
  const [statusDraft, setStatusDraft] = useState("valid");

  const fetchData = async () => {
    setLoading(true);
    try {
      const tasks = [learningService.getCourses(), learningService.getCertifications()];
      if (isManager) tasks.push(userService.getUsers({ limit: 500, role: "employee" }));
      const [coursesRes, certsRes, usersRes] = await Promise.all(tasks);
      setCourses(coursesRes.data || []);
      setCertifications(certsRes.data || []);
      setEmployees(usersRes?.users || []);
    } catch (error) {
      toast.error(error.message || "Failed to load certification data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isManager]);

  const createCertification = async () => {
    try {
      await learningService.createCertification(form);
      toast.success("Certification added");
      setForm(initialForm);
      setCreateOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to create certification");
    }
  };

  const updateStatus = async () => {
    if (!activeCertification?._id) return;
    try {
      await learningService.updateCertification(activeCertification._id, { status: statusDraft });
      toast.success("Certification status updated");
      setActiveCertification(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to update certification status");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Certification Tracking</h1>
          <p className="text-gray-600">Create and track employee certifications.</p>
        </div>
        {isManager && (
          <Button className="btn-primary" onClick={() => setCreateOpen(true)}>
            Add Certification
          </Button>
        )}
      </div>

      <div className="card space-y-3">
        {certifications.map((certification) => (
          <div key={certification._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{certification.name}</p>
              <p className="text-sm text-gray-600">{certification.employee?.name} • {certification.issuer || "N/A"}</p>
              <p className="text-xs text-gray-500">Status: {certification.status}</p>
            </div>
            <Button
              className="btn-secondary"
              onClick={() => {
                setActiveCertification(certification);
                setStatusDraft(certification.status || "valid");
              }}
            >
              Update Status
            </Button>
          </div>
        ))}
        {!certifications.length && <p className="text-sm text-gray-500">No certifications found.</p>}
      </div>

      <InsightActionModal
        isOpen={createOpen}
        title="Add Certification"
        submitText="Create"
        onClose={() => setCreateOpen(false)}
        onSubmit={createCertification}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} required>
            <Option value="">Select Employee</Option>
            {employees.map((employee) => (
              <Option key={employee._id} value={employee._id}>{employee.name}</Option>
            ))}
          </Select>
          <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
            <Option value="">Related Course (Optional)</Option>
            {courses.map((course) => (
              <Option key={course._id} value={course._id}>{course.title}</Option>
            ))}
          </Select>
          <Input placeholder="Certification Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input placeholder="Issuer" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
          <Input type="date" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} required />
          <Input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
          <Input className="md:col-span-2" placeholder="Certificate URL" value={form.certificateUrl} onChange={(e) => setForm({ ...form, certificateUrl: e.target.value })} />
        </div>
      </InsightActionModal>

      <InsightActionModal
        isOpen={!!activeCertification}
        title="Update Certification Status"
        submitText="Update"
        onClose={() => setActiveCertification(null)}
        onSubmit={updateStatus}
      >
        <Select value={statusDraft} onChange={(e) => setStatusDraft(e.target.value)}>
          <Option value="valid">Valid</Option>
          <Option value="expired">Expired</Option>
          <Option value="renewal_due">Renewal Due</Option>
          <Option value="revoked">Revoked</Option>
        </Select>
      </InsightActionModal>
    </div>
  );
};

export default CertificationTracking;
