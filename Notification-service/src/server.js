require('dotenv').config();
const helmet = require("helmet");
const cors = require("cors");
const express = require("express");
const app = express();
const { authenticRequest } = require('./middlewares/authMiddleware');
const Redis = require('ioredis');
const mongoose = require("mongoose");
const logger = require('./utils/logger');
const errorHandler = require('../../identity-service/src/middlewares/errorHandler');
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitmq');
const { handlePostLikeEvent, handlePostCommentEvent, handleUserFollowEvent } = require('./events/event-handler');
const notifyRoutes = require('./routes/notifyRoutes')
const PORT = process.env.PORT || 3005;
const http = require("http");
const path = require("path");
const { intializeSocket } = require('./socket/socket');
const server = http.createServer(app);

intializeSocket(server);
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});
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
// routing
app.use('/api/notify', notifyRoutes);
// use errorHandler
app.use(errorHandler);

async function startServer() {
    try {
        await connectToRabbitMQ();
        await consumeEvent('post:liked', handlePostLikeEvent);
        await consumeEvent('post:comment', handlePostCommentEvent);
        await consumeEvent('user:follow', handleUserFollowEvent);
        server.listen(PORT, () => {
            logger.info(`Notification service is listening on ${PORT}`);
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

