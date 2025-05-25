import { Schema, model, Document, Types } from 'mongoose';
export interface IFinalTestSetting extends Document {
  course?: Types.ObjectId;
  // courseData?: Types.ObjectId;
  testDuration: number;
  numberOfQuestions: number;
  instructionsMessage: string;
  completionMessage: string;
}

export const FinalTestSettingSchema = new Schema<IFinalTestSetting>(
  {
    course: { type: Types.ObjectId, ref: 'Course', default: null },
    // courseData: { type: Types.ObjectId, ref: 'CourseData', default: null },
    testDuration: { type: Number, required: true },
    numberOfQuestions: { type: Number, required: true },
    instructionsMessage: { type: String, required: true },
    completionMessage: { type: String, required: true },
  },
  { timestamps: true },
);

export const FinalTestSettingModel = model<IFinalTestSetting>(
  'FinalTestSetting',
  FinalTestSettingSchema,
);
