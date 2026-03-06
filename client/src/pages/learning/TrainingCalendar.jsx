import { useEffect, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";
import toast from "react-hot-toast";
import { Button, Input, Select, Option } from "@/components/ui";
import InsightActionModal from "@/components/modals/InsightActionModal";
import { learningService } from "@/services/api";
import { useAuth } from "@/context/AuthContext";

const initialForm = {
  title: "",
  courseId: "",
  department: "",
  startDate: "",
  endDate: "",
  venue: "",
  trainer: "",
};

const TrainingCalendar = () => {
  const { user, isManager } = useAuth();
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [coursesRes, eventsRes] = await Promise.all([
        learningService.getCourses(),
        learningService.getCalendar(),
      ]);
      setCourses(coursesRes.data || []);
      setEvents(eventsRes.data || []);
      setForm((prev) => ({ ...prev, department: prev.department || user?.department || "" }));
    } catch (error) {
      toast.error(error.message || "Failed to load training calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createEvent = async () => {
    try {
      await learningService.createCalendarEvent(form);
      toast.success("Calendar event created");
      setForm({ ...initialForm, department: user?.department || "" });
      setCreateOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to create calendar event");
    }
  };

  const updateEvent = async () => {
    if (!activeEvent?._id) return;
    try {
      await learningService.updateCalendarEvent(activeEvent._id, activeEvent);
      toast.success("Calendar event updated");
      setActiveEvent(null);
      fetchData();
    } catch (error) {
      toast.error(error.message || "Failed to update calendar event");
    }
  };

  if (loading) return <PageSkeleton rows={6} />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Calendar</h1>
          <p className="text-gray-600">Schedule training sessions and view upcoming events.</p>
        </div>
        {isManager && (
          <Button className="btn-primary" onClick={() => setCreateOpen(true)}>
            Create Event
          </Button>
        )}
      </div>

      <div className="card space-y-3">
        {events.map((event) => (
          <div key={event._id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">{event.title}</p>
              <p className="text-sm text-gray-600">{event.course?.title} • {event.department}</p>
              <p className="text-xs text-gray-500">{new Date(event.startDate).toLocaleString()} - {new Date(event.endDate).toLocaleString()} • {event.venue || "Virtual"}</p>
            </div>
            {isManager && (
              <Button
                className="btn-secondary"
                onClick={() => setActiveEvent({
                  ...event,
                  courseId: event.course?._id || event.courseId || "",
                  startDate: event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "",
                  endDate: event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "",
                })}
              >
                Update
              </Button>
            )}
          </div>
        ))}
        {!events.length && <p className="text-sm text-gray-500">No training events found.</p>}
      </div>

      <InsightActionModal
        isOpen={createOpen}
        title="Create Training Event"
        submitText="Create"
        onClose={() => setCreateOpen(false)}
        onSubmit={createEvent}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Event Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
            <Option value="">Select Course</Option>
            {courses.map((course) => (
              <Option key={course._id} value={course._id}>{course.title}</Option>
            ))}
          </Select>
          <Input placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} required />
          <Input placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
          <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
          <Input className="md:col-span-2" placeholder="Trainer" value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} />
        </div>
      </InsightActionModal>

      <InsightActionModal
        isOpen={!!activeEvent}
        title="Update Training Event"
        submitText="Update"
        onClose={() => setActiveEvent(null)}
        onSubmit={updateEvent}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input placeholder="Event Title" value={activeEvent?.title || ""} onChange={(e) => setActiveEvent((prev) => ({ ...prev, title: e.target.value }))} required />
          <Select value={activeEvent?.courseId || ""} onChange={(e) => setActiveEvent((prev) => ({ ...prev, courseId: e.target.value }))} required>
            <Option value="">Select Course</Option>
            {courses.map((course) => (
              <Option key={course._id} value={course._id}>{course.title}</Option>
            ))}
          </Select>
          <Input placeholder="Department" value={activeEvent?.department || ""} onChange={(e) => setActiveEvent((prev) => ({ ...prev, department: e.target.value }))} required />
          <Input placeholder="Venue" value={activeEvent?.venue || ""} onChange={(e) => setActiveEvent((prev) => ({ ...prev, venue: e.target.value }))} />
          <Input type="datetime-local" value={activeEvent?.startDate || ""} onChange={(e) => setActiveEvent((prev) => ({ ...prev, startDate: e.target.value }))} required />
          <Input type="datetime-local" value={activeEvent?.endDate || ""} onChange={(e) => setActiveEvent((prev) => ({ ...prev, endDate: e.target.value }))} required />
          <Input className="md:col-span-2" placeholder="Trainer" value={activeEvent?.trainer || ""} onChange={(e) => setActiveEvent((prev) => ({ ...prev, trainer: e.target.value }))} />
        </div>
      </InsightActionModal>
    </div>
  );
};

export default TrainingCalendar;
