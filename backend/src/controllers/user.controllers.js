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
