const express = require("express");
const { body } = require("express-validator");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { protect, authorize } = require("../middleware/auth");
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserRole,
  updateLeaveBalance,
  getUserLeaveBalances,
  bulkUpdateLeaveBalances,
  getDepartmentUsers,
  toggleUserStatus,
  updateProfile,
  changePassword,
  sendCredentialsToUser,
  getUserStatistics,
  getDepartmentHeadCandidates,
  uploadProfilePicture,
  updateUserPermissions,
  updateDepartmentPermissions,
} = require("../controllers/userController");

const router = express.Router();

// Configure multer for profile pictures
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/profiles/');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    // Use user ID in filename for easy identification
    cb(null, 'profile-' + req.user.id + '-' + uniqueSuffix + ext);
  }
});

const profileFileFilter = (req, file, cb) => {
  // Allow only images
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: profileStorage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit for profile pictures
  },
  fileFilter: profileFileFilter
});

// All routes require authentication
router.use(protect);

// Public routes (accessible by authenticated users)
router.get("/profile", getUserById); // Gets current user's profile
router.put("/profile", updateProfile);
router.put("/change-password", changePassword);

// Profile picture upload - must be before admin routes
router.post(
  "/profile/picture",
  upload.single("profilePicture"),
  uploadProfilePicture
);

// Manager/Admin only routes
router.get("/statistics", authorize("manager", "admin"), getUserStatistics);
router.get(
  "/leave-balances",
  authorize("manager", "admin"),
  getUserLeaveBalances,
);
router.get(
  "/department/:department",
  authorize("manager", "admin"),
  getDepartmentUsers,
);

// Department head candidates route (Admin only)
router.get(
  "/department/:departmentName/candidates",
  authorize("admin"),
  getDepartmentHeadCandidates,
);

// Admin only routes - all routes after this require admin
router.use(authorize("admin"));

router
  .route("/")
  .get(getUsers)
  .post(
    [
      body("name").notEmpty().trim(),
      body("email").isEmail().normalizeEmail(),
      body("password").optional({ checkFalsy: true }).isLength({ min: 6 }),
      body("employeeId").notEmpty(),
      body("department").notEmpty(),
      body("role").isIn(["employee", "manager", "admin"]),
      body("designation")
        .optional()
        .isIn([
          "intern",
          "staff",
          "senior",
          "lead",
          "manager",
          "project_manager",
          "hr",
          "finance",
          "it",
          "director",
        ]),
      body("dateOfBirth").optional().isISO8601(),
      body("dateOfBirth")
        .optional()
        .custom((value) => new Date(value) <= new Date())
        .withMessage("Date of birth cannot be in the future"),
      body("joiningDate").optional().isISO8601(),
      body("joiningDate")
        .optional()
        .custom((value) => new Date(value) <= new Date())
        .withMessage("Joining date cannot be in the future"),
    ],
    createUser,
  );

router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

router.put("/:id/role", updateUserRole);
router.put("/:id/permissions", updateUserPermissions);
router.put("/:id/leave-balance", updateLeaveBalance);
router.put("/:id/toggle-status", toggleUserStatus);
router.post("/:id/send-credentials", sendCredentialsToUser);
router.put(
  "/permissions/department/:department",
  updateDepartmentPermissions,
);
router.post("/bulk-update-leave-balances", bulkUpdateLeaveBalances);

module.exports = router;
