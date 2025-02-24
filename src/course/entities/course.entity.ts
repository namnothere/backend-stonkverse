import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CatDocument = HydratedDocument<Course>;

@Schema()
export class Course {
  
}


export const CatSchema = SchemaFactory.createForClass(Course);