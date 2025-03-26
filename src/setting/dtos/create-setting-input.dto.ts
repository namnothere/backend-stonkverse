import { IsMongoId, IsOptional } from 'class-validator';

export class CreateSettingInput {
  @IsOptional()
  @IsMongoId()
  course?: string;

  @IsOptional()
  @IsMongoId()
  courseData?: string;

  @IsOptional()
  testDuration?: number; // minutes

  @IsOptional()
  numberOfQuestions?: number;

  @IsOptional()
  instructionsMessage?: string;

  @IsOptional()
  completionMessage?: string;
}
