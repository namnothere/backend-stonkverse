"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newPayment = exports.sendStripePublishableKey = exports.getAllOrders = exports.createOrder = void 0;
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const order_model_1 = __importDefault(require("../models/order.model"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const order_service_1 = require("../services/order.service");
const sendMail_1 = require("../utils/sendMail");
const notification_model_1 = __importDefault(require("../models/notification.model"));
const redis_1 = require("../utils/redis");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
// Create order
exports.createOrder = (0, catchAsyncErrors_1.CatchAsyncErrors)(async (req, res, next) => {
    try {
        const { courseId, payment_info } = req.body;
        if (payment_info) {
            if ("id" in payment_info) {
                const paymentIntentId = payment_info.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== "succeeded") {
                    next(new ErrorHandler_1.default("Payment not authorized", 400));
                }
            }
        }
        const user = await user_model_1.default.findById(req.user?._id);
        const courseExistInUser = user?.courses.find((course) => course.courseId === courseId);
        // Course đã mua rồi thì không thể mua lại nữa
        if (courseExistInUser) {
            return next(new ErrorHandler_1.default("You have already purchased this course", 400));
        }
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new ErrorHandler_1.default("Course not found", 404));
        }
        const data = {
            courseId: course._id,
            userId: user?._id,
            payment_info,
        };
        const mailData = {
            order: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString("vi-VN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                }),
            },
        };
        try {
            if (user) {
                await (0, sendMail_1.sendMail)({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (error) {
            return next(new ErrorHandler_1.default(error.message, 500));
        }
        user?.courses.push({ courseId, createdDate: new Date(Date.now()) });
        await redis_1.redis.set(req.user?.id, JSON.stringify(user));
        await user?.save();
        const notification = await notification_model_1.default.create({
            user: user?._id,
            title: "New Order",
            message: `You have a new order from ${course.name}`,
        });
        if (course.purchased || course.purchased === 0) {
            course.purchased += 1;
        }
        await course.save();
        (0, order_service_1.newOrder)(data, res, next);
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// Get all courses
exports.getAllOrders = (0, catchAsyncErrors_1.CatchAsyncErrors)(async (req, res, next) => {
    try {
        const orders = await order_model_1.default.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, orders });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
// Send Stripe publishable key
exports.sendStripePublishableKey = (0, catchAsyncErrors_1.CatchAsyncErrors)(async (req, res, next) => {
    res
        .status(200)
        .json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
});
// New Payment
exports.newPayment = (0, catchAsyncErrors_1.CatchAsyncErrors)(async (req, res, next) => {
    try {
        const myPayment = await stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: "USD",
            metadata: {
                company: "E-Learning",
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });
        res
            .status(201)
            .json({ success: true, client_secret: myPayment.client_secret });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 400));
    }
});
