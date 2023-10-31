import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { Paging } from '../../shared/dtos';

export class StocksHistoryFilterInput extends Paging {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  from: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  to: Date;
}
