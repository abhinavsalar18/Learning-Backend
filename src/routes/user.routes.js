import { Router } from "express";
import { loginUser, logoutUser, registerUser, testRoute } from "../controllers/user.controller.js";
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
export default router;