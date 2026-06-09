require('dotenv').config();
const helmet = require("helmet");
const cors = require("cors");
const express = require("express");
const app = express();
const postRoutes = require('./routes/postRoutes');
const { createPost } = require('./controllers/post-controller');
const { authenticRequest } = require('./middlewares/authMiddleware');
const Redis = require('ioredis');
const mongoose = require("mongoose");
const logger = require('./utils/logger');
const errorHandler = require('../../identity-service/src/middlewares/errorHandler');
const { connectToRabbitMQ } = require('./utils/rabbitmq');
const PORT = process.env.PORT || 3002;

// connect to database
mongoose.connect(process.env.MONGO_URI).then(() => console.log("Connected to DB")).catch((e) => {
    console.log("connection failed!!");
});

// create redis client
const redisClient = new Redis(process.env.REDIS_URL);

// middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    logger.info(`Method ${req.method} requested to ${req.url}`);
    next();
})

// pass redis client to request
app.use('/api/post', (req, res, next) => {
    req.redisClient = redisClient;
    next();
}, postRoutes);

// use errorHandler
app.use(errorHandler);
async function startServer() {
    try {
        await connectToRabbitMQ();
        app.listen(PORT, () => {
            logger.info(`Post service is listening on ${PORT}`);
        })
    } catch (e) {
        logger.error("failed to connect to server", e);
        process.exit(1);
    }
}
startServer();
// listen to server 

// // unHandled promise rejections
process.on("unhandledRejections", (reason, Promise) => {
    logger.error("unhandled Rejections at", "reason", reason, Promise);
})

