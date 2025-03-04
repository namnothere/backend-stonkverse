import { Module } from '@nestjs/common';
import * as controllers from './controllers';
import * as providers from './providers';
import { MongooseModule } from '@nestjs/mongoose';
import { PromoCodeSchema } from './entities';
import { Schema } from 'mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'PromoCode',
        schema: PromoCodeSchema,
      },
      {
        name: 'User',
        schema: new Schema({}, { strict: false })
      }
    ])
  ],
  controllers: [...Object.values(controllers)],
  providers: [...Object.values(providers)],
})
export class PromoCodeModule {}
