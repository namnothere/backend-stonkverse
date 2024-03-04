import { Module } from '@nestjs/common';
import * as controllers from './controllers';
import * as providers from './providers';
import { Course } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Course, User])],
  controllers: Object.values(controllers),
  providers: Object.values(providers),
})
export class CourseModule {}
