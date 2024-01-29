import { IsString } from 'class-validator';
import { Role } from '../../entities';

export class UserRoleUpdateInput {
  @IsString()
  role: Role;
}
