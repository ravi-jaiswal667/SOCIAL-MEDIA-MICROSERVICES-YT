const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const refreshTokenModel = require('../models/tokenModel');
const tokens = async (user) => {
    const accessToken = jwt.sign({
        userId: user._id,
        username: user.username
    }, process.env.JWT_SECRET, { expiresIn: "60m" })

    const refreshToken = crypto.randomBytes(10).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await refreshTokenModel.create({
        token: refreshToken,
        user: user._id,
        expiresAt
    })

    return { accessToken, refreshToken };
}

module.exports = tokens;



