import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';
import { IsString } from 'class-validator';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @IsString()
  id: string;
}
