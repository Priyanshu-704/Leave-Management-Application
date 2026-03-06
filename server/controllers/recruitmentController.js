const JobPosting = require("../models/JobPosting");
const Candidate = require("../models/Candidate");
const Interview = require("../models/Interview");
const User = require("../models/User");
const {
  isSuperAdmin,
  isAdmin,
  canAccessDepartment,
} = require("../utils/accessControl");

const isManagerOrAdmin = (user) => ["manager", "admin", "super_admin"].includes(user?.role);
const isDepartmentScoped = (user) => ["manager"].includes(user?.role);
const isHr = (user) =>
  String(user?.department || "").toLowerCase() === "hr" ||
  String(user?.designation || "").toLowerCase() === "hr";

const canManageRecruitmentPipeline = (user) =>
  isSuperAdmin(user) || isAdmin(user) || isHr(user);

const canManageInterviews = (user) =>
  isManagerOrAdmin(user) || isHr(user);

const getScopedDepartment = (req) => {
  if (isDepartmentScoped(req.user) && !isSuperAdmin(req.user)) {
    return req.user.department;
  }
  return null;
};

const ensureDepartmentAccess = (req, department) => {
  return canAccessDepartment(req.user, department);
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

exports.getJobPostings = async (req, res) => {
  try {
    const { status, department, search } = req.query;
    const query = { isActive: true };

    if (status && status !== "all") query.status = status;

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

    const jobs = await JobPosting.find(query)
      .populate("postedBy", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createJobPosting = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const {
      title,
      code,
      department,
      location,
      employmentType,
      openings,
      description,
      skills,
      status,
      closingDate,
    } = req.body;

    const scopedDepartment = getScopedDepartment(req);
    const finalDepartment = scopedDepartment || department;

    if (!title || !code || !description || !finalDepartment) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await JobPosting.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: "Job code already exists" });
    }

    const job = await JobPosting.create({
      title,
      code: code.toUpperCase(),
      department: finalDepartment,
      location,
      employmentType,
      openings,
      description,
      skills: parseArray(skills),
      status: status || "draft",
      closingDate: closingDate || null,
      postedBy: req.user.id,
    });

    res.status(201).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateJobPosting = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const job = await JobPosting.findById(req.params.id);
    if (!job || !job.isActive) {
      return res.status(404).json({ message: "Job posting not found" });
    }

    if (!ensureDepartmentAccess(req, job.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatable = [
      "title",
      "location",
      "employmentType",
      "openings",
      "description",
      "status",
      "closingDate",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        job[field] = req.body[field];
      }
    });

    if (req.body.skills !== undefined) {
      job.skills = parseArray(req.body.skills);
    }

    if (req.body.department && isSuperAdmin(req.user)) {
      job.department = req.body.department;
    }

    job.updatedBy = req.user.id;
    await job.save();

    res.json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteJobPosting = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const job = await JobPosting.findById(req.params.id);
    if (!job || !job.isActive) {
      return res.status(404).json({ message: "Job posting not found" });
    }

    if (!ensureDepartmentAccess(req, job.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    job.isActive = false;
    job.updatedBy = req.user.id;
    await job.save();

    res.json({ success: true, message: "Job posting deactivated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCandidates = async (req, res) => {
  try {
    const { stage, department, jobPosting, search } = req.query;
    const query = { isActive: true };

    if (stage && stage !== "all") query.stage = stage;
    if (jobPosting) query.jobPosting = jobPosting;

    const scopedDepartment = getScopedDepartment(req);
    if (scopedDepartment) {
      query.department = scopedDepartment;
    } else if (department && department !== "all") {
      query.department = department;
    }

    if (search?.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { email: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const candidates = await Candidate.find(query)
      .populate("jobPosting", "title code department")
      .populate("assignedRecruiter", "name email")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: candidates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createCandidate = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const {
      jobPosting,
      name,
      email,
      phone,
      currentCompany,
      experienceYears,
      resumeUrl,
      source,
      notes,
      rating,
      assignedRecruiter,
    } = req.body;

    if (!jobPosting || !name || !email) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const job = await JobPosting.findById(jobPosting);
    if (!job || !job.isActive) {
      return res.status(404).json({ message: "Job posting not found" });
    }

    if (!ensureDepartmentAccess(req, job.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const candidate = await Candidate.create({
      jobPosting,
      name,
      email,
      phone,
      department: job.department,
      currentCompany,
      experienceYears,
      resumeUrl,
      source,
      notes,
      rating,
      assignedRecruiter: assignedRecruiter || null,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: candidate });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "Candidate already exists for this job" });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.updateCandidate = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!ensureDepartmentAccess(req, candidate.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatable = [
      "name",
      "email",
      "phone",
      "currentCompany",
      "experienceYears",
      "resumeUrl",
      "source",
      "notes",
      "rating",
      "assignedRecruiter",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) candidate[field] = req.body[field];
    });

    candidate.updatedBy = req.user.id;
    await candidate.save();

    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCandidateStage = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { stage, notes } = req.body;
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!ensureDepartmentAccess(req, candidate.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    candidate.stage = stage;
    if (notes) candidate.notes = notes;
    candidate.updatedBy = req.user.id;
    await candidate.save();

    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.scheduleInterview = async (req, res) => {
  try {
    if (!canManageInterviews(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const {
      candidateId,
      round,
      title,
      interviewer,
      scheduledAt,
      durationMinutes,
      mode,
    } = req.body;

    const candidate = await Candidate.findById(candidateId).populate("jobPosting", "_id");
    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!ensureDepartmentAccess(req, candidate.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const interviewerUser = await User.findById(interviewer).select("department");
    if (!interviewerUser) {
      return res.status(404).json({ message: "Interviewer not found" });
    }

    if (!isSuperAdmin(req.user) && interviewerUser.department !== candidate.department) {
      return res.status(403).json({ message: "Interviewer must be from same department" });
    }

    const interview = await Interview.create({
      candidate: candidate._id,
      jobPosting: candidate.jobPosting._id,
      department: candidate.department,
      round,
      title,
      interviewer,
      scheduledAt,
      durationMinutes,
      mode,
      createdBy: req.user.id,
    });

    candidate.stage = "interview";
    candidate.updatedBy = req.user.id;
    await candidate.save();

    res.status(201).json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getInterviews = async (req, res) => {
  try {
    const { status, department } = req.query;
    const query = {};

    if (status && status !== "all") query.status = status;

    const scopedDepartment = getScopedDepartment(req);
    if (scopedDepartment) {
      query.department = scopedDepartment;
    } else if (department && department !== "all") {
      query.department = department;
    }

    const interviews = await Interview.find(query)
      .populate("candidate", "name email stage")
      .populate("interviewer", "name email department")
      .sort({ scheduledAt: -1 });

    res.json({ success: true, data: interviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateInterview = async (req, res) => {
  try {
    if (!canManageInterviews(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({ message: "Interview not found" });
    }

    if (!ensureDepartmentAccess(req, interview.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatable = [
      "round",
      "title",
      "interviewer",
      "scheduledAt",
      "durationMinutes",
      "mode",
      "status",
      "feedback",
      "score",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) interview[field] = req.body[field];
    });

    interview.updatedBy = req.user.id;
    await interview.save();

    res.json({ success: true, data: interview });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.generateOfferLetter = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { ctc, joiningDate } = req.body;
    const candidate = await Candidate.findById(req.params.id).populate("jobPosting", "title");

    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!ensureDepartmentAccess(req, candidate.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const letterText = [
      "Offer Letter",
      `Date: ${new Date().toISOString().split("T")[0]}`,
      `Candidate: ${candidate.name}`,
      `Position: ${candidate.jobPosting?.title || "N/A"}`,
      `Department: ${candidate.department}`,
      `Compensation (CTC): ${ctc || 0}`,
      `Expected Joining Date: ${joiningDate || "To be decided"}`,
      "",
      "We are pleased to offer you this role. Welcome aboard.",
    ].join("\n");

    candidate.offer = {
      ...candidate.offer,
      status: "generated",
      ctc: Number(ctc || 0),
      joiningDate: joiningDate || null,
      letterText,
      letterSentAt: new Date(),
    };
    candidate.stage = "offered";
    candidate.updatedBy = req.user.id;
    await candidate.save();

    res.json({
      success: true,
      message: "Offer letter generated successfully",
      data: {
        candidateId: candidate._id,
        offer: candidate.offer,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOnboardingChecklist = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { checklist } = req.body;
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!ensureDepartmentAccess(req, candidate.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!Array.isArray(checklist)) {
      return res.status(400).json({ message: "Checklist must be an array" });
    }

    candidate.onboardingChecklist = checklist.map((item) => ({
      item: item.item,
      completed: !!item.completed,
      completedAt: item.completed ? new Date() : null,
      completedBy: item.completed ? req.user.id : null,
    }));

    const completedCount = candidate.onboardingChecklist.filter((i) => i.completed).length;
    if (completedCount > 0) {
      candidate.stage = "onboarding";
    }

    candidate.updatedBy = req.user.id;
    await candidate.save();

    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDocumentVerification = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { status, remarks } = req.body;
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!ensureDepartmentAccess(req, candidate.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    candidate.documentVerification.status = status;
    candidate.documentVerification.remarks = remarks || "";
    candidate.documentVerification.verifiedAt =
      status === "verified" ? new Date() : null;
    candidate.documentVerification.verifiedBy =
      status === "verified" ? req.user.id : null;
    candidate.updatedBy = req.user.id;
    await candidate.save();

    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateBackgroundCheck = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { status, vendor, remarks } = req.body;
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!ensureDepartmentAccess(req, candidate.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    candidate.backgroundCheck.status = status;
    candidate.backgroundCheck.vendor = vendor || "";
    candidate.backgroundCheck.remarks = remarks || "";
    candidate.backgroundCheck.completedAt =
      ["clear", "failed"].includes(status) ? new Date() : null;
    candidate.updatedBy = req.user.id;
    await candidate.save();

    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProbation = async (req, res) => {
  try {
    if (!canManageRecruitmentPipeline(req.user)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { status, startDate, endDate, reviewDate, remarks } = req.body;
    const candidate = await Candidate.findById(req.params.id);

    if (!candidate || !candidate.isActive) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    if (!ensureDepartmentAccess(req, candidate.department)) {
      return res.status(403).json({ message: "Not authorized" });
    }

    candidate.probation = {
      status,
      startDate: startDate || null,
      endDate: endDate || null,
      reviewDate: reviewDate || null,
      remarks: remarks || "",
    };

    if (status === "in_progress") {
      candidate.stage = "hired";
    }

    candidate.updatedBy = req.user.id;
    await candidate.save();

    res.json({ success: true, data: candidate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRecruitmentSummary = async (req, res) => {
  try {
    const query = { isActive: true };
    const scopedDepartment = getScopedDepartment(req);

    if (scopedDepartment) {
      query.department = scopedDepartment;
    }

    const [jobs, candidates, interviews] = await Promise.all([
      JobPosting.countDocuments(query),
      Candidate.countDocuments(query),
      Interview.countDocuments(
        query.department ? { department: query.department } : {},
      ),
    ]);

    const stageStats = await Candidate.aggregate([
      { $match: query },
      { $group: { _id: "$stage", count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        jobs,
        candidates,
        interviews,
        stageStats,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
