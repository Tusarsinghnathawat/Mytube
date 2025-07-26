import mongoose, { isValidObjectId } from "mongoose";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.models.js";
import { User } from "../models/user.models.js";

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if(!content?.trim()){
        throw new apiError(400, "Tweet cannot be empty")
    }

    if (content.length > 280) {
        throw new apiError(400, "Tweet content cannot exceed 280 characters")
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: req.user._id
    })

    //get created tweet with owner details
    const createdTweet = await Tweet.aggregate([
        {
            $match: {
                _id: tweet._id
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
                owner: { $first: "$owner" }
            }
        }
    ])
    return res
    .status(201)
    .json(
        new apiResponse(
            201,
            createdTweet[0],
            "Tweet created successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { userId } = req.params
    const { page = 1, limit = 10 } = req.query
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new apiError(400, "Invalid user Id")
    }

    const user = await User.findById(userId)
    if (!user) {
        throw new apiError(404, "User not found")
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
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
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner"}
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: (parseInt(page) - 1)*parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        { $addFields: { likeCount: { $size: "$likes" } } },
        { $project: { likes: 0 } }
    ])

    const totalTweets = await Tweet.countDocuments({ owner: userId })
    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                {
                    tweets,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalTweets / parseInt(limit)),
                    totalTweets
                },
                "Tweets fetched successfully"
            )
        )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new apiError(400, "Invalid tweet Id")
    }

    if (!content?.trim()) {
        throw new apiError(400, "Tweet content is required")
    }

    if (content.length > 280) {
        throw new apiError(400, "Tweet content cannot exceed 280 characters")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new apiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new apiError(403, "You are not authorized to update this tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: { content: content.trim() }
        },
        { new: true }
    )
    return res
        .status(200)
        .json(
            new apiResponse(
                200,
                updatedTweet,
                "Tweet updated successfully"
            )
        )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { userId, tweetId } = req.params
    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new apiError(400, "Invalid tweet Id")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new apiError(404, "Tweet not found")
    }

    if(tweet.owner.toString() !== req.user._id.toString()) throw new apiError(403, "You are not authorized to delete this tweet")

    await Tweet.findByIdAndDelete(tweetId)
    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {},
            "Tweet deleted successfully"
        )
    )
})

// Get all tweets (global feed)
const getAllTweets = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tweets = await Tweet.aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, FullName: 1, fullName: 1, avatar: 1 } }
                ]
            }
        },
        { $addFields: { owner: { $first: "$owner" } } },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        { $addFields: { likeCount: { $size: "$likes" } } },
        { $project: { likes: 0 } }
    ]);
    const totalTweets = await Tweet.countDocuments();
    return res.status(200).json(
        new apiResponse(
            200,
            {
                tweets,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalTweets / parseInt(limit)),
                totalTweets
            },
            "All tweets fetched successfully"
        )
    );
});

// Get a single tweet by ID
const getTweetById = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new apiError(400, "Invalid tweet Id");
    }
    const tweet = await Tweet.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(tweetId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, FullName: 1, fullName: 1, avatar: 1 } }
                ]
            }
        },
        { $addFields: { owner: { $first: "$owner" } } },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        { $addFields: { likeCount: { $size: "$likes" } } },
        { $project: { likes: 0 } }
    ]);
    if (!tweet || tweet.length === 0) {
        throw new apiError(404, "Tweet not found");
    }
    return res.status(200).json(
        new apiResponse(200, tweet[0], "Tweet fetched successfully")
    );
});

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet,
    getAllTweets,
    getTweetById
}