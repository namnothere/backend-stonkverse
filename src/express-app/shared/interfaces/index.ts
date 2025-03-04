import { Request } from "express"
import { IUser } from "../../user/models"
export interface IGetUserAuthInfoRequest extends Request {
  user: IUser
}
