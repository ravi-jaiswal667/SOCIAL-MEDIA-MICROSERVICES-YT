require('dotenv').config();
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const followRoutes = require('./routes/followRoutes');
const { connectToRabbitMQ } = require('./utils/rabbitMQ');
const Redis = require("ioredis")
const app = express();
const PORT = process.env.PORT || 3006;
// connect to database
mongoose.connect(process.env.MONGO_URI).then(() => console.log("Connected to DB")).catch((e) => {
    console.log("connection failed!!");
});

// middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
// redis
const redisClient = new Redis(process.env.REDIS_URL);
app.use((req, res, next) => {
    logger.info(`Method ${req.method} requested to ${req.url}`);
    next();
})

app.use('/api/follow', (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, followRoutes);

// use errorHandler
app.use(errorHandler);

async function startServer() {
    try {
        // listen to server 
        await connectToRabbitMQ();
        app.listen(PORT, () => {
            logger.info(`Follow service is listening on ${PORT}`);
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



