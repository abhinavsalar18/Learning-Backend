
import mongoose from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true // it makes searching with username efficient
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true
        },

        password: {
            type: String,
            required:[true, "Password is required!"]
        },

        avatar: {
            type: String,  //cloudinary url
            required: true
        },

        coverImage: {
            type: String // cloudinary url
        },

        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ],

        refreshToken: {
            type: String
        }


    },
    {
        timestamps: true
    }
);


// we can do some processing here using middlewares


// event based middleware (even, callback)
// we can not use fat arrow function here because they don't have access to the "this"
// the computation takes some time => async -> next to pass it further
userSchema.pre("save", async function (next){
    // modify only when password is updated
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10);
    next();
})

// we can defined our own methods like we have updateOne, insertMany etc
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password) // return boolean value
}

// jwt sign is very fast we do not need of async
userSchema.methods.generateAccessToken = function () {
    const accessToken = jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    );
    // console.log("accessToken: ", accessToken);
    return accessToken;
}

userSchema.methods.generateRefreshToken = function () {
    // console.log("generating refresh token", process.env.REFRESH_TOKEN_EXPIRY);
     try {
        const refreshToken = jwt.sign(
           {
               _id: this._id,
               
           },
           process.env.REFRESH_TOKEN_SECRET,
           {
               expiresIn: process.env.REFRESH_TOKEN_EXPIRY
           }
       );
    //    console.log("refreshToken: ", refreshToken);
       return refreshToken;
     } catch (error) {
        console.log(error.message);
     }
   return null;
}

export const User = mongoose.model("User", userSchema);