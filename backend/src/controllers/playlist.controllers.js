import mongoose, {isValidObjectId} from "mongoose"
import { Playlist } from "../models/playlist.models.js"
import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { User } from "../models/user.models.js"

const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body

    if(!name?.trim()) throw new apiError(400,"Playlist name is required")
    
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description?.trim() || "",
        owner: req.user._id
    })

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            playlist,
            "Playlist created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists
    const {userId} = req.params
    const { page = 1, limit = 10 } = req.query

    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new apiError(400,"Invalid user Id")
    }

    const user = await User.findById(userId)
    if(!user) throw new apiError(404,"user not found")
    
    //get playlist
    const Playlists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            // description: 1,
                            duration: 1,
                            thumbnail: 1,
                            views: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                videoCount: { $first: "$videos"}
            }
        },
        {
            $sort: { updatedAt: -1 }
        },
        {
            $skip: (parseInt(page) - 1)*parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    const totalPlaylists = await Playlist.countDocuments({ owner: userId})

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {
                Playlists,
                currentPage: parseInt(page),
                totalPage: Math.ceil(totalPlaylists/parseInt(limit)),
                totalPlaylists
            },
            "playlists fetched successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async (req, res) => { 
    //thoda complex hai
    //TODO: get playlist by id
    const {playlistId} = req.params
    
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new apiError(400, "Invalid playlist Id")
    }

    // const playlist = await Playlist.findById(playlistId)
    // if(!playlist) throw new apiError(404, "Playlist not found")

    const playlist = await Playlist.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(playlistId)
            } 
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            FullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        FullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }

                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" },
                videoCount: { $size: "$videos" }
            }
        }
    ])

    //check if playlist exists
    if(!playlist || playlist.length ===0){
        throw new apiError(404, "playlist not found")
    }

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            playlist[0],
            "playlist fetched successfully"
        )
    )
        
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new apiError(400, "Invalid playlist Id")
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new apiError(400, "Invalid video Id")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new apiError(404, "Playlist not found")
    }
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new apiError(404, "you are not authorized to modify this playlist")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new apiError(404, "Video not found")
    }

    //check if video already in playlist
    if(playlist.videos.includes(videoId)){
        throw new apiError( 400, "video is already in the playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: { videos: videoId }
        },
        {new: true}
    )

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                updatedPlaylist,
                "Video added to playlist successfully"
            )
        )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist
    const {playlistId, videoId} = req.params
    
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new apiError(400, "Invalid playlist Id")
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new apiError(400, "Invalid video Id")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new apiError(404, "Playlist not found")
    }
    if(playlist.owner.toString() !== req.user._id.toString()) {
        throw new apiError(404, "you are not authorized to modify this playlist")
    }
    // const video = await Playlist.findById(videoId)
    // if (!video) {
    //     throw new apiError(404, "video not found")
    // }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }
        },
        { new: true }
    )

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            updatedPlaylist,
            "Video removed from playlist successfully"
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist
    const {playlistId} = req.params
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new apiError(400, "Invalid playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new apiError(404, "Playlist not found")
    }
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You are not authorized to delete this playlist")
    }

    await Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {},
            "Playlist deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist
    const {playlistId} = req.params
    const {name, description} = req.body

    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new apiError(400, "Invalid playlist Id")
    }

    if(!name?.trim()){
        throw new apiError(400, "playlist name is required")
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new apiError(404, "Playlist not found")
    }
    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You are not authorized to delete this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name: name.trim(),
                description: description?.trim() || ""
            }
        },
        { new: true }
    )
    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                updatedPlaylist,
                "Playlist updated successfully"
            )
        )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}

