import { Expose, Type } from 'class-transformer';

export class CourseOutput {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  image: string;

  @Expose()
  @Type(() => Number)
  price: number;

  constructor(partial: Partial<CourseOutput>) {
    Object.assign(this, partial);
  }
}
