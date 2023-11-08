import  "../proxy_config.mjs" 
import dotenv from "dotenv"
import express from "express"
import mongoose from "mongoose";
import { DB_NAME} from "./constants.js";
import connectDB from "./db/dbConnection.js"
dotenv.config();
connectDB();


/* //* IIFE to connect to db
//* Database is in another continent - Always use try-catch and async-await 
const app = express();
(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

        app.on("error", () => {
            console.log("Error server unable to communicate: ", error);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port: ${process.env.PORT}`);
        })
        console.log("MongoDB connected!! ");
    } catch (error){
        console.log("Error: ", error);
        throw error;
    }
})();
*/