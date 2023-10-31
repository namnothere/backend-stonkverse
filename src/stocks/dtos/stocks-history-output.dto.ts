import { Expose } from 'class-transformer';

export class StocksHistoryOutput {
  @Expose()
  adjClose: number;

  @Expose()
  date: Date;

  @Expose()
  high: number;

  @Expose()
  low: number;

  @Expose()
  symbol: string;
}
