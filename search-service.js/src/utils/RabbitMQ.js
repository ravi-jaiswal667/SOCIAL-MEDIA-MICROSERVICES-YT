const amqplib = require('amqplib');
const logger = require('./logger');

let EXCHANGE_NAME = "facebook-app";
let connection = null;
let channel = null;

const connectedToRabbitMQ = async () => {
    try {
        connection = await amqplib.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        channel.assertExchange(
            EXCHANGE_NAME,
            "topic",
            { durable: true }
        )
        logger.info("Connected to RabbitMQ");
        return channel;
    } catch (err) {
        console.error("RabbitMQ connection failed:", err);
        throw err;
    }
}

async function publishEvent(routingKey, message) {
    if (!channel) {
        await connectedToRabbitMQ();
    }
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(message)));
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

module.exports = { connectedToRabbitMQ, publishEvent, consumeEvent };

