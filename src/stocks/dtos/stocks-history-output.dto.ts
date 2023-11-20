import { Expose, Type } from 'class-transformer';

export class StocksHistoryOutput {
  @Expose()
  adjClose: number;

  @Expose()
  date: Date;

  @Expose()
  @Type(() => Number)
  high: number;

  @Expose()
  @Type(() => Number)
  low: number;

  @Expose()
  symbol: string;
}
