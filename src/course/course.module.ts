import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseController } from './course.controller';
import { MongooseModule } from '@nestjs/mongoose';
import mongoose from 'mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Course', schema: new mongoose.Schema({}, { strict: false }) }]),
  ],
  controllers: [CourseController],
  providers: [CourseService],
})
export class CourseModule {}
