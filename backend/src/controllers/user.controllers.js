// Aim : - for handeling user registeration 
import { response } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"; 
import { User } from "../models/user.models.js"; //step3 and step5//if user already exist chek kerne ke leye
import { uploadOnCloudinary } from "../utils/cloudinary.js"; //step6
// import { userRouter } from "../routes/register.routes.js";
import { apiResponse } from "../utils/apiResponse.js"; //step9
import { verifyJwt } from "../middlewares/auth.middlewares.js"; //middleware for checking logout
import jwt from "jsonwebtoken"; //for generating access and refresh tokens
import mongoose from "mongoose";

//for generating access and refresh tokens when user log in 
const generateAccessAndRefreshTokens = async (userId) => {
        try {
            const user = await User.findById(userId)
            const accessToken = user.generateAccessToken()
            const refreshToken = user.generateRefreshToken()

            //refreshTokern ko user object mai save ker lo
            user.refreshToken = refreshToken
            // user.accessToken = accessToken
            // console.log(accessToken)
            //save ker lo
            await user.save({ validateBeforeSave : false})

            return {accessToken, refreshToken}

        } catch (error) {
            throw new apiError(500,"something went wrong while generating access and refresh tokens")
        }
}

//register
const registerUser = asyncHandler(async (req,res)=>{
    //step1- get user details from frontend
    //step2- add validation(eg: not empty)
    //step3- check if user already exists(eg. unique usernaem or email)
    //step4- check for images and check for avatar
    //step5- upload them on cloudniray, Avatar
    //step6- create user object - create a entry in database
    //step7- remove password and refresh token field from response
    //step8- check for user creation
    //return response  

    //debug logs :
    // console.log("Content-Type:", req.headers['content-type']);
    // console.log("Complete Request:", req);
    // console.log("Request body:", req.body);
    // console.log("Request files:", req.files);

    //step1:
    const {username, email, password, FullName} = req.body  //object destructuring
    console.log('email : ',email);


    //step2: validation
    if(!username || !email || !password || !FullName) {
        throw new apiError(400, "All fields are required")
    }

    if(
        [username, FullName, email, password].some((field)=>
            field?.trim()==="")
    ){
        throw new apiError(400, "All fields are required")
    }

    //check if user already exists or not
    //checking if username or email any of the data already present in database($or )
    const userExisted = await User.findOne({
        $or : [{username}, {email}]
    })
    if(userExisted){
        throw new apiError(409, "user already exists")
    }


    //step4: check for image and avatar
    //multer use keya hai tho files ka  access bhi most probaly available hoga hence req.files?

    //console.log(req.files)

    const avatarLocalPath = req.files?.avatar[0]?.path //avatar file ka path(server per)
    if(!avatarLocalPath){
        throw new apiError(400,"Avtar file is required")
    }
    //const coverImageLocalPath = req.files?.coverImage[0]?.path //coverImage file ka path(server per)
    
    //the above line for coverImageLocalPath will give you erro if we do not send coverimage from frontend
    // solution use classic if else

    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    
    //step6 - upload on cloudnary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    
    if(!avatar){
        throw new apiError(400,"Avatar file is required")
    }
    
    //step6- create user object - create a entry in database
    const user = await User.create({
        password,
        FullName,
        email,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        username : username.toLowerCase()
    })
    
    //step7- remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    
    //step8
    if(!createdUser){
        throw new apiError(500,"Something went wrong while registering the user")
    }
    
    return res
    .status(201)
    .json(
        new apiResponse(200,createdUser, "user registerd successfully")
    )
})

//login
const loginUser = asyncHandler(async (req, res)=>{
    //step1 - request body se data le aao
    //step2 - username or email basis pe access
    //step3 - find the user
    //step4 - password check
    //step5 - accecc and refresh token generate
    //step6 - send cookie

    //step1 - request body se data 
    const {email, username, password} = req.body

    //username or emial dono mai se ek hona chaeye
    if(!username && !email){
        throw new apiError(400, "username or email is required")
    }

    //step3 - find user by its username or email
    const user = await User.findOne({
        $or : [{username}, {email}]
    }) 

    if(!user){
        throw new apiError(404, "user not found")
    }
    
    //step4 - password check
    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) throw new apiError(401,"incorrect Password")

    //step5 - access and refresh token 
    const {refreshToken, accessToken} = await generateAccessAndRefreshTokens(user._id)

    //step6 - send cookie

    const loggedInUser = await User.findById(user._id).select(
         "-password -refreshToken"
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new apiResponse(200,{user: loggedInUser, accessToken, refreshToken},"user logged in successfully")
    )
})


//logout
const logoutUser = asyncHandler(async(req, res) => {
    //cookies clean kerni hai
    //refresh token to reset kerna hai
    //User.findById() ...> wrong hai (because user logout ho chuka hai to ID se user find nahi ker sakte)
    //solution -> kudh ka middleware design kerna padega(i.e. authentication ka middleware)

    await User.findByIdAndUpdate(
        req.user._id,  //user find ker lo
        //refresh token update ker do 
        {
            $set:{
                refreshToken : undefined
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly :true,
        secure : true
    }

    return res.
    status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new apiResponse(200,{},"user logged Out")
    )

})

//refresh access token
/*
    access token are short lived and refresh tokens are stored in database.
    whenever access token got invalidate(expired) then we can use refresh token to generate new access token.
    or in other words our access token got refreshed.

    how??
    1. user will send refresh token in request header or cookies.
    2. we will verify the refresh token.
    3. if refresh token is valid then we will generate new access token and send it back to user.
    4. if refresh token is invalid then we will send error response.
*/
const refreshAccessToken = asyncHandler(async (req,res)=>{
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incommingRefreshToken){
        throw new apiError(401, "Refresh token is required")
    }

    try {
        const decodedToken = jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new apiError(404, "User not found")
        }
    
        if(incommingRefreshToken !== user.refreshToken){
            throw new apiError(401, "Refresh token is expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken, newrefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newrefreshToken, options)
        .json(
            new apiResponse(
                200,
                {accessToken, refreshToken: newrefreshToken},
                "Access token refreshed successfully"
    
            )
    )
    
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid refresh token")
    }


})

//change password
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {currentPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(currentPassword)

    if(!isPasswordCorrect){
        throw new apiError(401, "Current password is incorrect")
    }

    //set new password 
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new apiResponse(200, {}, "Password changed successfully")
    )
})

//get current user
const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(
        new apiResponse(200, req.user, "current user fetched successfully")
    )
})

//update account details (only text based data for now)
const updateAccountDetails = asyncHandler(async(req, res) => {
    const {FullName, username, email} = req.body

    if(!FullName || !username || !email){
        throw new apiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                FullName : FullName,
                username: username.toLowerCase(),
                email: email
            }
        },
        {new : true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(200, user, "Account details updated successfully")
    )
})

//update file based data (avatar image)
const updateUserAvatar = asyncHandler(async(req,res) => {
    //file update kerne ke liye two middlewares use honge
    //multer and auth(to check weathere the user is logged in or not)

    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new apiError(400, "Avatar file is required")
    }

    //delete old avatar file if exists

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new apiError(400, "error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(200, user, "Avatar updated successfully")
    )

})

//update file based data (cover image)
const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new apiError(400, "Cover Image is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new apiError(400, "error while uploading cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new apiResponse(200, user, "Cover Image updated successfully")
    )

})

//get user channel profile (subscriber count, channel subscribed to count, isSubscribed)
const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params
    if(!username?.trim()){
        throw new apiError(400, "Username is required")
    }

    const channel = await User.aggregate([
        {
            $match : {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel", //channel is the one to whom the subscriber is subscribing
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber", //subscriber is the one who is subscribing
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: { $size: "$subscribers" },
                channelSubscribedToCount: { $size: "$subscribedTo" },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] }, //check if user is subscribed to the channel 
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                FullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                isSubscribed: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
            }
        }
    ])

    if(!channel || channel.length === 0){
        throw new apiError(404, "Channel not found")
    }

    return res
    .status(200)
    .json(
        new apiResponse(200, channel[0], "Channel profile fetched successfully")
    )
    // alternative approach (without aggregation pipeline)
    // const user = await User.findOne({ username: username.toLowerCase() });
    // const subscribersCount = await Subscription.countDocuments({ channel: user._id });
    // const subscribedToCount = await Subscription.countDocuments({ subscriber: user._id });
    // const isSubscribed = await Subscription.exists({ 
    //     channel: user._id, 
    //     subscriber: req.user._id 
    


});



const getWatchHistory = asyncHandler(async(req, res) => {

//thoda complex hai no doubt, but be patient while understanding.(take your time)

//watch history ----> (user nested pipelines)
//pipeline 1(lookup) -> watch-history mai "videos" document ko join karenge 
//pipeline 2(nested-lookup) -> above pipeline se jo videos milenge unko "users"(i.e. owner) document se join karenge
//pipeline 3(nested $project) -> un videos mai se sirf required fields ko project karenge
    const user = await User.aggregate([
        {
            $match: {
                
                _id: new mongoose.Types.ObjectId(req.user._id) 

            }
        }, //so far document is matched according to object id(user mil gya)
        {
            $lookup: {
                from: "videos", //videos collection se join karenge
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                //sub-pipline
                pipeline: [
                    {
                         
                        $lookup: {
                            from: "users",
                            localField: "owner", //videos mai owner field ha
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        FullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        //abhi tak jo keya uska data array ke form mai aayega object ke nahi (thats whay using $addfields, data ko object ke form me lane ke leye)
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new apiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    )
})

export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails ,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile, 
    getWatchHistory
}
