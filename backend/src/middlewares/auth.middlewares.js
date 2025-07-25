// purpose -> varify karega ke user hai ya nahi 
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
    
    try {
        //token ka access lena hai--> either cookies se token aaya hoga or header se aaya hoga
        //if header se aaya hai tho syntax hoga "Authorization : Bearer <Token>", here in order 
        //get token value hum header se Bearer ko remove ker denge tho hume token mil jayega
    
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","") //we will replace "Brear " in order to get token
        console.log("Received token:", token);


        //if user ke pass token nahi hai than vo unauthorize hai, error de do  
        //agr token hai tho token varify kro (jwt lagega uske leye)  
    
        if(!token){
            throw new apiError(401, "unauthorize access")
        }
    
        const decodeToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        
        const user =await User.findById(decodeToken?._id).select(
            "-password -refreshToken"
        )
    
        if(!user){
            //discussion about frontend
            throw new apiError(401, "invalid Access Token")
        }

        req.user = user;   //request mai new object add keya hai
        next()
    
    } catch (error) {
        throw new apiError(401, error?.message || "invalid Access Token")
    }
})