import { Message } from 'discord.js';
import { Connection } from 'mysql';

module.exports = {
	name: 'xp',
	description: 'Displays your XP in the server.',
	usage: '<@Username>',
	guildOnly: false,
	run(msg: Message, args: string[], connection: Connection) {
		const target = msg.mentions.users.first() || msg.guild.members.get(args[0]) || msg.author;

		connection.query(`SELECT * FROM xp WHERE id = '${target.id}'`, (err, rows) => {
			if (err) throw err;
			if(!rows[0]) return msg.channel.send('User not found!');

			const xp: string = rows[0].xp;
			msg.channel.send(xp);
		});
	}
};
