import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js"
import APIResponse from "../utils/APIResponse.js"

import {User} from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js"
import jwt from "jsonwebtoken";
import { upload } from "../middlewares/multer.middleware.js";

const generateAccessAndRefreshTokens = async (userId) =>{
     try {
         const user = await User.findById(userId);
         const accessToken = user.generateAccessToken();
         const refreshToken = user.generateRefreshToken();
 
         user.refreshToken = refreshToken;
         await user.save({ validateBeforeSave: false });
 
         return {accessToken, refreshToken};
 
 
     } catch (error) {
         throw new APIError(500, "Something went wrong while generating refresh and access token")
     }
 }

const registerUser = asyncHandler ( async (req, res) => {
   const {username, email, fullName, password} = req.body;

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

//    console.log("req: ", req);
//    console.log ("files: ", req.files);
   const avatarLocalPath = req.files?.avatar[0]?.path;
//    const converImageLocalPath = req.files?.coverImage[0]?.path;
     
     // checking whether we have coverImage or not
   let converImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
     converImageLocalPath = req.files.coverImage[0].path;
   }

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


const loginUser = asyncHandler (async (req, res) => {
     // todo's
     /**
      * req.body -> data
      * Check for email/username & password not empty
      *  Not empty -> validate , else -> throw error
      * check whether user exists or not
      * validate credentials
      * if valid -> login generate access token and refresh token and send to user // using cookies
      * else throw error
      */
     
     const {email, username, password} = req.body;
     if (!(email || username) || !password){
          throw new APIError(400, "Username/email or password is required!");
     }
     
     // checking whether user exists or not
     const user = await User.findOne(
          {
               $or: [{username} ,{email}]
          }
     );

     if(!user){
          throw new APIError(401, "User does not exists!")
     }
     
     // validating password using isPasswordCorrect custom method from userModel
     // custom methods can only be accesses using the instance like 'user' here not by Mongoose Schema like 'User'
     const isPasswordValid = await user.isPasswordCorrect(password);
     
     if(!isPasswordValid){
          throw new APIError(401, "Invalid user credentials!")
     }

     // user logged in generate access and refresh token
     const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
     
     // currently user does not have token so either we have to fetch it from db
     // or we can simply send it manually to user

     const loggedInUser = await User.findById(user._id)
     .select("-password -refreshToken");

     // sending data and token using cookies

     const options = {
          //secure true -> only server can modify the cookies not client (i.e. from frontend)
          httpOnly: true,
          secure: true
     };

     // sending response

     res
     .status(200)
     .cookie("accessToken", accessToken, options)
     .cookie("refreshToken", refreshToken, options)
     .json(
          new APIResponse(
               200,
               {
                    // we need to pass token explicitly so that user can save it local storage or in mobile apps(no set cookies concept there)
                    user: loggedInUser,
                    accessToken,
                    refreshToken
               },
               "User logged in successfully!"
          )
     );
});

// for logout we need to remove cookies and delete refresh token
// but how to get the userId 🤔🤔? -> here comes the use of our custom middleware
// using auth middleswware we will add the user details in req object using access token
// req.user <- this the name of newly added field which contains the userInfo
const logoutUser = asyncHandler (async (req, res) => {
     await User.findByIdAndUpdate(req.user._id,
          {
               $set: {
                    refreshToken: undefined
               }
          },
          {
               new: true
          }
     );
     
     const options = {
          httpOnly: true,
          secure: true
     };

    res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
          new APIResponse(200, {}, "User logged out successfully!")
    )
});

const refreshAccessToken = asyncHandler ( async (req, res) => {
     // for mobile apps refreshToken from req.body
     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

     if(!incomingRefreshToken){
          throw new APIError(401, "Unauthorized request!")
     }

     try {
               // verifying the incomingToken
               const decodedToken = jwt.verify(
                    incomingRefreshToken, 
                    process.env.REFRESH_TOKEN_SECRET
               );

               // console.log("decodedToken: ", decodedToken);
          
               const user = await User.findById(decodedToken?._id);
          
               // getting saved refresh token from user details
               if(!user){
                    throw new APIError(401, "Invalid refresh token")
               }
          
               if(incomingRefreshToken !== user?.refreshToken){
                    throw new APIError(401, "Refresh token has expired or used!")
               }
          
               const options = {
                    httpOnly: true,
                    secure: true
               };
          
               const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);
     
               return res
                    .status(200)
                    .cookie("accessToken", accessToken, options)
                    .cookie("refreshToken", refreshToken, options)
                    .json(
                         new APIResponse(
                                   200, 
                                   {
                                        accessToken,
                                        refreshToken
                                   },
                                   "Access token refreshed successfully!"
                              )
                    )
     } catch (error) {
          console.log(error?.message || "Invalid refresh token");
     }
});

const updateUserPassword = asyncHandler (async (req, res) => {
     const {oldPassword, newPassword} = req?.body;

     if(!oldPassword || !newPassword){
          throw new APIError(400, "All fileds are required!");
     }

     const user = await User.findById(req.user?._id);

     if(!user){
          throw new APIError(401, "Unauthorized request!");
     }

     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

     if(!isPasswordCorrect){
          throw new APIError(400, "Invalid old password!");
     }

     user.password = newPassword;
     await user.save({validateBeforeSave: false}, {new: true});

     return res
          .status(200)
          .json(new APIResponse(200, {}, "Password updated successfully!"));
});

const getCurrentUser = asyncHandler (async (req, res) => {
     return res
          .status(200)
          .json(new APIResponse(200, {user: req?.user}, "Current user fetched successfully!"))
});


const updateUserAccountDetails = asyncHandler (async (req, res) => {
     const {fullName, email} = req.body;
     // console.log("fullName: " + fullName + " email: " + email);
     if(!email || !fullName){
          throw new APIError(400, "All fields are required!")
     }

     const updatedUser = await User.findByIdAndUpdate(
          req?.user?._id,
          {
               $set: {
                    // mongoDB update this field based on the field name matched with it, if not matched
                    // a new field will be created with name of variable: (In ES6 syntax we can pass the value(var name)
                    // directly if it matched to the field name else write fullName: newValue)

                    fullName, 
                    email: email
               }
          },
          { new: true },
          ).select("-password"); // this select method works on the updated user details
     
          // console.log("updatedUser: ", updatedUser);
     return res
          .status(200)
          .json(new APIResponse(200, {user: updatedUser}, "User account details updated successfully!"))
});


const updateUserAvatar = asyncHandler ( async (req, res) => {
     // we need to inject 2 middleswares to make this controller to work
     //1: auth middleware to set the user inside req
     //2: multer to get and keep files in on the local machine before uploading
     const avatarLocalPath = req?.files?.avatar[0].path;

     console.log(avatarLocalPath);
     if(!avatarLocalPath){
          throw new APIError(400, "Avatar file is missing")
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath);

     if(!avatar.url){
          throw new APIError(400, "Error while uploading avatar!")
     }

     const updatedUser = await User.findByIdAndUpdate(
          req?.user?._id,
          {
               $set: {
                    avatarImage: avatar.url
               }
          },
          {new: true}
     ).select("-password");

     return res
          .status(200)
          .json(new APIResponse(200, {user: updatedUser}, "Avatar image updated successfully!"))
});

const updateUserCoverImage = asyncHandler (async (req, res) => {
     console.log(req.files);
     const converImageLocalPath = req.files?.coverImage[0].path;

     if(!converImageLocalPath){
          throw new APIError(400, "Cover image file is missing");
     }

     const coverImage = await uploadOnCloudinary(converImageLocalPath);

     if(!coverImage.url){
          throw new APIError(500, "Error while uploading cover image!")
     }
     
     const updatedUser = await User.findByIdAndUpdate(
          req.user?._id,
          {
               $set: {
                    coverImage: coverImage.url
               }
          },
          { new: true }
     ).select("-password");

     return res
          .status(200)
          .json(new APIResponse(200, {user: updatedUser}, "Cover image updated successfully!"));

});


// get user channel profile
const getUserChannelProfile = asyncHandler(async (req, res) => {
     const { username } = req?.params;
     
     if (!username?.trim()) {
          throw new APIError(400, "Username is missing!");
     }

     // aggregation pipeline
     const channel = await User.aggregate([
          {
               $match: {
                    username: username?.toLowerCase()
               },
          },
          {
               $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "channel",
                    as: "subscribers"
               }
          },
          {
               $lookup: {
                    from: "subscriptions",
                    localField: "_id",
                    foreignField: "subscriber",
                    as: "subscribedTo"
              } 
          },
          {
               $addFields: {
                    subscribersCount: {
                         $size: "$subscribers"
                    },
                    channelSubscribedTo: {
                         $size: "$subscribedTo"
                    },
                    isSubscribed: {
                         $cond: { //subscriber -> model contains subscriber & channel fields =? subscriber -> _id (userId)
                              if: { $in: [req?.user?._id, "$subscribers.subscriber"] },
                              then: true,
                              else: false
                         }
                    }
               }
          },
          {
               $project: {
                    // we can also rename the field name -> emailId: "$email"
                    fullName: 1,
                    username: 1,
                    email: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    channelSubscribedTo: 1,
                    isSubscribed: 1,
               }
          }
     ])

     if (!channel?.length) {
          throw new APIError(400, "Unable to find channel details");
     }

     res
     .status(200)
     .json(
          new APIResponse(200, channel[0], "User channel fetched successfully")
     )
})



export {
     registerUser, 
     loginUser, 
     logoutUser, 
     refreshAccessToken,
     updateUserPassword,
     getCurrentUser,
     updateUserAccountDetails,
     updateUserAvatar,
     updateUserCoverImage
};