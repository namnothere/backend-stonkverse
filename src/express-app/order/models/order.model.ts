import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IOrder extends Document {
  courseId: string;
  userId: string;
  payment_info: object;
  promoCode: string;
}

const orderSchema = new Schema<IOrder>(
  {
    courseId: { type: String, required: true },
    userId: { type: String, required: true },
    payment_info: { type: Object },
  },
  { timestamps: true },
);

export const OrderModel: Model<IOrder> = mongoose.model('Order', orderSchema);
