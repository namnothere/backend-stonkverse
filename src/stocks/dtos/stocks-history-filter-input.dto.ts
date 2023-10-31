import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { PaginationParamsDto } from '../../shared/dtos';

export class StocksHistoryFilterInput extends PaginationParamsDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to: Date;
}
