import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateSettingInput,
  SettingFilterInput,
  UpdateSettingInput,
} from '../dtos';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IFinalTestSetting } from '../entities';
import { MESSAGES } from '../../shared/constants';
import { ICourse, ICourseData } from 'src/express-app/course';

@Injectable()
export class SettingAdminService {
  constructor(
    @InjectModel('FinalTestSetting')
    private readonly settingRepo: Model<IFinalTestSetting>,
    @InjectModel('Course')
    private readonly courseRepo: Model<ICourse>,
    @InjectModel('CourseData')
    private readonly courseDataRepo: Model<ICourseData>,
  ) {}

  async create(input: CreateSettingInput) {
    const { course, courseData } = input;

    if (!course && !courseData) {
      throw new NotFoundException(
        'Either courseId or courseDataId is required',
      );
    }

    const existingSetting = await this.settingRepo.findOne({
      $or: [{ course: course || null }, { courseData: courseData || null }],
    });

    if (existingSetting) {
      throw new ForbiddenException(MESSAGES.SETTING_ALREADY_EXISTS);
    }
    if (course) {
      const courseExists = await this.courseRepo.findById(course);
      if (!courseExists) throw new NotFoundException(MESSAGES.COURSE_NOT_FOUND);
    }

    if (courseData) {
      const courseDataExists = await this.courseDataRepo.findById(courseData);
      if (!courseDataExists)
        throw new NotFoundException(MESSAGES.COURSE_DATA_NOT_FOUND);
    }

    const setting = new this.settingRepo({ ...input });
    return setting.save();
  }

  async getSettings(filter: SettingFilterInput) {
    if (!filter) {
      return this.settingRepo.find();
    }

    const setting = await this.settingRepo.findOne({
      $or: [
        { course: filter.courseId || null },
        { courseData: filter.courseDataId || null },
      ],
    });

    if (!setting) {
      throw new NotFoundException('Setting not found');
    }

    return setting;
  }

  findOne(id: string) {
    const setting = this.settingRepo.findById(id);
    if (!setting) {
      throw new NotFoundException(MESSAGES.SETTING_NOT_FOUND);
    }

    return setting;
  }

  async update(id: string, input: UpdateSettingInput) {
    const setting = await this.settingRepo.findById(id);

    if (!setting) {
      throw new NotFoundException(MESSAGES.SETTING_NOT_FOUND);
    }

    return this.settingRepo.findByIdAndUpdate(id, input, { new: true });
  }

  async remove(id: string) {
    const setting = await this.settingRepo.findByIdAndDelete(id).exec();
    if (!setting) {
      throw new BadRequestException(MESSAGES.SETTING_NOT_FOUND);
    }
    return setting;
  }
}
