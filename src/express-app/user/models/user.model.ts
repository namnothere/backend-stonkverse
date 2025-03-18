import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
require('dotenv').config();
import jwt from 'jsonwebtoken';

const emailRegexPattern: RegExp =
  /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;

interface ICourse {
  courseId: string;
  createdDate: Date;
}

export enum TEST_COURSE_STATUS {
  NEW = 'NEW',
  FAILED = 'FAILED',
  PASSED = 'PASSED',
}

export interface IUser extends Document {
  _id: string;
  id: string;
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: ICourse[];
  isActive: boolean;
  token: string;
  finalScore: number;

  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: [true, 'Please enter your name'] },
    email: {
      type: String,
      required: [true, 'Please enter your email'],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: 'Please enter a valid email',
      },
      unique: true,
    },
    password: {
      type: String,
      minLength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: 'user',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    token: {
      type: String,
    },
    courses: [{ courseId: String, createdDate: Date }],
  },
  { timestamps: true },
);

export interface ILearningProgress extends Document {
  user: IUser;
  courseId: string;
  progress: string[];
}

export const LearningProgressSchema = new Schema<ILearningProgress>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  courseId: String,
  progress: [String],
});

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.SignAccessToken = function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN as string, {
    expiresIn: '5m',
  });
};

userSchema.methods.SignRefreshToken = function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN as string, {
    expiresIn: '3d',
  });
};

userSchema.methods.comparePassword = async function (
  enteredPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

export interface IUserScore extends Document {
  user: IUser;
  courseId: string;
  finalScore: number;
  testCourseStatus: TEST_COURSE_STATUS;
  createdAt: Date;
}

export const UserScoreSchema = new Schema<IUserScore>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  courseId: String,
  createdAt: Date,
  finalScore: { type: Number, default: 0 },
  testCourseStatus: { type: String, default: TEST_COURSE_STATUS.NEW },
});

export const userModel: Model<IUser> = mongoose.model('User', userSchema);
export const learningProgressModel: Model<ILearningProgress> = mongoose.model(
  'LearningProgress',
  LearningProgressSchema,
);

// TODO: insert new document when user finish a course
export const userScoreModel: Model<IUserScore> = mongoose.model( 
  'UserScore',
  UserScoreSchema,
);
