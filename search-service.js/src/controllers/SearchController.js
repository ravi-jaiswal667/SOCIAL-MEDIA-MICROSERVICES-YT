const SearchModel = require("../models/SearchModel");
const logger = require("../utils/logger")

// implementing redis caching for 2 to 5 minutes
const searchPostController = async (req, res) => {
    logger.info("Search endPoint hit...");
    try {
        const { query } = req.query;
        const cachedKey = `search:${query}`;
        const searchRes = await req.redisClient.get(cachedKey);
        if (searchRes) {
            return res.json(JSON.parse(searchRes));
        }
        const result = await SearchModel.find(
            {
                $text: { $search: query }
            },
            {
                score: { $meta: "textScore" }
            }
        ).sort({ score: { $meta: "textScore" } }).limit(10);
        await req.redisClient.setex(cachedKey, 3600, JSON.stringify(result));
        res.json(result);
    } catch (error) {
        logger.info(`Error while searching post`, error);
        res.json({
            success: false,
            message: `Error while searching post`, error
        })
    }
}

module.exports = { searchPostController };