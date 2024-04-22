import { Router } from "express";
import { 
    loginUser, 
    logoutUser, 
    registerUser, 
    refreshAccessToken, 
    updateUserPassword, 
    updateUserAccountDetails, 
    getCurrentUser, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getUserChannelProfile, 
    getWatchHistory 
    } from "../controllers/user.controller.js";
import {upload} from  "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

//secure routes
// in post method we can pass any number of functions, middlewares, next transfer controll to one after other
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/update-password").post(verifyJWT, updateUserPassword);
router.route("/get-current-user").get(verifyJWT, getCurrentUser);
router.route("/update-user-details").patch(verifyJWT, updateUserAccountDetails);  // patch as we want to update some piece of info
router.route("/update-avatar").patch(
    verifyJWT,
    upload.single("avatar"), 
    updateUserAvatar
);
router.route("/update-coverImage").patch(
    verifyJWT,
    upload.single("coverImage"), 
    updateUserCoverImage
);

router.route("/channel/:username").get(verifyJWT, getUserChannelProfile);
router.route("/watch-history").get(verifyJWT, getWatchHistory);

export default router;