import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controllers.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const dashboardRouter = Router()

dashboardRouter.use(verifyJwt)

dashboardRouter.get("/stats/:channelId", getChannelStats);
dashboardRouter.get("/stats", getChannelStats); // For current user
dashboardRouter.get("/videos/:channelId", getChannelVideos);
dashboardRouter.get("/videos", getChannelVideos); // For current user

export { dashboardRouter }