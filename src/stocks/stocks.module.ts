import { Module } from '@nestjs/common';
import * as providers from './providers';
import * as controllers from './controllers';
import { History } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
@Module({
  imports: [TypeOrmModule.forFeature([History])],
  providers: Object.values(providers),
  controllers: Object.values(controllers),
})
export class StocksModule {}
