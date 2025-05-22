import cloudinary from 'cloudinary';
import { CatchAsyncErrors } from '../../middleware/catchAsyncErrors';
import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../../utils/ErrorHandler';
import { checkContent, createCourseInDB, updateCourseInDB } from '../providers';
import {
  COURSE_DATA_STATUS,
  COURSE_STATUS,
  CourseModel,
  IAnswerQuiz,
  ICourse,
  ICourseData,
  IQuestionQuiz,
} from '../models';
import { redis } from '../../utils/redis';
import mongoose from 'mongoose';
import { NotificationModel } from '../../models';
import axios from 'axios';
import { LayoutModel } from '../../layout/models';
import { TEST_COURSE_STATUS, userScoreModel } from '../../user/models';
import { MESSAGES } from '../../shared/common';
import { userModel } from '../../user/models';

export const uploadCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body;
      const thumbnail = data.thumbnail;
      const curriculum = data.curriculum;

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: 'courses',
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      if (curriculum) {
        const myCloudCurri = await cloudinary.v2.uploader.upload(curriculum, {
          resource_type: 'auto',
          folder: 'curriculums',
          // }).then((result) => {
          //     console.log("Upload successful");
          //     console.log(result);
          // }).catch((error) => {
          //     console.log("An error occurred:");
          //     console.log(error);
        });
        data.curriculum = {
          public_id: myCloudCurri.public_id,
          url: myCloudCurri.secure_url,
        };
      }
      // console.log('Quiz data:', data.courseData[0].quiz);

      // const isContentSafe = await checkContent(req.body);

      // console.log("isContentSafe:", isContentSafe)

      // if (!isContentSafe ) {
      //   return next(new ErrorHandler("Cannot create answer with inappropriate content", 400));
      // }

      const course = await createCourseInDB(data, res, next);
      res.status(201).json({ success: true, course });
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status || 500));
    }
  },
);

export const editCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const courseId = req.params.id;

      const existCourse: any = await CourseModel.findById(courseId);

      if (!existCourse) {
        res.status(404).json({ success: false, message: 'Course not found' });
        return;
      }

      const categories = await LayoutModel.findOne({ type: 'Categories' });

      const oldCategory = categories?.categories.find(
        (category) => category.title === existCourse.category,
      );

      if (oldCategory) {
        const courseIndex = oldCategory?.courses?.findIndex(
          (course: any) => course.toString() === existCourse._id.toString(),
        );

        oldCategory.courses?.splice(courseIndex, 1);
      }

      if (data.thumbnail) {
        const thumbnail = data.thumbnail;
        if (!thumbnail.startsWith('https')) {
          const thumbnailCloud = await cloudinary.v2.uploader.upload(
            thumbnail,
            {
              folder: 'courses',
              resource_type: 'auto',
              allowedFormats: ['jpg', 'png', 'pdf'],
            },
          );
          data.thumbnail = {
            public_id: thumbnailCloud.public_id,
            url: thumbnailCloud.secure_url,
          };
        }
      }

      if (data.curriculum) {
        const curriculum = data.curriculum;
        if (!curriculum.startsWith('https')) {
          const curriculumCloud = await cloudinary.v2.uploader.upload(
            curriculum,
            {
              resource_type: 'auto',
              folder: 'curriculums',
              allowedFormats: ['jpg', 'png', 'pdf'],
            },
          );
          data.curriculum = {
            public_id: curriculumCloud.public_id,
            url: curriculumCloud.secure_url,
          };
        }
      }

      // const isContentSafe = await checkContent(req.body);

      // console.log("isContentSafe:", isContentSafe)

      // if (!isContentSafe ) {
      //   return next(new ErrorHandler("Cannot create answer with inappropriate content", 400));
      // }

      const updatedCourse = await updateCourseInDB(courseId, req.body);
      if (!updatedCourse) {
        return res
          .status(404)
          .json({ success: false, message: 'Course not found' });
      }

      if (data.category && data.category !== existCourse.category) {
        const newCategory = categories?.categories.find(
          (category) => category.title === data.category,
        );

        if (newCategory) {
          newCategory.courses.push(updatedCourse._id);
          await categories?.save();
        }
      } else if (categories) {
        // Save categories anyway to persist the removal from old category
        await categories.save();
      }

      res.status(200).json({ success: true, course: updatedCourse });
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status || 500));
    }
  },
);

export const getSingleCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const course = await CourseModel.findOne({
        _id: courseId,
        status: 'APPROVED',
      })
        .select(
          '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links',
        )
        .populate('reviews.user');

      if (!course) {
        res.status(404).json({ success: false, message: 'Course not found' });
      }

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getAllCourses = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModel.find({ status: 'APPROVED' }).select(
        '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links',
      );

      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getCoursesByKeySearch = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.params;

      const courses = await CourseModel.find({
        name: { $regex: query, $options: 'i' },
        status: 'APPROVED',
      }).select('thumbnail name ratings');

      console.log(courses[0]);

      const notDuplicate = new Map();

      courses.forEach((course) => {
        if (course.name) {
          notDuplicate.set(course.name, {
            name: course.name,
            thumbnail: course.thumbnail.url,
            ratings: course.ratings,
          });
        }
      });

      const courseSearch = Array.from(notDuplicate.values());
      console.log(courseSearch);
      // const courseSearch = courses.map((course) => {
      //   console.log(course.courseData);
      //   return course.name;
      // }).flat();
      // console.log(courseSearch[0])
      res.status(200).json({ success: true, courseSearch });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getCourseByUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;
      const courseId = req.params.id;
      const courseExists = userCourseList?.find(
        (course: any) => course.courseId === courseId,
      );

      if (!courseExists) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 403),
        );
      }

      const course = await CourseModel.findById(courseId).populate(
        'courseData.questions.user courseData.questions.questionReplies.user',
      );

      const content = course?.courseData;

      res.status(200).json({ success: true, content });
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  },
);

export const getCourseByAdmin = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    try {
      const courseId = req.params.id;
      const course = await CourseModel.findById(courseId);

      res.status(200).json(course);
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  },
);

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
      // console.log("test: ",course)

      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Invalid content id', 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId),
      );

      if (!courseContent) {
        return next(new ErrorHandler('Invalid content id', 400));
      }

      const newQuestion: any = {
        user: req.user?._id,
        title,
        question,
        questionReplies: [],
      };

      courseContent.questions.push(newQuestion);

      // [LATER]

      await course?.save();

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

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
        'courseData.questions.user',
      );

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Invalid content id', 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId),
      );

      if (!courseContent) {
        return next(new ErrorHandler('Invalid content id', 400));
      }

      const question = courseContent.questions.find((item: any) =>
        item._id.equals(questionId),
      );

      if (!question) {
        return next(new ErrorHandler('Invalid content id', 400));
      }

      const isContentSafe = await checkContent(answer);

      console.log('isContentSafe:', isContentSafe);

      if (!isContentSafe) {
        return next(
          new ErrorHandler(
            'Cannot create answer with inappropriate content',
            400,
          ),
        );
      }

      const newAnswer: any = { user: req.user?._id, answer };
      console.log('newans:', newAnswer);
      question.questionReplies.push(newAnswer);

      await course?.save();

      // if (req.user?._id === question.user._id) {
      //   await NotificationModel.create({
      //     user: req.user?._id,
      //     title: "New Question Reply Received",
      //     message: `You have a new question reply in ${courseContent.title}`,
      //   });
      // } else {

      //   const data = { name: question.user.name, title: courseContent.title };

      //   try {
      //     await sendMail({
      //       email: question.user.email,
      //       subject: "Question Reply",
      //       template: "question-reply.ejs",
      //       data,
      //     });
      //   } catch (error: any) {
      //     return next(new ErrorHandler(error.message, 500));
      //   }
      // }

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

interface IAddAnswerQuizz {
  courseId: string;
  contentId: string;
  answers: {
    questionId: string;
    answer: string[];
  }[];
  score: number;
}

export const addAnswerQuiz = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, contentId, answers } = req.body as IAddAnswerQuizz;

      const course = await CourseModel.findById(courseId).populate(
        'courseData.quiz.user',
      );
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler('Course not found', 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId),
      );
      if (!courseContent) {
        return next(new ErrorHandler('Video not found', 400));
      }

      let totalScore = 0;
      const detailedScores: { [key: string]: number } = {};

      answers.forEach((answerObj) => {
        const { questionId, answer } = answerObj;
        const question = courseContent.quiz.find((item) =>
          item._id.equals(questionId),
        );
        if (!question) {
          return;
        }

        let score = 0;
        if (Array.isArray(question.correctAnswer)) {
          score = question.correctAnswer.every((val) => answer.includes(val))
            ? question.maxScore
            : 0;
        } else {
          score = question.correctAnswer === answer[0] ? question.maxScore : 0;
        }
        totalScore += score;
        detailedScores[questionId] = score;

        const newAnswer: any = {
          user: req.user?._id,
          answer,
          score,
        };

        question.answers.push(newAnswer);
      });

      await course?.save();

      res.status(200).json({ success: true, totalScore, detailedScores });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getAnswersQuiz = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { contentId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return next(new ErrorHandler(MESSAGES.USER_NOT_FOUND, 404));
    }

    // console.log("UserId req: ", userId);
    // console.log("ContentId req: ", contentId);

    const courses = await CourseModel.find({
      'courseData._id': contentId,
      'courseData.quiz.answers.user': userId,
    }).select('courseData._id courseData.quiz._id courseData.quiz.answers');

    // console.log("Courses found: ", courses);

    const answers: Record<string, Record<string, string[]>> = {};

    courses.forEach((course) => {
      course.courseData.forEach((data) => {
        // console.log("Processing courseData: ", data._id);
        if (data._id.toString() === contentId) {
          data.quiz.forEach((quiz) => {
            // console.log("Processing quiz: ", quiz._id);
            if (quiz.answers && quiz.answers.length > 0) {
              const userAnswers = quiz.answers.filter(
                (ans) => ans.user?.toString() === userId.toString(),
              );
              // console.log("Answers for quiz: ", quiz._id, userAnswers);
              if (userAnswers.length > 0) {
                if (!answers[data._id.toString()]) {
                  answers[data._id.toString()] = {};
                }
                answers[data._id.toString()][quiz._id.toString()] =
                  userAnswers[userAnswers.length - 1].answer;
              }
            }
          });
        }
      });
    });
    console.log('Final answers: ', answers);
    res.status(200).json({ success: true, answers });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

export const addReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userCourseList = req.user?.courses;

      const courseId = req.params.id;

      const courseExists = userCourseList?.find(
        (course: any) => course.courseId === courseId.toString(),
      );

      if (!courseExists) {
        return next(
          new ErrorHandler('You are not eligible to access this course', 400),
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

        const totalRatings =
          course?.reviews.reduce((acc, cur) => acc + cur.rating, 0) || 0;

        const avgRatings = totalRatings / (course?.reviews.length || 0);

        course.ratings = Number(avgRatings.toFixed(2));

        await course.save();

        const updatedCourse =
          await CourseModel.findById(courseId).populate('reviews.user');

        res.status(200).json({
          success: true,
          reviews: updatedCourse?.reviews,
          ratings: updatedCourse?.ratings,
        });
      } else {
        return next(new ErrorHandler('Found no course', 404));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

interface IAddReviewData {
  answer: string;
  courseId: string;
  reviewId: string;
}

export const addReplyToReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, reviewId } = req.body as IAddReviewData;
      const course = await CourseModel.findById(courseId);
      console.log('courseId:', courseId);
      console.log('reviewId:', reviewId);
      console.log('answer:', answer);

      if (!course) {
        console.log('Loi:');
        return next(new ErrorHandler('Found no course', 404));
      }

      const review = course.reviews.find(
        (review: any) => review._id.toString() === reviewId,
      );

      if (!review) {
        return next(new ErrorHandler('Review no course', 404));
      }

      const isContentSafe = await checkContent(answer);

      console.log('isContentSafe:', isContentSafe);

      if (!isContentSafe) {
        return next(
          new ErrorHandler(
            'Cannot create answer with inappropriate content',
            400,
          ),
        );
      }

      const replyData: any = {
        user: req.user?._id,
        answer,
      };

      review.commentReplies.push(replyData);

      await course?.save();

      const updatedCourse = await CourseModel.findById(courseId).populate(
        'reviews.user reviews.commentReplies.user',
      );

      res.status(200).json({ success: true, reviews: updatedCourse?.reviews });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getAllCoursesAdmin = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await CourseModel.find().sort({ createdAt: -1 });

      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const getUserCourses = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseIds } = req.body;
      const courses = await CourseModel.find({
        _id: { $in: courseIds },
        status: 'APPROVED',
      })
        .sort({
          createdAt: -1,
        })
        .select('_id name purchased price estimatedPrice courseData thumbnail');

      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const deleteCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const course = await CourseModel.findById(id);

      if (!course) {
        return next(new ErrorHandler('Course not found', 400));
      }

      await CourseModel.deleteOne({ _id: id });

      await redis.del(id);

      const categories = await LayoutModel.findOne({ type: 'Categories' });

      const oldCategory = categories?.categories.find(
        (category) => category.title === course.category,
      );

      if (oldCategory) {
        const courseIndex = oldCategory?.courses?.findIndex(
          (course: any) => course.toString() === course._id.toString(),
        );

        oldCategory.courses?.splice(courseIndex, 1);
      }

      await categories?.save();

      res
        .status(200)
        .json({ success: true, message: 'Course deleted successfully' });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

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
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
        },
      );

      res.json(response.data);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const getCourseReviews = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;

      const course = await CourseModel.findById(courseId)
        .select('reviews ratings')
        .populate('reviews.user reviews.commentReplies.user');

      if (!course) {
        return next(new ErrorHandler('Course not found', 400));
      }

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const getCourseByQuery = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.params;

      const courses = await CourseModel.find({
        name: { $regex: query, $options: 'i' },
      }).select(
        '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links',
      );

      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const getIndexStock = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const indexUrl = 'https://stock.immergreen.cc/historical_data/filter';
      const response = await axios.get(indexUrl);
      const data = response.data.data;

      if (data.length === 0) {
        return next(new ErrorHandler('No data available', 400));
      }
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomData = data[randomIndex];

      const changePercent =
        ((randomData.close_price - randomData.open_price) /
          randomData.open_price) *
        100;

      const result = res.json({
        symbol: randomData.symbol,
        close_price: randomData.close_price,
        change_percent: changePercent.toFixed(2),
      });

      res.status(200).json({ success: true, result });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

// export const getCurrentUserProgress = CatchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { courseIds } = req.body;
//       const userId = req.user?._id;

//       const courses = await CourseModel.find({
//         _id: { $in: courseIds },
//       }).populate('courseData.quiz.answers.user');

//       const courseScores = courses.map((course: ICourse) => {
//         let totalScore = 0;
//         let totalMaxScore = 0;

//         course.courseData.forEach((data: ICourseData) => {
//           data.quiz.forEach((question: IQuestionQuiz) => {
//             let latestAnswer: IAnswerQuiz | undefined;
//             question.answers.forEach((answer: IAnswerQuiz) => {
//               if (
//                 answer.user._id.equals(userId) &&
//                 (!latestAnswer || answer.createdAt > latestAnswer.createdAt)
//               ) {
//                 latestAnswer = answer;
//               }
//             });

//             if (latestAnswer) {
//               totalScore += latestAnswer.score;
//             }
//             totalMaxScore += question.maxScore;
//           });
//         });

//         const completionRate = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
//         return {
//           courseId: course._id,
//           courseName: course.name,
//           totalScore,
//           totalMaxScore,
//           completionRate,
//         };
//       });

//       res.status(200).json({ success: true, courseScores });
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   }
// );
export const getCurrentUserProgress = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseIds } = req.body;
      const userId = req.user?._id;

      const courses = await CourseModel.find({
        _id: { $in: courseIds },
      }).populate('courseData.quiz.answers.user');

      const courseScores = courses.map((course: ICourse) => {
        let totalScore = 0;
        let totalMaxScore = 0;

        const quizScores = course.courseData.flatMap((data: ICourseData) =>
          data.quiz.map((question: IQuestionQuiz) => {
            let latestAnswer: IAnswerQuiz | undefined;
            question.answers.forEach((answer: IAnswerQuiz) => {
              if (
                answer.user._id == userId &&
                (!latestAnswer || answer.createdAt > latestAnswer.createdAt)
              ) {
                latestAnswer = answer;
              }
            });

            const score = latestAnswer ? latestAnswer.score : 0;
            totalScore += score;
            totalMaxScore += question.maxScore;

            return { title: question.title || '', score };
          }),
        );

        const completionRate =
          totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

        return {
          courseId: course._id,
          courseName: course.name,
          totalScore,
          totalMaxScore,
          completionRate,
          quizScores,
        };
      });

      res.status(200).json({ success: true, courseScores });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getUnapprovedCourses = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    try {
      const { offset, limit } = req.query;
      const courses = await CourseModel.find({
        $or: [
          { status: COURSE_STATUS.PENDING_REVIEW },
          { status: { $exists: false } },
        ],
      })
        .skip(parseInt((offset ?? 0) as string, 10))
        .limit(parseInt((limit ?? 0) as string, 10));

      res.status(200).json(courses);
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  },
);

export const approveCourse = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    try {
      const courseId = req.params.id;

      const course = await CourseModel.findById(courseId);

      // const course = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.APPROVED }, { new: true });
      if (!course) {
        return new ErrorHandler(`Course with ID ${courseId} not found`, 404);
      }

      await NotificationModel.create({
        user: course.createdBy,
        title: 'Approved Course',
        message: `Your course ${course.name} has been approved`,
      });

      const updatedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        { status: COURSE_STATUS.APPROVED },
        { new: true },
      );
      res.status(200).json(updatedCourse);
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  },
);
export const rejectCourse = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    try {
      const courseId = req.params.id;
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return new ErrorHandler(`Course with ID ${courseId} not found`, 404);
      }

      const updatedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        { status: COURSE_STATUS.REJECTED },
        { new: true },
      );
      await NotificationModel.create({
        user: course.createdBy,
        title: 'Rejected Course',
        message: `Your course ${course.name} has been rejected`,
      });
      res.status(200).json(updatedCourse);
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  },
);
export const approveCourseFinalTest = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    try {
      const courseId = req.params.id;
      const finalTestId = req.params.finalTestId;

      const course = await CourseModel.findById(courseId);

      // const course = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.APPROVED }, { new: true });
      if (!course) {
        return new ErrorHandler(`Course with ID ${courseId} not found`, 404);
      }

      const finalTest = course.courseData.find((item) => item.isFinalTest);
      if (!finalTest) {
        return new ErrorHandler(`Final test not found`, 404);
      }

      // const updatedCourse = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.APPROVED }, { new: true });
      const updatedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: { 'courseData.$[finalTest].status': COURSE_STATUS.APPROVED },
        },
        {
          arrayFilters: [
            { 'finalTest._id': finalTestId, 'finalTest.isFinalTest': true },
          ],
          new: true,
        },
      );

      await NotificationModel.create({
        user: course.createdBy,
        title: 'Approved Final Test',
        message: `Your Final Test in course ${course.name} has been approved`,
      });

      res.status(200).json(updatedCourse);
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  },
);

export const rejectCourseFinalTest = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    try {
      const courseId = req.params.id;
      const finalTestId = req.params.finalTestId;

      const course = await CourseModel.findById(courseId);

      // const course = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.APPROVED }, { new: true });
      if (!course) {
        return new ErrorHandler(`Course with ID ${courseId} not found`, 404);
      }

      const finalTest = course.courseData.find((item) => item.isFinalTest);
      if (!finalTest) {
        return new ErrorHandler(`Final test not found`, 404);
      }

      // const updatedCourse = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.REJECTED }, { new: true });
      const updatedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $set: { 'courseData.$[finalTest].status': COURSE_STATUS.REJECTED },
        },
        {
          arrayFilters: [
            { 'finalTest._id': finalTestId, 'finalTest.isFinalTest': true },
          ],
          new: true,
        },
      );

      await NotificationModel.create({
        user: course.createdBy,
        title: 'Rejected Final Test',
        message: `Your Final Test in course ${course.name} has been rejected`,
      });

      res.status(200).json(updatedCourse);
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  },
);

export const uploadFinalTest = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data, courseId } = req.body;

      const course = await CourseModel.findById(courseId);

      if (!course) {
        return new ErrorHandler(`Course with ID ${courseId} not found`, 404);
      }

      if (course.status !== 'APPROVED') {
        return next(
          new ErrorHandler(
            'Course must be approved before uploading final test',
            403,
          ),
        );
      }

      const isExistingFinalTest = course.courseData.find(
        (item) => item.isFinalTest,
      );

      if (isExistingFinalTest) {
        return new ErrorHandler(`Final test already exists`, 400);
      }

      data.isFinalTest = true;
      const updatedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        {
          $push: {
            courseData: {
              $each: [data],
              $position: 0,
            },
          },
        },
        { new: true },
      );

      res.status(201).json({ success: true, updatedCourse });
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status || 500));
    }
  },
);

export const getPendingFinalTest = CatchAsyncErrors(
  async (req: Request, res: Response) => {
    try {
      const { offset, limit } = req.query;
      const courses = await CourseModel.find({
        courseData: {
          $elemMatch: {
            isFinalTest: true,
            status: COURSE_DATA_STATUS.PENDING_REVIEW,
          },
        },
      });
      // .select({
      //   courseData: { $elemMatch: { isFinalTest: true } }
      // });

      res.status(200).json(courses);
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  },
);

export const getCoursesByCategory = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { categorySlug } = req.params;

      const category = categorySlug.replace(/-/g, ' ');

      const courses = await CourseModel.find({
        category: { $regex: new RegExp('^' + category + '$', 'i') },
        status: 'APPROVED',
      }).select(
        '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links',
      );

      console.log('test category by course:', courses);

      res.status(200).json({ success: true, courses, category });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

const getLatestAnswer = (
  answers: IAnswerQuiz[],
  userId: string,
): IAnswerQuiz | undefined => {
  return answers
    .filter((answer) => answer.user?._id?.toString() === userId)
    .reduce<
      IAnswerQuiz | undefined
    >((latest, current) => (latest && latest.createdAt > current.createdAt ? latest : current), undefined);
};

const calculateCourseScores = (course: ICourse, userId: string) => {
  let finalTestScore = 0;
  let finalTestMaxScore = 0;

  let totalScore = 0;
  let totalMaxScore = 0;
  const regularTestScores: number[] = [];

  const quizScores = course.courseData.flatMap((data: ICourseData) => {
    let isFinalTestQuestions = false;
    if (data.isFinalTest) isFinalTestQuestions = true;
    return data.quiz.map((question: IQuestionQuiz) => {
      const latestAnswer = getLatestAnswer(question.answers, userId);
      const score = latestAnswer ? latestAnswer.score : 0;
      const maxScore = question.maxScore;

      if (isFinalTestQuestions) {
        finalTestScore = score;
        finalTestMaxScore = maxScore;
      } else {
        regularTestScores.push(score / maxScore); // Store percentage
      }

      totalScore += score;
      totalMaxScore += maxScore;

      return { title: question.title || '', score };
    });
  });

  const avgRegularTestScore =
    regularTestScores.length > 0
      ? regularTestScores.reduce((sum, val) => sum + val, 0) /
        regularTestScores.length
      : 0;

  const weightedFinalScore =
    avgRegularTestScore * 0.2 * 100 +
    (finalTestScore / finalTestMaxScore) * 0.8 * 100;

  return { totalScore: weightedFinalScore, totalMaxScore: 100, quizScores };
};

export const calculateFinalTestScore = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;
      const course = await CourseModel.findById(courseId).populate(
        'courseData.quiz.answers.user',
      );

      if (!course) {
        return res
          .status(404)
          .json({ success: false, message: 'Course not found' });
      }

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      }

      const { totalScore, totalMaxScore, quizScores } = calculateCourseScores(
        course,
        userId,
      );

      const completionRate =
        totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

      // update userScore
      await userScoreModel.deleteOne({ user: userId, courseId });

      await userScoreModel.create({
        user: userId,
        courseId,
        finalScore: totalScore,
        testCourseStatus:
          completionRate >= 50
            ? TEST_COURSE_STATUS.PASSED
            : TEST_COURSE_STATUS.FAILED,
      });

      res.status(200).json({
        success: true,
        courseId: course._id,
        courseName: course.name,
        totalScore,
        totalMaxScore,
        completionRate,
        quizScores,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getUserScores = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      // const userId = req.user?._id ;
      const userScores = await userScoreModel
        .find({ user: userId })
        .populate('courseId');
      res.status(200).json({ success: true, userScores });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getMyUserScores = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const userScores = await userScoreModel
        .find({ user: userId })
        .populate('courseId');
      res.status(200).json({ success: true, userScores });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getUsersByCourseId = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;

      const users = await userModel
        .find({
          'courses.courseId': courseId,
        })
        .select('name email avatar role createdAt');


      const userScores = await userScoreModel.find({
        courseId: courseId.toString()
      }).populate('user');
      
      const userScoreMap = new Map(
        userScores.map(score => [score.user._id.toString(), score])
      );

      const usersWithScores = users.map(user => {
        const userScore = userScoreMap.get(user._id.toString());
        return {
          ...user.toObject(),
          score: userScore ? {
            finalScore: userScore.finalScore || 0,
            testCourseStatus: userScore.testCourseStatus || 0
          } : {}
        };
      });

      res.status(200).json({
        success: true,
        users: usersWithScores,
        total: users.length,
      });
    } catch (error: any) {
      console.error('Error in getUsersByCourseId:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getUsersInMyCourses = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const userRole = req.user?.role;

      if (!userId) {
        return next(new ErrorHandler('User not found', 404));
      }

      const myCourses = userRole === 'ADMIN' 
        ? await CourseModel.find({})
        : await CourseModel.find({ createdBy: userId });
      
      if (!myCourses.length) {
        return res.status(200).json({
          success: true,
          message: userRole === 'ADMIN' 
            ? 'No courses found in the system'
            : 'You have not created any courses yet',
          users: [],
          total: 0
        });
      }

      const courseIds = myCourses.map(course => course._id);

      const users = await userModel
        .find({
          'courses.courseId': { $in: courseIds }
        })
        .select('name email avatar role createdAt courses');

      const userScores = await userScoreModel
        .find({
          courseId: { $in: courseIds }
        })
        .populate('user');

      const userScoreMap = new Map(
        userScores.map(score => [
          `${score.user._id.toString()}-${score.courseId.toString()}`,
          score
        ])
      );

      const courseMap = new Map(
        myCourses.map(course => [course._id.toString(), course])
      );

      const usersWithCourseInfo = users.flatMap(user => {
        return user.courses
          .filter(course => courseIds.some(id => id.toString() === course.courseId.toString()))
          .map(course => {
            const courseInfo = courseMap.get(course.courseId.toString());
            const userScore = userScoreMap.get(`${user._id.toString()}-${course.courseId.toString()}`);
            
            // delete user.courses;
            
            return {
              ...user.toObject(),
              _id: userScore?._id || `${user._id}-${course.courseId}`,
              courseId: course.courseId,
              courseName: courseInfo?.name || '',
              score: userScore ? {
                finalScore: userScore.finalScore || 0,
                testCourseStatus: userScore.testCourseStatus || 0
              } : {}
            };
          });
      });

      res.status(200).json({
        success: true,
        users: usersWithCourseInfo,
        total: usersWithCourseInfo.length
      });
    } catch (error: any) {
      console.error('Error in getUsersInMyCourses:', error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);