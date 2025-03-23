// import express from "express";
const express = require('express');

import {
  getCourseAnalytics,
  getOrderAnalytics,
  getUserAnalytics,
} from '../controllers/analytics.controller';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { updateAccessToken } from '../user/controllers';

export const analyticsRouter = express.Router();

analyticsRouter.get(
  '/get-users-analytics',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('ADMIN'),
  getUserAnalytics,
);

analyticsRouter.get(
  '/get-courses-analytics',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('ADMIN'),
  getCourseAnalytics,
);

analyticsRouter.get(
  '/get-orders-analytics',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('ADMIN'),
  getOrderAnalytics,
);

// export default analyticsRouter;
