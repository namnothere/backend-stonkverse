// import express from "express";
const express = require('express');

import {
  addAnswer,
  addReplyToReview,
  addReview,
  deleteCourse,
  editCourse,
  generateVideoUrl,
  getAllCourses,
  getAllCoursesAdmin,
  getCourseByAdmin,
  getCoursesByKeySearch,
  getCourseByQuery,
  getCourseByUser,
  getCourseReviews,
  getSingleCourse,
  getUserCourses,
  uploadCourse,
  addQuestion,
  addAnswerQuiz,
  getAnswersQuiz,
  getIndexStock,
  getCurrentUserProgress,
  getUnapprovedCourses,
  approveCourse,
  rejectCourse,
} from '../course/controllers';
import { authorizeRoles, isAuthenticated } from '../middleware/auth';
import { updateAccessToken } from '../user/controllers';

export const courseRouter = express.Router();

courseRouter.post(
  '/create-course',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  uploadCourse,
);

courseRouter.put(
  '/edit-course/:id',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  editCourse,
);

courseRouter.get('/get-course/:id', getSingleCourse);
courseRouter.get('/search-courses/:query', getCourseByQuery);

courseRouter.get('/get-key-search/:query', getCoursesByKeySearch);

courseRouter.get('/get-courses', getAllCourses);

courseRouter.get(
  '/get-course-content/:id',
  updateAccessToken,
  isAuthenticated,
  getCourseByUser,
);

courseRouter.get(
  '/get-course-by-admin/:id',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  getCourseByAdmin,
);

courseRouter.put(
  '/add-question',
  updateAccessToken,
  isAuthenticated,
  addQuestion,
);
courseRouter.put(
  '/add-reply',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  addReplyToReview,
);

courseRouter.put('/add-answer', updateAccessToken, isAuthenticated, addAnswer);

courseRouter.put(
  '/add-answer-quiz',
  updateAccessToken,
  isAuthenticated,
  addAnswerQuiz,
);

courseRouter.get(
  '/quiz/:contentId',
  updateAccessToken,
  isAuthenticated,
  getAnswersQuiz,
);
courseRouter.put(
  '/add-review/:id',
  updateAccessToken,
  isAuthenticated,
  addReview,
);

courseRouter.get(
  '/get-all-courses',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  getAllCoursesAdmin,
);

courseRouter.post(
  '/get-user-courses',
  updateAccessToken,
  isAuthenticated,
  getUserCourses,
);

courseRouter.get('/get-reviews/:courseId', getCourseReviews);

courseRouter.post('/get-vdo-cipher-otp', generateVideoUrl);

courseRouter.delete(
  '/delete-course/:id',
  updateAccessToken,
  isAuthenticated,
  authorizeRoles('admin'),
  deleteCourse,
);

courseRouter.get('/get-index', getIndexStock);

courseRouter.post(
  '/get-user-progress',
  updateAccessToken,
  isAuthenticated,
  getCurrentUserProgress,
);

courseRouter.get(
  '/admin/courses/pending-review',
  // updateAccessToken,
  // isAuthenticated,
  // authorizeRoles('admin'),
  getUnapprovedCourses,
);

courseRouter.put(
  '/admin/courses/:id/approve',
  // updateAccessToken,
  // isAuthenticated,
  // authorizeRoles('admin'),
  approveCourse,
);
courseRouter.put(
  '/admin/courses/:id/reject',
  // updateAccessToken,
  // isAuthenticated,
  // authorizeRoles('admin'),
  rejectCourse,
);

// courseRouter.get('/get-user-quiz-scores',updateAccessToken, isAuthenticated, getUserQuizScores);

// export default courseRouter;
