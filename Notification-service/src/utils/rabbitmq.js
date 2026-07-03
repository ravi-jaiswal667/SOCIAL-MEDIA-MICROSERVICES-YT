const amqplib = require("amqplib");
const logger = require("./logger");
let connection = null;
let channel = null;
const EXCHANGE_NAME = "facebook-app";
const connectToRabbitMQ = async () => {
    try {
        connection = await amqplib.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, "topic");
        console.log("Connected to RABBITMQ");
        return channel;
    } catch (err) {
        console.log('Failed to connect to RABBITMQ');
        throw err;
    }
}

const publishEvent = async (routingKey, input) => {
    if (!connectToRabbitMQ) {
        await connectToRabbitMQ();
    }
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON
        .stringify(input)));
    logger.info(`Event published: ${routingKey}`);
}

const consumeEvent = async (routingKey, callback) => {
    if (!connectToRabbitMQ) {
        await connectToRabbitMQ()
    }
    const queue = await channel.assertQueue("", { exclusive: true, });
    await channel.bindQueue(queue.queue, EXCHANGE_NAME, routingKey);
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
