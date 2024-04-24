import APIError from "../utils/APIError.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import {Video} from "../models/video.model.js"
import APIResponse from "../utils/APIResponse.js";

const publishAVideo = asyncHandler(async (req, res) => {
    const {title, description} = req?.body;
    const user = req?.user;
    
    if(!title || !description){
        throw new APIError(400, "Title or description is missing!");
    }
    
    console.log(req?.files);

    const localVideoPath = req?.files?.video?.[0]?.path;
    const localThumbnailPath = req?.files?.thumbnail?.[0]?.path;


    if(!localVideoPath || !localThumbnailPath){
        throw new APIError(400, "Video or thumbnail is missing")
    }

    const videoDetails = await uploadOnCloudinary(localVideoPath);
    const thumbnailDetails = await uploadOnCloudinary(localThumbnailPath);

    if(!videoDetails || !thumbnailDetails){
        throw new APIError(500, "Something went wrong while publishing the video!");
    }
    
    const video = await Video.create({
        title: title,
        description: description,
        videoFile: videoDetails?.url,
        duration: videoDetails?.duration,
        thumbnail: thumbnailDetails?.url,
        isPublished: true,
        owner: user?._id,
    });

    if(!video){
        throw APIError(500, "Error encountered while publishing a the video!")
    }

    return res
    .status(200)
    .json(
        new APIResponse(
            200,
            video,
            "Video published successfully!"
        )
    );
    
})

export {
    publishAVideo
}