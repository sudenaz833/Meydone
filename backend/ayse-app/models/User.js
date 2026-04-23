const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    email: { type: String, trim: true, lowercase: true },
    password: { type: String, select: false },
    name: { type: String, trim: true, default: '' },
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    username: { type: String, trim: true, default: '' },
    birthDate: { type: Date, default: null },
    profilePhoto: { type: String, trim: true, default: '' },
    privacy: {
      locationVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public',
      },
      postVisibility: {
        type: String,
        enum: ['public', 'friends', 'private'],
        default: 'public',
      },
    },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Venue' }],
    role: {
      type: String,
      enum: ['user', 'admin', 'owner'],
      default: 'user',
    },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.statics.hashPassword = async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
};

module.exports = mongoose.model('User', userSchema);
