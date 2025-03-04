import { notificationRouter } from './notification.route';
import { courseRouter } from './course.route';
import { orderRouter } from './order.route';
import { userRouter } from './user.route';
import { analyticsRouter } from './analytics.route';
import { layoutRouter } from './layout.route';
import { contactRouter } from './contact.route';
import { testRouter } from './test.route';

export const v1Routes = [
  userRouter,
  courseRouter,
  orderRouter,
  notificationRouter,
  analyticsRouter,
  layoutRouter,
  contactRouter,
  testRouter
];

// router.use('/users', userRouter);
// router.use('/courses', courseRouter);
// router.use('/orders', orderRouter);
// router.use('/notifications', notificationRouter);
// router.use('/analytics', analyticsRouter);
// router.use('/layout', layoutRouter);
// router.use('/contact', contactRouter);

// export default router;