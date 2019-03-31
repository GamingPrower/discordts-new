import { Client, Collection, Message, RichEmbed } from 'discord.js';
import { TOKEN, PREFIX } from './config';
import { readdirSync } from 'fs';
import { ICom } from './interfaces/ICom';
import * as winston from 'winston';
import * as sqlite from 'better-sqlite3';
const sql = new sqlite('db.db');

const logger = winston.createLogger({
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'log' })
	],
	format: winston.format.combine(
		winston.format.timestamp({
			format: 'YYYY-MM-DD-HH:mm:ss'
		}),
		winston.format.printf(log => `[${log.level.toUpperCase()}] - ${log.message} - ${log.timestamp}`)
	)
});

const bot: Client = new Client({ disableEveryone: true });
const commandFiles: string[] = readdirSync('./commands').filter((file: string) => file.endsWith('.js'));
bot.commands = new Collection();
bot.servers = {};

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	bot.commands.set(command.name, command);
	logger.log('info', `Loaded: ${command.name}`);
}

bot.once('ready', () => {
	let table = sql.prepare('SELECT count(*) FROM sqlite_master WHERE type=\'table\' AND name = \'servers\'').get();
	if (table['count(*)']) sql.prepare('DELETE FROM servers').run();
	else sql.prepare('CREATE TABLE servers (id TEXT, queue TEXT)').run();
	table = sql.prepare('SELECT count(*) FROM sqlite_master WHERE type=\'table\' AND name = \'points\'').get();
	if (!table['count(*)']) {
		sql.prepare('CREATE TABLE points (id TEXT PRIMARY KEY, memberId TEXT, guildId TEXT, xp INTEGER, level INTEGER)').run();
		sql.prepare('CREATE UNIQUE INDEX idx_points_id ON points (id)').run();
		sql.pragma('synchronous = 1');
		sql.pragma('journal_mode = wal');
	}

	bot.user.setActivity(`${bot.guilds.size} servers`, { type: 'WATCHING' });
	logger.log('info', 'The bot is online!');
});

function calcNextLevelXp(currentLvl: number): number {
	return Math.round(currentLvl ** 3 * 0.04 + currentLvl ** 2 * 0.8 + currentLvl * 2);
}

function addXp(guildId: string, memberId: string, msg: Message) {
	let xp = sql.prepare('SELECT * FROM points WHERE memberId = ? AND guildId = ?').get(memberId, guildId);
	if (!xp) xp = { id: `${guildId}-${memberId}`, memberId: memberId, guildId: guildId, xp: 0, level: 1 };
	xp.xp++;
	const nextLevelXp = calcNextLevelXp(xp.level);
	if (nextLevelXp <= xp.xp && xp.xp !== 0) {
		xp.level++;

		const embed = new RichEmbed()
			.setAuthor(msg.client.user.username)
			.addField('Level up!', `${msg.author} has reached level ${xp.level}!\n${calcNextLevelXp(xp.level) - xp.xp} xp until next level!`)
			.setThumbnail(msg.client.user.displayAvatarURL || msg.client.user.defaultAvatarURL);
		msg.channel.send(embed);
	}
	sql.prepare('INSERT OR REPLACE INTO points (id, memberId, guildId, xp, level) VALUES (@id, @memberId, @guildId, @xp, @level)').run(xp);
}

bot.on('message', msg => {
	if (msg.author.bot) return;

	if (msg.guild) addXp(msg.guild.id, msg.member.id, msg);

	const prefixRegex = new RegExp(`^(<@!?${bot.user.id}>|\\${PREFIX})\\s*`);
	if (!prefixRegex.test(msg.content)) return;

	const [, matchedPrefix] = msg.content.match(prefixRegex) as RegExpMatchArray;

	const args = msg.content.slice(matchedPrefix.length).trim().split(/ +/);
	const commandName = args.shift()!.toLowerCase();

	const command = bot.commands.get(commandName) as ICom || bot.commands.find((cmd: any) => cmd.aliases && cmd.aliases.includes(commandName)) as ICom;

	if (command.guildOnly && msg.channel.type !== 'text') return msg.reply('I can\'t execute that command insidie DMs!');

	if (command.args && !args.length) {
		let reply = 'Arguments not provided!';
		if (command.usage) reply += `Usage: ${PREFIX}${command.name} ${command.usage}`;
		return msg.channel.send(reply);
	}

	try {
		command.run(msg, args, sql, logger);
	} catch (error) {
		logger.log('error', error);
		msg.reply('An error occurred executing the command.');
	}
});

bot.on('error', (error: string) => logger.log('error', error));
bot.on('debug', info => logger.log('debug', info));
bot.on('warn', info => logger.log('warn', info));

(process as NodeJS.EventEmitter).on('uncaughtException', (error: string) => logger.log('error', error));

bot.login(TOKEN);
