require('dotenv').config();
const logger = require("./utils/logger");
const express = require('express');
const app = express();
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const rateLimiterEndPoints = require('express-rate-limit');
const { RedisStore } = require("rate-limit-redis");
const Redis = require("ioredis");
const routes = require('./routes/identity-routes');
const errorHandler = require('./middlewares/errorHandler');

const PORT = process.env.PORT || 3001;

// mongoDB connection
mongoose.connect(process.env.MONGO_URI).then(() => logger.info("Connected to database successFully")).catch((e) => {
    console.log("Not connceted to DB");
})

// create redis client using ioredis
const redisClient = new Redis(process.env.REDIS_URL);

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Method ${req.method} requested to ${req.url}`);
    next();
})

const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: "middleware",
    points: 10,
    duration: 1
})

app.use((req, res, next) => {
    rateLimiter.consume(req.ip).then(() => next()).catch(() => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" })
    })
})

// IPs base request limiter on end-points
const sensitiveEnPointsLimiter = rateLimiterEndPoints({
    windowMs: 5 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({ success: false, message: "Too many requests" })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    }),
});

// apply this sensitive endpointsLimiter to our routes
app.use('/api/auth/register', sensitiveEnPointsLimiter);

// use original routes
app.use('/api/auth', routes);

// use errorHandler
app.use(errorHandler);

// listen to server 
app.listen(PORT, () => {
    logger.info(`Server is listening on ${PORT}`);
})

// // unHandled promise rejections
// process.on("unhandledRejections", (reason, Promise) => {
//     logger.error("unhandled Rejections at", "reason", reason, Promise);
// })




