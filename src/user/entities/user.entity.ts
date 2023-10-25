import { Transaction } from '../../transaction/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum USER_STATUS {
  NEW_REQUEST = -1,
  NOT_KYC = 0,
  WAITING_CONFIRM = 1,
  ACTIVE = 2,
  BLOCKED = 3,
  REJECT_KYC = 4,
  SUSPEND = 5,
}

@Entity({ name: 'users', schema: process.env.DB_SCHEMA })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  password: string;

  @Unique('username', ['username'])
  @Column({ length: 200 })
  username: string;

  // @Unique('user_email', ['email'])
  // @Column({ length: 200 })
  // email: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  gender: number;

  @CreateDateColumn({ name: 'createdAt', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: false })
  updatedAt: Date;

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];

  @Column({ nullable: true })
  verification_code: string;

  @Column({ type: 'numeric', nullable: true })
  verification_time: number;

  @Column({ nullable: true })
  token: string;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
