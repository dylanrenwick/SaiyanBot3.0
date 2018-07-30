const logger = require('../util/logger.js');
const log = logger.command;
const dice = require('droll');

const commands = {
	//warn: warn
};

module.exports = function (bot, message) {
	let command = processCommand(message);
	if (!command) return;

	if (Object.keys(commands).includes(command.command)) {
		log.info("Received command " + commands[command.command].name + " with args: " + command.args.join(', '));
		commands[command.command](bot, message, command.args);
	}
}

function processCommand(message) {
	let content = message.content;
	if (!content.startsWith('$')) return null;
	let contentArr = content.split(' ');
	let command = contentArr.shift().substring(1);
	return {
		command: command,
		args: contentArr
	};
}

function warn(bot, message, args) {
	message.channel.send("Foot tapping is strictly prohibited under Article A section 3 of the Tyran-ical Dictator's handbook");
}
