import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js"
import APIResponse from "../utils/APIResponse.js"

import {User} from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js"

const registerUser = asyncHandler ( async (req, res) => {
   const {username, email, fullName, password} = req.body;
     console.log(req.body);
   // validating the data - not empty check
   // we can write normal  if else 
   if( [ username, fullName, email, password ].some((field) => field?.trim() === "" ) ){
        throw new APIError(400, "All fileds are required!");
   }

   const isUserExists = await User.findOne({
            $or: [ {email}, {username} ]
        }
   );

   if(isUserExists){
        throw new APIError(400, "User already registered!");
   }

   const avatarLocalPath = req.files?.avatar[0]?.path;
   const converImageLocalPath = req.files?.coverImage[0]?.path;

   if(!avatarLocalPath){
        throw new APIError(400, "Avatar file is required!");
   }
   
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(converImageLocalPath);

   if(!avatar){
        throw new APIError(500, "Something went wrong while registering user!");
   }

   const user = await User.create({
        username: username.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
   });

   const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
   );

   res.status(201).json(
    new APIResponse(201, createdUser, "User registered!")
   )
})


const testRoute = asyncHandler(async (req, res) => {
     console.log(req.body);
})
export {registerUser, testRoute};