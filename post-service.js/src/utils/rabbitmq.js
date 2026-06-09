const amqp = require('amqplib');
const logger = require('./logger');
let channel = null;
let connection = null;
const EXCHANGE_NAME = "facebook-app";
async function connectToRabbitMQ() {
    try {
        console.log("Rabbit URL:", process.env.RABBITMQ_URL);
        connection = await amqp.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(
            EXCHANGE_NAME,
            "topic",
            { durable: true }
        );
        logger.info("RabbitMQ connected");
        return channel;
    } catch (e) {
        logger.error("Failed to connect to RabbitMQ", e);
        throw e;   // important
    }
}

async function publishEvent(routingKey, message) {
    if (!channel) {
        await connectToRabbitMQ();
    }
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
    logger.info(`Event published: ${routingKey}`);
}

module.exports = { connectToRabbitMQ, publishEvent };