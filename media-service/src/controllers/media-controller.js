const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');
const { uploadToCloudinary } = require('../utils/cloudinary');
const Media = require('../models/Media');

const uploadMedia = async (req, res) => {
    logger.info("Starting media upload...");
    try {
        if (!req.file) {
            logger.error("No file upload");
            res.status(400).json({
                success: false,
                message: "No file upload, Plz upload a file!!"
            })
        }
        const { originalname, mimetype, buffer } = req.file;
        const userId = req.user.userId;
        logger.info(`File details: name=${originalname}, type:${mimetype}`);
        logger.info("uploading to cloudinary...");
        const cloudinaryUploadResult = await uploadToCloudinary(req.file);
        logger.info(`cloudinary upload is successFull, publicId: - ${cloudinaryUploadResult.public_id}`);
        const newCreatedMedia = new Media({
            publicId: cloudinaryUploadResult.public_id,
            originalName: originalname,
            mimeType: mimetype,
            url: cloudinaryUploadResult.secure_url,
            user: req.user
        })
        await newCreatedMedia.save();
        return res.status(201).json({
            success: true,
            message: "Media uploaded successfully",
            media: newCreatedMedia
        });
    } catch (error) {
        logger.error("Error while uploading,", error);
        res.status(500).json({
            success: false,
            message: "Error while uploading,", error
        })
    }
}
const getAllMedia = async (req, res) => {
    try {
        const medias = await Media.find({});
        res.status(200).json({
            medias: medias
        })
    }
    catch (e) {
        logger.error("Failed to get all medias", e);
        res.status(500).json({
            success: false,
            message: "Failed to get all medias", e
        })
    }
}
module.exports = { uploadMedia, getAllMedia };

