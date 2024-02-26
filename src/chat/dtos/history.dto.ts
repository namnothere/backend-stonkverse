import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class HistoryDto {
  @IsNotEmpty()
  @IsString()
  sender: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsNotEmpty()
  @Transform(({ value }) => (new Date(value) ? new Date(value) : null))
  createdAt: Date;
}
