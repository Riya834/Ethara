const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  floor: { type: Number, required: true },
  zone: { type: String, required: true },
  seatNumber: { type: String, required: true },
  status: { type: String, enum: ['Available', 'Occupied', 'Maintenance'], default: 'Available' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

seatSchema.index({ floor: 1, zone: 1, seatNumber: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
