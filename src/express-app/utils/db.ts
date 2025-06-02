import mongoose from 'mongoose';

require('dotenv').config();

const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log('MongoDB is already connected');
      return;
    }
    
    const dbUrl: string = process.env.DB_URI || '';
    if (!dbUrl) {
      throw new Error('DB_URI is not defined in environment variables');
    }
    
    await mongoose.connect(dbUrl);
    console.log('MongoDB connected successfully');
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message);
  }
};

export default connectDB;
