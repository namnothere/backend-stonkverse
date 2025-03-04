import { Injectable } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CourseService {
  constructor(
    @InjectModel('Course') private readonly courseModel: Model<any>,
  ) {}
  create(createCourseDto: CreateCourseDto) {
    return 'This action adds a new course';
  }

  findAll() {
    // return `This action returns all course`;
    return this.courseModel
      .find()
      .select(
        '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links',
      )
      .lean()
      .exec();
  }

  findOne(id: number) {
    return `This action returns a #${id} course`;
  }

  update(id: number, updateCourseDto: UpdateCourseDto) {
    return `This action updates a #${id} course`;
  }

  remove(id: number) {
    return `This action removes a #${id} course`;
  }
}
