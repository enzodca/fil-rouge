const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  content: { type: String, required: true },
  is_correct: { type: Boolean, required: true },
  question_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }
});

module.exports = mongoose.model('Answer', answerSchema);
