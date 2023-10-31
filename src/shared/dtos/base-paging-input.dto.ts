import { IsNumber, IsOptional } from 'class-validator';

export class Paging {
  @IsOptional()
  @IsNumber()
  offset = 0;

  @IsOptional()
  @IsNumber()
  limit = 20;
}
