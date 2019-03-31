import { Message } from 'discord.js';
import { Connection } from 'mysql';
import { ICom } from '../interfaces/ICom';

module.exports = {
	name: 'skip',
	description: 'Skip the current song',
	guildOnly: true,
	run(msg: Message, args: string[], connection: Connection) {
		// Only skip if the user is in the same voice channel
		if (msg.member.voiceChannel !== msg.guild.voiceConnection.channel) return;

		connection.query(`SELECT * FROM servers WHERE id = '${msg.guild.id}' LIMIT 2`, (err, rows) => {
			if (err) throw err;
			if (rows.length > 1) msg.reply('Song Skipped!');
			msg.guild.voiceConnection.dispatcher.end();
		});
	}
} as ICom;
