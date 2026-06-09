const logger = require('../utils/logger');

const authenticRequest = async (req, res, next) => {
    console.log("req.headers authenticRequest", req.headers);
    // console.log("hit");
    const userId = req.headers['x-user-id'];
    if (!userId) {
        logger.error("Access attempted without userId");
        res.status(500).json({
            success: false,
            message: "Authentication required!! Plz login to continue..."
        })
    }
    console.log("authMiddleware", userId);
    req.user = userId;
    next();
}

module.exports = { authenticRequest };
