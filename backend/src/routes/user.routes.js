import { Router} from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} 
from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const userRouter = Router();


//Upload is middleware so that at the rout register if any image is uploaded it should go through middleware
userRouter.route("/register").post(upload.fields([
    {
        name : "avatar",
        maxCount :1
    },
    {
        name : "coverImage",
        maxCount : 1
    }
]),registerUser)
//  http://localhost:8000/api/v1/user/register


userRouter.route("/login").post(loginUser)

//secured routes
userRouter.route("/logout").post(verifyJwt, logoutUser)
userRouter.route("/refresh-token").post(refreshAccessToken)
userRouter.route("/change-password").post(verifyJwt, changeCurrentPassword)
userRouter.route("/current-user").get(verifyJwt, getCurrentUser)
userRouter.route("/update-account").patch(verifyJwt, updateAccountDetails)
userRouter.route("/update-avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)
userRouter.route("/update-cover-image").patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage)
userRouter.route("/c/:username").get(getUserChannelProfile) // public channel profile
//user.prams se data aa raha hai (URL mai)
userRouter.route("/history").get(verifyJwt, getWatchHistory)



export {userRouter}