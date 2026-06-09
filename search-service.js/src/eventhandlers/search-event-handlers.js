const SearchModel = require('../models/SearchModel');
const logger = require('../utils/logger');
async function invalidateCache(req, input) {
    const deletePostsKey = `search:*`;
    if (deletePostsKey.length > 0) {
        await req.redisClient.del(...deletePostsKey);
    }
}
const handlePostSearch = async (req, event) => {
    try {
        const { postId, userId, content, createdAt } = event;
        const newSearchPost = new SearchModel({
            postId,
            userId,
            content,
            createdAt
        });
        await newSearchPost.save();
        await invalidateCache(req, newSearchPost._id.toString());
        logger.info("newSearchPost is saved in SearchModel DB");
    } catch (error) {
        logger.error(`Error saving search post: ${error.message}`);
    }
}
const handlePostSearchDelete = async (event) => {
    try {
        const { postId } = event;
        const deletedSearchPost =
            await SearchModel.findOneAndDelete({ postId });
        logger.info(`Deleted search post: ${JSON.stringify(deletedSearchPost)}`);
    } catch (e) {
        logger.error(`Error while deleting search post: ${e.message}`);
    }
};

module.exports = { handlePostSearch, handlePostSearchDelete };