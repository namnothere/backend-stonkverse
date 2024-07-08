import cloudinary from "cloudinary";
import { CatchAsyncErrors } from "../../middleware/catchAsyncErrors";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../../utils/ErrorHandler";
import { checkCourseContent, createCourseInDB, updateCourseInDB } from "../providers";
import { CourseModel, IAnswerQuiz, ICourse, ICourseData, IQuestionQuiz } from "../models";
import { redis } from "../../utils/redis";
import mongoose from "mongoose";
import { sendMail } from "../../utils/sendMail";
import { NotificationModel } from "../../models";
import axios from "axios";
import { LayoutModel } from "../../layout/models";
import { getUserInfo } from "../../user/controllers";
import { userModel } from "../../user/models";
import { MESSAGES } from "../../shared/common";

export const uploadCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { data } = req.body;
      const thumbnail = data.thumbnail;
      const curriculum = data.curriculum;

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      if (curriculum) {
        
        const myCloudCurri = await cloudinary.v2.uploader.upload(curriculum, {
          resource_type: "auto",
          folder: "curriculums",
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

      if (!(await checkCourseContent(req.body.name))) {
        return res.status(400).json({
          success: false,
          message: 'Can not create a course with inappropriate content',
        });
      }

      const course = await createCourseInDB(data, res, next);
      res.status(201).json({ success: true, course });


    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status || 500));
    }
  }
);

export const editCourse = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const courseId = req.params.id;

      let existCourse: any = await CourseModel.findById(courseId);

      if (!existCourse) {
        res.status(404).json({ success: false, message: "Course not found" });
        return;
      }

      if (data.thumbnail) {
        const thumbnail = data.thumbnail;
        if (!thumbnail.startsWith("https")) {
          const thumbnailCloud = await cloudinary.v2.uploader.upload(thumbnail, {
            folder: "courses",
            resource_type: "auto",
            allowedFormats: ["jpg", "png", "pdf"],
          });
          data.thumbnail = {
            public_id: thumbnailCloud.public_id,
            url: thumbnailCloud.secure_url,
          };
        }
      }

      if (data.curriculum) {
        const curriculum = data.curriculum;
        if (!curriculum.startsWith("https")) {
          const curriculumCloud = await cloudinary.v2.uploader.upload(curriculum, {
            resource_type: "auto",
            folder: "curriculums",
            allowedFormats: ["jpg", "png", "pdf"],

          });
          data.curriculum = {
            public_id: curriculumCloud.public_id,
            url: curriculumCloud.secure_url,
          };
        }
      }

      if (!(await checkCourseContent(req.body.name))) {
        return res.status(400).json({
          success: false,
          message: 'Cannot update the course with inappropriate content',
        });
      }

      const updatedCourse = await updateCourseInDB(courseId, req.body);
      if (!updatedCourse) {
        return res.status(404).json({ success: false, message: "Course not found" });
      }
      res.status(200).json({ success: true, course: updatedCourse });
    } catch (error: any) {
      next(new ErrorHandler(error.message, error.status || 500));
    }
  }
);


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

export const getCoursesByKeySearch = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { query } = req.params;

      const courses = await CourseModel.find({
        name: { $regex: query, $options: "i" },
      }).select("thumbnail name ratings");

      console.log(courses[0]);

      const notDuplicate = new Map();

      courses.forEach(course => {
        if (course.name) {
          notDuplicate.set(course.name, {
            name: course.name,
            thumbnail: course.thumbnail.url,
            ratings: course.ratings
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
  }
);

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

      const newQuestion: any = {
        user: req.user?._id,
        title,
        question,
        questionReplies: [],
      };

      courseContent.questions.push(newQuestion);

      // [LATER]
      const notification = await NotificationModel.create({
        user: req.user?._id,
        title: "New Question Created",
        message: `You have a new question in ${courseContent.title}`,
      });

      await course?.save();

      res.status(200).json({ success: true, course });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
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

      const newAnswer: any = { user: req.user?._id, answer };

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
  }
);

interface IAddAnswerQuizz {
  courseId: string;
  contentId: string;
  answers: {

    questionId: string;
    answer: string[];
  }[];
  score: number,
}

export const addAnswerQuiz = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, contentId, answers } = req.body as IAddAnswerQuizz;

      const course = await CourseModel.findById(courseId).populate(
        "courseData.quiz.user"
      );
      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Course not found", 400));
      }

      const courseContent = course?.courseData?.find((item: any) =>
        item._id.equals(contentId)
      );
      if (!courseContent) {
        return next(new ErrorHandler("Video not found", 400));
      }

      let totalScore = 0;
      let detailedScores: { [key: string]: number } = {};

      answers.forEach(answerObj => {
        const { questionId, answer } = answerObj;
        const question = courseContent.quiz.find((item) => item._id.equals(questionId));
        if (!question) {
          return;
        }

        let score = 0;
        if (Array.isArray(question.correctAnswer)) {
          score = question.correctAnswer.every((val) => answer.includes(val)) ? question.maxScore : 0;
        } else {
          score = question.correctAnswer === answer[0] ? question.maxScore : 0;
        }
        totalScore += score;
        detailedScores[questionId] = score;

        const newAnswer: any = {
          user: req.user?._id,
          answer,
          score
        };

        question.answers.push(newAnswer);
      });

      await course?.save();

      res.status(200).json({ success: true, totalScore, detailedScores });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const getAnswersQuiz = async (req: Request, res: Response, next: NextFunction) => {
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
    
        courses.forEach(course => {
          course.courseData.forEach(data => {
            // console.log("Processing courseData: ", data._id);
            if (data._id.toString() === contentId) {
              data.quiz.forEach(quiz => {
                // console.log("Processing quiz: ", quiz._id);
                if (quiz.answers && quiz.answers.length > 0) {
                  const userAnswers = quiz.answers.filter(ans => ans.user?.toString() === userId.toString());
                  // console.log("Answers for quiz: ", quiz._id, userAnswers);
                  if (userAnswers.length > 0) {
                    if (!answers[data._id.toString()]) {
                      answers[data._id.toString()] = {};
                    }
                    answers[data._id.toString()][quiz._id.toString()] = userAnswers[userAnswers.length - 1].answer;
                  }
                }
              });
            }
          });
        });
    console.log("Final answers: ",answers );
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

        const totalRatings =
          course?.reviews.reduce((acc, cur) => acc + cur.rating, 0) || 0;

        const avgRatings = totalRatings / (course?.reviews.length || 0);

        course.ratings = Number(avgRatings.toFixed(2));

        await course.save();

        const updatedCourse = await CourseModel.findById(courseId).populate(
          "reviews.user"
        );

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


export const addReplyToReview = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, reviewId } = req.body as IAddReviewData;
      const course = await CourseModel.findById(courseId);
      console.log("courseId:", courseId);
      console.log("reviewId:", reviewId);
      console.log("answer:", answer);

      if (!course) {
        console.log("Loi:")
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

export const getIndexStock = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const indexUrl = "http://207.148.64.246:8080/historical_data/filter";
      const response = await axios.get(indexUrl);
      const data = response.data.data;
      
      if (data.length === 0) {
        return next(new ErrorHandler("No data available", 400));
      }
      const randomIndex = Math.floor(Math.random() * data.length);
      const randomData = data[randomIndex];

      const changePercent = ((randomData.close_price - randomData.open_price) / randomData.open_price) * 100;

      const result = res.json({
        symbol: randomData.symbol,
        close_price: randomData.close_price,
        change_percent: changePercent.toFixed(2)
      });

      res.status(200).json({ success: true, result });

    }  catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
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
                answer.user._id.equals(userId) &&
                (!latestAnswer || answer.createdAt > latestAnswer.createdAt)
              ) {
                latestAnswer = answer;
              }
            });

            const score = latestAnswer ? latestAnswer.score : 0;
            totalScore += score;
            totalMaxScore += question.maxScore;

            return { title: question.title || "", score };
          })
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
  }
);
