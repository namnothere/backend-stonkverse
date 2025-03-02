import { IsString } from 'class-validator';

export class VerifyPromoInput {
  @IsString()
  courseId: string;

  @IsString()
  code: string;
}
