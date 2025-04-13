import cloudinary from 'cloudinary';
import { NextFunction, Request, Response } from 'express';
import { CatchAsyncErrors } from '../../middleware/catchAsyncErrors';
import ErrorHandler from '../../utils/ErrorHandler';
import { LayoutModel } from '../models';
import axios from 'axios';
import { CourseModel } from 'src/express-app/course/models';

// Create Layout
export const createLayout = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const normalizedType = type.trim();

      const isTypeExist = await LayoutModel.findOne({
        type: { $regex: new RegExp(`^${normalizedType}$`, 'i') }
      });

      if (isTypeExist) {
        return next(new ErrorHandler(`${normalizedType} alreay exist`, 400));
      }

      if (normalizedType === 'Banner') {
        const { image, title, subTitle } = req.body;

        const myCloud = await cloudinary.v2.uploader.upload(image, {
          folder: 'layout',
        });

        const banner = {
          image: { public_id: myCloud.public_id, url: myCloud.secure_url },
          title,
          subTitle,
        };

        await LayoutModel.create({ type: 'Banner', banner });
      }

      if (normalizedType === 'FAQ') {
        const { faq } = req.body;
        const faqItems = faq.map((item: any) => ({
          question: item.question,
          answer: item.answer,
        }));
        await LayoutModel.create({ type: 'FAQ', faq: faqItems });
      }

      if (normalizedType === 'Categories') {
        const { categories } = req.body;
        const titleSet = new Set();

        for (const category of categories) {
          const normalizedTitle = category.title.trim().toLowerCase();

          if (normalizedTitle === '') {
            return next(new ErrorHandler("Category title cannot be empty", 400));
          }
          if (titleSet.has(normalizedTitle)) {
            return next(new ErrorHandler(`Duplicate category "${category.title}" in request`, 400));
          }

          titleSet.add(normalizedTitle);
        }

        const existingLayouts = await LayoutModel.find({ type: 'Categories' });

        for (const category of categories) {
          const normalizedTitle = category.title.trim().toLowerCase();

          const isDuplicate = existingLayouts.some(layout =>
            layout.categories.some((existingCategory: any) =>
              existingCategory.title.trim().toLowerCase() === normalizedTitle
            )
          );

          if (isDuplicate) {
            return next(new ErrorHandler(`Category "${category.title}" already exists`, 400));
          }
        }
        const categoryItems = categories.map((category: any) => ({
          title: category.title,
        }));
        await LayoutModel.create({
          type: 'Categories',
          categories: categoryItems,
        });
      }

      res
        .status(200)
        .json({ success: true, message: 'Layout created successfully' });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Edit Layout
export const editLayout = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const normalizedType = type.trim();

      const layoutToUpdate = await LayoutModel.findOne({
        type: { $regex: new RegExp(`^${normalizedType}$`, 'i') }
      });

      if (!layoutToUpdate) {
        return next(new ErrorHandler(`${normalizedType} does not exist`, 404));
      }

      if (normalizedType === 'Banner') {
        const bannerData = await LayoutModel.findOne({ type: 'Banner' });
        const { image, title, subTitle } = req.body;

        const data: any = image.startsWith('https')
          ? bannerData
          : await cloudinary.v2.uploader.upload(image, {
            folder: 'layout',
          });

        const banner = {
          image: {
            public_id: image.startsWith('https')
              ? bannerData?.banner.image.public_id
              : data?.public_id,
            url: image.startsWith('https')
              ? bannerData?.banner.image.url
              : data?.secure_url,
          },
          title,
          subTitle,
        };

        await LayoutModel.findByIdAndUpdate(layoutToUpdate._id, { banner });
      }

      if (normalizedType === 'FAQ') {
        const { faq } = req.body;
        const faqItems = faq.map((item: any) => ({
          question: item.question,
          answer: item.answer,
        }));
        await LayoutModel.findByIdAndUpdate(layoutToUpdate._id, {
          faq: faqItems,
        });
      }

      if (normalizedType === 'Categories') {
        const { categories } = req.body;

        const titleSet = new Set();
        for (const category of categories) {
          const normalizedTitle = category.title.trim().toLowerCase();

          if (normalizedTitle === '') {
            return next(new ErrorHandler("Category title cannot be empty", 400));
          }

          if (titleSet.has(normalizedTitle)) {
            return next(new ErrorHandler(`Category "${category.title}" already exist`, 400));
          }
          titleSet.add(normalizedTitle);
        }

        const existingLayouts = await LayoutModel.find({
          type: 'Categories',
          _id: { $ne: layoutToUpdate._id }
        });

        for (const category of categories) {
          const normalizedTitle = category.title.trim().toLowerCase();

          const isDuplicate = existingLayouts.some(layout =>
            layout.categories.some((existingCategory: any) =>
              existingCategory.title.trim().toLowerCase() === normalizedTitle
            )
          );

          if (isDuplicate) {
            return next(new ErrorHandler(`Category "${category.title}" already exists in another layout`, 400));
          }
        }

        const oldCategoryTitles = (layoutToUpdate.categories || []).map((cat: any) =>
          cat.title.trim().toLowerCase()
        );

        const newCategoryTitles = categories.map((cat: any) =>
          cat.title.trim().toLowerCase()
        );

        const deletedTitles = oldCategoryTitles.filter(
          (oldTitle) => !newCategoryTitles.includes(oldTitle)
        );

        if (deletedTitles.length > 0) {
          await CourseModel.updateMany(
            { category: { $in: deletedTitles } },
            { $set: { category: null } }
          );
        }

        const oldCategoryMap = new Map(
          (layoutToUpdate.categories || []).map((cat: any) => [
            cat.title.trim().toLowerCase(),
            cat.courses || [],
          ])
        );

        const categoryItems = categories.map((category: any) => {
          const normalizedTitle = category.title.trim().toLowerCase();
          return {
            title: category.title.trim(),
            courses: oldCategoryMap.get(normalizedTitle) || []
          };
        });

        await LayoutModel.findByIdAndUpdate(layoutToUpdate._id, {
          type: 'Categories',
          categories: categoryItems,
        });
      }

      res
        .status(200)
        .json({ success: true, message: 'Layout updated successfully' });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

// Get Layout by Type
export const getLayoutByType = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const layout = await LayoutModel.findOne({ type: req.params.type });

      if (!layout) {
        return next(new ErrorHandler("Layout not found", 404));
      }

      if (layout.type === "Categories" && Array.isArray(layout.categories)) {
        for (const category of layout.categories) {
          if (Array.isArray(category.courses) && category.courses.length > 0) {
            const approvedCourses = await CourseModel.find({
              _id: { $in: category.courses },
              status: "APPROVED",
            }).select("_id");

            category.courses = approvedCourses.map(course => course._id);
          }
        }
      }
      res.status(200).json({ success: true, layout });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getChatbotResponse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message } = req.body;
      console.log('mess input:', message);

      if (!message) {
        return next(new ErrorHandler('Message is required', 400));
      }

      const response = await axios.post(
        'http://207.148.64.246:8080/ask',
        { newMessage: message },
        {
          headers: {
            'Content-Type': 'application/json',
            Connection: 'keep-alive',
          },
        },
      );
      console.log('response:', response);

      const botResponse = response.data.response.trim();
      console.log('botResponse:', botResponse);

      res.status(200).json({
        success: true,
        botResponse,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);
