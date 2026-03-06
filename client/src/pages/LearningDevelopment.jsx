/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import { learningService, userService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const defaultCourseForm = {
  title: "",
  code: "",
  department: "",
  category: "general",
  mode: "online",
  description: "",
  durationHours: 1,
  provider: "In-house",
  courseUrl: "",
  certificationOffered: false,
};

const defaultNominationForm = {
  courseId: "",
  employeeId: "",
  remarks: "",
};

const defaultCalendarForm = {
  title: "",
  courseId: "",
  department: "",
  startDate: "",
  endDate: "",
  venue: "",
  trainer: "",
};

const defaultCertificationForm = {
  employeeId: "",
  courseId: "",
  name: "",
  issuer: "",
  issueDate: "",
  expiryDate: "",
  certificateUrl: "",
};

const defaultPathForm = {
  name: "",
  department: "",
  description: "",
  courses: "",
};

const LearningDevelopment = () => {
  const { user, isManager } = useAuth();
  const canWrite = isManager;

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    courses: 0,
    nominations: 0,
    certifications: 0,
    calendarEvents: 0,
    learningPaths: 0,
    nominationByStatus: [],
  });
  const [courses, setCourses] = useState([]);
  const [nominations, setNominations] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [learningPaths, setLearningPaths] = useState([]);
  const [users, setUsers] = useState([]);

  const [courseForm, setCourseForm] = useState(defaultCourseForm);
  const [nominationForm, setNominationForm] = useState(defaultNominationForm);
  const [calendarForm, setCalendarForm] = useState(defaultCalendarForm);
  const [certificationForm, setCertificationForm] = useState(defaultCertificationForm);
  const [pathForm, setPathForm] = useState(defaultPathForm);
  const [feedbackForm, setFeedbackForm] = useState({ courseId: "", rating: 5, feedback: "", recommend: true });
  const [assessmentForm, setAssessmentForm] = useState({ courseId: "", answers: "" });

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        summaryRes,
        coursesRes,
        nominationsRes,
        calendarRes,
        certificationsRes,
        pathsRes,
        usersRes,
      ] = await Promise.all([
        learningService.getSummary(),
        learningService.getCourses(),
        learningService.getNominations(),
        learningService.getCalendar(),
        learningService.getCertifications(),
        learningService.getLearningPaths(),
        canWrite ? userService.getUsers({ limit: 500 }) : Promise.resolve({ users: [] }),
      ]);

      setSummary(summaryRes.data || summary);
      setCourses(coursesRes.data || []);
      setNominations(nominationsRes.data || []);
      setCalendarEvents(calendarRes.data || []);
      setCertifications(certificationsRes.data || []);
      setLearningPaths(pathsRes.data || []);
      setUsers(usersRes.users || []);

      setCourseForm((prev) => ({ ...prev, department: prev.department || user?.department || "" }));
      setCalendarForm((prev) => ({ ...prev, department: prev.department || user?.department || "" }));
      setPathForm((prev) => ({ ...prev, department: prev.department || user?.department || "" }));
    } catch (error) {
      toast.error(error.message || "Failed to load learning data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onSubmit = async (handler, payload, successMessage, resetter) => {
    try {
      await handler(payload);
      toast.success(successMessage);
      if (resetter) resetter();
      fetchAll();
    } catch (error) {
      toast.error(error.message || "Request failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Learning & Development</h1>
        <p className="text-gray-600 mt-1">
          Course catalog, training nominations, online courses, certifications, calendar, feedback,
          assessments, and learning paths.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="card bg-blue-50 border-blue-100"><p className="text-sm text-blue-700">Courses</p><p className="text-2xl font-bold">{summary.courses}</p></div>
        <div className="card bg-green-50 border-green-100"><p className="text-sm text-green-700">Nominations</p><p className="text-2xl font-bold">{summary.nominations}</p></div>
        <div className="card bg-purple-50 border-purple-100"><p className="text-sm text-purple-700">Calendar</p><p className="text-2xl font-bold">{summary.calendarEvents}</p></div>
        <div className="card bg-amber-50 border-amber-100"><p className="text-sm text-amber-700">Certifications</p><p className="text-2xl font-bold">{summary.certifications}</p></div>
        <div className="card bg-rose-50 border-rose-100"><p className="text-sm text-rose-700">Learning Paths</p><p className="text-2xl font-bold">{summary.learningPaths}</p></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Course Catalog</h2>
          {canWrite && (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" onSubmit={(e) => {
              e.preventDefault();
              onSubmit(learningService.createCourse, courseForm, "Course created", () =>
                setCourseForm({ ...defaultCourseForm, department: user?.department || "" }),
              );
            }}>
              <Input placeholder="Course Title" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} required />
              <Input placeholder="Course Code" value={courseForm.code} onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })} required />
              <Input placeholder="Department" value={courseForm.department} onChange={(e) => setCourseForm({ ...courseForm, department: e.target.value })} required />
              <Input placeholder="Category" value={courseForm.category} onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })} />
              <Select value={courseForm.mode} onChange={(e) => setCourseForm({ ...courseForm, mode: e.target.value })}>
                <Option value="online">Online</Option>
                <Option value="classroom">Classroom</Option>
                <Option value="blended">Blended</Option>
              </Select>
              <Input type="number" min="1" value={courseForm.durationHours} onChange={(e) => setCourseForm({ ...courseForm, durationHours: Number(e.target.value) })} />
              <Input className="md:col-span-2" placeholder="Description" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} required />
              <Input placeholder="Provider" value={courseForm.provider} onChange={(e) => setCourseForm({ ...courseForm, provider: e.target.value })} />
              <Input placeholder="Course URL" value={courseForm.courseUrl} onChange={(e) => setCourseForm({ ...courseForm, courseUrl: e.target.value })} />
              <Button type="submit" className="btn-primary md:col-span-2">Create Course</Button>
            </form>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {courses.map((course) => (
              <div key={course._id} className="rounded-lg border border-gray-200 p-3 bg-white">
                <p className="font-semibold text-gray-900">{course.title} <span className="text-xs text-gray-500">({course.code})</span></p>
                <p className="text-sm text-gray-600">{course.department} • {course.mode} • {course.durationHours}h</p>
                <p className="text-xs text-gray-500">{course.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Training Nominations</h2>
          {canWrite && (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" onSubmit={(e) => {
              e.preventDefault();
              onSubmit(learningService.createNomination, nominationForm, "Nomination added", () =>
                setNominationForm(defaultNominationForm),
              );
            }}>
              <Select value={nominationForm.courseId} onChange={(e) => setNominationForm({ ...nominationForm, courseId: e.target.value })} required>
                <Option value="">Select Course</Option>
                {courses.map((course) => (
                  <Option key={course._id} value={course._id}>{course.title}</Option>
                ))}
              </Select>
              <Select value={nominationForm.employeeId} onChange={(e) => setNominationForm({ ...nominationForm, employeeId: e.target.value })} required>
                <Option value="">Select Employee</Option>
                {users.map((u) => (
                  <Option key={u._id} value={u._id}>{u.name} ({u.department})</Option>
                ))}
              </Select>
              <Input className="md:col-span-2" placeholder="Remarks" value={nominationForm.remarks} onChange={(e) => setNominationForm({ ...nominationForm, remarks: e.target.value })} />
              <Button type="submit" className="btn-primary md:col-span-2">Nominate</Button>
            </form>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {nominations.map((nomination) => (
              <div key={nomination._id} className="rounded-lg border border-gray-200 p-3 bg-white flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{nomination.employee?.name} - {nomination.course?.title}</p>
                  <p className="text-sm text-gray-600">{nomination.department} • Score: {nomination.score ?? "N/A"}</p>
                </div>
                <Select
                  value={nomination.status}
                  onChange={(e) => onSubmit(
                    (payload) => learningService.updateNominationStatus(nomination._id, payload),
                    { status: e.target.value },
                    "Nomination status updated",
                  )}
                  className="max-w-44"
                >
                  <Option value="nominated">Nominated</Option>
                  <Option value="approved">Approved</Option>
                  <Option value="rejected">Rejected</Option>
                  <Option value="in_progress">In Progress</Option>
                  <Option value="completed">Completed</Option>
                </Select>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Training Calendar</h2>
          {canWrite && (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" onSubmit={(e) => {
              e.preventDefault();
              onSubmit(learningService.createCalendarEvent, calendarForm, "Calendar event created", () =>
                setCalendarForm({ ...defaultCalendarForm, department: user?.department || "" }),
              );
            }}>
              <Input placeholder="Event Title" value={calendarForm.title} onChange={(e) => setCalendarForm({ ...calendarForm, title: e.target.value })} required />
              <Select value={calendarForm.courseId} onChange={(e) => setCalendarForm({ ...calendarForm, courseId: e.target.value })} required>
                <Option value="">Select Course</Option>
                {courses.map((course) => (
                  <Option key={course._id} value={course._id}>{course.title}</Option>
                ))}
              </Select>
              <Input placeholder="Department" value={calendarForm.department} onChange={(e) => setCalendarForm({ ...calendarForm, department: e.target.value })} required />
              <Input placeholder="Venue" value={calendarForm.venue} onChange={(e) => setCalendarForm({ ...calendarForm, venue: e.target.value })} />
              <Input type="datetime-local" value={calendarForm.startDate} onChange={(e) => setCalendarForm({ ...calendarForm, startDate: e.target.value })} required />
              <Input type="datetime-local" value={calendarForm.endDate} onChange={(e) => setCalendarForm({ ...calendarForm, endDate: e.target.value })} required />
              <Input placeholder="Trainer" value={calendarForm.trainer} onChange={(e) => setCalendarForm({ ...calendarForm, trainer: e.target.value })} />
              <Button type="submit" className="btn-primary">Add Event</Button>
            </form>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {calendarEvents.map((event) => (
              <div key={event._id} className="rounded-lg border border-gray-200 p-3 bg-white">
                <p className="font-semibold text-gray-900">{event.title}</p>
                <p className="text-sm text-gray-600">
                  {new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">{event.department} • {event.venue || "Virtual"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Certification Tracking</h2>
          {canWrite && (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" onSubmit={(e) => {
              e.preventDefault();
              onSubmit(learningService.createCertification, certificationForm, "Certification added", () =>
                setCertificationForm(defaultCertificationForm),
              );
            }}>
              <Select value={certificationForm.employeeId} onChange={(e) => setCertificationForm({ ...certificationForm, employeeId: e.target.value })} required>
                <Option value="">Employee</Option>
                {users.map((u) => (
                  <Option key={u._id} value={u._id}>{u.name}</Option>
                ))}
              </Select>
              <Select value={certificationForm.courseId} onChange={(e) => setCertificationForm({ ...certificationForm, courseId: e.target.value })}>
                <Option value="">Related Course (optional)</Option>
                {courses.map((course) => (
                  <Option key={course._id} value={course._id}>{course.title}</Option>
                ))}
              </Select>
              <Input placeholder="Certification Name" value={certificationForm.name} onChange={(e) => setCertificationForm({ ...certificationForm, name: e.target.value })} required />
              <Input placeholder="Issuer" value={certificationForm.issuer} onChange={(e) => setCertificationForm({ ...certificationForm, issuer: e.target.value })} />
              <Input type="date" value={certificationForm.issueDate} onChange={(e) => setCertificationForm({ ...certificationForm, issueDate: e.target.value })} required />
              <Input type="date" value={certificationForm.expiryDate} onChange={(e) => setCertificationForm({ ...certificationForm, expiryDate: e.target.value })} />
              <Input className="md:col-span-2" placeholder="Certificate URL" value={certificationForm.certificateUrl} onChange={(e) => setCertificationForm({ ...certificationForm, certificateUrl: e.target.value })} />
              <Button type="submit" className="btn-primary md:col-span-2">Add Certification</Button>
            </form>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {certifications.map((cert) => (
              <div key={cert._id} className="rounded-lg border border-gray-200 p-3 bg-white">
                <p className="font-semibold text-gray-900">{cert.name} - {cert.employee?.name}</p>
                <p className="text-sm text-gray-600">{cert.issuer || "Issuer N/A"} • Status: {cert.status}</p>
                <p className="text-xs text-gray-500">Issued: {new Date(cert.issueDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Feedback & Quiz/Assessment</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" onSubmit={(e) => {
            e.preventDefault();
            onSubmit(learningService.submitFeedback, feedbackForm, "Feedback submitted", () =>
              setFeedbackForm({ courseId: "", rating: 5, feedback: "", recommend: true }),
            );
          }}>
            <Select value={feedbackForm.courseId} onChange={(e) => setFeedbackForm({ ...feedbackForm, courseId: e.target.value })} required>
              <Option value="">Select Course</Option>
              {courses.map((course) => (
                <Option key={course._id} value={course._id}>{course.title}</Option>
              ))}
            </Select>
            <Input type="number" min="1" max="5" value={feedbackForm.rating} onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: Number(e.target.value) })} required />
            <Input className="md:col-span-2" placeholder="Feedback" value={feedbackForm.feedback} onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })} />
            <Button type="submit" className="btn-primary md:col-span-2">Submit Feedback</Button>
          </form>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-3" onSubmit={(e) => {
            e.preventDefault();
            const answers = assessmentForm.answers
              .split(",")
              .map((a) => Number(a.trim()))
              .filter((a) => !Number.isNaN(a));

            onSubmit(
              learningService.submitAssessment,
              { courseId: assessmentForm.courseId, answers },
              "Assessment submitted",
              () => setAssessmentForm({ courseId: "", answers: "" }),
            );
          }}>
            <Select value={assessmentForm.courseId} onChange={(e) => setAssessmentForm({ ...assessmentForm, courseId: e.target.value })} required>
              <Option value="">Select Course For Assessment</Option>
              {courses.filter((course) => course.quiz?.enabled).map((course) => (
                <Option key={course._id} value={course._id}>{course.title}</Option>
              ))}
            </Select>
            <Input placeholder="Answers (comma separated index values)" value={assessmentForm.answers} onChange={(e) => setAssessmentForm({ ...assessmentForm, answers: e.target.value })} required />
            <Button type="submit" className="btn-secondary md:col-span-2">Submit Quiz/Assessment</Button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Learning Paths</h2>
          {canWrite && (
            <form className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" onSubmit={(e) => {
              e.preventDefault();
              const courseIds = pathForm.courses
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean);

              onSubmit(
                learningService.createLearningPath,
                {
                  ...pathForm,
                  courses: courseIds,
                  targetRoles: ["employee", "manager"],
                },
                "Learning path created",
                () => setPathForm({ ...defaultPathForm, department: user?.department || "" }),
              );
            }}>
              <Input placeholder="Path Name" value={pathForm.name} onChange={(e) => setPathForm({ ...pathForm, name: e.target.value })} required />
              <Input placeholder="Department" value={pathForm.department} onChange={(e) => setPathForm({ ...pathForm, department: e.target.value })} required />
              <Input className="md:col-span-2" placeholder="Description" value={pathForm.description} onChange={(e) => setPathForm({ ...pathForm, description: e.target.value })} />
              <Input className="md:col-span-2" placeholder="Course IDs (comma separated)" value={pathForm.courses} onChange={(e) => setPathForm({ ...pathForm, courses: e.target.value })} />
              <Button type="submit" className="btn-primary md:col-span-2">Create Learning Path</Button>
            </form>
          )}

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {learningPaths.map((path) => (
              <div key={path._id} className="rounded-lg border border-gray-200 p-3 bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-gray-900">{path.name}</p>
                    <p className="text-sm text-gray-600">{path.department} • {path.courses?.length || 0} courses</p>
                  </div>
                  <Button
                    className="btn-secondary text-xs"
                    onClick={() => onSubmit(
                      (payload) => learningService.enrollInPath(path._id, payload),
                      {},
                      "Enrolled successfully",
                    )}
                  >
                    Enroll Me
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningDevelopment;
