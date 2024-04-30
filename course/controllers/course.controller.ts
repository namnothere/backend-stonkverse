import cloudinary from "cloudinary";
import { CatchAsyncErrors } from "../../middleware/catchAsyncErrors";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../../utils/ErrorHandler";
import { createCourse } from "../providers";
import { CourseModel } from "../models";
import { redis } from "../../utils/redis";
import mongoose from "mongoose";
import { sendMail } from "../../utils/sendMail";
import { NotificationModel } from "../../models";
import axios from "axios";
import { LayoutModel } from "../../layout/models";

// Upload course
export const uploadCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body;
      const thumbnail = data.thumbnail;
      const curriculum = data.curriculum;

      // Upload thumbnail
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      // Upload curriculum
      if (curriculum) {
        const myCloudCurri = await cloudinary.v2.uploader.upload(curriculum, {
          folder: "curriculums",
          resource_type: "raw", // Nếu là PDF hoặc tệp tài liệu
        });
        data.curriculum = {
          public_id: myCloudCurri.public_id,
          url: myCloudCurri.secure_url,
        };
      }

      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Edit Course
export const editCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;
      const curriculum = data.curriculum;
      const courseId = req.params.id;

      let existCourse: any = await CourseModel.findById(courseId);

      if (!existCourse) {
        res.status(404).json({ success: false, message: "Course not found" });
      }

      const categories = await LayoutModel.findOne({ type: "Categories" });

      const oldCategory = categories?.categories.find(
        (category) => category.title === existCourse.category
      );

      if (oldCategory) {
        const courseIndex = oldCategory?.courses?.findIndex(
          (course: any) => course.toString() === existCourse._id.toString()
        );

        oldCategory.courses?.splice(courseIndex, 1);
      }

      // Handling thumbnail updates
      if (thumbnail && !thumbnail.startsWith("https")) {
        await cloudinary.v2.uploader.destroy(existCourse.thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      if (existCourse && thumbnail.startsWith("https")) {
        data.thumbnail = {
          public_id: existCourse?.thumbnail.public_id,
          url: existCourse?.thumbnail.url,
        };
      }
      
       // Handling curriculum updates
       if (curriculum && !curriculum.startsWith("https")) {
        if (existCourse.curriculum && existCourse.curriculum.public_id) {
          await cloudinary.v2.uploader.destroy(existCourse.curriculum.public_id, {
            resource_type: 'raw'
          });
        }
        const curriculumCloud = await cloudinary.v2.uploader.upload(curriculum, {
          resource_type: 'raw',
          folder: "curriculums",
        });
        data.curriculum = {
          public_id: curriculumCloud.public_id,
          url: curriculumCloud.secure_url,
        };
      } else if (curriculum.startsWith("https")) {
        data.curriculum = {
          public_id: existCourse.curriculum.public_id,
          url: existCourse.curriculum.url,
        };
      }

      const updatedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );

      const newCategory = categories?.categories.find(
        (category) => category.title === data.category
      );

      newCategory?.courses.push(updatedCourse?._id);

      await categories?.save();

      res.status(201).json({ success: true, course: updatedCourse });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get Single Course - Without purchasing
export const getSingleCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const course = await CourseModel.findById(courseId)
        .select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
        )
        .populate("reviews.user");

      if (!course) {
        res.status(404).json({ success: false, message: "Course not found" });
      }

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get All Courses - Without purchasing
export const getAllCourses = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModel.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );

      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get Courses By Category
export const getCoursesByCategory = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categorySlug } = req.params;

      const categoryLowerCase = categorySlug.replace(/-/g, " ");

      const arr = categoryLowerCase.split(" ");
      for (var i = 0; i < arr.length; i++) {
        arr[i] = arr[i].charAt(0).toUpperCase() + arr[i].slice(1);
      }
      const category = arr.join(" ");

      const courses = await CourseModel.find({ category }).select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );

      res.status(200).json({ success: true, courses, category });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get Courses By Key Search: Remember add thumbnail
export const getCoursesByKeySearch = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.params;

      const courses = await CourseModel.find({
        name: { $regex: query, $options: "i" },
      }).select(
        "name -_id"
      );
      // check trùng
      const notDuplicate = new Set();

      courses.forEach(course => {
        if (course.name) {
          notDuplicate.add(course.name)
        }
      });

      const courseSearch = [...notDuplicate];
      console.log(courseSearch);
      // const courseSearch = courses.map((course) => {
      //   console.log(course.courseData); // Truy cập và in ra courseData

      //   return course.name;
      // }).flat();
      // console.log(courseSearch[0])

      res.status(200).json({ success: true, courseSearch });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get course content - only for valid user
export const getCourseByUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      const courseExists = userCourseList?.find(
        (course: any) => course.courseId === courseId
      );

      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 403)
        );
      }

      const course = await CourseModel.findById(courseId).populate(
        "courseData.questions.user courseData.questions.questionReplies.user"
      );

      const content = course?.courseData;

      res.status(200).json({ success: true, content });
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  }
);

// Get course for admin page
export const getCourseByAdmin = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const course = await CourseModel.findById(courseId);

      res.status(200).json(course);
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  }
);

// Add questions in course
interface IAddQuestionData {
  title: string;
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, question, courseId, contentId } =
        req.body as IAddQuestionData;
      const course = await CourseModel.findById(courseId);
      console.log(req.body)

      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      // Create new question object
      const newQuestion: any = {
        user: req.user?._id,
        title,
        question,
        questionReplies: [],
      };

      // Add question to course content
      courseContent.questions.push(newQuestion);

      // Create notification
      const notification = await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Created",
        message: `You have a new question in ${courseContent.title}`,
      });

      // Save updated course
      await course?.save();

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Add answer in course content
interface IAddAnswerData {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId } =
        req.body as IAddAnswerData;

      const course = await CourseModel.findById(courseId).populate(
        "courseData.questions.user"
      );

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const question = courseContent.questions.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      // Create new answer object
      const newAnswer: any = { user: req.user?._id, answer };

      // Add answer to course content
      question.questionReplies.push(newAnswer);

      await course?.save();

      // Gửi notification về Admin dashboard khi có answer mới
      if (req.user?._id === question.user._id) {
        await NotificationModel.create({
          user: req.user?._id,
          title: "New Question Reply Created",
          message: `You have a new question reply in ${courseContent.title}`,
        });
      } else {
        // Gửi email thông báo về cho người đặt question khi question có answer mới
        const data = { name: question.user.name, title: courseContent.title };

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Add quiz
interface IAddQuestionQuiz {
  question: string;
  correctAnswer: string;
  courseId: string;
  contentId: string;
}

export const addQuestionQuiz = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, correctAnswer, courseId, contentId } =
        req.body as IAddQuestionQuiz;
      const course = await CourseModel.findById(courseId);
      console.log(req.body)

      // Check course
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      // Check video of course
      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Do not have any source", 400));
      }

      // Create new QUIZ question
      const newQuiz: any = {
        user: req.user?._id,
        question,
        correctAnswer,
        answers: [],

      };

      // Add quiz to course content
      courseContent.quizzes.push({ ...newQuiz, maxScore: 10 });

      // Create notification
      const notification = await NotificationModel.create({
        user: req.user?._id,
        title: "New Quiz Created",
        message: `A new quiz was added to ${courseContent.title}`,
      });

      // Save updated course
      await course?.save();

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Add answer in quiz
interface IAddAnswerQuizz {
  courseId: string;
  contentId: string;
  questionId: string;
  answer: string;
  score: Number,
}

export const addAnswerQuiz = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId } =
        req.body as IAddAnswerQuizz;

      const course = await CourseModel.findById(courseId).populate(
        "courseData.quizzes.user"
      );
      console.log(req.body)

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Do not have any sources", 400));
      }

      const question = courseContent.quizzes.find((item: any) =>
        item._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandler("Invalid content id", 400));
      }

      const score = question.correctAnswer === answer ? 10 : 0;

      // Create new answer object
      const newAnswer: any = { user: req.user?._id, answer, score };

      // Add answer to course content
      question.answers.push(newAnswer);

      await course?.save();

      // Gửi notification về Admin dashboard khi có answer mới
      // if (req.user?._id === question.user._id) {
      //   await NotificationModel.create({
      //     user: req.user?._id,
      //     title: "New Question Reply Created",
      //     message: `You have a new question reply in ${courseContent.title}`,
      //   });
      // } else {

      // Gửi email thông báo về cho người đặt question khi question có answer mới
      if (question.user && question.user.name) { // Kiểm tra xem question.user tồn tại và có trường name không
        const data = { name: question.user.name, title: courseContent.title };

        try {
          await sendMail({
            email: question.user.email,
            subject: "Question Reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (error: any) {
          return next(new ErrorHandler(error.message, 500));
        }
      }


      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Add review in course
export const addReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;

      const courseId = req.params.id;

      // Check if courseId already exists in userCourseList
      const courseExists = userCourseList?.find(
        (course: any) => course.courseId === courseId.toString()
      );

      if (!courseExists) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 400)
        );
      }

      const course = await CourseModel.findById(courseId);

      if (course) {
        const { review, rating } = req.body;

        const reviewData: any = {
          user: req.user?._id,
          comment: review,
          rating,
        };

        course.reviews.push(reviewData);

        // Cập ratings của course sau khi vừa thêm 1 review mới
        const totalRatings =
          course?.reviews.reduce((acc, cur) => acc + cur.rating, 0) || 0;

        const avgRatings = totalRatings / (course?.reviews.length || 0);

        course.ratings = Number(avgRatings.toFixed(2));

        await course.save();

        const updatedCourse = await CourseModel.findById(courseId).populate(
          "reviews.user"
        );

        // Push notification về Admin
        const notification = {
          title: "New Review Created",
          message: `${req.user?.name} has given a review in ${course?.name}`,
        };

        res.status(200).json({
          success: true,
          reviews: updatedCourse?.reviews,
          ratings: updatedCourse?.ratings,
        });
      } else {
        return next(new ErrorHandler("Found no course", 404));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

interface IAddReviewData {
  answer: string;
  courseId: string;
  reviewId: string;
}

// Add review reply - only Admin
export const addReplyToReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, reviewId } = req.body as IAddReviewData;
      const course = await CourseModel.findById(courseId);

      if (!course) {
        return next(new ErrorHandler("Found no course", 404));
      }

      const review = course.reviews.find(
        (review: any) => review._id.toString() === reviewId
      );

      if (!review) {
        return next(new ErrorHandler("Review no course", 404));
      }

      const replyData: any = {
        user: req.user?._id,
        answer,
      };

      review.commentReplies.push(replyData);

      await course?.save();

      const updatedCourse = await CourseModel.findById(courseId).populate(
        "reviews.user reviews.commentReplies.user"
      );

      res.status(200).json({ success: true, reviews: updatedCourse?.reviews });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

// Get all courses
export const getAllCoursesAdmin = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModel.find().sort({ createdAt: -1 });

      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get user's courses
export const getUserCourses = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseIds } = req.body;
      const courses = await CourseModel.find({ _id: { $in: courseIds } })
        .sort({
          createdAt: -1,
        })
        .select("_id name purchased price estimatedPrice courseData thumbnail");

      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Delete course
export const deleteCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await CourseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler("Course not found", 400));
      }

      await CourseModel.deleteOne({ _id: id });

      await redis.del(id);

      // const categories = await LayoutModel.findOne({ type: "Categories" });

      // const oldCategory = categories?.categories.find(
      //   (category) => category.title === course.category
      // );

      // if (oldCategory) {
      //   const courseIndex = oldCategory?.courses?.findIndex(
      //     (course: any) => course.toString() === course._id.toString()
      //   );

      //   oldCategory.courses?.splice(courseIndex, 1);
      // }

      // await categories?.save();

      res
        .status(200)
        .json({ success: true, message: "Course deleted successfully" });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Generate Video URL
export const generateVideoUrl = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        // ttl là Time to live: Thời gian cache
        { ttl: 300 },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
        }
      );

      res.json(response.data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Generate Course Reviews
export const getCourseReviews = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;

      const course = await CourseModel.findById(courseId)
        .select("reviews ratings")
        .populate("reviews.user reviews.commentReplies.user");

      if (!course) {
        return next(new ErrorHandler("Course not found", 400));
      }

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

// Get Course By Query
export const getCourseByQuery = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.params;

      const courses = await CourseModel.find({
        name: { $regex: query, $options: "i" },
      }).select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links"
      );

      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);