import {Video} from '../models/video.models.js';
import {User} from '../models/user.models.js';
import mongoose from 'mongoose';
import {apiError} from '../utils/apiError.js';
import {apiResponse} from '../utils/apiResponse.js';
import {asyncHandler} from '../utils/asyncHandler.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import { upload } from '../middlewares/multer.middlewares.js';
import { verifyJwt } from '../middlewares/auth.middlewares.js';
import { getWatchHistory } from './user.controllers.js';

// upload a new video(publish video)
// search video by title
//update video details 
// delete a video by id



// get all videos
const getAllVideos = asyncHandler(async(req, res) => {
    //Todo - get all videos based on query, sort, pagination
    //step 1 - get query parameters
    const {page = 1, limit = 10, query, sortBy="createdAt", sortType="desc", userId} =req.query;
    
    //step 2 - build match condition

    const matchCondition = {}

    if(query){
        matchCondition.$or = [
            {title: {$regex: query, $options: 'i'}},
            {description: {$regex: query, $options: 'i'}}
            //regex -> way to search text useing patterns
            //options: "i" --> case Insensitive
        ]
    } // filter videos where title or description contains the query (case-insensitive using $regex and $options: 'i').

    if(userId){
        matchCondition.owner = new mongoose.Types.ObjectId(userId)
        //If userId is given, filter videos by matching the owner’s ObjectId
    }

    matchCondition.isPublished = true //only include videos that are published

    //step 3 - build sort condition
    const sortCondition = {}
    sortCondition[sortBy] = sortType === "desc"? -1:1

    //step 4- aggregation pipeline
    const videos = await Video.aggregate([
        {
            $match: matchCondition
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
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
            //Replace the owner array with the first element(so owner becomes a single object, not an array)
        },
        {
            $sort: sortCondition
        },
        {
            $skip: (parseInt(page)-1)*parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    //step5 - get total count for pagination
    const totalVideos = await Video.countDocuments(matchCondition)
    
    //step 6 - return response with pagination info 
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {
                videos,
                currentPage: parseInt(page),//parse int because page comes as url, we neet to convert it into numver
                totalPages: Math.ceil(totalVideos/parseInt(limit)),
                totalVideos,
            },
            "video fetched successfully"
        )
    )

   
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video

    /*how??
      #get title, description, tumbnail, video
      #vido ko upload kro, then async await ker ke thumbnail ko upload kro
      # dono ka url(cloudinary se aayega) aane baad ek object bna lo jis mei title, description, thumbnail, video, duration sab hoga
      # duration cloudinary ke respose se aayega
    */

    //step 1 - get video details from body
    const { title, description,} = req.body

    //stem 2 - validate
    if(!title || !description){
        throw new apiError(400, "title and description are required")
    }
    console.log('title :', title);

    //step 3 - get video and thumbnail file from request
    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath){
        throw new apiError(400, "video file is required")
    }
    if(!thumbnailLocalPath){
        throw new apiError(400, "thumbnail file is required")
    }

    //step 4 -upload on cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    //ai ka code
    // const videoUploadResponse = await uploadOnCloudinary(videoLocalPath, "video")
    // const thumbnailUploadResponse = await uploadOnCloudinary(thumbnailLocalPath, "image")

    if(!videoFile) {
        throw new apiError(500, "video upload failed")
    }
    if(!thumbnail){
        throw new apiError(500, "thumbnail upload failed")
    }

    //step 5 - create video document in database
    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration,
        owner: req.user._id,
        isPublished: true
    })

    //step 6 - return response

    return res
    .status(200)
    .json(
        new apiResponse(200,video, "video published successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    //TODO: get video by id
    //req.prams se aa jayega
    
    // Step 1: Get videoId from params
    const { videoId } = req.params

    // Step 2: Validate videoId
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new apiError(400, "invalid video Id")
    }

    //step 3: find video and populate owner details
    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
            $addFields: {
                owner : {
                    $first: "$owner"
                }
            }
        }
    ])

    // Step 4: Check if video exists
    if(!video || video.length===0){
        throw new apiError(400, "video not found")
    }
    
    // Step 5: Increment view count
    await Video.findByIdAndUpdate(
        videoId,
        {
            $inc: { views: 1 }
        }
    )
    
    // Step 6: Add video to user's watch history (if user is authenticated)
    if(req.user?._id) {
    await User.findByIdAndUpdate(
        req.user._id,
        {
                $addToSet: { watchHistory: videoId }
        }
    ) 
    }

    // Step 7: Get updated video with incremented views
    const updatedVideo = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
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
            $addFields: {
                owner: {
                    $first: "$owner"
                }
            }
        }
    ])

    // Step 8: return response
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            updatedVideo[0],
            "video fetched successfully"
        )
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    //TODO: update video details like title, description, thumbnail
    
    // Step 1: Get videoId from params
    const { videoId } = req.params

    // Step 2: Validate videoId
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new apiError(400,"Invalid video ID")
    }

    // Step 3: Get update data from request body
    const {title, description} = req.body

    const video = await Video.findById(videoId);
    if(!video) throw new apiError(404,"video not found")
    
    //check ownership
    if(video.owner.toString()!==req.user._id.toString()){
        throw new apiError(403,"you are not authorized to update this video")
    }

    // Step 5: Handle thumbnail update if provided
    let thumbnailUrl = video.thumbnail
    if(req.file?.path){
        const thumbnail = await uploadOnCloudinary(req.file.path)
        if(!thumbnail){
            throw new apiError(500,"error while updating thumbnail")
        }
        thumbnailUrl = thumbnail.url
    }

    // Step 6: Update video
    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title || video.title,
                description:  description || video.description,
                thumbnail: thumbnailUrl
            }
        },
        {new: true}
    )

    // Step 7: Return response
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            updateVideo,
            "video updated successfully"
        )
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    //TODO: delete video
    const { videoId } = req.params
    if(!videoId) throw new apiError(404,"video not found")
    
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new apiError(400,"invalid video Id")
    }

    const video = await Video.findById(videoId)
    if(!video) throw new apiError(404, "video not found")
    //check for authoriziton
    if(video.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "you are not authorized to delete this video")
    }

    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {},
            "video deleted successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    //ek object hai model ke andar jiske values ko hum change kerenge
    //koi toggle button per click kerta hai to pata kro ke currently kis state mai hai
    //publish hai to unpublish kro, unpublish hai to publish kro
    
    const { videoId } = req.params

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new apiError(400, "invalid video Id")
    }

    const video = await Video.findById(videoId)
    if(!video) throw new apiError(405, "video not found")
    
    if(video.owner.toString()!==req.user._id.toString()){
        throw new apiError(403, "you are not authorized to toggle publish status")
    }

    //togle publish status
    const updateVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            updateVideo,
            `video ${updateVideo.isPublished ? "published" : "unpublished"} successfully`
        )
    )
    //#note :- even after unpublishing of video getVideosById will give you video details but getAllVideos will not show that video
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}      