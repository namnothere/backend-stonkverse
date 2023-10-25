import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import * as shortid from 'shortid';
import { User } from '../../user/entities';

export enum TRANSACTION_TYPE {
  DEPOSIT = 'DEPOSIT',
  REGISTER_PRODUCT = 'REGISTER_PRODUCT',
  REGISTER_FOREX = 'REGISTER_FOREX',
}

export enum TRANSACTION_STATUS {
  NEW_REQUEST = 'NEW REQUEST',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  PENDING = 'PENDING',
  IN_PROCESS = 'IN PROCESS',
  WAITING_COMPLETED = 'WAITING_COMPLETED',
}

@Entity({ name: 'transaction', schema: process.env.DB_SCHEMA })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'numeric' })
  amount: number;

  @Column({ type: 'numeric', nullable: true })
  amount_before: number;

  @Column({ type: 'numeric', nullable: true })
  amount_after: number;

  @Column({ default: TRANSACTION_STATUS.NEW_REQUEST })
  status: string;

  @Column({ nullable: true })
  name: string;

  @Column({ length: 4000, nullable: true })
  note: string;

  @CreateDateColumn({ name: 'createdAt', type: 'timestamptz', nullable: true })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: true })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.transactions)
  user: User;

  @Column({ nullable: true })
  checkout_url: string;

  @Column({ nullable: true })
  status_url: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  txn_id: string;

  @Column({ nullable: true })
  confirms_needed: string;

  @Column({ nullable: true })
  timeout: number;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  mail: string;

  @Column({ nullable: true, length: 4000 })
  statusSendMail: string;

  @Column({
    type: 'varchar',
    nullable: true,
    unique: true,
    name: 'transaction_code',
  })
  transactionCode: string;

  @Column({ nullable: true })
  method: string;

  @BeforeInsert()
  generateTransactionCode() {
    this.transactionCode = shortid.generate();
  }
}
