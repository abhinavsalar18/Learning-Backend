import dotenv from "dotenv"
import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";
import asyncHandler from "../utils/asyncHandler.js";

dotenv.config();

const connectDB = async () =>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB Connected!! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("\n MongoDB Connection Failed!: ", error);
        throw error;
    }
}

export default connectDB;