import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePostInput } from '../dtos/create-post.dto';
import { UpdatePostDto } from '../dtos/update-post.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities';
import { User } from '../../user/entities';
import { MESSAGES, RESULT_STATUS } from '../../shared/constants';
import { BaseApiResponse } from '../../shared/dtos';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}
  async create(id: string, createPostInput: CreatePostInput): Promise<BaseApiResponse<any>> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(MESSAGES.USER_NOT_FOUND);
    }
    const post = new Post({
      ...createPostInput,
      createdBy: user,
    })

    await this.postRepo.save(post);
    return {
      status: RESULT_STATUS.SUCCEED,
      data: post
    }
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
