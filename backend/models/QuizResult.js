const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, required: true },
  total_questions: { type: Number, required: true },
  time_taken: { type: Number, default: 0 },
  is_first_attempt: { type: Boolean, default: true },
  completed_at: { type: Date, default: Date.now }
});

quizResultSchema.index({ quiz_id: 1, user_id: 1, is_first_attempt: 1 });

module.exports = mongoose.model('QuizResult', quizResultSchema);
