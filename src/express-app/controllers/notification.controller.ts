import { NextFunction, Request, Response } from 'express';
import { CatchAsyncErrors } from '../middleware/catchAsyncErrors';
import ErrorHandler from '../utils/ErrorHandler';
import { NotificationModel } from '../models';
// import cron from "node-cron";
const cron = require('node-cron');

// Get all notifications
export const getAllNotifications = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // const userRole = req.user?.role;
      // let findCondition = {};
      
      // if (userRole !== "ADMIN") {
      //   findCondition = { userId: req.user?._id };
      // }
      // console.log("Find condition:", findCondition);
      const findCondition = { userId: req.user?._id };

      const notifications = await NotificationModel.find(findCondition)
        .sort({ createdAt: -1 });
      
      // console.log("Notifications count:", notifications.length);
      
      res.status(200).json({ success: true, notifications });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Update Notification status
export const updateNotification = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await NotificationModel.findById(req.params.id);
      if (!notification) {
        return next(new ErrorHandler('Notification not found', 404));
      }

      notification.status = 'read';

      await notification.save();

      const notifications = await NotificationModel.find().sort({
        created: -1,
      });

      res.status(200).json({ success: true, notifications });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Delete Notification
cron.schedule('0 0 0 * * *', async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await NotificationModel.deleteMany({
    status: 'read',
    createdAt: { $lt: thirtyDaysAgo },
  });
});
