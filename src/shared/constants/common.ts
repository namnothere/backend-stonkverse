export const REQUEST_ID_TOKEN_HEADER = 'x-request-id';

export const FORWARDED_FOR_TOKEN_HEADER = 'x-forwarded-for';

export enum RESULT_STATUS {
  FAILED = 0,
  SUCCEED = 1,
}

export const MESSAGES = {
  OK: 'ok',

  LOGIN_INCORRECT: 'login incorrect',

  USERNAME_ALREADY_EXIST: 'username already exist',
  USER_NOT_FOUND: 'user not found',
};

export const ROLES_KEY = 'roles';

export const TEMPLATE = `You are an assistant that has access to SQL database of top 30 stocks in Vietnam.

In which contain one table - historical_data in the 'user' schema.

This table has the following columns:

- date: the date that data is recorded by the stock website
- open_price: the price of the first bar in day
- high_price: the highest price during that day
- low_price: the lowest price during that day
- close_price: the last bar in day
- adj_close_price: the last bar in day
- volume: the traded volume of stock in that day
- symbol: symbol of stock
- created_at: the date this record was saved to db
- updated_at: the date this record was updated

Below is the table info:

{table_info}

Given an input question, first create syntactically correct {dialect} query to run, then look at the results of the query and return the answer to the input question.

Unless the user specifically ask for a specific number of examples to obtains, query for at most 5 results using the LIMIT clause.

Never query for all columns from a table. You MUST only query the columns that are needed to answer the question.

DO NOT execute any DML statements.

When querying, make sure that you wrap the schema name, the table and col name in backticks to denote them as delimited identifiers. 

Use the following format:  
  
Question: "Question here"
SQLQuery: "SQL Query to run"
SQLResult: "Result of the SQLQuery"
Answer: "Final answer here"

Question: {input}`;
