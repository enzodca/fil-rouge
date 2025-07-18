const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  creator_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  visibility: {
    type: String,
    enum: ['public', 'private', 'organization'],
    default: 'public'
  },
  allowed_emails: [{ type: String }],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Quiz', quizSchema);
