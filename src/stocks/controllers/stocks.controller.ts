import { Body, Controller, Get } from '@nestjs/common';
import { StocksHistoryFilterInput } from '../dtos';
import { StocksService } from '../providers';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get('filter')
  async filter(@Body() filter: StocksHistoryFilterInput) {
    return this.stocksService.filterStocksHistory(filter);
  }
}
