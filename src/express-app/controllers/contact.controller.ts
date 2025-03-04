import { NextFunction, Request, Response } from 'express';
import { CatchAsyncErrors } from '../middleware/catchAsyncErrors';
import { contactModel, IContact } from '../models';
import ErrorHandler from '../utils/ErrorHandler';
import { sendMail } from '../utils/sendMail';
import { constants } from 'buffer';

export const addNewContact = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, problem, explain }: IContact = req.body;

      const newContact = await contactModel.create({ email, problem, explain });

      await newContact?.save();

      const mailData = {
        contact: {
          _id: newContact._id.toString().slice(0, 6),
          email: newContact.email,
          problem: newContact.problem,
          explain: newContact.explain,
        },
      };

      const data = {
        email: newContact.email,
        problem: newContact.problem,
        explain: newContact.explain,
      };

      try {
        await sendMail({
          email: 'tnbh234@gmail.com',
          subject: 'Support Request: ' + data.problem,
          template: 'support-request.ejs',
          data: mailData,
        });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
      }

      res.status(200).json({ success: true, newContact });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  },
);

export const getAllContact = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const contacts = await contactModel.find().sort({ createdAt: -1 });

      res.status(200).json({ success: true, contacts });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);

export const deleteContact = CatchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const contact = await contactModel.findById(id);

      if (!contact) {
        return next(new ErrorHandler('Contact not found', 400));
      }

      await contactModel.deleteOne({ _id: id });

      res
        .status(200)
        .json({ success: true, message: 'This contact deleted successfully' });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  },
);
