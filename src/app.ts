import { NextFunction, Request, Response } from 'express';
import * as express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ErrorMiddleware } from './express-app/middleware/error';
import {
  notificationRouter,
  analyticsRouter,
  courseRouter,
  orderRouter,
  userRouter,
  layoutRouter,
} from './express-app/routes';
import { rateLimit } from 'express-rate-limit';
import { contactRouter } from './express-app/routes/contact.route';
import mongoose from 'mongoose';

import { v2 as cloudinary } from "cloudinary";

require('dotenv').config();
// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_SECRET_KEY,
});

export const app = express.default();

app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://frontend-stockverse-v1.vercel.app',
    ],
    credentials: true,
  }),
);

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(
    `\x1b[36m[Nest] ${process.pid}  - ${timestamp}   LOG\x1b[0m [Express] ${req.method} ${req.originalUrl}`,
  );
  next();
});

// Rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use(limiter);
app.use(ErrorMiddleware);

// // Routers
// app.use(
//   "/api/v1",
//   userRouter,
//   courseRouter,
//   orderRouter,
//   notificationRouter,
//   analyticsRouter,
//   layoutRouter,
//   contactRouter
// );

// //Testing the successfully deployed route
// app.get("/", (req: Request, res: Response) => {
//   res.status(200).json({ success: true, message: "Welcome to the API" });
// });

// // Testing API
// app.get("/test", (req: Request, res: Response, next: NextFunction) => {
//   res.status(200).json({ success: true, message: "API is working" });
// });

// Unknown route
// app.all("/api/v1/{*splat}", (req: Request, res: Response, next: NextFunction) => {
//   const err = new Error(`Route ${req.originalUrl} not found`) as any;
//   err.statusCode = 404;
//   next(err);
// });
