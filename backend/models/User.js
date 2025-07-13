const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role:     { type: String, default: 'user' },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  organization_role: { type: String, enum: ['chef', 'membre'] },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
