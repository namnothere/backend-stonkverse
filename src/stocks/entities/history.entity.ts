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

  @Column('timestamptz', { name: 'date', nullable: false })
  date: Date;

  @Column('bigint', { name: 'open_price', nullable: false })
  open: number;

  @Column('bigint', { name: 'high_price', nullable: false })
  high: number;

  @Column('bigint', { name: 'low_price', nullable: false })
  low: number;

  @Column('bigint', { name: 'close_price', nullable: false })
  close: number;

  @Column('bigint', { name: 'adj_close_price', nullable: true })
  adjClose: number;

  @Column('bigint', { name: 'volume', nullable: false })
  volume: number;

  @Column('text', { name: 'symbol', nullable: false })
  symbol: string;

  @Column('text', { name: 'change', nullable: true })
  change: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  constructor(partial: Partial<History>) {
    Object.assign(this, partial);
  }
}
