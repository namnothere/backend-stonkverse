import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { StocksHistoryOutput, StocksHistoryFilterInput } from '../dtos';
import { BasePaginationResponse } from '../../shared/dtos';
import { History } from '../entities';

@Injectable()
export class StocksService {
  constructor(
    @InjectRepository(History)
    private historyRepo: Repository<History>,
  ) {}

  async filterStocksHistory(
    input: StocksHistoryFilterInput,
  ): Promise<BasePaginationResponse<StocksHistoryOutput>> {
    const where = {};

    if (input.from) {
      where['date'] = MoreThanOrEqual(input.from);
    }

    if (input.to) {
      where['date'] = LessThanOrEqual(input.to);
    }

    if (input.from && input.to) {
      where['date'] = Between(input.from, input.to);
    }

    const [data, count] = await this.historyRepo.findAndCount({
      where,
      order: {
        date: 'DESC',
      },
      skip: input.offset,
      take: input.limit,
    });

    const output = plainToClass(StocksHistoryOutput, data, {
      excludeExtraneousValues: true,
    });

    return {
      listData: output,
      total: count,
    };
  }
}
