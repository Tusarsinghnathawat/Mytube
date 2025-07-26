import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { 
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikeStatus
    
} from "../controllers/like.controllers.js";

const likeRouter = Router();

likeRouter.use(verifyJwt)

likeRouter.post("/toggle/video/:videoId", toggleVideoLike);
likeRouter.post("/toggle/comment/:commentId", toggleCommentLike);
likeRouter.post("/toggle/tweet/:tweetId", toggleTweetLike);

likeRouter.get("/videos", getLikedVideos)
likeRouter.get("/video/:videoId", getVideoLikeStatus)

export { likeRouter }