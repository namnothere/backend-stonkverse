import { CatchAsyncErrors } from "../../middleware/catchAsyncErrors";
import { CourseModel } from "../models";

import axios from 'axios';

const PREDICT_LABEL_API_URL = 'http://127.0.0.1:8000/predict_label';

export const checkCourseContent = async (itemName: string) => {
  try {
    const response = await axios.post(`${PREDICT_LABEL_API_URL}?item=${encodeURIComponent(itemName)}`);
    return response.data.result !== 'negative';
  } catch (error) {
    console.error('Failed to check content:', error);
    throw new Error('Failed to check content. The service is unavailable.');
  }
};

export const createCourseInDB = CatchAsyncErrors(async (data: any) => {
  try {
    console.log("Data",data)

    return await CourseModel.create(data);
    
  } catch (error) {
    console.error('Failed to create course:', error);
    throw new Error('Failed to create course in the database.');
  }
});

export const updateCourseInDB = async (courseId: string, courseData: any) => {
  try {
    return await CourseModel.findByIdAndUpdate(courseId, { $set: courseData }, { new: true });
  } catch (error) {
    console.error('Failed to update course:', error);
    throw new Error('Failed to update course in the database.');
  }
};