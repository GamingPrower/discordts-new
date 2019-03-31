import { Message, RichEmbed } from 'discord.js';
import { Database } from 'better-sqlite3';
import { ICom } from '../interfaces/ICom';

function calcNextLevelXp(currentLvl: number): number {
	return Math.round(currentLvl ** 3 * 0.04 + currentLvl ** 2 * 0.8 + currentLvl * 2);
}

function generateXpBar(level: number, xp: number) {
	const totalXp = calcNextLevelXp(level) - calcNextLevelXp(level - 1);
	const currentXp = totalXp - (calcNextLevelXp(level) - xp);
	const progress = Math.round((currentXp / totalXp) * 10);
	let progressString = '';
	for (let i = 0; i < progress; i++) {
		progressString += '➡';
	}
	for (let i = 0; i < (10 - progress); i++) {
		progressString += '🔄';
	}
	return progressString;
}

module.exports = {
	name: 'xp',
	description: 'Displays your XP in the server.',
	usage: '<@Username>',
	guildOnly: false,
	run(msg: Message, args: string[], sql: Database) {
		const target = msg.mentions.members.first() || msg.guild.members.get(args[0]) || msg.member;

		const stats = sql.prepare('SELECT * FROM points WHERE memberId = ? AND guildId = ?').get(target.id, msg.guild.id);
		if (!stats) return;

		const embed = new RichEmbed()
			.addField(`${calcNextLevelXp(stats.level) - stats.xp} xp until next level!`, generateXpBar(stats.level, stats.xp))
			.addBlankField()
			.setThumbnail(target.user.displayAvatarURL || target.user.defaultAvatarURL);
		msg.channel.send(embed);
	}
} as ICom;
