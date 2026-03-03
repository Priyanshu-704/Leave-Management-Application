const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanAttendance = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/leave-management');
    console.log('✅ Connected to MongoDB');

    const Attendance = require('../models/Attendance');

    // Find all records with invalid checkout location
    const invalidRecords = await Attendance.find({
      "checkOut.location": { $exists: true },
      $or: [
        { "checkOut.location.coordinates": { $exists: false } },
        { "checkOut.location.coordinates": { $size: 0 } },
        { "checkOut.location.type": { $exists: true, $eq: "Point" }, "checkOut.location.coordinates": { $exists: false } }
      ]
    });

    console.log(`Found ${invalidRecords.length} records with invalid checkout location`);

    for (const record of invalidRecords) {
      // Remove the invalid location field
      if (record.checkOut) {
        // If checkOut has only location and no other data, remove checkOut entirely
        if (Object.keys(record.checkOut.toObject()).length === 1 && record.checkOut.location) {
          record.checkOut = undefined;
        } else {
          // Otherwise just remove the location
          record.checkOut.location = undefined;
        }
        await record.save();
        console.log(`✅ Fixed record: ${record._id}`);
      }
    }

    // Drop and recreate indexes
    console.log('\n🔄 Dropping and recreating indexes...');
    await Attendance.collection.dropIndexes();
    console.log('✅ Indexes dropped');

    // Wait for indexes to be recreated
    await Attendance.init();
    console.log('✅ Indexes recreated');

    console.log('\n✨ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

cleanAttendance();