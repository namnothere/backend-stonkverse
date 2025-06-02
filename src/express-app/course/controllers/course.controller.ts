import { title } from 'process';
import cloudinary from 'cloudinary';
import { CatchAsyncErrors } from '../../middleware/catchAsyncErrors';
import { NextFunction, Request, Response } from 'express';
import ErrorHandler from '../../utils/ErrorHandler';
import { checkContent, createCourseInDB, updateCourseInDB } from '../providers';
import {
  COURSE_DATA_STATUS,
  COURSE_STATUS,
  CourseModel,
  IAnswerFinalTest,
  IAnswerQuiz,
  ICourse,
  ICourseData,
  IFinalTest,
  IQuestionQuiz,
  ITitleFinalTest,
} from '../models';
import { redis } from '../../utils/redis';
import mongoose from 'mongoose';
import { NotificationModel } from '../../models';
import axios from 'axios';
import { LayoutModel } from '../../layout/models';
import { TEST_COURSE_STATUS, userModel, userScoreModel } from '../../user/models';
import { MESSAGES } from '../../shared/common';
import { FinalTestSettingModel, IFinalTestSetting } from 'src/setting/entities/setting.entity';
import { sendMail } from 'src/express-app/utils';

export const uploadCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body;
      const thumbnail = data.thumbnail;
      const curriculum = data.curriculum;
      data.createdBy = req.user?._id;

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

      const course = await CourseModel.findOne({ _id: courseId, status: 'APPROVED' })
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
        status: 'APPROVED'
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
      const course = await CourseModel.findById(courseId)
        .populate([
          {
            path: 'courseData.questions.user courseData.questions.questionReplies.user',
          },
          {
            path: 'finalTest.settings',
          },
        ]);

      const content = course?.courseData;
      const finalTest = course?.finalTest || [];

      res.status(200).json({
        success: true,
        content,
        finalTest
      });
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

      const isContentSafe = await checkContent([title, question].join('\n\n'));

      console.log('isContentSafe question :', isContentSafe);

      if (!isContentSafe) {
        return next(
          new ErrorHandler(
            'Cannot create answer with inappropriate content',
            400,
          ),
        );
      }

      const newQuestion: any = {
        user: req.user?._id,
        title,
        question,
        questionReplies: [],
      };

      courseContent.questions.push(newQuestion);

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

      if (req.user?._id === question.user._id) {
        await NotificationModel.create({
          user: req.user?._id,
          title: "New Question Reply Received",
          message: `You have a new question reply in ${courseContent.title}`,
        });
      } else {

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

interface IAddAnswerFinalTest {
  courseId: string;
  finalTestId: string;
  answers: {
    questionId: string;
    answer: string[];
  }[];
}

export const addAnswerFinalTest = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, finalTestId, answers } = req.body as IAddAnswerFinalTest;

      // Validate courseId
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return next(new ErrorHandler('Invalid course ID', 400));
      }

      // Find the course
      const course = await CourseModel.findById(courseId);
      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }

      // Validate finalTestId
      if (!mongoose.Types.ObjectId.isValid(finalTestId)) {
        return next(new ErrorHandler('Invalid final test ID', 400));
      }

      // Find the final test
      const finalTest = course.finalTest.find((test: any) =>
        test._id.equals(finalTestId)
      );

      if (!finalTest) {
        return next(new ErrorHandler('Final test not found', 404));
      }

      // Process each answer
      let totalScore = 0;
      const detailedScores: { [key: string]: number } = {};

      answers.forEach((answerObj) => {
        const { questionId, answer } = answerObj;

        // Find the question in the final test
        const question = finalTest.tests.find((q: any) => q._id.equals(questionId));

        if (!question) {
          return;
        }

        // Calculate score based on question type and correctness
        let score = 0;

        if (question.type === "single" || question.type === "fillBlank") {
          // For single choice or fill in blank questions
          score = question.correctAnswer.includes(answer[0]) ? question.maxScore : 0;
        } else if (question.type === "multiple") {
          // For multiple choice questions
          const correctAll =
            question.correctAnswer.length === answer.length &&
            question.correctAnswer.every((val: string) => answer.includes(val)) &&
            answer.every((val: string) => question.correctAnswer.includes(val));

          if (correctAll) {
            score = question.maxScore;
          } else {
            // Calculate partial score for partially correct answers
            const correctCount = answer.filter((ans: string) =>
              question.correctAnswer.includes(ans)).length;

            // Deduct points for incorrect selections
            const incorrectCount = answer.filter((ans: string) =>
              !question.correctAnswer.includes(ans)).length;

            // Calculate score based on correct - incorrect (min 0)
            const partialScore = Math.max(0,
              (correctCount - incorrectCount) /
              question.correctAnswer.length * question.maxScore
            );

            score = partialScore;
          }
        }

        totalScore += score;
        detailedScores[questionId] = score;

        // Save the answer
        question.answers.push({
          user: req.user?._id,
          answer: answer,
          score: score
        } as any);
      });

      // Save the updated course
      await course.save();

      // Return the result
      res.status(200).json({
        success: true,
        totalScore,
        detailedScores
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
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
        
        const isContentSafe = await checkContent(review);

        console.log('isContentSafe review:', isContentSafe);

        if (!isContentSafe) {
          return next(
            new ErrorHandler(
              'Cannot create answer with inappropriate content',
              400,
            ),
          );
        }

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

export const getAllCoursesFinalTest = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userid = req.user?._id;

      if (!userid) {
        return next(new ErrorHandler('User not authenticated', 401));
      }
      console.log("userid test:", userid)

      const courses = await CourseModel.find({
        createdBy: userid,
      })
        .sort({
          createdAt: -1,
        })

      console.log("course test:", courses)
      res.status(200).json({
        success: true,
        courses
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
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
      console.log("test courseid:", courseId)

      const course = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.APPROVED }, { new: true });
      if (!course) {
        return new ErrorHandler(`Course with ID ${courseId} not found`, 404);
      }

      await NotificationModel.create({
        title: 'Course Approved',
        message: `Your course "${course.name}" has been approved`,
        userId: course.createdBy,
        status: 'unread'
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

      const course = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.APPROVED }, { new: true });

      if (!course) {
        return new ErrorHandler(`Course with ID ${courseId} not found`, 404);
      }

      const updatedCourse = await CourseModel.findByIdAndUpdate(
        courseId,
        { status: COURSE_STATUS.REJECTED },
        { new: true },
      );
      await NotificationModel.create({
        title: 'Course Rejected',
        message: `Your course "${course.name}" has been rejected`,
        userId: course.createdBy,
        status: 'unread'
      });
      res.status(200).json(updatedCourse);
    } catch (error: any) {
      return new ErrorHandler(error.message, 500);
    }
  },
);

// export const approveCourseFinalTest = CatchAsyncErrors(
//   async (req: Request, res: Response) => {
//     try {
//       const courseId = req.params.id;
//       const finalTestId = req.params.finalTestId;

//       const course = await CourseModel.findById(courseId);

//       // const course = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.APPROVED }, { new: true });
//       if (!course) {
//         return new ErrorHandler(`Course with ID ${courseId} not found`, 404);
//       }

//       const finalTest = course.courseData.find((item) => item.isFinalTest);
//       if (!finalTest) {
//         return new ErrorHandler(`Final test not found`, 404);
//       }

//       // const updatedCourse = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.APPROVED }, { new: true });
//       const updatedCourse = await CourseModel.findByIdAndUpdate(
//         courseId,
//         {
//           $set: { 'courseData.$[finalTest].status': COURSE_STATUS.APPROVED },
//         },
//         {
//           arrayFilters: [
//             { 'finalTest._id': finalTestId, 'finalTest.isFinalTest': true },
//           ],
//           new: true,
//         },
//       );

//       await NotificationModel.create({
//         user: course.createdBy,
//         title: 'Approved Final Test',
//         message: `Your Final Test in course ${course.name} has been approved`,
//       });

//       res.status(200).json(updatedCourse);
//     } catch (error: any) {
//       return new ErrorHandler(error.message, 500);
//     }
//   },
// );

// export const rejectCourseFinalTest = CatchAsyncErrors(
//   async (req: Request, res: Response) => {
//     try {
//       const courseId = req.params.id;
//       const finalTestId = req.params.finalTestId;

//       const course = await CourseModel.findById(courseId);

//       // const course = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.APPROVED }, { new: true });
//       if (!course) {
//         return new ErrorHandler(`Course with ID ${courseId} not found`, 404);
//       }

//       const finalTest = course.courseData.find((item) => item.isFinalTest);
//       if (!finalTest) {
//         return new ErrorHandler(`Final test not found`, 404);
//       }

//       // const updatedCourse = await CourseModel.findByIdAndUpdate(courseId, { status: COURSE_STATUS.REJECTED }, { new: true });
//       const updatedCourse = await CourseModel.findByIdAndUpdate(
//         courseId,
//         {
//           $set: { 'courseData.$[finalTest].status': COURSE_STATUS.REJECTED },
//         },
//         {
//           arrayFilters: [
//             { 'finalTest._id': finalTestId, 'finalTest.isFinalTest': true },
//           ],
//           new: true,
//         },
//       );

//       await NotificationModel.create({
//         user: course.createdBy,
//         title: 'Rejected Final Test',
//         message: `Your Final Test in course ${course.name} has been rejected`,
//       });

//       res.status(200).json(updatedCourse);
//     } catch (error: any) {
//       return new ErrorHandler(error.message, 500);
//     }
//   },
// );

interface TimeDuration {
  hours?: number;
  minutes?: number;
}
function convertToMinutes(duration: TimeDuration): number {
  return (duration.hours || 0) * 60 + (duration.minutes || 0);
}

export const uploadFinalTest = CatchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log("Request body:", JSON.stringify(req.body, null, 2));

    const { finalTest } = req.body;

    console.log("finalTest structure:", JSON.stringify(finalTest, null, 2));
    console.log("finalTest.tests:", JSON.stringify(finalTest.tests, null, 2));

    const courseId = req.params.id;

    const course = await CourseModel.findById(courseId);
    if (!course) {
      return next(new ErrorHandler(MESSAGES.COURSE_NOT_FOUND, 404));
    }
    if (course.status !== 'APPROVED') {
      return next(new ErrorHandler(MESSAGES.COURSE_NOT_APPROVED, 403));
    }
    if (course.finalTest && course.finalTest.length > 0) {
      return next(new ErrorHandler(MESSAGES.FINAL_TEST_EXISTS, 400));
    }

    const settings = finalTest.settings;

    if (!settings || !settings.testDuration) {
      return next(new ErrorHandler("Test duration is required", 400));
    }

    // Chuyển đổi từ giao diện giờ-phút sang số phút
    const totalMinutes = convertToMinutes(settings.testDuration);

    console.log("Total duration calculation:", {
      hours: settings.testDuration.hours || 0,
      minutes: settings.testDuration.minutes || 0,
      totalMinutes: totalMinutes
    });

    const settingsPayload = {
      testDuration: totalMinutes,
      numberOfQuestions: settings.numberOfQuestions,
      pageLayout: settings.pageLayout,
      gradingDisplay: settings.gradingDisplay,
      enableProctoring: settings.enableProctoring,
      displaySettings: settings.displaySettings,
      instructionsMessage: settings.instructionsMessage,
      completionMessage: settings.completionMessage,
      course: courseId,
    };

    const savedSettings = await FinalTestSettingModel.create(settingsPayload);

    const finalTestData = {
      title: finalTest.title,
      description: finalTest.description,
      score: finalTest.score || 0,
      settings: savedSettings._id,
      tests: Array.isArray(finalTest.tests) ? finalTest.tests.map((test: any) => ({
        title: test.title,
        type: test.type,
        correctAnswer: Array.isArray(test.correctAnswer) ? test.correctAnswer : [],
        mockAnswer: Array.isArray(test.mockAnswer) ? test.mockAnswer : [],
        answers: Array.isArray(test.answers) ? test.answers : [],
        maxScore: typeof test.maxScore === 'number' ? test.maxScore : 10,
        imageUrl: test.imageUrl || ""
      })) : []
    };

    await CourseModel.findByIdAndUpdate(
      courseId,
      {
        $push: { finalTest: finalTestData },
        $set: {
          isFinalTest: true,
          quizWeight: settings.quizWeight || 20,
          finalTestWeight: settings.finalTestWeight || 80,
          passingGrade: settings.passingGrade || 50
        }
      },
      { new: true }
    );

    const populatedCourse = await CourseModel.findById(courseId)
      .populate({
        path: 'finalTest.settings'
      });

    res.status(201).json({
      success: true,
      message: "Final test uploaded successfully",
      course: populatedCourse,
    });
  } catch (error: any) {
    console.error("Error detail:", error);
    next(new ErrorHandler(error.message || "Failed to upload final test", 500));
  }
});

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
        status: "APPROVED"
      }).select(
        '-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links',
      );

      console.log("test category by course:", courses)

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
    .reduce<IAnswerQuiz | undefined>(
      (latest, current) => (latest && latest.createdAt > current.createdAt ? latest : current),
      undefined
    );
};

const getLatestFinalTestAnswer = (
  answers: IAnswerFinalTest[],
  userId: string,
): IAnswerFinalTest | undefined => {
  return answers
    .filter((answer) => answer.user?._id?.toString() === userId)
    .reduce<IAnswerFinalTest | undefined>(
      (latest, current) => (latest && latest.createdAt > current.createdAt ? latest : current),
      undefined
    );
};
interface QuizScoreDetail {
  title: string;
  score: number;
  maxScore: number;
  type: string;
}

const calculateCourseScores = (course: ICourse, userId: string) => {
  // Quiz scores calculation
  let totalQuizScore = 0;
  let totalQuizMaxScore = 0;
  const quizScoresDetails: QuizScoreDetail[] = [];

  // Process regular quiz scores from courseData
  course.courseData.forEach((data: ICourseData) => {
    data.quiz.forEach((question: IQuestionQuiz) => {
      const latestAnswer = getLatestAnswer(question.answers, userId);
      const score = latestAnswer ? latestAnswer.score : 0;
      const maxScore = question.maxScore;

      totalQuizScore += score;
      totalQuizMaxScore += maxScore;

      quizScoresDetails.push({
        title: question.title || '',
        score,
        maxScore,
        type: 'quiz'
      });
    });
  });

  // Calculate quiz percentage
  const quizPercentage = totalQuizMaxScore > 0 ? (totalQuizScore / totalQuizMaxScore) * 100 : 0;

  // Final test scores calculation
  let totalFinalScore = 0;
  let totalFinalMaxScore = 0;

  // Process final test scores from the finalTest array
  if (course.finalTest && course.finalTest.length > 0) {
    course.finalTest.forEach((finalTest: IFinalTest) => {
      finalTest.tests.forEach((test: ITitleFinalTest) => {
        const latestAnswer = getLatestFinalTestAnswer(test.answers, userId);
        const score = latestAnswer ? latestAnswer.score : 0;
        const maxScore = test.maxScore;

        totalFinalScore += score;
        totalFinalMaxScore += maxScore;

        quizScoresDetails.push({
          title: test.title || finalTest.title || '',
          score,
          maxScore,
          type: 'finalTest'
        });
      });
    });
  }

  // Calculate final test percentage
  const finalTestPercentage = totalFinalMaxScore > 0 ? (totalFinalScore / totalFinalMaxScore) * 100 : 0;

  // Use course-defined weights instead of hardcoded values
  const quizWeight = course.quizWeight || 20;
  const finalTestWeight = course.finalTestWeight || 80;

  // Calculate weighted final score
  const weightedFinalScore = (quizPercentage * quizWeight / 100) + (finalTestPercentage * finalTestWeight / 100);

  return {
    totalScore: weightedFinalScore,
    totalMaxScore: 100,
    quizScoresDetails,
    quizPercentage,
    finalTestPercentage
  };
};

export const calculateFinalTestScore = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const userId = req.user?._id;

      // Populate both courseData.quiz.answers.user AND finalTest.tests.answers.user
      const course = await CourseModel.findById(courseId)
        .populate('courseData.quiz.answers.user')
        .populate('finalTest.tests.answers.user');

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

      const user = await userModel.findById(userId);

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: 'User not found' });
      }

      const { totalScore, totalMaxScore, quizScoresDetails, quizPercentage, finalTestPercentage } = calculateCourseScores(
        course,
        userId.toString(),
      );

      // Use course-defined passing grade instead of hardcoded value
      const passingGrade = course.passingGrade || 50;

      // Determine if user passed or failed
      const hasPassed = totalScore >= passingGrade;
      const testStatus = hasPassed ? TEST_COURSE_STATUS.PASSED : TEST_COURSE_STATUS.FAILED;

      // Find if there's an existing score to determine if this is first time passing
      const existingScore = await userScoreModel.findOne({ user: userId, courseId });
      const isFirstTimePassing = !existingScore || existingScore.testCourseStatus !== TEST_COURSE_STATUS.PASSED;

      // Update userScore
      await userScoreModel.deleteOne({ user: userId, courseId });

      await userScoreModel.create({
        user: userId,
        courseId,
        finalScore: totalScore,
        testCourseStatus: testStatus,
      });

      // Create notification for course completion
      // await NotificationModel.create({
      //   user: userId,
      //   title: hasPassed ? 'Congratulations! Course Completed' : 'Course Test Result',
      //   message: hasPassed 
      //     ? `You have successfully passed the course "${course.name}" with a score of ${totalScore.toFixed(1)}%!`
      //     : `You have completed the tests for "${course.name}" with a score of ${totalScore.toFixed(1)}%. Try again to achieve a passing score of ${passingGrade}%.`,
      // });

      // If user passed and it's their first time passing, send email
      if (hasPassed && isFirstTimePassing) {
        try {
          // Email template data
          const mailData = {
            course: {
              _id: course._id.toString().slice(0, 6),
              name: course.name,
              score: totalScore.toFixed(1),
              passingGrade: passingGrade,
              quizScore: quizPercentage.toFixed(1),
              finalTestScore: finalTestPercentage.toFixed(1),
              completionDate: new Date().toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
            },
            user: {
              name: user.name || user.email.split('@')[0],
            }
          };

          // Send congratulatory email
          await sendMail({
            email: user.email,
            subject: `Congratulations on Completing "${course.name}"!`,
            template: 'course-completion.ejs',
            data: mailData,
          });

        } catch (error: any) {
          console.error('Error sending course completion email:', error.message);
        }
      }

      res.status(200).json({
        success: true,
        courseId: course._id,
        courseName: course.name,
        totalScore,
        totalMaxScore,
        quizPercentage,
        finalTestPercentage,
        completionRate: totalScore,
        quizScoresDetails,
        passingGrade: course.passingGrade,
        status: testStatus,
        passed: hasPassed,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getAllCoursesByUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userid = req.user?._id;
      // console.log("userid:",userid)
      const courses = await CourseModel.find({
        createdBy: userid,
      })
        .sort({
          createdAt: -1,
        })
        .select('_id name purchased price estimatedPrice courseData thumbnail status createdAt');

      res.status(200).json({ success: true, courses });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

function convertMinutesToTimeDuration(minutes: number): { hours: number, minutes: number } {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return { hours, minutes: remainingMinutes };
}

export const getFinalTests = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;

      const courseExists = await CourseModel.exists({ _id: courseId });

      if (!courseExists) {
        return next(new ErrorHandler(MESSAGES.COURSE_NOT_FOUND, 404));
      }

      const course = await CourseModel.findById(courseId)
        .select('_id name finalTest')
        .populate({
          path: 'finalTest',
          select: '_id title description tests score',
          populate: {
            path: 'settings',
            model: 'FinalTestSetting',
            select: 'testDuration numberOfQuestions instructionsMessage completionMessage'
          }
        });

      if (!course) {
        return next(new ErrorHandler(MESSAGES.COURSE_NOT_FOUND, 404));
      }

      const finalTests = course.finalTest || [];

      const transformedFinalTests = finalTests.map(test => {
        const transformedTest = { ...test.toObject() };

        if (transformedTest.settings && typeof transformedTest.settings === 'object'
          && transformedTest.settings.testDuration !== undefined) {
          // Chuyển đổi số phút thành định dạng giờ-phút
          transformedTest.settings.testDuration = convertMinutesToTimeDuration(
            transformedTest.settings.testDuration
          );
        }

        return transformedTest;
      });

      res.status(200).json({
        success: true,
        data: {
          _id: course._id,
          name: course.name,
          finalTests: transformedFinalTests
        }
      });

    } catch (error: any) {
      console.error("Error getting final tests:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getFinalTestById = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const finalTestId = req.params.id;

      const course = await CourseModel.findOne({ "finalTest._id": finalTestId })
        .populate({
          path: 'finalTest',
          match: { _id: finalTestId },
          select: '_id title description type imageUrl maxScore correctAnswer mockAnswer createdAt',
          populate: [{
            path: 'settings',
            model: 'FinalTestSetting',
            select: 'testDuration numberOfQuestions instructionsMessage completionMessage'
          },
          {
            path: 'tests',
            select: '_id title description type imageUrl maxScore correctAnswer mockAnswer'
          }
          ]
        });

      if (!course) {
        return next(new ErrorHandler(MESSAGES.FINAL_TEST_NOT_FOUND, 404));
      }

      const finalTest = course.finalTest.find(test => test._id.toString() === finalTestId);
      if (!finalTest) {
        return next(new ErrorHandler(MESSAGES.FINAL_TEST_NOT_FOUND, 404));
      }

      const transformedFinalTest = finalTest.toObject();

      if (transformedFinalTest.settings && typeof transformedFinalTest.settings === 'object'
        && transformedFinalTest.settings.testDuration !== undefined) {
        transformedFinalTest.settings.testDuration = convertMinutesToTimeDuration(
          transformedFinalTest.settings.testDuration
        );
      }

      console.log("id data:", finalTestId);
      console.log("final data:", transformedFinalTest);

      res.status(200).json({
        success: true,
        data: transformedFinalTest
      });

    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const editFinalTestById = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const finalTestId = req.params.id;
      const { finalTest } = req.body;

      console.log("Editing finalTest with ID:", finalTestId);
      console.log("Request body:", JSON.stringify(req.body, null, 2));

      const course = await CourseModel.findOne({ "finalTest._id": finalTestId });

      if (!course) {
        return next(new ErrorHandler(MESSAGES.FINAL_TEST_NOT_FOUND, 404));
      }

      const finalTestIndex = course.finalTest.findIndex(
        test => test._id.toString() === finalTestId
      );

      if (finalTestIndex === -1) {
        return next(new ErrorHandler(MESSAGES.FINAL_TEST_NOT_FOUND, 404));
      }

      const currentFinalTest = course.finalTest[finalTestIndex];

      if (finalTest.settings) {
        const settings = finalTest.settings;

        if (settings.testDuration) {
          const totalMinutes = convertToMinutes(settings.testDuration);

          const settingsPayload = {
            testDuration: totalMinutes,
            numberOfQuestions: settings.numberOfQuestions,
            instructionsMessage: settings.instructionsMessage,
            completionMessage: settings.completionMessage
          };

          if (currentFinalTest.settings && typeof currentFinalTest.settings === 'object' && currentFinalTest.settings._id) {
            await FinalTestSettingModel.findByIdAndUpdate(
              currentFinalTest.settings._id,
              settingsPayload
            );
          } else {

            const updateQuery = {};
            updateQuery[`finalTest.${finalTestIndex}.settings`] = settingsPayload;

            await CourseModel.updateOne(
              { _id: course._id },
              { $set: updateQuery }
            );
          }
        }
      }
      const finalTestUpdateData = {};

      if (finalTest.title !== undefined) {
        finalTestUpdateData[`finalTest.${finalTestIndex}.title`] = finalTest.title;
      }

      if (finalTest.description !== undefined) {
        finalTestUpdateData[`finalTest.${finalTestIndex}.description`] = finalTest.description;
      }

      if (finalTest.score !== undefined) {
        finalTestUpdateData[`finalTest.${finalTestIndex}.score`] = finalTest.score;
      }

      if (Array.isArray(finalTest.tests) && finalTest.tests.length > 0) {
        const testsData = finalTest.tests.map((test: any) => ({
          title: test.title,
          type: test.type,
          correctAnswer: Array.isArray(test.correctAnswer) ? test.correctAnswer : [],
          mockAnswer: Array.isArray(test.mockAnswer) ? test.mockAnswer : [],
          answers: Array.isArray(test.answers) ? test.answers : [],
          maxScore: typeof test.maxScore === 'number' ? test.maxScore : 10,
          imageUrl: test.imageUrl || "",
          description: test.description || ""
        }));

        finalTestUpdateData[`finalTest.${finalTestIndex}.tests`] = testsData;
      }

      if (finalTest.settings) {
        if (finalTest.settings.quizWeight !== undefined) {
          finalTestUpdateData["quizWeight"] = finalTest.settings.quizWeight;
        }

        if (finalTest.settings.finalTestWeight !== undefined) {
          finalTestUpdateData["finalTestWeight"] = finalTest.settings.finalTestWeight;
        }

        if (finalTest.settings.passingGrade !== undefined) {
          finalTestUpdateData["passingGrade"] = finalTest.settings.passingGrade;
        }
      }

      if (Object.keys(finalTestUpdateData).length > 0) {
        await CourseModel.updateOne(
          { _id: course._id },
          { $set: finalTestUpdateData }
        );
      }

      const updatedCourse = await CourseModel.findById(course._id)
        .populate({
          path: 'finalTest',
          match: { _id: finalTestId },
          populate: {
            path: 'settings',
            model: 'FinalTestSetting',
            select: 'testDuration numberOfQuestions instructionsMessage completionMessage'
          }
        });

      if (!updatedCourse) {
        return next(new ErrorHandler(MESSAGES.COURSE_NOT_FOUND, 404));
      }

      const updatedFinalTest = updatedCourse.finalTest.find(
        test => test._id.toString() === finalTestId
      );

      res.status(200).json({
        success: true,
        message: "Final test updated successfully",
        data: updatedFinalTest
      });

    } catch (error: any) {
      console.error("Error updating finalTest:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const deleteFinalTest = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const finalTestId = req.params.id;

      const course = await CourseModel.findOne({ "finalTest._id": finalTestId });

      if (!course) {
        return next(new ErrorHandler(MESSAGES.FINAL_TEST_NOT_FOUND, 404));
      }

      const finalTest = Array.isArray(course.finalTest)
        ? course.finalTest.find((test) => test._id.toString() === finalTestId)
        : course.finalTest;

      if (finalTest && finalTest.settings) {
        await FinalTestSettingModel.findByIdAndDelete(finalTest.settings);
      }

      const updateData = {
        finalTestWeight: 0,
        isFinalTest: false
      }

      if (Array.isArray(course.finalTest)) {
        // If finalTest is an Array
        await CourseModel.findByIdAndUpdate(
          course._id,
          {
            $pull: { finalTest: { _id: finalTestId } },
            $set: updateData
          }
        );
      } else {
        // If finalTest is an Object
        await CourseModel.findByIdAndUpdate(
          course._id,
          {
            $unset: { finalTest: "" },
            $set: updateData
          }
        );
      }

      res.status(200).json({
        success: true,
        message: MESSAGES.FINAL_TEST_EDITED_SUCCESSFULLY
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

/**
 * Submit an answer to a final test (for students)
 */
// export const submitFinalTestAnswer = CatchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const finalTestId = req.params.id;
//       const { answers, testIds } = req.body; // testIds maps to ITitleFinalTest._id
//       const userId = req.user?._id;

//       if (!userId) {
//         return next(new ErrorHandler(MESSAGES.UNAUTHORIZED, 401));
//       }

//       // Find the course containing the final test
//       const course = await CourseModel.findOne({ "finalTest._id": finalTestId });
//       if (!course) {
//         return next(new ErrorHandler(MESSAGES.FINAL_TEST_NOT_FOUND, 404));
//       }

//       // Find the final test
//       const finalTestIndex = course.finalTest.findIndex(
//         test => test._id.toString() === finalTestId
//       );

//       if (finalTestIndex === -1) {
//         return next(new ErrorHandler(MESSAGES.FINAL_TEST_NOT_FOUND, 404));
//       }

//       const finalTest = course.finalTest[finalTestIndex];

//       // Calculate score for each test question
//       let totalScore = 0;
//       let totalPoints = 0;

//       // Process answers and calculate score
//       if (finalTest.tests && Array.isArray(finalTest.tests) && testIds && Array.isArray(testIds)) {
//         for (let i = 0; i < testIds.length; i++) {
//           const testId = testIds[i];
//           const userAnswer = answers[i];

//           // Find the corresponding test question
//           const testIndex = finalTest.tests.findIndex(
//             test => test._id.toString() === testId
//           );

//           if (testIndex !== -1) {
//             const test = finalTest.tests[testIndex];
//             const maxScore = test.maxScore || 10;
//             totalPoints += maxScore;

//             if (userAnswer && test.correctAnswer) {
//               // Handle different question types
//               if (test.type === 'multiple') {
//                 // For multiple choice, check if arrays match (regardless of order)
//                 const userAnswerSet = new Set(Array.isArray(userAnswer) ? userAnswer : [userAnswer]);
//                 const correctAnswerSet = new Set(test.correctAnswer);

//                 if (userAnswerSet.size === correctAnswerSet.size && 
//                     [...userAnswerSet].every(value => correctAnswerSet.has(value))) {
//                   totalScore += maxScore;
//                 }
//               } else {
//                 // For single choice, fillBlank, and image, direct comparison
//                 if (userAnswer.toString() === test.correctAnswer.toString()) {
//                   totalScore += maxScore;
//                 }
//               }

//               // Add the user's answer to the test
//               const answerData = {
//                 user: userId,
//                 answer: Array.isArray(userAnswer) ? userAnswer : [userAnswer],
//                 score: maxScore, // Individual answer score
//               };

//               // Check if this user already has an answer for this test
//               const existingAnswerIndex = test.answers?.findIndex(
//                 answer => answer.user && answer.user.toString() === userId.toString()
//               );

//               if (existingAnswerIndex !== -1 && test.answers) {
//                 test.answers[existingAnswerIndex] = answerData;
//               } else {
//                 if (!test.answers) {
//                   test.answers = [];
//                 }
//                 test.answers.push(answerData);
//               }
//             }
//           }
//         }
//       }

//       // Calculate percentage score
//       const finalScore = totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0;

//       // Update the final test score
//       finalTest.score = finalScore;

//       // Save the course with the updated final test
//       await course.save();

//       // Create notification for the student
//       // await NotificationModel.create({
//       //   title: 'Final Test Submitted',
//       //   message: `You've successfully submitted your final test for the course "${course.name}"`,
//       //   userId: userId,
//       //   status: 'unread'
//       // });

//       res.status(200).json({
//         success: true,
//         message: "Final test submitted successfully",
//         data: {
//           score: finalScore,
//           passed: finalScore >= course.passingGrade
//         }
//       });
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message || "Failed to submit final test", 500));
//     }
//   }
// );

/**
 * Get student's final test results
 */
// export const getStudentFinalTestResults = CatchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const courseId = req.params.courseId;
//       const userId = req.user?._id;

//       if (!userId) {
//         return next(new ErrorHandler(MESSAGES.UNAUTHORIZED, 401));
//       }

//       // Find the course
//       const course = await CourseModel.findById(courseId).populate({
//         path: 'finalTest',
//         populate: [
//           {
//             path: 'settings',
//             model: 'FinalTestSetting'
//           },
//           {
//             path: 'tests',
//             match: { 'answers.user': userId }, // Only get tests that the user has answered
//             select: '_id title answers'
//           }
//         ]
//       });

//       if (!course) {
//         return next(new ErrorHandler(MESSAGES.COURSE_NOT_FOUND, 404));
//       }

//       if (!course.finalTest || course.finalTest.length === 0) {
//         return next(new ErrorHandler(MESSAGES.FINAL_TEST_NOT_FOUND, 404));
//       }

//       // Process the results for each final test
//       const results = [];

//       for (const finalTest of course.finalTest) {
//         // Calculate the user's overall score in this final test
//         let userTestsWithAnswers = 0;
//         let userTotalScore = 0;

//         if (finalTest.tests) {
//           for (const test of finalTest.tests) {
//             const userAnswer = test.answers?.find(
//               answer => answer.user && answer.user.toString() === userId.toString()
//             );

//             if (userAnswer) {
//               userTestsWithAnswers++;
//               userTotalScore += userAnswer.score;
//             }
//           }
//         }

//         // Only add results if the user has answered some tests
//         if (userTestsWithAnswers > 0) {
//           const averageScore = Math.round(userTotalScore / userTestsWithAnswers);

//           results.push({
//             finalTestId: finalTest._id,
//             title: finalTest.title,
//             score: averageScore,
//             passedTests: userTestsWithAnswers,
//             totalTests: finalTest.tests?.length || 0,
//             passed: averageScore >= course.passingGrade
//           });
//         }
//       }

//       res.status(200).json({
//         success: true,
//         data: {
//           courseId: course._id,
//           courseName: course.name,
//           passingGrade: course.passingGrade,
//           results
//         }
//       });
//     } catch (error: any) {
//       return next(new ErrorHandler(error.message, 500));
//     }
//   }
// );

export const getCourseByInstructor = CatchAsyncErrors(
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

interface ISubmitFinalTestBody {
  courseId: string;
  finalTestId: string;
  answers: {
    questionId: string;
    answer: string[];
  }[];
}

export const submitFinalTest = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, finalTestId, answers } = req.body as ISubmitFinalTestBody;
      const userId = req.user?._id;

      if (!userId) {
        return next(new ErrorHandler('User not found', 401));
      }

      // Tìm khóa học
      const course = await CourseModel.findById(courseId)
        .populate('courseData.quiz.answers.user');

      if (!course) {
        return next(new ErrorHandler('Course not found', 404));
      }

      // Tìm bài kiểm tra cuối cùng
      const finalTest = course.finalTest.find((test: any) =>
        test._id.toString() === finalTestId
      );

      if (!finalTest) {
        return next(new ErrorHandler('Final test not found', 404));
      }

      // Tính điểm cho bài kiểm tra này
      let totalScore = 0;
      let totalMaxScore = 0;
      let correctAnswersCount = 0;

      // Xử lý từng câu trả lời
      for (const answerObj of answers) {
        const { questionId, answer } = answerObj;

        // Tìm câu hỏi
        const question = finalTest.tests.find((q: any) =>
          q._id.toString() === questionId
        );

        if (!question) continue;

        // Tính điểm
        let score = 0;
        const maxScore = question.maxScore || 10;
        totalMaxScore += maxScore;

        if (question.type === "single" || question.type === "fillBlank") {
          // Cho câu hỏi một lựa chọn hoặc điền vào chỗ trống
          if (answer.length === 1 && question.correctAnswer.includes(answer[0])) {
            score = maxScore;
            correctAnswersCount++;
          }
        } else if (question.type === "multiple") {
          // Cho câu hỏi nhiều lựa chọn
          const isFullyCorrect =
            question.correctAnswer.length === answer.length &&
            question.correctAnswer.every((val: string) => answer.includes(val)) &&
            answer.every((val: string) => question.correctAnswer.includes(val));

          if (isFullyCorrect) {
            score = maxScore;
            correctAnswersCount++;
          } else {
            // Điểm một phần cho câu trả lời đúng một phần
            const correctCount = answer.filter((ans: string) =>
              question.correctAnswer.includes(ans)).length;

            // Trừ điểm cho các lựa chọn sai
            const incorrectCount = answer.filter((ans: string) =>
              !question.correctAnswer.includes(ans)).length;

            // Tính điểm một phần
            score = Math.max(0,
              (correctCount - incorrectCount) /
              question.correctAnswer.length * maxScore
            );

            // Đếm là đúng nếu đạt trên 50% điểm
            if (score >= maxScore / 2) {
              correctAnswersCount++;
            }
          }
        }

        totalScore += score;

        try {
          const answerData = {
            user: userId,
            answer: answer,
            score: score,
            createdAt: new Date()
          };

          await CourseModel.updateOne(
            {
              _id: courseId,
              "finalTest._id": finalTestId,
              "finalTest.tests._id": questionId
            },
            {
              $push: {
                "finalTest.$[ft].tests.$[q].answers": answerData
              }
            },
            {
              arrayFilters: [
                { "ft._id": finalTestId },
                { "q._id": questionId }
              ]
            }
          );
        } catch (err) {
          console.error("Error saving answer:", err);
        }
      }

      // Tính phần trăm điểm bài test
      const finalTestPercentage = totalMaxScore > 0 ?
        (totalScore / totalMaxScore) * 100 : 0;

      // --- Tính điểm tổng hợp cả khóa học ---

      let totalQuizScore = 0;
      let totalQuizMaxScore = 0;

      course.courseData.forEach((data: any) => {
        data.quiz.forEach((question: any) => {
          const userAnswers = question.answers.filter((ans: any) =>
            ans.user && ans.user._id.toString() === userId.toString()
          );

          const latestAnswer = userAnswers.reduce((latest: any, current: any) =>
            latest && latest.createdAt > current.createdAt ? latest : current,
            null
          );

          const score = latestAnswer ? latestAnswer.score : 0;
          const maxScore = question.maxScore || 10;

          totalQuizScore += score;
          totalQuizMaxScore += maxScore;
        });
      });

      const quizPercentage = totalQuizMaxScore > 0 ?
        (totalQuizScore / totalQuizMaxScore) * 100 : 0;

      const quizWeight = course.quizWeight || 20;
      const finalTestWeight = course.finalTestWeight || 80;

      const weightedFinalScore =
        (quizPercentage * quizWeight / 100) +
        (finalTestPercentage * finalTestWeight / 100);

      const passingGrade = course.passingGrade || 50;
      const hasPassed = weightedFinalScore >= passingGrade;
      const testStatus = hasPassed ? TEST_COURSE_STATUS.PASSED : TEST_COURSE_STATUS.FAILED;

      const existingScore = await userScoreModel.findOne({ user: userId, courseId });
      const isFirstTimePassing = !existingScore || existingScore.testCourseStatus !== TEST_COURSE_STATUS.PASSED;

      await userScoreModel.deleteOne({ user: userId, courseId });

      await userScoreModel.create({
        user: userId,
        courseId,
        finalScore: weightedFinalScore,
        testCourseStatus: testStatus,
      });

      // await NotificationModel.create({
      //   user: userId,
      //   title: hasPassed ? 'Congratulations! Course Completed' : 'Course Test Result',
      //   message: hasPassed 
      //     ? `You have successfully passed the course "${course.name}" with a score of ${weightedFinalScore.toFixed(1)}%!`
      //     : `You have completed the tests for "${course.name}" with a score of ${weightedFinalScore.toFixed(1)}%. Try again to achieve a passing score of ${passingGrade}%.`,
      // });

      if (hasPassed && isFirstTimePassing) {
        try {
          const user = await userModel.findById(userId);

          if (user && user.email) {
            const mailData = {
              course: {
                _id: course._id.toString().slice(0, 6),
                name: course.name,
                score: weightedFinalScore.toFixed(1),
                passingGrade: passingGrade,
                quizScore: quizPercentage.toFixed(1),
                finalTestScore: finalTestPercentage.toFixed(1),
                completionDate: new Date().toLocaleDateString('vi-VN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
              },
              user: {
                name: user.name || user.email.split('@')[0],
              }
            };

            // Gửi email chúc mừng
            await sendMail({
              email: user.email,
              subject: `Congratulations on Completing "${course.name}"!`,
              template: 'course-completion.ejs',
              data: mailData,
            });
          }
        } catch (emailError) {
          console.error('Error sending completion email:', emailError);
        }
      }

      res.status(200).json({
        success: true,
        data: {
          courseId: course._id,
          courseName: course.name,
          finalScore: weightedFinalScore,
          quizScore: quizPercentage,
          testScore: finalTestPercentage,
          correctAnswers: correctAnswersCount,
          totalQuestions: answers.length,
          weightedDetails: {
            quizContribution: quizWeight.toString(),
            testContribution: finalTestWeight.toString(),
          },
          passingGrade: passingGrade,
          passed: hasPassed,
          status: testStatus,
          isFirstTimePassing: isFirstTimePassing,
        }
      });
    } catch (error: any) {
      console.error("Submit final test error:", error);
      return next(new ErrorHandler(error.message, 500));
    }
  }
);