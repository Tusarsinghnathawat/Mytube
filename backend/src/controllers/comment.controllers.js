import mongoose from "mongoose";
import { Comment } from "../models/comments.models.js"; 
import { Video } from "../models/video.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    // with pagination
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new apiError(400, "Invalid video ID")
    }

    //check if video exists
    const video = await Video.findById(videoId)
    if(!video) throw new apiError(404, "video not found")
    
    //get comments using aggrigation pipeline
    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [{
                    $project: {
                        username: 1,
                        FullName: 1,
                        avatar: 1,
                        createdAt: 1
                    }
                }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "likes"
            }
        },
        {
            $addFields: {
                owner: {
                    $first: "$owner"
                },
                likeCount: { $size: "$likes" },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, "$likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    //get total count of pagination
    const totalComments = await Comment.countDocuments({video: videoId})

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {
                comments,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalComments/parseInt(limit)),
                totalComments
            },
            "comments fetched successfully"
        )
    )
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new apiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)
    if(!video) throw new apiError(404, "video not found")
    
    const { content } = req.body
    if(!content?.trim()) throw new apiError(400, "comment content is required") //checks if content after removing whitespace(trimed) is valid or not

    //create comment 
    const comment = await Comment.create({
        content: content.trim(),
        video: videoId,
        owner: req.user._id
    })

    //get the created comment with owner details
    const createdComment = await Comment.aggregate([
        {
            $match: {
                _id: comment._id //find the specific comment
            }
        },
        {
            //find the user who wrote the comment and add their info
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

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            createdComment[0],
            "comment added successfully"
        )
    )
    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params
    const { content } = req.body
    if(!content?.trim()){
        throw new apiError(400, "comment content is required")
    }

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new apiError(400, "Invalid comment ID")
    }

    //find comment and check ownership
    const comment = await Comment.findById(commentId)
    if(!comment) throw new apiError(404,"comment not found")
    if(comment.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "you are not authorized to update this comment")
    }

    //update comment
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content: content.trim()
            }
        },
        {new: true}
    )

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            updatedComment,
            "comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params

    if(!commentId?.trim()) throw new apiError(400, "Indvalid comment Id")
    
    const comment = await Comment.findById(commentId)
    if(!comment) throw new apiError(404, "comment not found")
    if(comment.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "you are not authorized to delete this comment")
    }
    //alow video owner to delete the comment 
    const video = await Video.findById(comment.video)
    if(!video) throw new apiError(404, "video not found")
    if(video.owner.toString() !== req.user._id.toString()){
        throw new apiError(403, "you are not authorized to delete this comment")
    }

    await Comment.findByIdAndDelete(commentId)

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {},
            "comment deleted successfully"
        )
    )
})

// Add a reply to a tweet
const addTweetReply = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new apiError(400, "Invalid tweet ID");
    }
    const { content } = req.body;
    if (!content?.trim()) throw new apiError(400, "reply content is required");
    // create comment
    const comment = await Comment.create({
        content: content.trim(),
        tweet: tweetId,
        owner: req.user._id
    });
    // get the created comment with owner details
    const createdComment = await Comment.aggregate([
        { $match: { _id: comment._id } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, FullName: 1, avatar: 1 } }
                ]
            }
        },
        { $addFields: { owner: { $first: "$owner" } } }
    ]);
    return res.status(200).json(new apiResponse(200, createdComment[0], "reply added successfully"));
});

// Get all replies for a tweet
const getTweetReplies = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new apiError(400, "Invalid tweet ID");
    }
    const comments = await Comment.aggregate([
        { $match: { tweet: new mongoose.Types.ObjectId(tweetId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, FullName: 1, avatar: 1 } }
                ]
            }
        },
        { $addFields: { owner: { $first: "$owner" } } },
        { $sort: { createdAt: -1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
    ]);
    const totalComments = await Comment.countDocuments({ tweet: tweetId });
    return res.status(200).json(new apiResponse(200, {
        comments,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalComments / parseInt(limit)),
        totalComments
    }, "replies fetched successfully"));
});

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment,
    addTweetReply,
    getTweetReplies
}