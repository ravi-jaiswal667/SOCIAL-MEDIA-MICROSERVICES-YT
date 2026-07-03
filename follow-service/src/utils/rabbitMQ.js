const amqplib = require("amqplib");
const logger = require("./logger");
let connection = null;
let channel = null;
const EXCHANGE_NAME = "facebook-app";
async function connectToRabbitMQ() {
    try {
        console.log("RabbitMQ")
        connection = await amqplib.connect(process.env.RABBITMQ_URL);
        channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: true });
        console.log('Connected to RABBITMQ');
        return channel;
    }
    catch (e) {
        logger.error(`Failed to connect to RabbitMQ`);
        throw e;
    }
}


async function publishEvent(routingKey, msg) {
    if (!channel) {
        await connectTocRabbitMQ();
    }
    channel.publish(EXCHANGE_NAME, routingKey, Buffer.from(JSON.stringify(msg)));
}

module.exports = { connectToRabbitMQ, publishEvent }