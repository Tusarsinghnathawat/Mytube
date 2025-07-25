//Aim :- server se files ko cloudinary per upload kerna aur fir server se files ko free kerna
//fs - file_system (read, write, update, delete files and directories.)
import pkg from "cloudinary";
const { v2: cloudinary } = pkg;
import { response } from "express";
import fs from "fs";
import { type } from "os";

cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath)=>{
    if(!localFilePath) return null
    //server se cloudinary pe file upload 
    try {
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })

        // Delete local file only if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        //file has been uploaded on cloudinary successfully
        //console.log("file is uploaded on cloudinary", response.url);

        // fs.unlinkSync(localFilePath)
        
        return response;
    }catch (error) {
        // Remove the file only if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.error("Cloudinary upload failed:", error.message);
        return null;


        //remove the locally stored file temporary file as the upload operation got failed
        // fs.unlinkSync(localFilePath)
        // return null
    }
}

export {uploadOnCloudinary}