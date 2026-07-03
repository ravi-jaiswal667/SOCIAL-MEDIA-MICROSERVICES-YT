const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    content: {
        type: String,
        required: true
    },
    mediaIds: [
        {
            type: String
        }
    ],
    likes: {
        type: [mongoose.Schema.Types.ObjectId], // hold all userIds who liked the post
        default: []
    },
    comments: {
        type: [{
            userId: mongoose.Schema.Types.ObjectId,
            text: String
        }],
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

postSchema.index({ content: "text" });

module.exports = mongoose.model("PostModel", postSchema);



