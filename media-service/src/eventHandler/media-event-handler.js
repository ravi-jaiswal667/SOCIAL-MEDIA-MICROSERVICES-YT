const Media = require("../models/Media");
const logger = require("../utils/logger");
const cloudinary = require('cloudinary').v2;
const handlePostDeleted = async (event) => {
    console.log(event, "eventeventevent");
    //  await publishEvent('post:deleted', {
    //         postId: post._id.toString(),
    //         userId: req.user,
    //         mediaId: post.mediaIds
    //     })

    try {
        const { postId } = event;
        const medias = await Media.find({ _id: { $in: event.mediaId } });
        for (const media of medias) {
            await cloudinary.uploader.destroy(media.publicId);
            await Media.findByIdAndDelete(media._id);
            logger.info(`Media ${media._id} for associated post ${postId}`);
        }
        logger.info(`Media deleted successFully from both cloudinary & Media for post ${postId}`);
    } catch (error) {
        logger.error(`Error while deleting media`, error);
    }
}

module.exports = { handlePostDeleted };