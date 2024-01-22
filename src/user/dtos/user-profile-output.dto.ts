import { Expose, Type } from 'class-transformer';
// import { RoleOutput } from './role-output.dto';
import { USER_GENDER } from '../entities';
export class UserProfileOutput {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  code: string;

  @Expose()
  email: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;

  @Expose()
  parent_id: string;

  @Expose()
  full_name: string;

  @Expose()
  phone: string;

  @Expose()
  @Type(() => Number)
  gender: USER_GENDER;

  @Expose()
  verification_code: string;

  @Expose()
  avatar: string;

  @Expose()
  role: string;
}
