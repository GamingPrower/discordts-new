import * as ytdl from 'ytdl-core';
import { RichEmbed, Message } from 'discord.js';
import { Connection } from 'mysql';

module.exports = {
	name: 'currentsong',
	description: 'Displays information about the current song',
	aliases: ['cs', 'current'],
	args: false,
	guildOnly: false,
	run(msg: Message, args: string[], connection: Connection) {

		connection.query(`SELECT * FROM servers WHERE id = '${msg.guild.id}' LIMIT 1`, (err, rows) => {
			if (err) throw err;

			// Check if song is playing
			if (!rows[0]) return msg.reply('No song currently playing!');

			// Fetch video info from YTDL
			ytdl.getInfo(rows[0].queue, (err, info) => {
				if (err) return msg.channel.send('There was an error retrieving song information!');

				// Generate and send embed
				const ytEmbed = new RichEmbed()
					.setTitle(`${info.title.substr(0, 252)}${info.title.length > 256 ? '...' : ''}`)
					.setDescription(`${info.description.substr(0, 2044)}${info.description.length > 2048 ? '...' : ''}`)
					.setThumbnail(info.thumbnail_url)
					.setColor(0x000000)
					.setURL(info.video_url)
					.addField(`Channel: ${info.author.name.substr(0, 243)}${info.author.name.length > 247 ? '...' : ''}`, `${info.author.channel_url.substr(0, 1020)}`);
				msg.channel.send(ytEmbed);
			});
		});
	}
};
