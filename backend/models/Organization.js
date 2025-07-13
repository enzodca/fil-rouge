const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Le nom est requis'],
    unique: true,
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  members: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }],
  created_at: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});


organizationSchema.index({ name: 1 });
organizationSchema.index({ members: 1 });

module.exports = mongoose.model('Organization', organizationSchema);