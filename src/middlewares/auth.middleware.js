import { User } from "../models/user.model.js";
import APIError from "../utils/APIError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
const verifyJWT = asyncHandler( async (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken || req.header
        ("Authorization")?.replace("Bearer ", "");
    
        if(!accessToken){
            throw new APIError(401, "Unauthorized access!")
        }
        
        // in user model we have custom methods for generating access token
        // there we used user data id, username, email etc and secret_key for creating token 
        // now we are using that token and same secret key to verify or decode the token
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            throw new APIError(401, "Invalid access token")
        }
        
        // setting a field named user in the req object; we can name it whatever we want.
        req.user = user;
        next();

    } catch (error) {
        throw new APIError(401, error?.message || "Invalid access token")
    }
});

export {verifyJWT};