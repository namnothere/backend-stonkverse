import mongoose, { Model, Schema } from "mongoose";

export interface IContact {
  email: string;
  problem: string;
  explain: string;
}

const contactSchema: Schema<IContact> = new Schema(
  {
    email: { type: String, required: true },
    problem: { type: String, required: true },
    explain: { type: String, required: true },
  },
  { timestamps: true }
);

export const contactModel: Model<IContact> = mongoose.model("Contact", contactSchema);
