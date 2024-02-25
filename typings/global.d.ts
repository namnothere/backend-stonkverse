import { Payload } from '../src/auth';

export declare global {
  type AnyObject = Record<string, unknown>;

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: string;
      PORT: string;
      DB_TYPE: string;
      DB_HOST: string;
      DB_PORT: string;
      DB_USER: string;
      DB_PASS: string;
      DB_NAME: string;
      DB_SCHEMA: string;
      DB_URL: string;
      JWT_PUBLIC_KEY_BASE64: string;
      JWT_PRIVATE_KEY_BASE64: string;
      JWT_ACCESS_TOKEN_EXP_IN_SEC: string;
      JWT_REFRESH_TOKEN_EXP_IN_SEC: string;
    }
  }

  namespace Express {
    interface Request {
      id: string;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends Payload {}
  }
}
