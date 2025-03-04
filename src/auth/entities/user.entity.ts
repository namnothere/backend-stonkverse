import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Document } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

export enum USER_ROLE {
  ADMIN = 'ADMIN',
  USER = 'USER',
  INSTRUCTOR = 'INSTRUCTOR',
}

@Schema()
export class User extends Document {}

// export type User = Document & any;

// export const UserSchema = SchemaFactory.createForClass(User);
