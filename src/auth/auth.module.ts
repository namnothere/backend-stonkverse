import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { STRATEGY_JWT_AUTH } from './constants';
import * as controllers from './controllers';
import { AuthSerializer } from './interfaces';
import * as providers from './providers';
import * as strategies from './strategies';
import { SharedModule } from '../shared';
import { MongooseModule } from '@nestjs/mongoose';
import { Schema } from 'mongoose';

@Global()
@Module({
  imports: [
    SharedModule,
    PassportModule.register({ defaultStrategy: STRATEGY_JWT_AUTH }),
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwtSecret'),
        signOptions: { expiresIn: config.get<string>('expiresIn') },
      }),
      inject: [ConfigService],
    }),
    // MongooseModule.forFeature([{ name: 'User', schema: {} as any }]),
    MongooseModule.forFeature([
      { name: 'User', schema: new Schema({}, { strict: false }) },
    ]),
  ],
  controllers: Object.values(controllers),
  providers: [
    ...Object.values(providers),
    ...Object.values(strategies),
    AuthSerializer,
  ],
  exports: Object.values(providers),
})
export class AuthModule {}

// @Global()
// @Module({
//   imports: [
//     SharedModule,
//     PassportModule.register({ defaultStrategy: STRATEGY_JWT_AUTH }),
//     JwtModule.registerAsync({
//       useFactory: (config: ConfigService) => ({
//         secret: config.get('jwtSecret'),
//         signOptions: { expiresIn: config.get<string>('expiresIn') },
//       }),
//       inject: [ConfigService],
//     }),
//     TypeOrmModule.forFeature([User]),
//   ],
//   controllers: Object.values(controllers),
//   providers: [...Object.values(providers), ...Object.values(strategies), AuthSerializer],
//   exports: Object.values(providers),
// })
// export class AuthModule {}
