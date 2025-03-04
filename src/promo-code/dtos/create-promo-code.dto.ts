import {
  IsString,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreatePromoCodeInput {
  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsDateString()
  expDate: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentOff: number;

  @IsNumber()
  @Min(1)
  usageLimit: number;
}
