const logger = require('../util/logger.js');
const log = logger.command;
const dice = require('droll');

const commands = {
	roll: roll,
	r: roll,
	dice: roll
};

module.exports = function (bot, message) {
	let command = processCommand(message);
	if (!command) return;

	if (Object.keys(commands).includes(command.command)) {
		log.info('Received command ' + commands[command.command].name + ' with args: ' + command.args.join(', '));
		commands[command.command](bot, message, command.args);
	}
};

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

function roll(bot, message, args) {
	let diceString = args.join(' ');
	let result = dice.roll(diceString);
	if (diceString.indexOf('d') > 4) {
		message.channel.send('I can\'t handle that many dice, please choose a number less than 10,000');
		return;
	}
	if (result) {
		let msg = 'Result is: [' + result.rolls.join(' + ') + '] = ' + result.total;
		if (msg.length >= 2000) msg = 'Total is: ' + result.total + ', there were too many dice to show';
		message.channel.send(msg);
	} else {
		message.channel.send('Sorry, I\'m not sure what you mean');
		log.error('Invalid dice string: ' + diceString);
	}
}
