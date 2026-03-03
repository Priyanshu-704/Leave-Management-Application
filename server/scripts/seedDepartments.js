const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Department = require('../models/Department');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const departments = [
  {
    name: 'Engineering',
    code: 'ENG',
    description: 'Software development and engineering team',
    location: { building: 'A', floor: '3', office: 'A301' },
    contactInfo: { email: 'engineering@company.com', extension: '1101' },
    settings: {
      defaultLeaveQuota: { annual: 22, sick: 12, personal: 6 }
    }
  },
  {
    name: 'Human Resources',
    code: 'HR',
    description: 'Human resources and personnel management',
    location: { building: 'B', floor: '1', office: 'B101' },
    contactInfo: { email: 'hr@company.com', extension: '1201' },
    settings: {
      defaultLeaveQuota: { annual: 21, sick: 11, personal: 5 }
    }
  },
  {
    name: 'Finance',
    code: 'FIN',
    description: 'Finance and accounting department',
    location: { building: 'A', floor: '2', office: 'A201' },
    contactInfo: { email: 'finance@company.com', extension: '1301' },
    settings: {
      defaultLeaveQuota: { annual: 20, sick: 10, personal: 5 }
    }
  },
  {
    name: 'Marketing',
    code: 'MKT',
    description: 'Marketing and communications',
    location: { building: 'C', floor: '2', office: 'C201' },
    contactInfo: { email: 'marketing@company.com', extension: '1401' },
    settings: {
      defaultLeaveQuota: { annual: 20, sick: 10, personal: 5 }
    }
  },
  {
    name: 'Sales',
    code: 'SALES',
    description: 'Sales and business development',
    location: { building: 'C', floor: '1', office: 'C101' },
    contactInfo: { email: 'sales@company.com', extension: '1501' },
    settings: {
      defaultLeaveQuota: { annual: 18, sick: 8, personal: 4 }
    }
  },
  {
    name: 'Operations',
    code: 'OPS',
    description: 'Operations and logistics',
    location: { building: 'D', floor: '1', office: 'D101' },
    contactInfo: { email: 'operations@company.com', extension: '1601' },
    settings: {
      defaultLeaveQuota: { annual: 20, sick: 10, personal: 5 }
    }
  },
  {
    name: 'IT Support',
    code: 'IT',
    description: 'Information technology support',
    location: { building: 'A', floor: '1', office: 'A101' },
    contactInfo: { email: 'it@company.com', extension: '1701' },
    settings: {
      defaultLeaveQuota: { annual: 20, sick: 10, personal: 5 }
    }
  },
  {
    name: 'Customer Support',
    code: 'CS',
    description: 'Customer service and support',
    location: { building: 'E', floor: '1', office: 'E101' },
    contactInfo: { email: 'support@company.com', extension: '1801' },
    settings: {
      defaultLeaveQuota: { annual: 18, sick: 9, personal: 4 }
    }
  },
  {
    name: 'Administration',
    code: 'ADMIN',
    description: 'General administration',
    location: { building: 'B', floor: '2', office: 'B201' },
    contactInfo: { email: 'admin@company.com', extension: '1901' },
    settings: {
      defaultLeaveQuota: { annual: 22, sick: 12, personal: 6 }
    }
  },
  {
    name: 'Research & Development',
    code: 'RND',
    description: 'Research and development',
    location: { building: 'F', floor: '2', office: 'F201' },
    contactInfo: { email: 'rd@company.com', extension: '2001' },
    settings: {
      defaultLeaveQuota: { annual: 25, sick: 15, personal: 8 }
    }
  }
];

const seedDepartments = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/leave-management');
    console.log('✅ Connected to MongoDB\n');

    // Find admin user to set as creator
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('⚠️  No admin user found. Departments will be created without creator reference.');
    }

    console.log('Seeding departments...\n');

    let created = 0;
    let skipped = 0;

    for (const deptData of departments) {
      const existing = await Department.findOne({ 
        $or: [{ name: deptData.name }, { code: deptData.code }] 
      });

      if (!existing) {
        await Department.create({
          ...deptData,
          createdBy: admin?._id
        });
        console.log(`✅ Created: ${deptData.name} (${deptData.code})`);
        created++;
      } else {
        console.log(`⏭️  Skipped: ${deptData.name} (already exists)`);
        skipped++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created} departments`);
    console.log(`   Skipped: ${skipped} departments`);
    console.log(`   Total: ${created + skipped} departments`);

    // Update employee counts
    console.log('\n🔄 Updating employee counts...');
    const allDepts = await Department.find();
    for (const dept of allDepts) {
      await dept.updateEmployeeCount();
    }
    console.log('✅ Employee counts updated');

  } catch (error) {
    console.error('❌ Error seeding departments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
    process.exit(0);
  }
};

seedDepartments();