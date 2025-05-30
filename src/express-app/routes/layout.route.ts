// import express from "express";
const express = require('express');

import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import {
  createLayout,
  editLayout,
  getChatbotResponse,
  getLayoutByType,
} from '../layout/controllers/layout.controller';
import { updateAccessToken } from '../user/controllers/user.controller';

export const layoutRouter = express.Router();

layoutRouter.post(
  '/create-layout',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('ADMIN'),
  createLayout,
);

layoutRouter.put(
  '/edit-layout',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('ADMIN'),
  editLayout,
);

layoutRouter.get('/get-layout/:type', getLayoutByType);

layoutRouter.post('/chatbot', getChatbotResponse);

// export default layoutRouter;
