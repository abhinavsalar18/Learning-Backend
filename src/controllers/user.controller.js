import asyncHandler from "../utils/asyncHandler.js";
import APIError from "../utils/APIError.js"
import APIResponse from "../utils/APIResponse.js"

import {User} from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js"

const generateAccessAndRefreshToken = async (userId) => {
     try{
          const user = await User.findById(userId);
          const accessToken = user.generateAccessToken();
          const refreshToken = user.generateRefreshToken();

          //updating the user instance -> adding refresh token in db

          user.refreshToken = refreshToken;
          await user.save({validateBeforeSave: false});  // do not check for other fields just save it

          return {accessToken, refreshToken};
     }
     catch(err){
          throw new APIError(500, "Something went wrong while generating access and regresh token!")
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
     const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

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
     .cookie("refreshToken", refreshToken.options)
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
// req.user <- this the name of newly added field
const logoutUser = asyncHandler (async (req, res) => {
     await User.findByIdAndUpdate(res.user._id,
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
export {registerUser, loginUser, logoutUser};