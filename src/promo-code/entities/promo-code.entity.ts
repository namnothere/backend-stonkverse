import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Document, Types } from 'mongoose';

export type PromoCodeDocument = HydratedDocument<PromoCode>;

@Schema({ timestamps: true })
export class PromoCode extends Document {
  @Prop({ type: String, required: true, unique: true })
  code: string;

  @Prop({ type: Types.ObjectId, ref: 'Course', default: null })
  course?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  expDate: Date;

  @Prop({ type: Number, required: true })
  percentOff: number;

  @Prop({ type: Number, default: 1 })
  usageLimit: number;

  @Prop({ type: Number, default: 0 })
  usageCount: number;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  createdBy?: Types.ObjectId;
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode);
