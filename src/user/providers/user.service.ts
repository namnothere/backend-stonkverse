import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { UserProfileOutput } from '../dtos';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getProfile(userId: string): Promise<UserProfileOutput> {
    const user = this.userRepo.findOne({
      where: { id: userId },
    });

    const output = plainToClass(UserProfileOutput, user, {
      excludeExtraneousValues: true,
    });

    return output;
  }
}
