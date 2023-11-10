
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


// event based middle (even, callback)
// we can not use fat arrow function here because they don't have access to the "this"
// the computation takes some time => async -> next to pass it further
userSchema.pre("save", async function (next){
    // modify only when password is updated
    if(!this.isModified("password")) return next();

    this.password = bcrypt.hash(this.password, 10);
    next();
})

// we can defined our own methods like we have updateOne, insertMany etc
userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password) // return boolean value
}

// jwt sign is very fast we do not need of async
userSchema.methods.generateAccessToken = async function () {
    return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            fullName: this.fullName,
            email: this.email
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function (){
    return jwt.sign(
        {
            // refresh tokens should be light in payload
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.RFERSH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);