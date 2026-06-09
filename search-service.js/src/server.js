require('dotenv').config();
const helmet = require("helmet");
const cors = require("cors");
const express = require("express");
const app = express();
const { authenticRequest } = require('./middlewares/authMiddleware');
const Redis = require('ioredis');
const mongoose = require("mongoose");
const logger = require('./utils/logger');
const errorHandler = require('./middlewares/errorHandler');
const { connectedToRabbitMQ, consumeEvent } = require('./utils/RabbitMQ');
const { handlePostSearch, handlePostSearchDelete } = require('./eventhandlers/search-event-handlers');
const searchRoutes = require('./routes/searchRoutes');
const PORT = process.env.PORT || 3004;

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
app.use('/api/search',
    (req, res, next) => {
        req.redisClient = redisClient
        next();
    },
    searchRoutes);
app.use(errorHandler);
async function startSever() {
    try {
        await connectedToRabbitMQ();
        await consumeEvent("post:created", handlePostSearch);
        await consumeEvent("post:deleted", handlePostSearchDelete)
        app.listen((PORT), () => {
            console.log(`Search service is listening on PORT ${PORT}`);
        });
    } catch (e) {
        console.log("Error while starting server", e);
    }
}
startSever();
