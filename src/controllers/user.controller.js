import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler ( async (req, res) => {
    console.log("registerUser");
    res.status(200).json({
        message: "user registered!"
    })
})

export {registerUser};