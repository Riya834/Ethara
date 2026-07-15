const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['Employee', 'HR', 'Admin', 'Project Manager'], default: 'Employee' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  seat: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat' },
  isNewJoiner: { type: Boolean, default: false },
  allocationDate: { type: Date }
}, { timestamps: true });

userSchema.index({ name: 'text' });
userSchema.index({ email: 1 });

module.exports = mongoose.model('User', userSchema);
