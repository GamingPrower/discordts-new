import { PREFIX } from '../config';
import { Message } from 'discord.js';
import { ICom } from '../interfaces/ICom';
import { Connection } from 'mysql';
import { Logger } from 'winston';

module.exports = {
	name: 'kick',
	description: 'Kick a specified user',
	guildOnly: true,
	usage: '@Username',
	args: true,
	run(msg: Message, args: string[], connection: Connection, logger: Logger) {
		if (!msg.member.hasPermission('KICK_MEMBERS')) return msg.reply('You do not have kick permissions!');
		if (!args[0].startsWith('<@') && !args[0].endsWith('>')) return msg.reply(`Usage: ${PREFIX}kick @Username <reason>`);

		// Determine if ID has a '!' in it or not and assign memberToKick to GuildMember
		const mention = args[0].slice(2, -1);
		const memberToKick = (msg.guild.members.get(mention.startsWith('!') ? mention.slice(1) : mention));

		if (!memberToKick) return msg.reply('Unable to find user.');
		if (!memberToKick.kickable) return msg.reply('This user cannot be kicked!');

		const reason = args.shift() || 'No reason provided.';

		memberToKick.kick(reason)
			.then(() => {
				msg.delete();
				logger.log('info', `Kicked User: '${memberToKick.displayName}' from Server: ${msg.guild.name}\nReason: ${reason}`);
				connection.query(`SELECT * FROM logs WHERE id = '${msg.author.id}'`, err => {
					if (err) throw err;
					// tslint:disable-next-line: prefer-template
					connection.query(`INSERT INTO logs (id, member, info) VALUES('${msg.author.id}', '${msg.member}', 'Kick: ${reason.length > 24 ? reason.substr(0, 20) + '...': reason}')`);
				});
			})
			.catch(e => logger.log('error', e));

	}
} as ICom;
