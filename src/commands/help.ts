import { PREFIX } from '../config';
import { Message } from 'discord.js';
import { ICom } from '../interfaces/ICom';

module.exports = {
	name: 'help',
	description: 'List all commands or info about a specific command.',
	aliases: ['commands'],
	usage: '<command name>',
	run(msg: Message, args: string[]) {
		const data = [];
		const { commands } = msg.client;

		if (!args.length) {
			data.push('Here is a list of all available commands:');
			data.push(commands.map((command: any) => command.name).join(', '));
			data.push(`\nYou can send ${PREFIX}help <command name> to get info on a specific command.`);

			return msg.author.send(data, { split: true })
				.then(() => {
					if (msg.channel.type === 'dm') return;
					msg.reply('I\'ve sent a DM with command info.');
				})
				.catch(e => {
					console.error(`Could no send help DM to ${msg.author.tag}. \n`, e);
					msg.reply('Unable to DM. Do you have DMs disabled?');
				});
		}

		const name = args[0].toLowerCase();
		const command = commands.get(name) as ICom || commands.find((c: any) => c.aliases && c.aliases.includes(name)) as ICom;

		if (!command) return msg.reply('That\'s not a valid command!');

		data.push(`**Name:** ${command.name}`);

		if (command.aliases) data.push(`**Aliases:** ${command.aliases.join(', ')}`);
		if (command.description) data.push(`**Description:** ${command.description}`);
		if (command.usage) data.push(`**Usage:** ${PREFIX}${command.name} ${command.usage}`);

		msg.channel.send(data, { split: true });
	}
};
