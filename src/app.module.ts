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
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggerModule.forRoot(loggerOptions),
    TypeOrmModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        ...config.get<TypeOrmModuleOptions>('db'),
      }),
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: `${__dirname}/../public`,
      renderPath: '/',
    }),
    AuthModule,
    SharedModule,
    UserModule,
    TransactionModule,
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
  exports: [AppController]
})
export class AppModule {}
