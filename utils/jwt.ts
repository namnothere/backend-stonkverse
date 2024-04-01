require("dotenv").config();

import { Response } from "express";
import { IUser } from "../user/models";
import { redis } from "./redis";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly?: boolean;
  sameSite?: string;
  secure?: boolean;
  domain?: string;
}

const ACCESS_TOKEN_EXPIRE = 5;
const REFRESH_TOKEN_EXPIRE = 3;

export const accessTokenOptions = {
  expires: new Date(Date.now() + ACCESS_TOKEN_EXPIRE * 60 * 60 * 1000),
  maxAge: ACCESS_TOKEN_EXPIRE * 60 * 60 * 1000,
  httpOnly: true,
  // sameSite: "None",
  secure: true,
};

export const refreshTokenOptions = {
  expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRE * 24 * 60 * 60 * 1000),
  maxAge: REFRESH_TOKEN_EXPIRE * 24 * 60 * 60 * 1000,
  httpOnly: true,
  // sameSite: "None",
  secure: true,
};

export const sendToken = (user: IUser, statusCode: number, res: Response) => {
  const accessToken = user.SignAccessToken();
  const refreshToken = user.SignRefreshToken();

  res.cookie("access_token", accessToken, accessTokenOptions as any);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions as any);

  redis.set(user._id, JSON.stringify(user) as any);

  res.status(statusCode).json({
    success: true,
    user,
    accessToken,
  });
};
