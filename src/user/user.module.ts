import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transaction/entities';
import { User } from './entities';
import * as providers from './providers';
import * as controllers from './controllers';
@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User])],
  controllers: Object.values(controllers),
  providers: Object.values(providers),
  exports: Object.values(providers),
})
export class UserModule {}
