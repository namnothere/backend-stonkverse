"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayoutByType = exports.editLayout = exports.createLayout = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
const catchAsyncErrors_1 = require("../middleware/catchAsyncErrors");
const ErrorHandler_1 = __importDefault(require("../utils/ErrorHandler"));
const layout_model_1 = __importDefault(require("../models/layout.model"));
// Create Layout
exports.createLayout = (0, catchAsyncErrors_1.CatchAsyncErrors)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const isTypeExist = await layout_model_1.default.findOne({ type });
        if (isTypeExist) {
            return next(new ErrorHandler_1.default(`${type} alreay exist`, 400));
        }
        if (type === "Banner") {
            const { image, title, subTitle } = req.body;
            const myCloud = await cloudinary_1.default.v2.uploader.upload(image, {
                folder: "layout",
            });
            const banner = {
                image: { public_id: myCloud.public_id, url: myCloud.secure_url },
                title,
                subTitle,
            };
            await layout_model_1.default.create({ type: "Banner", banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = faq.map((item) => ({
                question: item.question,
                answer: item.answer,
            }));
            await layout_model_1.default.create({ type: "FAQ", faq: faqItems });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const categoryItems = categories.map((category) => ({
                title: category.title,
            }));
            await layout_model_1.default.create({
                type: "Categories",
                categories: categoryItems,
            });
        }
        res
            .status(200)
            .json({ success: true, message: "Layout created successfully" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// Edit Layout
exports.editLayout = (0, catchAsyncErrors_1.CatchAsyncErrors)(async (req, res, next) => {
    try {
        const { type } = req.body;
        if (type === "Banner") {
            const bannerData = await layout_model_1.default.findOne({ type: "Banner" });
            const { image, title, subTitle } = req.body;
            const data = image.startsWith("https")
                ? bannerData
                : await cloudinary_1.default.v2.uploader.upload(image, {
                    folder: "layout",
                });
            const banner = {
                type: "Banner",
                image: {
                    public_id: image.startsWith("https")
                        ? bannerData?.banner.image.public_id
                        : data?.public_id,
                    url: image.startsWith("https")
                        ? bannerData?.banner.image.url
                        : data?.secure_url,
                },
                title,
                subTitle,
            };
            await layout_model_1.default.findOneAndUpdate({ type: "Banner" }, { banner });
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const existFaq = await layout_model_1.default.findOne({ type: "FAQ" });
            const faqItems = faq.map((item) => ({
                question: item.question,
                answer: item.answer,
            }));
            await layout_model_1.default.findByIdAndUpdate(existFaq?._id, {
                type: "FAQ",
                faq: faqItems,
            });
        }
        if (type === "Categories") {
            const { categories } = req.body;
            const existCategories = await layout_model_1.default.findOne({
                type: "Categories",
            });
            const categoryItems = categories.map((category) => ({
                title: category.title,
            }));
            await layout_model_1.default.findByIdAndUpdate(existCategories?._id, {
                type: "Categories",
                categories: categoryItems,
            });
        }
        res
            .status(200)
            .json({ success: true, message: "Layout updated successfully" });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
// Get Layout by Type
exports.getLayoutByType = (0, catchAsyncErrors_1.CatchAsyncErrors)(async (req, res, next) => {
    try {
        const layout = await layout_model_1.default.findOne({ type: req.params.type });
        res.status(200).json({ success: true, layout });
    }
    catch (error) {
        return next(new ErrorHandler_1.default(error.message, 500));
    }
});
