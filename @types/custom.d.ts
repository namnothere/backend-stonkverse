import { Request } from "express";
import { IUser } from "../user/models";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}
