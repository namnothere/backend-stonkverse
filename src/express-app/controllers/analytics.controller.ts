import { NextFunction, Request, Response } from 'express';
import { CatchAsyncErrors } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import { generateLast12MonthsData } from '../utils/analytics.generator';
import { userModel, IUser } from '../user/models';
import { CourseModel, ICourse } from '../course/models';
import { OrderModel, IOrder } from '../order/models';
import { isAuthenticated } from '../middleware';

// Get users analytics
export const getUserAnalytics = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await generateLast12MonthsData<IUser>(userModel);

      res.status(200).json({ success: true, users: users.last12Months });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Get course analytics
export const getCourseAnalytics = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await generateLast12MonthsData<ICourse>(CourseModel);

      res.status(200).json({ success: true, courses: courses.last12Months });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Get order analytics
export const getOrderAnalytics = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await generateLast12MonthsData<IOrder>(OrderModel);

      res.status(200).json({ success: true, orders: orders.last12Months });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// Get order analytics for instructor
export const getOrderAnalyticsInstructor = [isAuthenticated, CatchAsyncErrors(async (req, res, next) => {
  try {
    const instructorId = req.user?._id || req.params.userId;

    const instructorCourses = await CourseModel.find({
      createdBy: instructorId
    }).select('_id');

    const courseIds = instructorCourses.map(course => course._id);

    const last12Months: any[] = [];
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    for (let i = 11; i >= 0; i--) {
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - 1, 1);

      const monthYear = startDate.toLocaleString('default', {
        month: 'short',
        year: 'numeric',
      });

      const count = await OrderModel.countDocuments({
        createdAt: {
          $gte: startDate,
          $lt: endDate,
        },
        courseId: { $in: courseIds },
      });

      last12Months.push({ month: monthYear, count });
    }

    res.status(200).json({
      success: true,
      orders: last12Months
    });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
}
)
];

export const getBuyersForMyCourses = [isAuthenticated, CatchAsyncErrors(async (req, res, next) => {
    try {
      const instructorId = req.user._id;

      const courses = await CourseModel.find({ createdBy: instructorId }).select('_id');

      const courseIds = courses.map(course => course._id);
      const orders = await OrderModel.find({
        courseId: { $in: courseIds }
      })
        .populate('userId') 
        .populate('courseId', 'price') 
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        orders,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
)];