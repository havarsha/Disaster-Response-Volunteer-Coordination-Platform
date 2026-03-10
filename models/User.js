const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['victim', 'volunteer', 'admin'], default: 'victim' },
    isActive: { type: Boolean, default: true },

    // Volunteer-specific fields
    volunteerProfile: {
      skills: [{
        type: String,
        enum: ['medical_aid', 'transportation', 'rescue', 'food_distribution', 'shelter', 'communication', 'engineering'],
      }],
      isAvailable: { type: Boolean, default: true },
      currentLocation: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      },
      taskRadius: { type: Number, default: 10 }, // km
      totalTasksCompleted: { type: Number, default: 0 },
      rating: { type: Number, default: 0, min: 0, max: 5 },
    },

    // Profile
    profileImage: { type: String },
    address: { type: String },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
    },

    lastLogin: { type: Date },
    fcmToken: { type: String }, // For push notifications
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ 'volunteerProfile.currentLocation': '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
