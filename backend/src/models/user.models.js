import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    username : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
        index : true
    },
    watchHistory : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Video"
        }  
    ],

    avatar : {
        type : String,
        required : true
    },
    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true,
    },
    FullName : {
        type : String,
        required : true,
        trim : true,
        index : true
    },
    coverImage : {
        type : String,
    },
    password : {
        type : String,
        required : [true, "password is required"]
    },
    refreshToken : {
        type : String,
    },

},{timestamps : true})


userSchema.pre("save",async function (next){

    if(!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

//we can create matheods also
//to check if the entered passwod is correct or not
userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password, this.password);
}

//method to generate access token(no need for async)
userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id : this._id,
        email : this.email,
        username : this.username,
        FullName : this.FullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    })
}

//method to generate refresh token
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id : this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    })
    // console.log("Generated Refresh Token:", token)
    // return token;

}

export const User = mongoose.model("User", userSchema)