import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'historical_data', schema: process.env.DB_SCHEMA })
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('timestamptz', { name: 'Date', nullable: false })
  date: Date;

  @Column('bigint', { name: 'OpenPrice', nullable: false })
  open: number;

  @Column('bigint', { name: 'HighPrice', nullable: false })
  high: number;

  @Column('bigint', { name: 'LowPrice', nullable: false })
  low: number;

  @Column('bigint', { name: 'ClosePrice', nullable: false })
  close: number;

  @Column('bigint', { name: 'AdjClosePrice', nullable: false })
  adjClose: number;

  @Column('bigint', { name: 'Volume', nullable: false })
  volume: number;

  @Column('text', { name: 'Symbol', nullable: false })
  symbol: string;

  @Column('text', { name: 'Change', nullable: false })
  change: string;

  @CreateDateColumn({ name: 'createdAt', nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt', nullable: false })
  updatedAt: Date;

  constructor(partial: Partial<History>) {
    Object.assign(this, partial);
  }
}
