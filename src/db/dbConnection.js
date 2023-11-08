import dotenv from "dotenv"
import mongoose, { connect } from "mongoose";
import { DB_NAME } from "../constants.js";
import "../../proxy_config.mjs"
dotenv.config();

const connectDB = async () =>{
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`,{
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
        console.log(`MongoDB Connected!! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("\n MongoDB Connection Failed!: ", error);
        throw error;
    }
}

export default connectDB;