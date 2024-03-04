import { Module } from '@nestjs/common';
import * as providers from './providers';

@Module({
  providers: Object.values(providers),
  exports: Object.values(providers),
})
export class LangchainModule {}
