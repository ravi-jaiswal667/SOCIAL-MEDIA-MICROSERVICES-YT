const mongoose = require("mongoose");

const SearchSchema = new mongoose.Schema(
    {
        postId: {
            type: String,
            required: true,
            unique: true
        },
        userId: {
            type: String,
            required: true,
            index: true
        },
        content: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

SearchSchema.index({ content: "text" });

module.exports = mongoose.model("SearchModel", SearchSchema);