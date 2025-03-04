import { IsString, MinLength } from 'class-validator';

export class ActivateInput {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  code: string;
}
