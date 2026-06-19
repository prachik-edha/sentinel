const mongoose = require('mongoose');

const loginEventSchema = new mongoose.Schema({
  username:  { type: String, required: true },
  ip:        { type: String, required: true },
  success:   { type: Boolean, required: true },
  country:   { type: String, default: 'Unknown' },
  city:      { type: String, default: 'Unknown' },
  userAgent: { type: String, default: '' },
  flagged:   { type: Boolean, default: false },
  flagReason:{ type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('LoginEvent', loginEventSchema);
