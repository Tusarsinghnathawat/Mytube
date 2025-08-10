import { Router } from "express";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controllers.js"

const videoRouter = Router();

//get all videos (public route - no auth needed)
videoRouter.get("/", getAllVideos);

// Public: single video details
videoRouter.get("/:videoId", getVideoById);

//apply verifyJWT middleware to routes that require authentication
videoRouter.use(verifyJwt)

//publish a new video
videoRouter.post(
    "/",
    upload.fields([
        {name: "videoFile", maxCount: 1},
        {name: "thumbnail", maxCount: 1}
    ]),
    publishAVideo
);

videoRouter.patch(
    "/:videoId",
    upload.single("thumbnail"),
    updateVideo
);

videoRouter.delete("/:videoId", deleteVideo);

videoRouter.patch("/:videoId/toggle-publish", togglePublishStatus);

export {videoRouter};

