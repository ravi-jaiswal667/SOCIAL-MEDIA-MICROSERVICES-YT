require("dotenv").config();
const helmet = require("helmet");
const cors = require("cors");
const express = require("express");
const app = express();
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const limiter = require('express-rate-limit');
const proxy = require("express-http-proxy");
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const validateUserAuth = require("./middleware/validateUser");

const PORT = process.env.PORT || 3000;
// middlewares
app.use(express.json());
app.use(helmet());
app.use(cors());
// establish redis client
const redisClient = new Redis(process.env.REDIS_URL);

// rate limit
const rateLimit = limiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
})

app.use(rateLimit);
app.use((req, res, next) => {
    logger.info(`Method ${req.method} requested to ${req.url}`);
    next();
});

// REPLACE URL PATHS OR CALL ROUTES FROM PORT=3000 TO(->) PORT=3001
// localhost://3001/api/auth/register -> localhost://3000/v1/auth/register
const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api");
    },
    proxyErrorHandler: (err, res, next) => {
        logger.error(`proxy error: ${err.message}`);
        res.status(500).json({
            message: `Internal server error`,
            error: err.message
        })
    }
}

// Setting up proxy for identity-service
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["content-type"] = "application/json";
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Responses recieved from identity service: ${proxyRes.statusCode} `);
        return proxyResData;
    }
}));

// Setting up proxy for post-service
app.use('/v1/post', validateUserAuth, proxy(process.env.POST_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["content-type"] = "application/json";
        // console.log("srcReq.user", srcReq.user);
        // console.log("srcReq.user.userId", srcReq.user.userId);
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Responses recieved from post service: ${proxyRes.statusCode} `);
        return proxyResData;
    }
}));
// Setting up proxy for media-service
app.use('/v1/media', validateUserAuth, proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        if (!srcReq.headers["content-type"].startsWith('multipart/form-data')) {
            proxyReqOpts.headers["content-type"] = "application/json";
        }
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Responses recieved from media service: ${proxyRes.statusCode} `);
        return proxyResData;
    }
}));
// Setting up proxy for search-service
app.use('/v1/search', validateUserAuth, proxy(process.env.SEARCH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["content-type"] = "application/json";
        // console.log("srcReq.user", srcReq.user);
        // console.log("srcReq.user.userId", srcReq.user.userId);
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Responses recieved from search service: ${proxyRes.statusCode} `);
        return proxyResData;
    }
}));
// Setting up proxy for notification-service
app.use('/v1/notify', validateUserAuth, proxy(process.env.NOTIFICATION_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["content-type"] = "application/json";
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Responses recieved from notification service: ${proxyRes.statusCode} `);
        return proxyResData;
    }
}))
// Setting up proxy for Follow-service
app.use('/v1/follow', validateUserAuth, proxy(process.env.FOLLOW_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["content-type"] = "application/json";
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Responses recieved from notification service: ${proxyRes.statusCode} `);
        return proxyResData;
    }
}))

// Setting up proxy for Feed-service
app.use('/v1/feed', validateUserAuth, proxy(process.env.FEED_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
        proxyReqOpts.headers["content-type"] = "application/json";
        proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
        return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
        logger.info(`Responses recieved from notification service: ${proxyRes.statusCode} `);
        return proxyResData;
    }
}))

app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`server is running on port ${PORT}`);
    logger.info(`server is running on identity-service ${process.env.IDENTITY_SEVRICE_URL}`);
    logger.info(`server is running on post-service ${process.env.POST_SEVRICE_URL}`);
    logger.info(`server is running on media-service ${process.env.MEDIA_SEVRICE_URL}`);
    logger.info(`server is running on search-service ${process.env.SEARCH_SERVICE_URL}`);
    logger.info(`server is running on notification-service ${process.env.NOTIFICATION_SERVICE_URL}`);
    logger.info(`server is running on follow-service ${process.env.FOLLOW_SERVICE_URL}`);
    logger.info(`server is running on feed-service ${process.env.FEED_SERVICE_URL}`);
    logger.info(`server also has ${process.env.REDIS_URL}`);
});


