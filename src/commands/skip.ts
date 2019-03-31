import { Message } from 'discord.js';
import { Database } from 'better-sqlite3';
import { ICom } from '../interfaces/ICom';

module.exports = {
	name: 'skip',
	description: 'Skip the current song',
	guildOnly: true,
	run(msg: Message, args: string[], sql: Database) {
		// Only skip if the user is in the same voice channel
		if (msg.member.voiceChannel !== msg.guild.voiceConnection.channel) return;

		const song = sql.prepare('SELECT * FROM servers WHERE id = ? LIMIT 1').get(msg.guild.id);
		if (song) msg.reply('Song Skipped!');
		msg.guild.voiceConnection.dispatcher.end();
	}
} as ICom;
