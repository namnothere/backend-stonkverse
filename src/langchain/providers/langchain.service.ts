import { Injectable } from '@nestjs/common';
import { SqlDatabase } from 'langchain/sql_db';
import { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions.js';
import { DataSource } from 'typeorm';

import { OpenAI } from '@langchain/openai';
import { createSqlAgent, SqlToolkit } from 'langchain/agents/toolkits/sql';
import { AgentExecutor } from 'langchain/agents';
import { SqlDatabaseChain } from 'langchain/chains/sql_db';
import { PromptTemplate } from '@langchain/core/prompts';
import { RESULT_STATUS, TEMPLATE } from '../../shared/constants';
import { ChatInputDto } from '../../chat/dtos';

@Injectable()
export class LangchainService {
  private currentPrompt: string = TEMPLATE;
  private dbChain: SqlDatabaseChain;
  private db: SqlDatabase;
  private executor: AgentExecutor;

  constructor() {
    this.init(this.currentPrompt).then();
  }

  async init(newPrompt: string) {
    const connection = {
      type: process.env.DB_TYPE,
      url: process.env.DB_URL,
      logging: true,
      schema: process.env.DB_SCHEMA,
    } as PostgresConnectionOptions;

    const datasource = new DataSource(connection);
    const db = await SqlDatabase.fromDataSourceParams({
      appDataSource: datasource,
      includesTables: ['historical_data'],
    });
    const model = new OpenAI({
      modelName: 'gpt-3.5-turbo-0125',
      temperature: 0,
    });
    const toolkit = new SqlToolkit(db, model);
    let prompt;
    if (newPrompt != '' && newPrompt.length > 0) {
      prompt = PromptTemplate.fromTemplate(newPrompt);
      this.currentPrompt = newPrompt;
    } else {
      prompt = PromptTemplate.fromTemplate(TEMPLATE);
      this.currentPrompt = TEMPLATE;
    }

    this.dbChain = new SqlDatabaseChain({
      llm: model,
      database: db,
      sqlOutputKey: 'sql',
      prompt: prompt,
    });
    this.executor = createSqlAgent(model, toolkit);
    console.log('done create new agent');
  }

  async newMessage(input: ChatInputDto) {
    try {
      const result = await this.dbChain.call(
        { query: input.newMessage },
        {
          recursionLimit: 3,
        },
      );
      console.log(result);
      return {
        output: result.result,
        intermediate_steps: result.intermediateSteps
          ? result.intermediateSteps
          : null,
        sql: [result.sql],
      };
    } catch (error) {
      console.log(error);
      return {
        status: RESULT_STATUS.FAILED,
        error: error,
      };
    }
  }
}
