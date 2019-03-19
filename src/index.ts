import { Client, Collection } from 'discord.js';
import { TOKEN, PREFIX, DB } from './config';
import { readdirSync } from 'fs';
import { ICom } from './interfaces/ICom';
import * as winston from 'winston';
import * as mysql from 'mysql';

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

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: DB,
	database: 'sadb'
});

connection.connect(err => {
	if (err) throw err;
	console.log('Connected to database');
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
	bot.user.setActivity(`${bot.guilds.size} servers`, { type: 'WATCHING' });
	logger.log('info', 'The bot is online!');
});

function generateXP(): number {
	const min: number = 25;
	const max: number = 50;

	return Math.floor(Math.random() * (max - min + 1)) + min;
}

bot.on('message', msg => {
	if (msg.author.bot) return;

	connection.query(`SELECT * FROM xp WHERE id = '${msg.author.id}'`, (err, rows) => {
		if (err) throw err;
		let sql: string;
		if (rows.length < 1) {
			sql = `INSERT INTO xp (id, xp) VALUES('${msg.author.id}', ${generateXP()})`;
		} else {
			const xp: number = rows[0].xp;
			sql = `UPDATE xp SET xp = ${xp + generateXP()} WHERE id = '${msg.author.id}'`;
		}

		connection.query(sql);
	});

	const prefixRegex = new RegExp(`^(<@!?${bot.user.id}>|\\${PREFIX})\\s*`);
	if (!prefixRegex.test(msg.content)) return;

	const [, matchedPrefix] = msg.content.match(prefixRegex) as RegExpMatchArray;

	const args = msg.content.slice(matchedPrefix.length).trim().split(/ +/);
	const commandName = args.shift()!.toLowerCase();

	const command = bot.commands.get(commandName) as ICom || bot.commands.find((cmd: any) => cmd.aliases && cmd.aliases.includes(commandName)) as ICom;
	if (!command) return msg.reply('2');

	if (command.guildOnly && msg.channel.type !== 'text') return msg.reply('I can\'t execute that command insidie DMs!');

	if (command.args && !args.length) {
		let reply = 'Arguments not provided!';
		if (command.usage) reply += `Usage: ${PREFIX}${command.name} ${command.usage}`;
		return msg.channel.send(reply);
	}

	try {
		command.run(msg, args, connection);
	} catch (error) {
		console.error(error);
		msg.reply('An error occurred executing the command.');
	}
});

bot.on('error', (error: string) => logger.log('error', error));
bot.on('debug', info => logger.log('debug', info));
bot.on('warn', info => logger.log('warn', info));

process.on('uncaughtException', (error: string) => logger.log('error', error));

bot.login(TOKEN);
