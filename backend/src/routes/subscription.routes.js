import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import { 
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    checkSubscriptionStatus
} from "../controllers/subscription.controllers.js";

const subscriptionRouter = Router()

subscriptionRouter.use(verifyJwt);

subscriptionRouter.post("/channel/:channelId", toggleSubscription);
subscriptionRouter.get("/channel/:channelId/status", checkSubscriptionStatus);
subscriptionRouter.get("/channel/:channelId/subscribers", getUserChannelSubscribers);
subscriptionRouter.get("/user/:subscriberId", getSubscribedChannels);

export { subscriptionRouter }