const Discord = require('discord.js');
const COLORS = {
	Error: '\x1b[31m',
	Success: '\x1b[32m',
	Warning: '\x1b[33m',
	Debug: '\x1b[33m',
	reset: '\x1b[0m'
};
const fs = require('fs');
const config = require('../config.json');
const CONSTRUCTORS = [Discord.Guild, Discord.TextChannel, Discord.Role, Discord.User];
const LOG_DATES = config.log.dates === true;
const LOG_FILE = config.log.filePath;
const PREFIXES = ['G', 'C', 'R', 'U'];
const TYPES = ['Command', 'Guild', 'Cycle', 'INIT', 'General', 'Debug', 'Controller'];
const LEVELS = ['Error', 'Success', 'Warning', 'Info'];
const MAXLEN = TYPES.reduce((a, b) => a.length > b.length ? a : b).length + LEVELS.reduce((a, b) => a.length > b.length ? a : b).length + 1;
let suppressedLevels = [];

function formatConsoleDate (date) {
	// http://stackoverflow.com/questions/18814221/adding-timestamps-to-all-console-messages
	const hour = padString(date.getHours(), 2, '0');
	const minutes = padString(date.getMinutes(), 2, '0');
	const seconds = padString(date.getSeconds(), 2, '0');
	const milliseconds = padString(date.getMilliseconds(), 3, '0');
	return `[${hour}:${minutes}:${seconds}.${milliseconds}] `;
}

function padString(string, length, padder = ' ', right = false) {
	let str = string.toString();
	let diff = length - str.length;
	if (diff <= 0) return str;

	let pad = padder.repeat(diff);
	if (right) return str + pad;
	else return pad + str;
}

class Logger {
	constructor (type) {
		this.type = type;
		LEVELS.forEach(level => {
			this[level.toLowerCase()] = this.log(level);
		});
	}

	parseDetails (details) {
		if (details.length === 0) return { identifier: '' };
		let error;
		let det = '';
		for (var q = 0; q < details.length; ++q) {
			const item = details[q];
			if (!item) continue;
			const i = CONSTRUCTORS.indexOf(item.constructor);
			if (i === -1) {
				if (item instanceof Error) error = item;
				continue;
			}
			const pre = PREFIXES[i];
			let stringName = (item.name || item.username);
			if (item.id && stringName) det += `(${pre}: ${item.id}, ${stringName}) `;
			else if (item.id) det += `(${pre} ${item.id}) `;
			else if (item.name) det += `(${pre} ${item.name}) `;
		}
		return { identifier: det, err: error, printStack: error && details[details.length - 1] === true };
	}

	log (level) {
		let intro = `${this.type} ${level}`;
		for (let i = intro.length; i < MAXLEN; ++i) intro += ' ';
		const color = COLORS[level] ? COLORS[level] : '';
		const reset = COLORS.reset ? COLORS.reset : '';
		return (contents, ...details) => {
			if (suppressedLevels.includes(level.toLowerCase())) return;
			const extra = this.parseDetails(details);
			let message = '';
			if (LOG_DATES) message += formatConsoleDate(new Date());
			message += color + intro + reset + ' | ';
			message += extra.indentifier + contents;
			if (extra.err) {
				message += ` (${extra.err}`;
				if (extra.err.code) message += `, Code ${extra.err.code}`;
				message += ')';
			}

			this.logMessage(message);
			if (extra.err && extra.printStack) this.logMessage(extra.err.stack); // Print stack trace
		};
	}

	logMessage(message) {
		console.log(message);
		if (LOG_FILE) fs.appendFile(LOG_FILE, message);
	}
}

TYPES.forEach(type => {
	exports[type.toLowerCase()] = new Logger(type);
});

exports.suppressLevel = level => {
	if (Array.isArray(level)) suppressedLevels = suppressedLevels.concat(level);
	else suppressedLevels.push(level);
};
