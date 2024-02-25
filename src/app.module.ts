import { Module, ValidationPipe } from '@nestjs/common';
import { AuthModule } from './auth';
import { SharedModule } from './shared';
import { UserModule } from './user';
import { TransactionModule } from './transaction';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { configuration, loggerOptions } from './configs';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import { ExceptionsFilter } from './common';
import { AppController } from './app.controller';
import { StocksModule } from './stocks';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRoot(loggerOptions),
    // TypeOrmModule.forRootAsync({
    //   useFactory: (config: ConfigService) => ({
    //     ...config.get<TypeOrmModuleOptions>('db'),
        // type: 'postgres',
        // url: 'postgresql://apfallinus27:RIk2YjqTVK1W@ep-dark-wood-a1z1omd0.ap-southeast-1.aws.neon.tech/stonkverse?sslmode=require',
    //   }),
    //   inject: [ConfigService],
    // }),
    TypeOrmModule.forRoot({
      type: process.env.DB_TYPE as any,
      url: process.env.DB_URL,
      synchronize: false,
      autoLoadEntities: true,
      logging: true,
    }),
    AuthModule,
    SharedModule,
    UserModule,
    TransactionModule,
    StocksModule,
  ],
  providers: [
    AppController,
    // Global Guard, Authentication check on all routers
    // { provide: APP_GUARD, useClass: AuthenticatedGuard },
    // Global Filter, Exception check
    // Global Pipe, Validation check
    // https://docs.nestjs.com/pipes#global-scoped-pipes
    { provide: APP_FILTER, useClass: ExceptionsFilter },
    // https://docs.nestjs.com/techniques/validation
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        // disableErrorMessages: true,
        transform: true, // transform object to DTO class
        whitelist: true,
      }),
    },
  ],
  exports: [AppController],
})
export class AppModule {}
