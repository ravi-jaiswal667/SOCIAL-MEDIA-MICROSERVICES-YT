const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

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
    } catch (error) {
        logger.error("Failed to connect to RabbitMQ", error);
        throw error;
    }
}

async function publishEvent(routingKey, message) {
    if (!channel) {
        await connectToRabbitMQ();
    }

    channel.publish(
        EXCHANGE_NAME,
        routingKey,
        Buffer.from(JSON.stringify(message))
    );

    logger.info(`Event published: ${routingKey}`);
}

async function consumeEvent(routingKey, callback) {
    if (!channel) {
        await connectToRabbitMQ();
    }

    const queue = await channel.assertQueue("", {
        exclusive: true,
    });

    await channel.bindQueue(
        queue.queue,
        EXCHANGE_NAME,
        routingKey
    );

    channel.consume(queue.queue, async (msg) => {
        if (msg) {
            try {
                const content = JSON.parse(
                    msg.content.toString()
                );

                await callback(content);

                channel.ack(msg);
            } catch (error) {
                logger.error("Error processing message", error);
            }
        }
    });

    logger.info(`Consuming events: ${routingKey}`);
}

module.exports = {
    connectToRabbitMQ,
    publishEvent,
    consumeEvent,
};