import { Message } from 'discord.js';
import { Connection } from 'mysql';
import { Logger } from 'winston';

export interface ICom {
	name: string;
	description: string;
	args?: boolean;
	usage?: string;
	guildOnly?: boolean;
	aliases?: string[];
	run(msg: Message, args: string[], connection: Connection, logger: Logger): any;
}
