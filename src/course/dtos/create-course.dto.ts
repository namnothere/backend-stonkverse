import { IsNumber, IsString } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  image: string;

  @IsNumber()
  price: number;

  constructor(partial: Partial<CreateCourseDto>) {
    Object.assign(this, partial);
  }
}
