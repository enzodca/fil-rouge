const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  type: { type: String, required: true }, // e.g., QCM, order, intrus
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true }
});

module.exports = mongoose.model('Question', questionSchema);
