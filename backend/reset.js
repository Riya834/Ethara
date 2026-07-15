const mongoose = require('mongoose');
const User = require('./src/models/User');
const Seat = require('./src/models/Seat');

const MONGO_URI = 'mongodb://127.0.0.1:27017/ethara-seats';

const resetAllocations = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB. Resetting all allocations...');

    // 1. Set all users' seat to null, isNewJoiner to true, and clear allocation date
    await User.updateMany({}, { $set: { seat: null, isNewJoiner: true, allocationDate: null } });
    console.log('Cleared all employee seat assignments.');

    // 2. Set all seats to Available and clear assignedTo
    await Seat.updateMany({}, { $set: { status: 'Available', assignedTo: null } });
    console.log('Set all seats to Available.');

    console.log('All allocations reset successfully!');
    mongoose.disconnect();
  } catch (err) {
    console.error('Error resetting database:', err);
    mongoose.disconnect();
  }
};

resetAllocations();
