import { Router } from "express"
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment,
    addTweetReply,
    getTweetReplies
} from "../controllers/comment.controllers.js"

const commentRouter = Router();
commentRouter.get("/video/:videoId", getVideoComments)

commentRouter.use(verifyJwt)//apply verifyJwt middleware to all routes

commentRouter.post("/video/:videoId", addComment)
commentRouter.patch("/:commentId", updateComment)
commentRouter.delete("/:commentId", deleteComment)
commentRouter.post("/tweet/:tweetId/reply", addTweetReply);
commentRouter.get("/tweet/:tweetId/replies", getTweetReplies);

export { commentRouter }