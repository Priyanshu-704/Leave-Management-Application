const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import User model
const User = require('../models/User');

// Admin user data
const adminData = {
  name: 'System Administrator',
  email: 'admin@company.com',
  password: 'Admin@123',
  employeeId: 'ADMIN001',
  department: 'Administration',
  role: 'admin',
  leaveBalance: {
    annual: 30,
    sick: 15,
    personal: 10
  },
  isActive: true
};

const createAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/leave-management');
    console.log('Connected to MongoDB successfully');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ 
      $or: [
        { email: adminData.email },
        { employeeId: adminData.employeeId }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists:');
      console.log({
        name: existingAdmin.name,
        email: existingAdmin.email,
        employeeId: existingAdmin.employeeId,
        role: existingAdmin.role
      });
      
      // Ask if user wants to update password
      const updatePassword = process.argv.includes('--update-password');
      if (updatePassword) {
        existingAdmin.password = adminData.password;
        await existingAdmin.save();
        console.log('Admin password updated successfully');
      }
      
      await mongoose.disconnect();
      return;
    }

    // Create new admin user
    console.log('Creating new admin user...');
    const admin = await User.create(adminData);
    
    console.log('✅ Admin user created successfully:');
    console.log({
      id: admin._id,
      name: admin.name,
      email: admin.email,
      employeeId: admin.employeeId,
      role: admin.role,
      department: admin.department,
      isActive: admin.isActive
    });
    
    console.log('\n📝 Login Credentials:');
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);
    console.log('\n⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.code === 11000) {
      console.error('Duplicate key error. Admin with this email or employee ID may already exist.');
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
createAdmin();