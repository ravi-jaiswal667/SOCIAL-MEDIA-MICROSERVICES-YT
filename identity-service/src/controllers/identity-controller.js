const logger = require('../utils/logger');
const validateSchema = require('../utils/validation');
const User = require('../models/user');
const generateTokens = require('../utils/genarateTokens');
const refreshTokenModel = require("../models/tokenModel");
const argon2 = require('argon2');
// registration
const registerUser = async (req, res) => {
    logger.info("Registration endPoint hit...")
    try {
        // validation
        const { username, email, password } = req.body;
        const { error } = validateSchema(req.body);
        if (error) {
            logger.warn("Error while use validation", error);
            return res.status(400).json({
                success: false,
                message: error
            })
        }
        // check if user is already exists or not -> means already registered or not in database
        let user = await User.findOne({ $or: [{ email }, { username }] });
        if (user) {
            logger.warn("User already exists");
            return res.status(400).json({
                success: false,
                message: "Plz logIN with another user",
            })
        }
        user = await User.create({
            username,
            email,
            password
        })

        logger.warn("User registered successFully!!", user._id);
        // create tokens
        const { accessToken, refreshToken } = await generateTokens(user);
        res.status(201).json({
            success: true,
            message: "User registered successFully!",
            accessToken,
            refreshToken
        })

    } catch (error) {
        logger.error("Error while registering user", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error!!"
        })
    }
}

// logIn

const loginUser = async (req, res) => {
    logger.info('logIn endPoint hit...');
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            logger.warn("First register the user before login");
            return res.status(400).json({
                success: false,
                message: "First register the user before login"
            })
        }
        const checkPassword = await argon2.verify(user.password, password);
        if (!checkPassword) {
            logger.warn("Plz enter correct password");
            return res.status(400).json({
                success: false,
                message: "Plz enter correct password"
            })
        }

        const { accessToken, refreshToken } = await generateTokens(user);

        res.json({
            accessToken,
            refreshToken,
            userId: user._id,
        });
    } catch (error) {
        logger.error("Error while logIn user", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error!!"
        })
    }
}

// refresh Token
const refreshTokenUser = async (req, res) => {
    logger.info("RefreshToken endPoint hit...");
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.info("Not getting the correct refreshToken!!");
            return res.status(400).json({
                success: false,
                message: "Plz enter correct Refresh Token!!"
            })
        }

        const storedToken = await refreshTokenModel.findOne({ token: refreshToken });
        if (!storedToken || storedToken.expiresAt < new Date()) {
            logger.warn(`token does not exist or it is expired`);
            return res.status(400).json({
                success: false,
                message: `token does not exist or it is expired`
            })
        }
        console.log("storedToken.user", storedToken.user);
        const user = await User.findOne({ _id: storedToken.user });

        if (!user) {
            logger.warn(`User does not exist!!`);
            return res.status(400).json({
                success: false,
                message: `User does not exist!!`
            })
        }
        await refreshTokenModel.deleteOne({ _id: storedToken._id });
        const { accessToken: newaccessToken, refreshToken: newrefreshToken } = await generateTokens(user);
        res.status(200).json({
            accessToken: newaccessToken,
            refreshToken: newrefreshToken
        })

    } catch (error) {
        logger.error("Error while producing RefreshToken user", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error!!"
        })
    }
}

// logOut
const logout = async (req, res) => {
    logger.info("logout endPoint hit...");
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.info("Not getting the correct refreshToken!!");
            return res.status(400).json({
                success: false,
                message: "Plz enter correct Refresh Token!!"
            })
        }
        await refreshToken.deleteOne({ token: refreshToken });
        logger.warn("User logout successFully!!");
        res.status(200).json({
            success: true,
            message: "User logout successFully!!"
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error!!"
        })
    }
}

const getAllUsers = async (req, res) => {
    logger.info("getAllUsers endPoint hit...");
    try {
        const users = await User.find({});
        res.status(201).json({
            success: true,
            users
        })
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error!!"
        })
    }
}

module.exports = { registerUser, loginUser, refreshTokenUser, logout, getAllUsers };