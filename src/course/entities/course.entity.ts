import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities';

@Entity({ name: 'course', schema: process.env.DB_SCHEMA })
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { name: 'name', nullable: false })
  name: string;

  @Column('text', { name: 'description', nullable: true })
  description: string;

  @Column('text', { name: 'image', nullable: true })
  image: string;

  @Column('float', { name: 'price', default: 0 })
  price: number;

  @ManyToOne(() => User, (user) => user.ownCourses)
  createdBy: User;

  @ManyToMany(() => User, (user) => user.enrollCourses)
  students: User;

  @Column('int', { name: 'likes', default: 0 })
  likes: string;

  @Column('int', { name: 'dislikes', default: 0 })
  dislikes: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  constructor(partial: Partial<Course>) {
    Object.assign(this, partial);
  }
}
