const jwt = require("jsonwebtoken");
const CandidateAccount = require("../models/CandidateAccount");

exports.protectCandidate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Candidate token missing" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded?.type !== "candidate") {
      return res.status(401).json({ message: "Invalid candidate token" });
    }

    const candidate = await CandidateAccount.findById(decoded.id).select("-password");
    if (!candidate || !candidate.isActive) {
      return res.status(401).json({ message: "Candidate account not found or inactive" });
    }

    req.candidate = candidate;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Not authorized" });
  }
};
