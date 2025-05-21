// import express from "express";
const express = require('express');

import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import {
  getAllNotifications,
  updateNotification,
} from '../controllers/notification.controller';
import { updateAccessToken } from '../user/controllers/user.controller';

export const notificationRouter = express.Router();

notificationRouter.get(
  '/get-all-notifications',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('ADMIN', 'INSTRUCTOR'),
  getAllNotifications,
);

notificationRouter.put(
  '/update-notification/:id',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('ADMIN'),
  updateNotification,
);

// export default notificationRouter;
