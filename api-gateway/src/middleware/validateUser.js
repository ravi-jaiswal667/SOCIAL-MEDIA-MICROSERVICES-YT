const logger = require('../utils/logger');
const jwt = require("jsonwebtoken");

const validateUserAuth = async (req, res, next) => {
    try {
        const authHeaders = req.headers.authorization;
        const token = authHeaders && authHeaders.split(" ")[1];
        console.log("Authorization:", req.headers.authorization);
        console.log("Token:", token);
        if (!token) {
            logger.error("Token not found");
            res.status(400).json({
                success: false,
                message: "Token not found!!"
            })
        }
        console.log("JWT_SECRET =", process.env.JWT_SECRET);
        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            console.log("ERR =", err);
            console.log("USER =", user);

            if (err) {
                logger.error("Invalid token!!");
                return res.status(401).json({
                    message: err.message
                });
            }
            console.log("user in validateUser in api-gateway", user);
            req.user = user;
            next();
        });

    } catch (error) {
        console.log("VALIDATE ERROR:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error of validateUserAuth"
        });
    }
}

module.exports = validateUserAuth;
