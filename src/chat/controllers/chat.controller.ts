import { Body, Controller, Post } from '@nestjs/common';
import { ChatInputDto } from '../dtos';
import { ChatService } from '../providers';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  async sendMessage(@Body() input: ChatInputDto) {
    return this.chatService.ask(input);
  }
}
