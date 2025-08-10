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

// Public feed and tweet details
tweetRouter.get("/", getAllTweets);
tweetRouter.get("/:tweetId", getTweetById);

// Authenticated routes
tweetRouter.use(verifyJwt)
tweetRouter.post("/", createTweet);
tweetRouter.get("/user/:userId", getUserTweets);
tweetRouter.patch("/:tweetId", updateTweet);
tweetRouter.delete("/:tweetId", deleteTweet);

export { tweetRouter }