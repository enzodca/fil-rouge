const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_-]+$/
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true,
    maxlength: 255
  },
  password: { 
    type: String, 
    required: true,
    minlength: 8
  },
  role: { 
    type: String, 
    default: 'user',
    enum: ['user', 'admin', 'moderator']
  },
  organization_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Organization' 
  },
  organization_role: { 
    type: String, 
    enum: ['chef', 'membre'] 
  },
  
  isEmailVerified: { 
    type: Boolean, 
    default: false 
  },
  emailVerificationToken: { 
    type: String,
    index: true
  },
  emailVerificationExpires: { 
    type: Date 
  },
  emailVerifiedAt: {
    type: Date
  },

  lastLoginAt: {
    type: Date
  },
  lastLoginIP: {
    type: String
  },
  registrationIP: {
    type: String
  },
  registrationUserAgent: {
    type: String
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLockedUntil: {
    type: Date
  },
  passwordChangedAt: {
    type: Date
  },

  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

userSchema.index({ email: 1, isEmailVerified: 1 });
userSchema.index({ emailVerificationToken: 1, emailVerificationExpires: 1 });
userSchema.index({ lastLoginAt: 1 });
userSchema.index({ accountLockedUntil: 1 });

userSchema.methods.isAccountLocked = function() {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
};

userSchema.methods.incrementFailedLogins = function() {
  if (this.accountLockedUntil && this.accountLockedUntil < Date.now()) {
    this.failedLoginAttempts = 1;
    this.accountLockedUntil = undefined;
  } else {
    this.failedLoginAttempts += 1;

    if (this.failedLoginAttempts >= 5) {
      this.accountLockedUntil = Date.now() + 15 * 60 * 1000;
    }
  }
  
  return this.save();
};

userSchema.methods.resetFailedLogins = function() {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = undefined;
  return this.save();
};

userSchema.pre('save', function(next) {
  this.updated_at = new Date();

  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = new Date();
  }
  
  next();
});

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.emailVerificationToken;
  delete user.failedLoginAttempts;
  delete user.accountLockedUntil;
  delete user.registrationIP;
  delete user.registrationUserAgent;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);
