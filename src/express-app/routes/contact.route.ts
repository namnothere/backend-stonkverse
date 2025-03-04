// import express from "express";
const express = require('express');

import {
  addNewContact,
  deleteContact,
  getAllContact,
} from '../controllers/contact.controller';
import { isAuthenticated, authorizeRoles } from '../middleware/auth';
import { updateAccessToken } from '../user/controllers';

export const contactRouter = express.Router();

contactRouter.get(
  '/get-contacts',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  getAllContact,
);

contactRouter.delete(
  '/delete-contact/:id',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  deleteContact,
);

contactRouter.post('/contact', addNewContact);
