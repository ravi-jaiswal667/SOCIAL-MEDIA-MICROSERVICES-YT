require('dotenv').config();
const helmet = require("helmet");
const cors = require("cors");
const mongoose = require("mongoose");
const express = require("express");
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const mediaRoutes = require('./routes/media-routes');
const { connectToRabbitMQ, consumeEvent } = require('./utils/rabbitmq');
const { handlePostDeleted } = require('./eventHandler/media-event-handler');
const app = express();
const PORT = process.env.PORT || 3003;
// connect to database
mongoose.connect(process.env.MONGO_URI).then(() => console.log("Connected to DB")).catch((e) => {
    console.log("connection failed!!");
});

// middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use('/api/media', mediaRoutes);
app.use((req, res, next) => {
    logger.info(`Method ${req.method} requested to ${req.url}`);
    next();
})


// use errorHandler
app.use(errorHandler);

async function startServer() {
    try {
        await connectToRabbitMQ();
        await consumeEvent('post:deleted', handlePostDeleted);
        // listen to server 
        app.listen(PORT, () => {
            logger.info(`MEDIA service is listening on ${PORT}`);
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



