import { Router } from "express";
import { 
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controllers.js";
import { verifyJwt } from "../middlewares/auth.middlewares.js";

const playlistRouter = Router();
playlistRouter.use(verifyJwt)

playlistRouter.post("/", createPlaylist);
playlistRouter.get("/user/:userId", getUserPlaylists);
playlistRouter.get("/:playlistId", getPlaylistById);
playlistRouter.post("/:playlistId/videos/:videoId", addVideoToPlaylist);
playlistRouter.delete("/:playlistId/videos/:videoId", removeVideoFromPlaylist);
playlistRouter.delete("/:playlistId", deletePlaylist);
playlistRouter.patch("/:playlistId", updatePlaylist);

export { playlistRouter }
