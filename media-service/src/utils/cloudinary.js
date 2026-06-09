require("dotenv").config();
const cloudinary = require('cloudinary').v2;
const { log } = require("winston");
const logger = require('../utils/logger');
cloudinary.config({
    "cloud_name": process.env.cloud_name,
    "api_key": process.env.api_key,
    "api_secret": process.env.api_secret,
})
// console.log(cloudinary.config(), "cloudinary.config()");

const uploadToCloudinary = (file) => {
    // console.log(process.env.cloud_name);
    // console.log(process.env.api_key);
    // console.log(process.env.api_secret);
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: "auto"
            },
            (error, result) => {
                if (error) {
                    console.log("FULL CLOUDINARY ERROR:");
                    console.dir(error, { depth: null });
                    reject(error)
                }
                else resolve(result);
            })
        uploadStream.end(file.buffer);
    });
}
const deleteFromCloudinary = async (publicId) => {
    try {
        const deletedMedia = await cloudinary.uploader.destroy(publicId);
        logger.info("Media deleted from cloudinary", publicId);
        return deletedMedia;
    }
    catch (e) {
        logger.error("Failed to delete media from cloudinary", e);
        res.status(500).json({
            success: false,
            message: "Failed to delete media from cloudinary", e
        })
    }
}
module.exports = { uploadToCloudinary, deleteFromCloudinary };