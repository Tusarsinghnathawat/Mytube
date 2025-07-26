import mongoose from "mongoose";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { User } from "../models/user.models.js";

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const { channelId } = req.params
    const targetChannelId = channelId || req.user._id

    if(channelId && !mongoose.Types.ObjectId.isValid(channelId)){
        throw new apiError(400, "Invalid channel Id")
    }
    const channel = await User.findById(targetChannelId)
    if(!channel){
        throw new apiError(404, "Channel not found")
    }

    const totalVideos = await Video.countDocuments({owner: targetChannelId})
    
    //total subscription count
    const totalSubscribers = await Subscription.countDocuments({channel: targetChannelId})

    //total views
    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(targetChannelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ])

    //total likes
    const totalLikes = await Like.countDocuments({
        video: { $in: await Video.find({owner: targetChannelId}).distinct('_id')}
    })

    //get recent video statistcs (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentVideos = await Video.countDocuments({
        owner: targetChannelId,
        createdAt: { $gte: thirtyDaysAgo }
    })

    const recentViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(targetChannelId),
                createdAt: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views"}
            }
        }
    ])

    //get top performing videos
    const topVideos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(targetChannelId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                likeCount: { $sum: "$likes"}
            }
        },
        {
            $sort: { views: -1 }
        },
        {
            $limit: 5
        },
        {
            $project: {
                title: 1,
                thumbnail: 1,
                views: 1,
                likeCount: 1,
                duration: 1,
                createdAt: 1
            }
        }

        
        
    ])
    //compile statistics
    const stats = {
        totalVideos,
        totalSubscribers,
        totalViews: totalViews[0]?.totalViews || 0,
        totalLikes,
        recentVideos,
        recentViews: recentViews[0]?.totalViews || 0,
        topVideos,
        channelInfo: {
            username: channel.username,
            fullName: channel.FullName,
            avatar: channel.avatar,
            coverImage: channel.coverImage
        }
    }

    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                stats,
                "Channel statistics fetched successfully"
            )
        )


})  

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const { channelId } = req.params
    const { page = 1, limit = 10, sortBy = "createdAt", sortType = "desc" } = req.query
    const targetChannelId = channelId || req.user._id

    //validate
    if(channelId && !mongoose.Types.ObjectId.isValid(channelId)){
        throw new apiError(400, "Invalid channel Id")
    }
    const channel = await User.findById(targetChannelId)
    if (!channel) {
        throw new apiError(404, "Channel not found")
    }

    //sort condition
    const sortCondition = {}
    sortCondition[sortBy] = sortType === "desc" ? -1 : 1

    //get video with analytics using aggregation pipeline

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(targetChannelId)
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "comments"
            }
        },
        {
            $addFields: {
                likeCount: { $size: "$likes" },
                commentCount: { $size: "$comments" },
                // engagementRage: to be added in future in this field
            }
        },
        {
            $sort: sortCondition
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                duration: 1,
                views: 1,
                likeCount: 1,
                commentCount: 1,
                // engagementRate: 1,
                isPublished: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    ])

    const totalVideos = await Video.countDocuments({ owner: targetChannelId })

    //get additional analytics
    const totalViews =  await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(targetChannelId)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: {$sum: "$views"},
                averageViews: {$avg: "$views"}
            } 
        }
    ])
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {
                videos,
                analytics: {
                    totalVideos,
                    totalViews: totalViews[0]?.totalViews || 0,
                    averageViews: Math.round(totalViews[0]?.averageViews || 0)
                },
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalVideos / parseInt(limit)),
                    totalVideos
                }
            },
            "Channel videos fetched successfully"
        )
    )
})

export {
    getChannelStats, 
    getChannelVideos
}

