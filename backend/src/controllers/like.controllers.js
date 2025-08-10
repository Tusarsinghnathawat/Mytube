import mongoose, {isValidObjectId} from "mongoose";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.models.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comments.models.js";
import { Tweet } from "../models/tweet.models.js";
const toggleVideoLike = asyncHandler(async(req, res) => {
    //TODO: toggle like on video
    const { videoId } = req.params
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new apiError(400, "Invalid Video Id")
    }

    const video = await Video.findById(videoId)
    if(!video) throw new apiError(404, "video not found")
    
    //check if already liked or not
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    //toggle like status
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res
        .status(200)
        .json(
            new apiResponse(
                200,
                {isLiked: false},
                "video unliked successfully"
            )
        )
    }
    else{
        await Like.create({
            video: videoId,
            likedBy: req.user._id
        })
        return res
        .status(200)
        .json(
            new apiResponse(
                200,
                {isLiked: true},
                "video liked successfully"
            )
        )
    }    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment
    const {commentId} = req.params
    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new apiError(400, "invalid comment Id")
    }

    const comment = await Comment.findById(commentId)
    if(!comment) throw new apiError(404, "comment not found")
    
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    //toogle
    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res
        .status(200)
        .json(
            new apiResponse(
                200,
                {isLiked: false},
                "comment unliked successfully"
            )
        )
    }
    else{
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        
        return res
        .status(200)
        .json(
            new apiResponse(
                200,
                {isLiked: true},
                "comment Liked successfully"
            )
        )
    }
})


const toggleTweetLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on tweet
    const {tweetId} = req.params
    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new apiError(400, "Invalid Tweet Id")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet) throw new apiError(404, "Tweet not found")

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)
        return res
        .status(200)
        .json(
            new apiResponse(
                200,
                { isLiked: false },
                "Tweet unliked successfully"
            )
        )
    }
    else{
        await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
        return res
        .status(200)
        .json(
            new apiResponse(
                200,
                { isLiked: true },
                "Tweet liked successfully"
            )
        )
        
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const { page = 1, limit = 10 } = req.query
    
    //get all liked videos by current user
    const liked = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true } //onley get video likes
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
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
            $addFields:{
                video: { $first: "$video" }
            }
        },
        {
            $match: {
                "video": {$ne: null} //filter out deleted videos
            }
        },
        {
            $sort: { createdAt: -1}
        },
        {
            $skip: (parseInt(page) - 1)*parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])
    //get total count of pagination
    const totalLikedVideos = await Like.countDocuments({
        likedBy: req.user._id,
        video: {$exists: true }
    })
    
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {
                videos: liked.map(doc => doc.video),
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalLikedVideos/parseInt(limit)),
                totalLikedVideos
            },
            "liked videos fetched successfully"
        )
    )

})

const getVideoLikeStatus = asyncHandler(async (req, res) => {
    // Get like status and count for a specific video
    const { videoId } = req.params
    
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new apiError(400, "Invalid Video Id")
    }

    const video = await Video.findById(videoId)
    if (!video) throw new apiError(404, "Video not found")
    
    // Get total like count
    const totalLikes = await Like.countDocuments({ video: videoId })
    
    // Check if current user has liked the video
    let isLiked = false
    if (req.user?._id) {
        const existingLike = await Like.findOne({
            video: videoId,
            likedBy: req.user._id
        })
        isLiked = !!existingLike
    }
    
    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                {
                    isLiked,
                    totalLikes
                },
                "Video like status fetched successfully"
            )
        )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
    getVideoLikeStatus
}
