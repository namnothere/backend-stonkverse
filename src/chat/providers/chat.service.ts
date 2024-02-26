import { Injectable } from '@nestjs/common';
import { ChatInputDto } from '../dtos';
import { LangchainService } from '../../langchain/providers';

@Injectable()
export class ChatService {
  constructor(private readonly langchainService: LangchainService) {}

  async ask(input: ChatInputDto) {
    return this.langchainService.newMessage(input);
  }
}
