import { IsOptional } from 'class-validator';

export class SettingFilterInput {
  @IsOptional()
  courseId?: string;

  @IsOptional()
  courseDataId?: string;
}
