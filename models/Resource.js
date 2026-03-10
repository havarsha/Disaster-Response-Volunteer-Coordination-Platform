const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['food', 'water', 'medicine', 'shelter', 'transport', 'equipment', 'clothing', 'other'],
      required: true,
    },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'units' }, // kg, liters, beds, vehicles, etc.
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
      address: { type: String, required: true },
      name: { type: String }, // e.g. "Central Relief Camp"
    },
    status: {
      type: String,
      enum: ['available', 'low', 'depleted', 'reserved'],
      default: 'available',
    },
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    history: [{
      quantity: Number,
      action: { type: String, enum: ['added', 'consumed', 'transferred'] },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date, default: Date.now },
      notes: String,
    }],
  },
  { timestamps: true }
);

resourceSchema.index({ location: '2dsphere' });
resourceSchema.index({ category: 1, status: 1 });

// Auto-update status based on quantity
resourceSchema.pre('save', function (next) {
  if (this.quantity === 0) this.status = 'depleted';
  else if (this.quantity < 10) this.status = 'low';
  else this.status = 'available';
  this.lastUpdated = new Date();
  next();
});

module.exports = mongoose.model('Resource', resourceSchema);
