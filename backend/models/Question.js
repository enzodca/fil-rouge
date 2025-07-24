const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  content: { type: String, required: true },
  type: { type: String, required: true },
  quiz_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  time_limit: { type: Number, default: 30 },
  audio_file_name: { type: String, default: null },
  audio_data: { type: String, default: null },
  audio_mimetype: { type: String, default: null }
});

module.exports = mongoose.model('Question', questionSchema);
