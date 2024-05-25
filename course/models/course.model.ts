import mongoose, { Document, Model, Schema, Types } from "mongoose";
import { IUser } from "../../user/models";

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
  curriculumn: {
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

export interface ICourseData extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  videoThumbnail: object;
  fileCurriculumn: object;
  videoSection: string;
  videoLength: number;
  videoPlayer: string;
  links: ILink[];
  suggestion: string;
  questions: IQuestion[];
  quizzes:IQuestionQuiz[];
}

// QUIZZ
// export interface IQuestionOption extends Document {
//   _id: Types.ObjectId;
//   questionText: string;
//   createdAt: Date;

// }

export interface IAnswerQuiz extends Document {
  _id: Types.ObjectId;
  user: IUser;
  answer: string;
  score: Number;
  createdAt: Date;
}
//main
export interface IQuestionQuiz extends Document {
  _id: Types.ObjectId;
  user: IUser;
  question?: string;
  answers: IAnswerQuiz[];
  correctAnswer: String,
  maxScore:  Number,
  createdAt: Date;
}
// export interface IAnswerOption {
//   _id: Types.ObjectId;
//   user: IUser,
//   answerText: string;
//   isCorrect: boolean;
// }

// export interface IQuiz extends Document {
//   _id: Types.ObjectId;
//   title: string;
//   questions: Types.DocumentArray<IQuestionOption>;
//   passScore: number;
// }

// const quizzQuestionSchema = new mongoose.Schema<IQuestionOption>({
//   questionText: { type: String, required: true },
//   answerOptions: [{
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     answerText: { type: String, required: true },
//     isCorrect: { type: Boolean, required: true }
//   }]
// });

// const quizSchema = new mongoose.Schema<IQuiz>({
//   title: { type: String, required: true },
//   questions: [quizzQuestionSchema],
//   passScore: { type: Number, required: true }
// });

const answerQuizSchema = new Schema<IAnswerQuiz>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    answer: String,
    score: { type: Number, default: 0 },
  },
  { timestamps: true }
);


//main
const questionQuizSchema = new Schema<IQuestionQuiz>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    question: String,
    answers: [answerQuizSchema],
    correctAnswer: String,
    maxScore: {type: Number, default:10},
  },
  { timestamps: true }
);


export interface ICourse extends Document {
  name: string;
  description?: string;
  // category: string;
  price: number;
  estimatedPrice?: number;
  thumbnail: {
    public_id: string;
    url: string;
  };
  curriculumn: {
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
}

const replySchema = new Schema<IReply>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    answer: String,
  },
  { timestamps: true }
);

const reviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    rating: { type: Number, default: 0 },
    comment: String,
    commentReplies: [replySchema],
  },
  { timestamps: true }
);

const linkSchema = new Schema<ILink>({ title: String, url: String });

const commentSchema = new Schema<IQuestion>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    title: String,
    question: String,
    questionReplies: [replySchema],
  },
  { timestamps: true }
);

const courseDataSchema = new Schema<ICourseData>({
  videoUrl: String,
  videoThumbnail: Object,
  fileCurriculumn: Object,
  title: String,
  videoSection: String,
  description: String,
  videoLength: Number,
  links: [linkSchema],
  suggestion: String,
  questions: [commentSchema],
  quizzes: [questionQuizSchema],
});

const courseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    // category: { type: String, required: true },
    price: { type: Number, required: true },
    estimatedPrice: { type: Number },
    thumbnail: {
      public_id: {
        type: String,
        //  required: true
      },
      url: {
        type: String,
        // required: true
      },
    },
    curriculumn: {
      public_id: {
        type: String,
        //  required: true
      },
      url: {
        type: String,
        // required: true
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
  },
  { timestamps: true }
);

export const CourseModel: Model<ICourse> = mongoose.model("Course", courseSchema);