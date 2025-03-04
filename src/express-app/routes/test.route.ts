import { NextFunction, Request, Response } from "express";
const express = require("express");

export const testRouter = express.Router();
//Testing the successfully deployed route
testRouter.get("/", (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "Welcome to the API" });
});

// Testing API
testRouter.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({ success: true, message: "API is working" });
});