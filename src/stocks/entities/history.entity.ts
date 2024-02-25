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

  @Column('float', { name: 'open_price', nullable: false })
  open: number;

  @Column('float', { name: 'high_price', nullable: false })
  high: number;

  @Column('float', { name: 'low_price', nullable: false })
  low: number;

  @Column('float', { name: 'close_price', nullable: false })
  close: number;

  @Column('float', { name: 'adj_close_price', nullable: true })
  adjClose: number;

  @Column('float', { name: 'volume', nullable: false })
  volume: number;

  @Column('text', { name: 'symbol', nullable: false })
  symbol: string;

  @Column('float', { name: 'change', nullable: true })
  change: string;

  @CreateDateColumn({ nullable: false })
  createdAt: Date;

  @UpdateDateColumn({ nullable: false })
  updatedAt: Date;

  constructor(partial: Partial<History>) {
    Object.assign(this, partial);
  }
}
