import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import { json, urlencoded } from 'express';
import { Logger as NestLogger } from '@nestjs/common';
import { middleware } from './app.middleware';

async function bootstrap(): Promise<string> {
  const isProduction = process.env.NODE_ENV === 'production';
  // for app micro
  // const appMicro = await NestFactory.create<NestExpressApplication>(AppModule);
  // appMicro.useLogger(appMicro.get(Logger));
  // appMicro.useGlobalInterceptors(new LoggerErrorInterceptor());
  // Express Middleware
  // await appMicro.startAllMicroservices();
  // for http
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  if (isProduction) {
    app.enable('trust proxy');
  }
  app.enableCors();

  // Express Middleware
  middleware(app);

  app.setGlobalPrefix('api/v1');
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));
  await app.listen(process.env.PORT || 3000);
  return app.getUrl();
}

(async (): Promise<void> => {
  try {
    const url = await bootstrap();
    NestLogger.log(url, 'Bootstrap');
  } catch (error) {
    NestLogger.error(error, 'Bootstrap');
  }
})();
