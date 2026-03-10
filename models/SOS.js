const mongoose = require('mongoose');

const sosSchema = new mongoose.Schema(
  {
    victim: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    disasterType: {
      type: String,
      enum: ['flood', 'earthquake', 'fire', 'landslide', 'cyclone', 'tsunami', 'other'],
      required: true,
    },
    urgencyLevel: {
      type: String,
      enum: ['critical', 'moderate', 'low'],
      default: 'moderate',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'resolved', 'cancelled'],
      default: 'pending',
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: { type: String },
    },
    description: { type: String, maxlength: 1000 },
    numberOfPeople: { type: Number, default: 1, min: 1 },
    images: [{ type: String }], // File paths
    needsRequired: [{
      type: String,
      enum: ['medical', 'food', 'water', 'shelter', 'rescue', 'transport', 'other'],
    }],

    // Assigned volunteer
    assignedVolunteer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date },
    resolvedAt: { type: Date },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolutionNotes: { type: String },

    // Chat room linked to this SOS
    chatRoomId: { type: String },

    // Nearby volunteers notified
    notifiedVolunteers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

sosSchema.index({ location: '2dsphere' });
sosSchema.index({ status: 1 });
sosSchema.index({ urgencyLevel: 1 });
sosSchema.index({ disasterType: 1 });
sosSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SOS', sosSchema);
