import mongoose,{ isValidObjectId } from "mongoose";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Subscription } from "../models/subscription.models.js";
import { User } from "../models/user.models.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new apiError(400, "invalid channel Id")
    }

    const channel = await User.findById(channelId);
    if(!channel) throw new apiError(404, "Channel not found")

    //prevent self subscription
    if(channelId === req.user._id.toString()){
        throw new apiError(400, "you cannot subscribe to your own channel")
    }

    //check if already subscribed
    const existingSubscriber = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    })

    //toggle subscribe
    if(existingSubscriber){
        await Subscription.findByIdAndDelete(existingSubscriber._id)
        return res
        .status(200)
        .json(
            new apiResponse(
                200,
                {isSubscribed: false},
                "channel unsubscribed successfully"
            )
        )
    }
    else{
        await Subscription.create({
            channel: channelId,
            subscriber: req.user._id
        })
        return res
        .status(200)
        .json(
            new apiResponse(
                200,
                {isSubscribed: true},
                "channel subscribed successfully"
            )
        )
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const { page = 1, limit = 10 } = req.query

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new apiError(400, "invalid channel Id")
    }

    const channel = await User.findById(channelId);
    if(!channel) throw new apiError(404, "Channel not found")

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
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
                subscriber: { $first: "$subscriber"}
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: (parseInt(page)-1)*parseInt(limit) 
        },
        {
            $limit: parseInt(limit)
        }
    ])

    //get total count
    const totalSubscribers = await Subscription.countDocuments({channel: channelId})

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {
                subscribers: subscribers.map(sub => sub.subscriber), //using map for more clear response 
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalSubscribers/parseInt(limit)),
                totalSubscribers
            },
            "subscribers featched successfully"
        )
    )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const { page = 1, limit = 10 } = req.query
    
    if(!mongoose.Types.ObjectId.isValid(subscriberId)){
        throw new apiError(400, "invalid subscriber Id")
    }

    const user = await User.findById(subscriberId);
    if(!user) throw new apiError(404, "user not found")

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            FullName: 1,
                            avatar: 1,
                            coverImage: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                channel: { $first: "$channel"}
            }
        },
        {
            $sort: { createdAt: -1}
        },
        {
            $skip: (parseInt(page)-1)*parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ])

    const totalSubscribedChannel = await Subscription.countDocuments({subscriber: subscriberId})

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {
                channels: subscribedChannels.map(sub => sub.channel),
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalSubscribedChannel/parseInt(limit)),
                totalSubscribedChannel
            },
            "Subscribed channels fetched successfully"
        )
    )

})

// controller to check if user is subscribed to a channel
const checkSubscriptionStatus = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new apiError(400, "invalid channel Id")
    }

    const channel = await User.findById(channelId);
    if(!channel) throw new apiError(404, "Channel not found")

    //check if already subscribed
    const existingSubscriber = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user._id
    })

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            {isSubscribed: !!existingSubscriber},
            "subscription status fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels,
    checkSubscriptionStatus
}
