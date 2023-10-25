import { Expose } from 'class-transformer';

export class RegisterOutput {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  username: string;

  @Expose()
  email: string;

  @Expose()
  createdAt: string;

  @Expose()
  updatedAt: string;
}
