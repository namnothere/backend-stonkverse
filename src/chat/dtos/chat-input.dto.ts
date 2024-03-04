import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HistoryDto } from './history.dto';

export class ChatInputDto {
  @IsNotEmpty()
  @IsString()
  newMessage: string;

  @IsOptional()
  @IsArray()
  history: HistoryDto[];
}
