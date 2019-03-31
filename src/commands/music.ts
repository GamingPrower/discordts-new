import { YOUTUBE } from '../config';
import * as ytdl from 'ytdl-core-discord';
import * as Youtube from 'simple-youtube-api';
import { Message, VoiceConnection } from 'discord.js';
import { Connection } from 'mysql';
import { ICom } from '../interfaces/ICom';
const youtube = new Youtube(YOUTUBE);

function play(connection: VoiceConnection, msg: Message, con: Connection) {

	// Grab first song from DB
	con.query(`SELECT * FROM servers WHERE id = '${msg.guild.id}' LIMIT 1`, async (err, rows) => {
		if (err) throw err;
		if (rows.length < 1) return msg.channel.send('Unexpect error occured with song request.');

		// Play first song in queue
		const dispatcher = connection.playOpusStream(await ytdl(rows[0].queue));

		dispatcher.on('end', () => {
			// On song end, remove the previous song from DB
			con.query(`SELECT * FROM servers WHERE id = '${msg.guild.id}' LIMIT 2`, (err, rows) => {
				if (err) throw err;
				if (rows.length > 1) {
					// If queue has more songs, play next song
					con.query(`DELETE FROM servers WHERE id = '${msg.guild.id}' LIMIT 1`, (err) => {
						if (err) throw err;
						play(connection, msg, con);
					});
				} else {
					// If no more songs, remove current song and disconnect
					con.query(`DELETE FROM servers WHERE id = '${msg.guild.id}' LIMIT 1`);
					msg.channel.send('No more songs in queue. Disconnecting.');
					connection.disconnect();
				}
			});
		});

	});
}

module.exports = {
	name: 'music',
	description: 'Song request from Youtube',
	args: true,
	guildOnly: true,
	aliases: ['sr', 'songrequest', 'requestsong', 'play'],
	async run(msg: Message, args: string[], con: Connection) {
		if (!msg.member.voiceChannel) return msg.reply('Join a voice channel first!');
		if (!msg.member.voiceChannel.joinable) return msg.reply('I don\'t have permissions to join that channel!');

		// Parse search into URL and Title
		const result = await youtube.searchVideos(args, 1);
		const title = result[0].title;
		const queue = `https://www.youtube.com/watch?v=${result[0].id}`;

		// Add song to DB using server ID
		con.query(`SELECT * FROM servers WHERE id = '${msg.guild.id}'`, (err) => {
			if (err) throw err;
			con.query(`INSERT INTO servers (id, queue) VALUES('${msg.guild.id}', '${queue}')`);
		});

		if (msg.guild.voiceConnection) {
			// If the bot is already in the channel, just add to the queue
			msg.reply(`**${title}** has been added to the queue!`);
		} else {
			// Else if the bot is not in the channel, join then add to queue
			msg.member.voiceChannel.join()
				.then(connection => {
					msg.reply(`Music Bot Started! Now Playing **${title}**`);
					play(connection, msg, con);
				});
		}
	}
} as ICom;
