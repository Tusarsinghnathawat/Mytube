import { Router } from "express";
import { 
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets,
    getTweetById
} from "../controllers/tweet.controllers.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const tweetRouter = Router()

tweetRouter.use(verifyJwt)

tweetRouter.get("/", getAllTweets);
tweetRouter.post("/", createTweet);
tweetRouter.get("/user/:userId", getUserTweets);
tweetRouter.patch("/:tweetId", updateTweet);
tweetRouter.delete("/:tweetId", deleteTweet);
tweetRouter.get("/:tweetId", getTweetById);

export { tweetRouter }