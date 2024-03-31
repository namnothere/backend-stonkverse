import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreatePostInput {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsArray()
  images: string[];

  constructor(partial: Partial<CreatePostInput>) {
    Object.assign(this, partial);
  }
}
