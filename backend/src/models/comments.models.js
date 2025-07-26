import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        requird: true,
    },
    video: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required: false
    },
    tweet: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Tweet",
        required: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }

},{timestamps: true})

export const Comment = mongoose.model("Comment", commentSchema);