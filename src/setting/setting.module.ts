import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FinalTestSettingSchema } from './entities';
import * as controllers from './controllers';
import * as providers from './providers';
import { Schema } from 'mongoose';

@Module({
  imports: [
    MongooseModule.forFeatureAsync([
      {
        name: 'FinalTestSetting',
        useFactory: () => FinalTestSettingSchema,
      },
      {
        name: 'Course',
        useFactory: () => new Schema({}, { strict: false }),
      },
      {
        name: 'CourseData',
        useFactory: () => new Schema({}, { strict: false }),
      },
    ]),
  ],
  controllers: Object.values(controllers),
  providers: Object.values(providers),
})
export class SettingModule {}
