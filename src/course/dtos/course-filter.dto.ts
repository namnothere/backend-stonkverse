import { IsNumber, IsOptional, IsString } from 'class-validator';
import { PaginationParamsDto } from '../../shared/dtos';

export class CourseFilterInput extends PaginationParamsDto {
  @IsString()
  @IsOptional()
  keyword: string;

  @IsNumber()
  @IsOptional()
  price: number;
}
