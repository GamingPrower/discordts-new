import { Message } from 'discord.js';

module.exports = {
	name: 'ping',
	description: 'Test latency',
	async run(msg: Message) {
		const m = await msg.channel.send('Ping?') as Message;
		m.edit(`Pong! Latency is ${m.createdTimestamp - msg.createdTimestamp}ms API Latency is ${Math.round(msg.client.ping)}ms`);
	}
};
