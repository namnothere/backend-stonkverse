import { NextFunction, Request, Response } from 'express';
import { CatchAsyncErrors } from '../../middleware/catchAsyncErrors';
import ErrorHandler from '../../utils/ErrorHandler';
import { IOrder, OrderModel } from '../models';
import { userModel } from '../../user/models';
import { CourseModel } from '../../course/models';
import { newOrder } from '../providers';
import { sendMail } from '../../utils/sendMail';
import { NotificationModel } from '../../models';
import { redis } from '../../utils/redis';

require('dotenv').config();
// const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

import Stripe from 'stripe';
import { IPromoCode, PromoCodeModel } from '../../../promo-code/entities';
import { makeId } from 'src/shared/utils';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const calculateDiscount = (promo: IPromoCode, price: number) => {
  if (promo) {
    return (price * (100 - promo.percentOff)) / 100;
  }
  return price;
};

// Create order
export const createOrder = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, payment_info, promoCode } = req.body as IOrder;

      if (payment_info) {
        if ('id' in payment_info) {
          const paymentIntentId: any = payment_info.id;
          const paymentIntent =
            await stripe.paymentIntents.retrieve(paymentIntentId);

          if (paymentIntent.status !== 'succeeded') {
            next(new ErrorHandler('Payment not authorized', 400));
          }
        }
      }

      const user = await userModel.findById(req.user?._id);

      const courseExistInUser = user?.courses.find(
        (course: any) => course.courseId === courseId,
      );

      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }

      // TODO: email coupon to user
      if (courseExistInUser) {
        // return next(
        //   new ErrorHandler('You have already purchased this course', 400),
        // );

        await NotificationModel.create({
          user: user?._id,
          title: 'New Order',
          message: `You have a new order from ${course.name}`,
        });

        const couponCode = makeId(8);
        const coupon = await PromoCodeModel.create({
          code: couponCode,
          percentOff: 100,
          usageCount: 0,
          usageLimit: 1,
          course: course._id,
        });

        await coupon.save();

        try {
          const mailData = {
            order: {
              _id: course._id.toString().slice(0, 6),
              name: course.name,
              price: course.price,
              date: new Date().toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              giftCode: couponCode,
            },
          };

          if (user) {
            await sendMail({
              email: user.email,
              subject: 'Order Confirmation',
              template: 're-order-confirmation.ejs',
              data: mailData,
            });
          }
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      const data: any = {
        courseId: course._id,
        userId: user?._id,
        payment_info,
      };

      if (promoCode) {
        const promo = await PromoCodeModel.findOne({ code: promoCode });

        if (!promo) {
          return next(new ErrorHandler('Coupon not found', 404));
        }

        if (promo.usageCount >= promo.usageLimit) {
          return next(new ErrorHandler('Coupon is not active', 400));
        }

        if (promo.expDate && new Date() > promo.expDate) {
          return next(new ErrorHandler('Coupon has expired', 400));
        }

        const discountValue = calculateDiscount(promo, course.price);
        data.payment_info.amount = course.price - discountValue;
      }

      const mailData = {
        order: {
          _id: course._id.toString().slice(0, 6),
          name: course.name,
          price: course.price,
          date: new Date().toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
        },
      };

      try {
        if (user) {
          await sendMail({
            email: user.email,
            subject: 'Order Confirmation',
            template: 'order-confirmation.ejs',
            data: mailData,
          });
        }
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      user?.courses.push({ courseId, createdDate: new Date(Date.now()) });

      if (req.user?.id) {
        await redis.set(req.user?.id, JSON.stringify(user));
      }

      await user?.save();

      await NotificationModel.create({
        user: user?._id,
        title: 'New Order',
        message: `You have a new order from ${course.name}`,
      });

      if (course.purchased || course.purchased === 0) {
        course.purchased += 1;
      }

      course.save();

      // try {
      //   await course.save().then();
      // } catch (error: any) {
      //   // skip
      // }

      newOrder(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getAllOrders = CatchAsyncErrors(
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await OrderModel.find().sort({ createdAt: -1 });

      res.status(200).json({ success: true, orders });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const sendStripePublishableKey = CatchAsyncErrors(
  async (_req: Request, res: Response, next: NextFunction) => {
    res
      .status(200)
      .json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
  },
);

export const newPayment = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const myPayment = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: 'USD',
        metadata: {
          company: 'Stock E-Learning',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res
        .status(201)
        .json({ success: true, client_secret: myPayment.client_secret });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);
