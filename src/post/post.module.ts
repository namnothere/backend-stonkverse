import { Module } from '@nestjs/common';
import { PostService } from './providers/post.service';
import { PostController } from './controllers/post.controller';

@Module({
  controllers: [PostController],
  providers: [PostService]
})
export class PostModule {}
