import mongoose, { Document, Model, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  title: string;
  message: string;
  status: string;
  userId: Types.ObjectId;
}

const notificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: 'unread',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true },
);

export const NotificationModel: Model<INotification> = mongoose.model(
  'Notification',
  notificationSchema,
);
