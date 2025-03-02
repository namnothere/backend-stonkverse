import { Request } from 'express';
import { IUser } from '../express-app/user/models';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
