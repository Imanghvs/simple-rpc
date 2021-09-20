const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const express = require('express');

const app = express();
const port = 3000;

app.use(express.json());

const delay = (ms) =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, ms);
  });

async function connect() {
  const connection = await amqp.connect('amqp://rabbitmq');
  const channel = await connection.createChannel();
  app.post('/', async (req, res) => {
    const { number } = req.body;
    const correlationId = uuidv4();
    console.log(` [x] Requesting isEven(${number})`);
    const q = await channel.assertQueue('', { exclusive: true });
    channel.consume(q.queue, (msg) => {
      if (msg.properties.correlationId === correlationId) {
        res.send(` [.] Response received: ${msg.content.toString()}`);
      }
    }, { noAck: true });
    channel.sendToQueue(
      'rpc_queue',
      Buffer.from(number.toString()),
      { correlationId, replyTo: q.queue },
    );
    await delay(2000)
  });
  app.listen(port, () => {
    console.log(`listening at http://localhost:${port}`);
  });
}

connect();
