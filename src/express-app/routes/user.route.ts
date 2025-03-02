// import express from "express";
const express = require('express');

import {
  activateUser,
  deleteUser,
  getAllUsers,
  getUserInfo,
  getUserLearningProgress,
  loginUser,
  logoutUser,
  registrationUser,
  resetUserLearningProgress,
  socialAuth,
  updateAccessToken,
  updateAccessTokenHandler,
  updateLessonCompletion,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
  updateUserRole,
} from '../user/controllers';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';

export const userRouter = express.Router();

userRouter.post('/registration', registrationUser);

userRouter.post('/activate-user', activateUser);

userRouter.post('/login', loginUser);

userRouter.post('/logout', isAuthenticated, logoutUser);

userRouter.get('/refresh', updateAccessTokenHandler);

userRouter.get('/me', updateAccessToken, isAuthenticated, getUserInfo);

userRouter.post('/social-auth', socialAuth);

userRouter.put(
  '/update-user-info',
  updateAccessToken,
  isAuthenticated,
  updateUserInfo,
);

userRouter.put(
  '/update-user-password',
  updateAccessToken,
  isAuthenticated,
  updatePassword,
);

userRouter.put(
  '/update-user-avatar',
  updateAccessToken,
  isAuthenticated,
  updateProfilePicture,
);

userRouter.get(
  '/get-users',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  getAllUsers,
);

userRouter.put(
  '/update-user-role',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  updateUserRole,
);

userRouter.delete(
  '/delete-user/:id',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  deleteUser,
);

userRouter.get('/reset-user-progress', resetUserLearningProgress);
userRouter.get(
  '/user/progress/:courseId',
  updateAccessToken,
  isAuthenticated,
  getUserLearningProgress,
);
userRouter.post(
  '/user/progress/:courseId/:courseDataId',
  updateAccessToken,
  isAuthenticated,
  updateLessonCompletion,
);

// export default userRouter;
