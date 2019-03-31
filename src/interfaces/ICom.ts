import { Message } from 'discord.js';
import { Database } from 'better-sqlite3';
import { Logger } from 'winston';

export interface ICom {
	name: string;
	description: string;
	args?: boolean;
	usage?: string;
	guildOnly?: boolean;
	aliases?: string[];
	run(msg: Message, args: string[], sql: Database, logger: Logger): any;
}
