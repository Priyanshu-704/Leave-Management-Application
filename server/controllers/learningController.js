const Course = require("../models/Course");
const TrainingNomination = require("../models/TrainingNomination");
const TrainingCalendarEvent = require("../models/TrainingCalendarEvent");
const Certification = require("../models/Certification");
const TrainingFeedback = require("../models/TrainingFeedback");
const LearningPath = require("../models/LearningPath");
const AssessmentAttempt = require("../models/AssessmentAttempt");
const User = require("../models/User");

const isSuperAdmin = (user) => user?.role === "super_admin";
const isManagerOrAdmin = (user) => ["manager", "admin", "super_admin"].includes(user?.role);
const isDepartmentScoped = (user) => ["manager", "admin"].includes(user?.role);

const getScopedDepartment = (req) => {
  if (isDepartmentScoped(req.user) && !isSuperAdmin(req.user)) {
    return req.user.department;
  }
  return null;
};

const ensureDepartmentAccess = (req, department) => {
  if (!isDepartmentScoped(req.user) || isSuperAdmin(req.user)) return true;
  return department === req.user.department;
};

const parseArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

exports.getCourses = async (req, res) => {
  try {
    const { category, department, search } = req.query;
    const query = { isActive: true };

    if (category && category !== "all") query.category = category;

    const scopedDepartment = getScopedDepartment(req);
    if (scopedDepartment) {
      query.department = scopedDepartment;
    } else if (department && department !== "all") {
      query.department = department;
    }

    if (search?.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { code: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const courses = await Course.find(query)
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: courses });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const {
      title,
      code,
      department,
      category,
      mode,
      description,
      durationHours,
      provider,
      courseUrl,
      startDate,
      endDate,
      tags,
      certificationOffered,
      quiz,
    } = req.body;

    const scopedDepartment = getScopedDepartment(req);
    const finalDepartment = scopedDepartment || department;

    if (!title || !code || !description || !finalDepartment) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await Course.findOne({ code: code.toUpperCase() });
    if (exists) {
      return res.status(400).json({ message: "Course code already exists" });
    }

    const course = await Course.create({
      title,
      code: code.toUpperCase(),
      department: finalDepartment,
      category,
      mode,
      description,
      durationHours,
      provider,
      courseUrl,
      startDate,
      endDate,
      tags: parseArray(tags),
      certificationOffered: !!certificationOffered,
      quiz: quiz || { enabled: false, passingScore: 70, questions: [] },
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const course = await Course.findById(req.params.id);
    if (!course || !course.isActive) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!ensureDepartmentAccess(req, course.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatable = [
      "title",
      "category",
      "mode",
      "description",
      "durationHours",
      "provider",
      "courseUrl",
      "startDate",
      "endDate",
      "certificationOffered",
      "quiz",
      "isActive",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) course[field] = req.body[field];
    });

    if (req.body.tags !== undefined) {
      course.tags = parseArray(req.body.tags);
    }

    if (req.body.department && isSuperAdmin(req.user)) {
      course.department = req.body.department;
    }

    course.updatedBy = req.user.id;
    await course.save();

    res.json({ success: true, data: course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const course = await Course.findById(req.params.id);
    if (!course || !course.isActive) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!ensureDepartmentAccess(req, course.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    course.isActive = false;
    course.updatedBy = req.user.id;
    await course.save();

    res.json({ success: true, message: "Course deactivated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getNominations = async (req, res) => {
  try {
    const { status, department } = req.query;
    const query = {};

    if (status && status !== "all") query.status = status;

    if (req.user.role === "employee") {
      query.employee = req.user.id;
    }

    const scopedDepartment = getScopedDepartment(req);
    if (scopedDepartment) {
      query.department = scopedDepartment;
    } else if (department && department !== "all") {
      query.department = department;
    }

    const nominations = await TrainingNomination.find(query)
      .populate("course", "title code department")
      .populate("employee", "name email department")
      .populate("nominatedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: nominations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createNomination = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { courseId, employeeId, remarks } = req.body;

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!ensureDepartmentAccess(req, course.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const employee = await User.findById(employeeId).select("department");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!isSuperAdmin(req.user) && employee.department !== course.department) {
      return res.status(403).json({ message: "Employee must belong to same department" });
    }

    const nomination = await TrainingNomination.create({
      course: course._id,
      employee: employeeId,
      department: course.department,
      nominatedBy: req.user.id,
      remarks: remarks || "",
    });

    res.status(201).json({ success: true, data: nomination });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Employee already nominated for this course" });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.updateNominationStatus = async (req, res) => {
  try {
    const nomination = await TrainingNomination.findById(req.params.id);
    if (!nomination) {
      return res.status(404).json({ message: "Nomination not found" });
    }

    if (req.user.role === "employee") {
      if (nomination.employee.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { status } = req.body;
      if (!["in_progress", "completed"].includes(status)) {
        return res.status(403).json({ message: "Invalid status transition" });
      }
    } else if (!ensureDepartmentAccess(req, nomination.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { status, remarks, score } = req.body;
    nomination.status = status;
    if (remarks !== undefined) nomination.remarks = remarks;
    if (score !== undefined) nomination.score = score;
    nomination.completedAt = status === "completed" ? new Date() : null;

    await nomination.save();
    res.json({ success: true, data: nomination });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrainingCalendar = async (req, res) => {
  try {
    const { department, status } = req.query;
    const query = {};

    if (status && status !== "all") query.status = status;

    const scopedDepartment = getScopedDepartment(req);
    if (scopedDepartment) {
      query.department = scopedDepartment;
    } else if (department && department !== "all") {
      query.department = department;
    }

    const events = await TrainingCalendarEvent.find(query)
      .populate("course", "title code")
      .sort({ startDate: 1 });

    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTrainingCalendarEvent = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const {
      title,
      courseId,
      department,
      startDate,
      endDate,
      venue,
      trainer,
      maxParticipants,
      status,
    } = req.body;

    const scopedDepartment = getScopedDepartment(req);
    const finalDepartment = scopedDepartment || department;

    if (!title || !courseId || !startDate || !endDate || !finalDepartment) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!isSuperAdmin(req.user) && course.department !== finalDepartment) {
      return res.status(400).json({ message: "Course department mismatch" });
    }

    const event = await TrainingCalendarEvent.create({
      title,
      course: courseId,
      department: finalDepartment,
      startDate,
      endDate,
      venue,
      trainer,
      maxParticipants,
      status: status || "scheduled",
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTrainingCalendarEvent = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const event = await TrainingCalendarEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Training calendar event not found" });
    }

    if (!ensureDepartmentAccess(req, event.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatable = [
      "title",
      "startDate",
      "endDate",
      "venue",
      "trainer",
      "maxParticipants",
      "status",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) event[field] = req.body[field];
    });

    if (req.body.department && isSuperAdmin(req.user)) {
      event.department = req.body.department;
    }

    event.updatedBy = req.user.id;
    await event.save();

    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTrainingCalendarEvent = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const event = await TrainingCalendarEvent.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Training calendar event not found" });
    }

    if (!ensureDepartmentAccess(req, event.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await TrainingCalendarEvent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Training calendar event deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCertifications = async (req, res) => {
  try {
    const { employeeId, department, status } = req.query;
    const query = {};

    if (status && status !== "all") query.status = status;
    if (employeeId) query.employee = employeeId;

    if (req.user.role === "employee") {
      query.employee = req.user.id;
    }

    const scopedDepartment = getScopedDepartment(req);
    if (scopedDepartment) {
      query.department = scopedDepartment;
    } else if (department && department !== "all") {
      query.department = department;
    }

    const certifications = await Certification.find(query)
      .populate("employee", "name email department")
      .populate("course", "title code")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: certifications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCertification = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const {
      employeeId,
      courseId,
      name,
      issuer,
      issueDate,
      expiryDate,
      status,
      certificateUrl,
    } = req.body;

    const employee = await User.findById(employeeId).select("department");
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    if (!ensureDepartmentAccess(req, employee.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const certification = await Certification.create({
      employee: employeeId,
      course: courseId || null,
      department: employee.department,
      name,
      issuer,
      issueDate,
      expiryDate,
      status: status || "valid",
      certificateUrl,
      verifiedBy: req.user.id,
    });

    res.status(201).json({ success: true, data: certification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCertification = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const certification = await Certification.findById(req.params.id);
    if (!certification) {
      return res.status(404).json({ message: "Certification not found" });
    }

    if (!ensureDepartmentAccess(req, certification.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatable = [
      "name",
      "issuer",
      "issueDate",
      "expiryDate",
      "status",
      "certificateUrl",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) certification[field] = req.body[field];
    });

    certification.verifiedBy = req.user.id;
    await certification.save();

    res.json({ success: true, data: certification });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitTrainingFeedback = async (req, res) => {
  try {
    const { courseId, rating, feedback, recommend } = req.body;

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (
      isDepartmentScoped(req.user) &&
      !isSuperAdmin(req.user) &&
      course.department !== req.user.department
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const feedbackRecord = await TrainingFeedback.findOneAndUpdate(
      { course: courseId, employee: req.user.id },
      {
        course: courseId,
        employee: req.user.id,
        department: req.user.department,
        rating,
        feedback,
        recommend,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.status(201).json({ success: true, data: feedbackRecord });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTrainingFeedback = async (req, res) => {
  try {
    const { courseId } = req.query;
    const query = {};

    if (courseId) query.course = courseId;

    const scopedDepartment = getScopedDepartment(req);
    if (scopedDepartment) {
      query.department = scopedDepartment;
    }

    if (req.user.role === "employee") {
      query.employee = req.user.id;
    }

    const feedback = await TrainingFeedback.find(query)
      .populate("course", "title code department")
      .populate("employee", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitAssessment = async (req, res) => {
  try {
    const { courseId, answers } = req.body;

    const course = await Course.findById(courseId);
    if (!course || !course.isActive) {
      return res.status(404).json({ message: "Course not found" });
    }

    if (!course.quiz?.enabled || !course.quiz.questions?.length) {
      return res.status(400).json({ message: "Assessment is not configured for this course" });
    }

    if (
      isDepartmentScoped(req.user) &&
      !isSuperAdmin(req.user) &&
      course.department !== req.user.department
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const questionCount = course.quiz.questions.length;
    const safeAnswers = Array.isArray(answers) ? answers : [];

    let correct = 0;
    for (let i = 0; i < questionCount; i += 1) {
      if (safeAnswers[i] === course.quiz.questions[i].correctOption) {
        correct += 1;
      }
    }

    const score = Math.round((correct / questionCount) * 100);
    const passed = score >= (course.quiz.passingScore || 70);

    const attempt = await AssessmentAttempt.create({
      course: courseId,
      employee: req.user.id,
      department: req.user.department,
      answers: safeAnswers,
      score,
      passed,
    });

    await TrainingNomination.findOneAndUpdate(
      { course: courseId, employee: req.user.id },
      {
        status: passed ? "completed" : "in_progress",
        score,
        completedAt: passed ? new Date() : null,
      },
      { new: true },
    );

    res.status(201).json({ success: true, data: attempt });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLearningPaths = async (req, res) => {
  try {
    const { department } = req.query;
    const query = { isActive: true };

    const scopedDepartment = getScopedDepartment(req);
    if (scopedDepartment) {
      query.department = scopedDepartment;
    } else if (department && department !== "all") {
      query.department = department;
    }

    if (req.user.role === "employee") {
      query.$or = [{ enrolledUsers: req.user.id }, { targetRoles: req.user.role }];
    }

    const paths = await LearningPath.find(query)
      .populate("courses", "title code")
      .populate("enrolledUsers", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: paths });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createLearningPath = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { name, department, description, courses, targetRoles } = req.body;
    const scopedDepartment = getScopedDepartment(req);
    const finalDepartment = scopedDepartment || department;

    if (!name || !finalDepartment) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const path = await LearningPath.create({
      name,
      department: finalDepartment,
      description,
      courses: Array.isArray(courses) ? courses : [],
      targetRoles: Array.isArray(targetRoles) && targetRoles.length ? targetRoles : ["employee"],
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateLearningPath = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const path = await LearningPath.findById(req.params.id);
    if (!path || !path.isActive) {
      return res.status(404).json({ message: "Learning path not found" });
    }

    if (!ensureDepartmentAccess(req, path.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatable = ["name", "description", "isActive"];
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) path[field] = req.body[field];
    });

    if (Array.isArray(req.body.courses)) path.courses = req.body.courses;
    if (Array.isArray(req.body.targetRoles)) path.targetRoles = req.body.targetRoles;
    if (req.body.department && isSuperAdmin(req.user)) path.department = req.body.department;

    path.updatedBy = req.user.id;
    await path.save();

    res.json({ success: true, data: path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.enrollInLearningPath = async (req, res) => {
  try {
    const { userId } = req.body;
    const path = await LearningPath.findById(req.params.id);

    if (!path || !path.isActive) {
      return res.status(404).json({ message: "Learning path not found" });
    }

    const targetUserId = userId || req.user.id;

    if (targetUserId !== req.user.id && !isManagerOrAdmin(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const targetUser = await User.findById(targetUserId).select("department role");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!isSuperAdmin(req.user) && path.department !== targetUser.department) {
      return res.status(403).json({ message: "Department mismatch" });
    }

    if (!path.enrolledUsers.some((id) => id.toString() === targetUserId.toString())) {
      path.enrolledUsers.push(targetUserId);
      path.updatedBy = req.user.id;
      await path.save();
    }

    res.json({ success: true, data: path });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getLearningSummary = async (req, res) => {
  try {
    const scopedDepartment = getScopedDepartment(req);
    const deptQuery = scopedDepartment ? { department: scopedDepartment } : {};

    const [
      courseCount,
      nominationCount,
      certificationCount,
      calendarCount,
      learningPathCount,
    ] = await Promise.all([
      Course.countDocuments({ ...deptQuery, isActive: true }),
      TrainingNomination.countDocuments(deptQuery),
      Certification.countDocuments(deptQuery),
      TrainingCalendarEvent.countDocuments(deptQuery),
      LearningPath.countDocuments({ ...deptQuery, isActive: true }),
    ]);

    const nominationByStatus = await TrainingNomination.aggregate([
      { $match: deptQuery },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        courses: courseCount,
        nominations: nominationCount,
        certifications: certificationCount,
        calendarEvents: calendarCount,
        learningPaths: learningPathCount,
        nominationByStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
