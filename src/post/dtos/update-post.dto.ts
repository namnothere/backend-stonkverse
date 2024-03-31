import { PartialType } from '@nestjs/mapped-types';
import { CreatePostInput } from './create-post.dto';

export class UpdatePostDto extends PartialType(CreatePostInput) {
  
}
