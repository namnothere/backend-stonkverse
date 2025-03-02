import { NextFunction, Request, Response } from 'express';
import {
  userModel,
  IUser,
  learningProgressModel,
  COURSE_DATA_STATUS,
} from '../models';
import ErrorHandler from '../../utils/ErrorHandler';
import { CatchAsyncErrors } from '../../middleware/catchAsyncErrors';
import jwt, { JwtPayload, Secret } from 'jsonwebtoken';
import { sendMail } from '../../utils/sendMail';
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from '../../utils/jwt';
import { redis } from '../../utils/redis';
import cloudinary from 'cloudinary';
import { MESSAGES, RESULT_STATUS } from '../../shared/common';
import { CourseModel } from '../../course/models';
import {
  IActivationRequest,
  IActivationToken,
  ILoginRequest,
  IRegistrationBody,
  IUpdatePassword,
  IUpdateProfilePicture,
  IUpdateUserInfo,
} from '../interfaces';

require('dotenv').config();

export const registrationUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body as IRegistrationBody;

      const isEmailExist = await userModel.findOne({ email });

      if (isEmailExist) {
        return next(new ErrorHandler('Email already exist', 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
      };

      const activationToken = createActivationToken(user);
      const activationCode = activationToken.activationCode;

      if (process.env.NODE_ENV === 'development') {
        console.log(activationToken);
      }

      const data = { user: { name: user.name }, activationCode };

      await sendMail({
        email: user.email,
        subject: 'Activate your account',
        template: 'activation-mail.ejs',
        data,
      });

      res.status(201).json({
        success: true,
        message: `Please check your email ${user.email} to activate your account!`,
        activationToken: activationToken.token,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: '5m',
    },
  );

  return { token, activationCode };
};

export const activateUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activation_code, activation_token } =
        req.body as IActivationRequest;

      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activation_token,
        process.env.ACTIVATION_SECRET as string,
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activation_code) {
        return next(new ErrorHandler('Invalid activation code', 400));
      }

      const { name, email, password } = newUser.user;

      const existUser = await userModel.findOne({ email });

      if (existUser) {
        return next(new ErrorHandler('User already exists', 400));
      }

      await userModel.create({ name, email, password, isActive: true });

      res.status(201).json({ success: true });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const loginUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      if (!email || !password) {
        return next(new ErrorHandler('Please enter email and password', 400));
      }

      const user = await userModel.findOne({ email }).select('+password');

      if (!user) {
        return next(new ErrorHandler('Invalid email or password', 400));
      }

      const isPasswordMatch = await user.comparePassword(password);

      if (!isPasswordMatch) {
        return next(new ErrorHandler('Invalid password', 400));
      }

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: '5m' },
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        { expiresIn: '3d' },
      );

      res
        .cookie('access_token', accessToken, accessTokenOptions)
        .header('Access-Control-Allow-Credentials', 'true');
      res
        .cookie('refresh_token', refreshToken, refreshTokenOptions)
        .header('Access-Control-Allow-Credentials', 'true');

      await redis.set(user._id, JSON.stringify(user), 'EX', 604800);

      res.status(200).json({
        success: true,
        user,
        accessToken,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const logoutUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie('access_token', '', { maxAge: 1 });
      res.cookie('refresh_token', '', { maxAge: 1 });

      const userId = req.user?._id || '';
      redis.del(userId);

      res
        .status(200)
        .json({ success: true, message: 'Logged out successfully!' });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const updateAccessToken = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string,
      ) as JwtPayload;

      const message = 'Coud not refresh token';

      if (!decoded) return next(new ErrorHandler(message, 400));

      const session = await redis.get(decoded.id as string);

      if (!session) return next(new ErrorHandler(message, 400));

      const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: '5m' },
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        { expiresIn: '3d' },
      );

      req.user = user;

      res
        .cookie('access_token', accessToken, accessTokenOptions)
        .header('Access-Control-Allow-Credentials', 'true');
      res
        .cookie('refresh_token', refreshToken, refreshTokenOptions)
        .header('Access-Control-Allow-Credentials', 'true');

      await redis.set(user._id, JSON.stringify(user), 'EX', 604800);

      next();
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const updateAccessTokenHandler = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token as string;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string,
      ) as JwtPayload;

      if (!decoded)
        return next(new ErrorHandler(MESSAGES.COULD_NOT_REFRESH_TOKEN, 400));

      const session = await redis.get(decoded.id as string);

      if (!session)
        return next(new ErrorHandler(MESSAGES.COULD_NOT_REFRESH_TOKEN, 400));

      const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: '5m' },
      );

      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        { expiresIn: '3d' },
      );

      req.user = user;

      res.cookie('access_token', accessToken, accessTokenOptions);
      res.cookie('refresh_token', refreshToken, refreshTokenOptions);

      await redis.set(user._id, JSON.stringify(user), 'EX', 604800);

      res.status(200).json({ success: true, accessToken });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const getUserInfo = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if (user && req.user) {
        await redis.set(req.user?._id, JSON.stringify(user));
        res.status(200).json({ success: true, user });
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

interface ISocialAuthBody {
  name: string;
  email: string;
  avatar: string;
}

export const socialAuth = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;
      const user = await userModel.findOne({ email });

      if (!user) {
        const newUser = await userModel.create({ email, name, avatar });
        sendToken(newUser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const updateUserInfo = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = req.body as IUpdateUserInfo;

      const userId = req.user?._id;

      const user = await userModel.findById(userId);

      if (name && user) {
        user.name = name;
      }

      await user?.save();

      if (userId) {
        await redis.set(userId, JSON.stringify(user));
      }

      res.status(200).json({ success: true, user });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const updatePassword = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as IUpdatePassword;

      if (!oldPassword || !newPassword) {
        return next(new ErrorHandler('Please enter old and new password', 400));
      }

      const user = await userModel.findById(req.user?._id).select('+password');

      if (user?.password === undefined) {
        return next(new ErrorHandler('Invalid user', 400));
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword);

      if (!isPasswordMatch)
        return next(new ErrorHandler('Invalid old password', 400));

      user.password = newPassword;

      if (req.user) {
        await redis.set(req.user?.id, JSON.stringify(user));
      }

      await user.save();

      res.status(201).json({ success: true, user });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const updateProfilePicture = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body as IUpdateProfilePicture;

      const userId = req?.user?._id;

      const user = await userModel.findById(userId);

      if (avatar && user) {
        if (user?.avatar.public_id) {
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
          });

          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: 'avatars',
            width: 150,
          });

          user.avatar = {
            public_id: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
      }

      await user?.save();

      if (userId) {
        await redis.set(userId, JSON.stringify(user));
      }

      res.status(200).json({ success: true, user });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const getAllUsers = CatchAsyncErrors(
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userModel.find().sort({ createdAt: -1 });

      res.status(200).json({ success: true, users });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const updateUserRole = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, role } = req.body;
      const existedUser = await userModel.findOne({ email });

      if (!existedUser) {
        res
          .status(404)
          .json({ success: false, message: MESSAGES.USER_NOT_FOUND });
      }

      existedUser ? (existedUser.role = role) : existedUser;

      await existedUser?.save();

      res.status(200).json({ success: true, user: existedUser });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const deleteUser = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const user = await userModel.findById(id);

      if (!user) {
        return next(new ErrorHandler('User not found', 404));
      }

      await user.deleteOne({ id });

      await redis.del(id);

      res
        .status(200)
        .json({ success: true, message: 'User deleted successfully' });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const resetUserLearningProgress = CatchAsyncErrors(
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userModel.find().sort({ createdAt: -1 });

      const promises = users.map(async (user: IUser) => {
        const courseIds = user.courses.map((course: any) => course.courseId);
        const courses = await CourseModel.find({ _id: { $in: courseIds } });

        for (const course of courses) {
          const learningProgress = await learningProgressModel.findOne({
            user,
            courseId: course._id,
          });

          if (learningProgress) {
            learningProgress.progress = [];
            await learningProgress.save();
          } else {
            const newProgress = await learningProgressModel.create({
              courseId: course._id,
              user: user,
              progress: [],
            });
            await newProgress.save();
          }
        }
      });

      await Promise.all(promises);

      res.status(201).json({ status: RESULT_STATUS.SUCCESS });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const getUserLearningProgress = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userModel.findById(req.user?._id);
      if (!user) {
        return next(new ErrorHandler(MESSAGES.USER_NOT_FOUND, 404));
      }

      const courseId = req.params.courseId;
      console.log('get courseid: ', courseId);
      if (!courseId) {
        return next(new ErrorHandler(MESSAGES.COURSE_NOT_FOUND, 400));
      }
      const learningProgress = await learningProgressModel.findOne({
        user,
        courseId,
      });
      console.log('get learningProgress: ', learningProgress);

      if (!learningProgress) {
        return next(
          new ErrorHandler(MESSAGES.LEARNING_PROGRESS_NOT_FOUND, 404),
        );
      }

      res.status(200).json({ result: RESULT_STATUS.SUCCESS, learningProgress });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const updateLessonCompletion = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await userModel.findById(req?.user?._id);
      if (!user) {
        return next(new ErrorHandler(MESSAGES.USER_NOT_FOUND, 404));
      }
      const { courseDataId, courseId } = req.params;

      let learningProgress = await learningProgressModel.findOne({
        user,
        courseId,
      });

      console.log('courseDataId:', courseDataId);
      console.log('courseId:', courseId);
      console.log('userid:', user);
      console.log('learningProgress:', learningProgress);

      if (!learningProgress) {
        learningProgress = new learningProgressModel({
          user,
          courseId,
          progress: [courseDataId],
        });
        await learningProgress.save();
        return res
          .status(201)
          .json({ result: RESULT_STATUS.SUCCESS, learningProgress });
      }

      if (!learningProgress.progress.includes(courseDataId)) {
        learningProgress.progress.push(courseDataId);
        await learningProgress.save();
      }

      res.status(200).json({ result: RESULT_STATUS.SUCCESS, learningProgress });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);
