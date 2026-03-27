import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    surname: {
      type: String,
      required: [true, 'Surname is required'],
      trim: true,
      maxlength: [100, 'Surname cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-z0-9_]+$/, 'Username may only contain lowercase letters, numbers, and underscores'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    birthDate: {
      type: Date,
      required: [true, 'Birth date is required'],
    },
    phone: {
      type: String,
      trim: true,
      default: null,
      match: [/^\+?[0-9]{7,15}$/, 'Please provide a valid phone number'],
    },
    profilePhoto: {
      type: String,
      trim: true,
      default: null,
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'private', 'friends_only'],
      default: 'public',
    },
    commentVisibility: {
      type: String,
      enum: ['public', 'private', 'friends_only'],
      default: 'friends_only',
    },
    postsVisibility: {
      type: String,
      enum: ['public', 'private', 'friends_only'],
      default: 'friends_only',
    },
    locationVisibility: {
      type: String,
      enum: ['public', 'private', 'friends_only'],
      default: 'friends_only',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'owner'],
      default: 'user',
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);
