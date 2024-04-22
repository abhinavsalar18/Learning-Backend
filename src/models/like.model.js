import mongoose, { Schema } from "mongoose";

const likeSchema = new mongoose.Schema(
    {
        video: {
            type: Schema.Types.ObjectId,
            ref: "Comment" 
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Video" 
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User" 
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet" 
        }
    }, 
    {
        timestamps: true
    }
);


export const Like = mongoose.model("Like", likeSchema);