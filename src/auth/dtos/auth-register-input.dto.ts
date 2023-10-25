import { IsString, IsStrongPassword, MinLength } from 'class-validator';

export class RegisterInput {
  @IsString()
  @MinLength(3)
  username: string;

  @IsStrongPassword({
    minLength: 6,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 1,
  })
  password: string;
}
