import { IsString } from 'class-validator';

export class VerifyPromoInput {
  @IsString()
  course: string;

  @IsString()
  code: string;
}
