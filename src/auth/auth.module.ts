import { Module } from '@nestjs/common';
import * as providers from './providers';
import * as controllers from './controllers';
import { User } from 'src/user/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { STRATEGY_JWT_AUTH } from './constants';
import { AuthSerializer } from './auth.serializer';
import * as strategies from './strategies';
import { SharedModule } from '../shared';

@Module({
  imports: [
    SharedModule,
    // JwtModule.registerAsync({
    //   useFactory: (config: ConfigService) => ({
    //     secret: config.get('jwtSecret'),
    //     signOptions: { expiresIn: '1d' },
    //   }),
    //   inject: [ConfigService],
    // }),
    PassportModule.register({ defaultStrategy: STRATEGY_JWT_AUTH }),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService) => ({
        publicKey: configService.get<string>('jwt.secret'),
        privateKey: configService.get<string>('jwt.refreshSecret'),
        signOptions: {
          algorithm: 'RS256',
          issuer: 'AuthService',
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User]),
  ],
  providers: [
    ...Object.values(providers),
    AuthSerializer,
    ...Object.values(strategies),
  ],
  controllers: Object.values(controllers),
  exports: Object.values(providers),
})
export class AuthModule {}
