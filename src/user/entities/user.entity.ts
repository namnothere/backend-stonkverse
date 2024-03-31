import { Course } from '../../course/entities/course.entity';
import { Post } from '../../post/entities';
import { Transaction } from '../../transaction/entities';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum USER_STATUS {
  NEW_REQUEST = -1,
  NOT_KYC = 0,
  WAITING_CONFIRM = 1,
  ACTIVE = 2,
  BLOCKED = 3,
  REJECT_KYC = 4,
  SUSPEND = 5,
}

export enum USER_GENDER {
  MALE = 0,
  FEMALE = 1,
  OTHER = 2,
}

@Entity({ name: 'users', schema: process.env.DB_SCHEMA || 'system' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  password: string;

  @Unique('username', ['username'])
  @Column({ length: 200 })
  username: string;

  @Unique('user_email', ['email'])
  @Column({ length: 200, nullable: true })
  email: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  gender: USER_GENDER;

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

  @Column('text', { default: Role.USER })
  role: Role;

  @OneToMany(() => Course, (course) => course.createdBy)
  ownCourses: Course[];
  
  @ManyToMany(() => Course, (course) => course.students)
  enrollCourses: Course[];

  @OneToMany(() => Post, (post) => post.createdBy)
  posts: Post[];

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
