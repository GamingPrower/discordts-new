import { YOUTUBE } from '../config';
import * as ytdl from 'ytdl-core-discord';
import * as Youtube from 'simple-youtube-api';
import { Message, VoiceConnection } from 'discord.js';
import { Database } from 'better-sqlite3';
import { ICom } from '../interfaces/ICom';
const youtube = new Youtube(YOUTUBE);

async function play(connection: VoiceConnection, msg: Message, sql: Database) {

	// Grab first song from DB
	let song = sql.prepare('SELECT * FROM servers WHERE id = ? LIMIT 1').get(msg.guild.id);
	const dispatcher = connection.playOpusStream(await ytdl(song.queue));

	dispatcher.on('end', () => {
		sql.prepare('DELETE FROM servers WHERE id = ? LIMIT 1').run(msg.guild.id);
		song = sql.prepare('SELECT * FROM servers WHERE id = ? LIMIT 1').get(msg.guild.id);
		if (song) play(connection, msg, sql);
		else {
			msg.channel.send('No more songs in queue. Disconnecting.');
			connection.disconnect();
		}
	});
}

module.exports = {
	name: 'music',
	description: 'Song request from Youtube',
	args: true,
	guildOnly: true,
	aliases: ['sr', 'songrequest', 'requestsong', 'play'],
	async run(msg: Message, args: string[], sql: Database) {
		if (!msg.member.voiceChannel) return msg.reply('Join a voice channel first!');
		if (!msg.member.voiceChannel.joinable) return msg.reply('I don\'t have permissions to join that channel!');

		// Parse search into URL and Title
		const result = await youtube.searchVideos(args, 1);
		const title = result[0].title;
		const queue = `https://www.youtube.com/watch?v=${result[0].id}`;

		// Add song to DB using server ID
		let songs = sql.prepare('SELECT * FROM servers WHERE id = ?').get(msg.guild.id);
		songs = { id: msg.guild.id, queue: queue };
		sql.prepare('INSERT INTO servers (id, queue) VALUES (@id, @queue)').run(songs);

		if (msg.guild.voiceConnection) {
			// If the bot is already in the channel, just add to the queue
			msg.reply(`**${title}** has been added to the queue!`);
		} else {
			// Else if the bot is not in the channel, join then add to queue
			msg.member.voiceChannel.join()
				.then(connection => {
					msg.reply(`Music Bot Started! Now Playing **${title}**`);
					play(connection, msg, sql);
				});
		}
	}
} as ICom;
