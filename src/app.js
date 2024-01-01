import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"

import userRouter from "./routes/user.routes.js"

const app = express();

// used to resolve Cross Origin Access errors
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({limit: "16kb"}));

// to make server understand different encoding like '%20', '+' in url
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(cookieParser());

// to use some static files
app.use(express.static("public"));

//user routes
app.use("/api/v1/users", userRouter);
// app.use("/api/v1/test", )
export default app;