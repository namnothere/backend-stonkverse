import { Expose, Type } from 'class-transformer';

// import { RoleOutput } from './role-output.dto';

export class UserProfileOutput {
  @Expose()
  id: string;

  @Expose()
  username: string;

  @Expose()
  code: string;

  @Expose()
  reference_code: string;

  // @Expose()
  // @Type(() => RoleOutput)
  // role: RoleOutput;

  // @Expose()
  // email: string;

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
  gender: number;

  @Expose()
  verification_code: string;

  @Expose()
  avatar: string;
}
