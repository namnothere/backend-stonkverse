import { Module } from '@nestjs/common';
import { UserController } from './controllers/user.controller';
import { UserService } from './providers/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from '../transaction/entities';
import { User } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction, User])],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
