import * as ytdl from 'ytdl-core';
import { RichEmbed, Message } from 'discord.js';
import { Database } from 'better-sqlite3';
import { ICom } from '../interfaces/ICom';

module.exports = {
	name: 'currentsong',
	description: 'Displays information about the current song',
	aliases: ['cs', 'current'],
	args: false,
	guildOnly: false,
	run(msg: Message, args: string[], sql: Database) {

		const song = sql.prepare('SELECT * FROM servers WHERE id = ? LIMIT 1').get(msg.guild.id);
		if (!song) return msg.reply('No song currently playing!');

		ytdl.getInfo(song.queue, (err, info) => {
			if (err) return msg.channel.send('There was an error retrieving song information!');

			const embed = new RichEmbed()
				.setAuthor(`${msg.client.user.username}`, `${msg.client.user.displayAvatarURL}`)
				.setTitle(`${info.title.substr(0, 252)}${info.title.length > 256 ? '...' : ''}`)
				.setDescription(`${info.description.substr(0, 2044)}${info.description.length > 2048 ? '...' : ''}`)
				.setThumbnail(info.thumbnail_url)
				.setColor(0x000000)
				.setURL(info.video_url)
				.addField(`Channel: ${info.author.name.substr(0, 243)}${info.author.name.length > 247 ? '...' : ''}`, `${info.author.channel_url.substr(0, 1020)}`);
			msg.channel.send(embed);
		});
	}
} as ICom;
