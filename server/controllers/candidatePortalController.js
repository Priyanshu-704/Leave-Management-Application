const jwt = require("jsonwebtoken");
const CandidateAccount = require("../models/CandidateAccount");
const Candidate = require("../models/Candidate");
const JobPosting = require("../models/JobPosting");

const generateCandidateToken = (id) =>
  jwt.sign({ id, type: "candidate" }, process.env.JWT_SECRET, { expiresIn: "30d" });

exports.registerCandidate = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      resumeUrl,
      currentCompany,
      experienceYears,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const exists = await CandidateAccount.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(400).json({ message: "Candidate account already exists" });
    }

    const account = await CandidateAccount.create({
      name,
      email,
      password,
      phone,
      resumeUrl,
      currentCompany,
      experienceYears,
    });

    res.status(201).json({
      success: true,
      token: generateCandidateToken(account._id),
      candidate: {
        _id: account._id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        resumeUrl: account.resumeUrl,
        currentCompany: account.currentCompany,
        experienceYears: account.experienceYears,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.loginCandidate = async (req, res) => {
  try {
    const { email, password } = req.body;

    const account = await CandidateAccount.findOne({ email: email?.toLowerCase().trim() });
    if (!account || !(await account.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!account.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    res.json({
      success: true,
      token: generateCandidateToken(account._id),
      candidate: {
        _id: account._id,
        name: account.name,
        email: account.email,
        phone: account.phone,
        resumeUrl: account.resumeUrl,
        currentCompany: account.currentCompany,
        experienceYears: account.experienceYears,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCandidateMe = async (req, res) => {
  try {
    res.json({ success: true, data: req.candidate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateCandidateProfile = async (req, res) => {
  try {
    const updatable = [
      "name",
      "phone",
      "resumeUrl",
      "currentCompany",
      "experienceYears",
    ];

    updatable.forEach((field) => {
      if (req.body[field] !== undefined) req.candidate[field] = req.body[field];
    });

    if (req.body.password) {
      req.candidate.password = req.body.password;
    }

    await req.candidate.save();

    res.json({
      success: true,
      data: {
        _id: req.candidate._id,
        name: req.candidate.name,
        email: req.candidate.email,
        phone: req.candidate.phone,
        resumeUrl: req.candidate.resumeUrl,
        currentCompany: req.candidate.currentCompany,
        experienceYears: req.candidate.experienceYears,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPublicJobs = async (_req, res) => {
  try {
    const now = new Date();
    let jobs = await JobPosting.find({
      isActive: true,
      status: "open",
      $or: [{ closingDate: null }, { closingDate: { $exists: false } }, { closingDate: { $gte: now } }],
    })
      .select("title code department location employmentType openings description skills closingDate postedAt")
      .sort({ postedAt: -1 });

    // Fallback for legacy data where status is not maintained but posting is active.
    if (!jobs.length) {
      jobs = await JobPosting.find({
        isActive: true,
        status: { $ne: "closed" },
        $or: [{ closingDate: null }, { closingDate: { $exists: false } }, { closingDate: { $gte: now } }],
      })
        .select("title code department location employmentType openings description skills closingDate postedAt")
        .sort({ postedAt: -1 });
    }

    res.json({ success: true, data: jobs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.applyForJob = async (req, res) => {
  try {
    const { jobPostingId, notes } = req.body;

    if (!jobPostingId) {
      return res.status(400).json({ message: "Job posting ID is required" });
    }

    const job = await JobPosting.findOne({
      _id: jobPostingId,
      isActive: true,
      status: "open",
      $or: [{ closingDate: null }, { closingDate: { $gte: new Date() } }],
    });

    if (!job) {
      return res.status(404).json({ message: "Job posting not available" });
    }

    const existingApplication = await Candidate.findOne({
      account: req.candidate._id,
      jobPosting: jobPostingId,
      isActive: true,
    });

    if (existingApplication) {
      return res.status(400).json({ message: "You already applied to this job" });
    }

    const application = await Candidate.create({
      account: req.candidate._id,
      jobPosting: jobPostingId,
      name: req.candidate.name,
      email: req.candidate.email,
      phone: req.candidate.phone,
      department: job.department,
      currentCompany: req.candidate.currentCompany,
      experienceYears: req.candidate.experienceYears,
      resumeUrl: req.candidate.resumeUrl,
      source: "candidate_portal",
      notes: notes || "Applied from candidate portal",
      createdBy: null,
    });

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      data: application,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(400).json({ message: "You already applied to this job" });
    }
    res.status(500).json({ message: error.message });
  }
};

exports.getMyApplications = async (req, res) => {
  try {
    const applications = await Candidate.find({
      account: req.candidate._id,
      isActive: true,
    })
      .populate("jobPosting", "title code department location status")
      .sort({ createdAt: -1 });

    const stats = {
      total: applications.length,
      applied: applications.filter((a) => a.stage === "applied").length,
      interview: applications.filter((a) => a.stage === "interview").length,
      offered: applications.filter((a) => a.stage === "offered").length,
      hired: applications.filter((a) => a.stage === "hired").length,
      rejected: applications.filter((a) => a.stage === "rejected").length,
    };

    res.json({ success: true, data: applications, stats });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCandidateDashboard = async (req, res) => {
  try {
    const [applications, openJobs] = await Promise.all([
      Candidate.find({ account: req.candidate._id, isActive: true }).select("stage createdAt"),
      JobPosting.countDocuments({
        isActive: true,
        status: "open",
        $or: [{ closingDate: null }, { closingDate: { $gte: new Date() } }],
      }),
    ]);

    const stageSummary = applications.reduce(
      (acc, app) => {
        acc[app.stage] = (acc[app.stage] || 0) + 1;
        return acc;
      },
      {
        applied: 0,
        screening: 0,
        interview: 0,
        offered: 0,
        onboarding: 0,
        hired: 0,
        rejected: 0,
      },
    );

    res.json({
      success: true,
      data: {
        profile: {
          _id: req.candidate._id,
          name: req.candidate.name,
          email: req.candidate.email,
        },
        metrics: {
          openJobs,
          totalApplications: applications.length,
          stageSummary,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
