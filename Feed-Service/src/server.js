require('dotenv').config();
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const feedRoutes = require('./routes/feedRoutes');
const Redis = require("ioredis")
const app = express();
const PORT = process.env.PORT || 3007;
// connect to database
mongoose.connect(process.env.MONGO_URI).then(() => console.log("Connected to DB")).catch((e) => {
    console.log("connection failed!!");
});
// connect to redis
const redisClient = new Redis(process.env.REDIS_URL);
// middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Method ${req.method} requested to ${req.url}`);
    next();
})

app.use('/api/feed', (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, feedRoutes);

// use errorHandler
app.use(errorHandler);

async function startServer() {
    try {
        // listen to server 
        app.listen(PORT, () => {
            logger.info(`Feed service is listening on ${PORT}`);
        });
    } catch (e) {
        logger.info("Failed to connect to ReddisMQ", e);
    }
}
startServer();


// // unHandled promise rejections
process.on("unhandledRejections", (reason, Promise) => {
    logger.error("unhandled Rejections at", "reason", reason, Promise);
})



