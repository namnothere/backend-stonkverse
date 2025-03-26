import mongoose, { Document, Model, ObjectId, Schema, Types } from 'mongoose';
import { IUser } from '../../user/models';

export interface IReply extends Document {
  _id: Types.ObjectId;
  user: IUser;
  answer: string;
  createdAt: Date;
}

export interface IQuestion extends Document {
  _id: Types.ObjectId;
  user: IUser;
  title?: string;
  question: string;
  questionReplies: IReply[];
  createdAt: Date;
}

export interface IKeySearch extends Document {
  _id: Types.ObjectId;
  name: string;
  thumbnail: {
    public_id: string;
    url: string;
  };
  curriculum: {
    public_id: string;
    url: string;
  };
}

export interface IReviewReply extends Document {
  _id: Types.ObjectId;
  user: IUser;
  answer: string;
  createdAt: Date;
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  user: IUser;
  rating: number;
  comment: string;
  commentReplies: IReviewReply[];
}

export interface ILink extends Document {
  title: string;
  url: string;
}

export enum COURSE_DATA_STATUS {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ICourseData extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  questions: IQuestion[];
  quiz: IQuestionQuiz[];
  percentAccount: number;
  isFinalTest: boolean;
  status: COURSE_DATA_STATUS;
}

export interface IAnswerQuiz extends Document {
  _id: Types.ObjectId;
  user: IUser;
  answer: string[];
  score: number;
  createdAt: Date;
}

export interface IQuestionQuiz extends Document {
  _id: Types.ObjectId;
  user: IUser;
  title?: string;
  answers: IAnswerQuiz[];
  correctAnswer: string[];
  mockAnswer: string[];
  maxScore: number;
  createdAt: Date;
}

const answerQuizSchema = new Schema<IAnswerQuiz>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    answer: { type: [String], required: true },
    score: { type: Number, default: 0 },
  },
  { timestamps: true },
);

const questionQuizSchema = new Schema<IQuestionQuiz>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    title: String,
    answers: [answerQuizSchema],
    correctAnswer: { type: [String], required: true },
    mockAnswer: { type: [String], required: true },
    maxScore: { type: Number, default: 10 },
  },
  { timestamps: true },
);

export interface ICourse extends Document {
  _id: ObjectId;
  id: ObjectId;
  name: string;
  description?: string;
  category: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: {
    public_id: string;
    url: string;
  };
  curriculum: {
    public_id: string;
    url: string;
  };
  tags: string;
  level: string;
  demoUrl: string;
  benefits: { title: string }[];
  prerequisites: { title: string }[];
  forWho: { title: string }[];
  reviews: IReview[];
  courseData: ICourseData[];
  ratings?: number;
  purchased?: number;
  status: COURSE_STATUS;
  createdBy: Types.ObjectId;
}

const replySchema = new Schema<IReply>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    answer: String,
  },
  { timestamps: true },
);

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, default: 0 },
    comment: String,
    commentReplies: [replySchema],
  },
  { timestamps: true },
);

const linkSchema = new Schema<ILink>({ title: String, url: String });

const commentSchema = new Schema<IQuestion>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    title: String,
    question: String,
    questionReplies: [replySchema],
  },
  { timestamps: true },
);

const courseDataSchema = new Schema<ICourseData>({
  videoUrl: String,
  videoThumbnail: Object,

  title: String,
  videoSection: String,
  description: String,
  videoLength: Number,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
  quiz: [questionQuizSchema],

  percentAccount: { type: Number, default: 0 },
  isFinalTest: { type: Boolean, default: false },

  status: {
    type: String,
    enum: COURSE_DATA_STATUS,
    default: COURSE_DATA_STATUS.PENDING_REVIEW,
  },
});

export enum COURSE_STATUS {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedPrice: { type: Number },
    thumbnail: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    curriculum: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    tags: { type: String, required: true },
    level: { type: String, required: true },
    demoUrl: { type: String, required: true },
    benefits: [{ title: String }],
    prerequisites: [{ title: String }],
    forWho: [{ title: String }],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: { type: Number, default: 0 },
    purchased: { type: Number, default: 0 },
    // isApproved: { type: Boolean, default: false },
    status: {
      type: String,
      enum: COURSE_STATUS,
      default: COURSE_STATUS.PENDING_REVIEW,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

export const CourseModel: Model<ICourse> = mongoose.model(
  'Course',
  courseSchema,
);
