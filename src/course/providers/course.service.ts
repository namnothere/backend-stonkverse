import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateCourseDto } from '../dtos/create-course.dto';
import { UpdateCourseDto } from '../dtos/update-course.dto';
import { Course } from '../entities';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../user/entities';
import { ILike, Repository } from 'typeorm';
import { BaseApiResponse, BasePaginationResponse } from '../../shared/dtos';
import { RESULT_STATUS } from '../../shared/constants';
import { plainToClass } from 'class-transformer';
import { CourseFilterInput, CourseOutput } from '../dtos';

@Injectable()
export class CourseService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Course)
    private courseRepo: Repository<Course>,
  ) {}

  async create(id: string, createCourseDto: CreateCourseDto) {
    const user = await this.userRepo.findOne({ where: { id } });
    const course = new Course({
      ...createCourseDto,
      createdBy: user,
    });

    await this.courseRepo.save(course);
    const output = plainToClass(CourseOutput, course, {
      excludeExtraneousValues: true,
    });
    return {
      status: RESULT_STATUS.SUCCEED,
      data: output,
    };
  }

  async getCourses(
    input: CourseFilterInput,
  ): Promise<BasePaginationResponse<any>> {
    const where = {};

    if (input.keyword) {
      where['name'] = ILike(`%${input.keyword}%`);
    }
    if (input.price) {
      where['price'] = ILike(`%${input.price}%`);
    }

    const [courses, count] = await this.courseRepo.findAndCount({
      where,
    });

    if (!courses) {
      throw new BadRequestException('Course not found');
    }
    const output = plainToClass(CourseOutput, courses, {
      excludeExtraneousValues: true,
    });
    return {
      total: count,
      listData: output,
    };
  }

  async getCourse(id: string) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) {
      throw new BadRequestException('Course not found');
    }
    const output = plainToClass(CourseOutput, course, {
      excludeExtraneousValues: true,
    });
    return {
      status: RESULT_STATUS.SUCCEED,
      data: output,
    };
  }

  async update(updateCourseDto: UpdateCourseDto) {
    const course = await this.courseRepo.findOne({
      where: { id: updateCourseDto.id },
    });

    if (!course) {
      throw new BadRequestException('Course not found');
    }

    return {
      status: RESULT_STATUS.SUCCEED,
    };
  }

  async remove(id: string): Promise<BaseApiResponse<null>> {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) {
      throw new BadRequestException('Course not found');
    }
    await this.courseRepo.remove(course);
    return {
      status: RESULT_STATUS.SUCCEED,
    };
  }
}
