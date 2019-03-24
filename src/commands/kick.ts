import { PREFIX } from '../config';
import { Message } from 'discord.js';

module.exports = {
	name: 'kick',
	description: 'Kick a specified user',
	guildOnly: true,
	usage: '@Username',
	args: true,
	run(msg: Message, args: string[]) {
		if (!msg.member.hasPermission('KICK_MEMBERS')) return msg.reply('You do not have kick permissions!');
		if (!args[0].startsWith('<@') && !args[0].endsWith('>')) return msg.reply(`Usage: ${PREFIX}kick @Username <reason>`);

		// Determine if ID has a '!' in it or not and assign memberToKick to GuildMember
		const mention = args[0].slice(2, -1);
		const memberToKick = (msg.guild.members.get(mention.startsWith('!') ? mention.slice(1) : mention));

		if (!memberToKick) return msg.reply('Unable to find user.');
		if (!memberToKick.kickable) return msg.reply('This user cannot be kicked!');

		const reason = args.shift();

		const date = new Date();
		memberToKick.kick(reason)
			.then(() => {
				msg.delete();
				console.log(`Kicked User: '${memberToKick.displayName}' from Server: ${msg.guild.name} on ${date}\nReason: ${reason || 'No reason provided.'}`);
			})
			.catch(e => console.error(e));

	}
};
