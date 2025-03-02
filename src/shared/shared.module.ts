import { Global, Module } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
// import { MailerModule } from '@nestjs-modules/mailer';
// import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
// import { join } from 'path';

// import * as controllers from './controllers';
// import * as providers from './providers';

@Global()
@Module({
  imports: [
    // MailerModule.forRootAsync({
    //   useFactory: (config: ConfigService) => ({
    //     transport: {
    //       host: config.get('MAIL_HOST'),
    //       secure: false,
    //       auth: {
    //         user: config.get('MAIL_USERNAME'),
    //         pass: config.get('MAIL_PASSWORD'),
    //       },
    //     },
    //     defaults: {
    //       from: `"No Reply" <${config.get('MAIL_FROM')}>`,
    //     },
    //     template: {
    //       dir: join(__dirname, 'mail', 'templates'),
    //       adapter: new HandlebarsAdapter(),
    //       options: {
    //         strict: true,
    //       },
    //     },
    //   }),
    //   inject: [ConfigService],
    // }),
  ],
  // controllers: Object.values(controllers),
  // providers: Object.values(providers),
  // exports: Object.values(providers),
})
export class SharedModule {}
