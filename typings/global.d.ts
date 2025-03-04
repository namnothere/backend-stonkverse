// import type { Payload } from '../src/auth';

import { IUser } from "src/express-app/user";

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
      DB_PASSWORD: string;
      DB_NAME: string;

      JWT_SECRET: string;
      JWT_REFRESH_SECRET: string;
      DB_URI: string;
    }
  }

  namespace Express {
    interface Request {
      // customProps of pino-http
      customProps: object;
    }

    interface User extends IUser {
      // courses: any[];
      // _id: string;
      // name: string;
      // role: string;
    }
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    // interface User extends Payload {}
  }
}