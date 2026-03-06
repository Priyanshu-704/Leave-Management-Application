const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");

const superAdminData = {
  name: "Super Administrator",
  email: "superadmin@company.com",
  password: "super@123",
  employeeId: "SUPER001",
  department: "Administration",
  role: "super_admin",
  leaveBalance: {
    annual: 40,
    sick: 20,
    personal: 15,
  },
  isActive: true,
};

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/leave-management",
    );

    const existing = await User.findOne({
      $or: [{ email: superAdminData.email }, { employeeId: superAdminData.employeeId }],
    });

    if (existing) {
      console.log("Super admin already exists:");
      console.log({
        name: existing.name,
        email: existing.email,
        employeeId: existing.employeeId,
        role: existing.role,
      });

      if (process.argv.includes("--update-password")) {
        existing.password = superAdminData.password;
        existing.role = "super_admin";
        await existing.save();
        console.log("Super admin password/role updated.");
      }
      return;
    }

    const user = await User.create(superAdminData);
    console.log("✅ Super admin created:");
    console.log({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
    console.log("\nLogin Credentials:");
    console.log(`Email: ${superAdminData.email}`);
    console.log(`Password: ${superAdminData.password}`);
  } catch (error) {
    console.error("❌ Failed to create super admin:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createSuperAdmin();
