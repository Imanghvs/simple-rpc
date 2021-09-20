const amqp = require('amqplib');

async function connect() {
  const connection = await amqp.connect('amqp://rabbitmq');
  const channel = await connection.createChannel();
  const queue = 'rpc_queue';
  await channel.assertQueue(queue, { durable: false });
  await channel.prefetch(1);
  console.log(' [x] Awaiting RPC requests');
  channel.consume(queue, (msg) => {
    const n = parseInt(msg.content.toString(), 10);
    console.log(` [.] Received ${n} as input`);
    const answer = `${n} is ${n % 2 === 0 ? '' : 'not'} an even number`;
    channel.sendToQueue(msg.properties.replyTo, Buffer.from(answer.toString()), {
      correlationId: msg.properties.correlationId,
    });
    channel.ack(msg);
  });
}

connect();
