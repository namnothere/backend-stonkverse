import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities';
import { Repository } from 'typeorm';
import { plainToClass } from 'class-transformer';
import { UserProfileOutput, UserRoleUpdateInput } from '../dtos';

@Injectable()
export class AdminUserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async updateRole(userId: string, input: UserRoleUpdateInput) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepo.update(userId, {
      role: input.role,
    });

    return plainToClass(UserProfileOutput, user, {
      excludeExtraneousValues: true,
    });
  }
}
