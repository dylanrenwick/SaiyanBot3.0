const logger = require('../util/logger.js');
const log = logger.command;
const config = require('../config.json');
const storage = require('../util/storage.js');
const guildData = storage.currentGuilds;

const commands = {
	roleadd: addrole,
	rolegive: addrole,
	roleremove: removerole,
	roledel: removerole,
	rolerm: removerole,
	roleaddstaff: addstaffrole
};

module.exports = function (bot, message) {
	let command = processCommand(message);
	if (!command) return;

	if (Object.keys(commands).includes(command.command)) {
		log.info('Received command ' + command.command + ' with args: ' + command.args.join(', '));
		commands[command.command](bot, message, command.args);
	}
};

function processCommand(message) {
	let content = message.content;
	if (!content.startsWith(config.bot.prefix + 'role')) return null;
	let contentArr = content.split(' ');
	let command = contentArr.shift().substring(1);
	return {
		command: command,
		args: contentArr
	};
}

function addrole(bot, message, args) {
	let roleName = args[0];
	if (roleName.startsWith('#')) {
		if (!isColorRole(roleName)) {
			message.channel.send('Sorry, that is not a valid color');
			return;
		}
		if (roleName.length == 4) roleName = '#' + roleName.substring(1).repeat(2);
		log.info('Role is color: ' + roleName);
		createRoleIfNotExist(roleName.toLowerCase(), message);
	} else {
		log.info('Invalid role?');
		message.channel.send('You can currently only add colors, sorry!');
	}
}

function createRoleIfNotExist(roleName, message) {
	let guild = message.guild;
	let member = message.member;
	let role = guild.roles.findAll('name', roleName);
	if (role.length != 0) {
		log.info('Role exists');
		guild.member(member).addRole(role[0]).then(member => {
			log.info('Role added!');
			message.channel.send('Role added :+1:');
		});
		return;
	}

	log.info('Role doesn\'t exist');
	let botRole = guild.roles.findAll('name', 'Bot');
	if (botRole.length === 0) {
		log.error('Could not find bot role!');
	}

	let botPos = botRole[0].calculatedPosition;
	log.info('Bot pos is ' + botPos);

	log.info('Creating role');
	guild.createRole({
		name: roleName,
		color: roleName
	}).then(role => {
		log.info('Role created');
		guild.setRolePosition(role, botPos).then(guild => {
			log.info('Role moved');
			let role = Array.from(guild.roles.values()).filter(role => role.name.toLowerCase() === roleName)[0];
			member.addRole(role).then(member => {
				log.info('Role added!');
				message.channel.send('Role added :+1:');
			});
		});
	});
}

function removerole(bot, message, args) {
	let roleName = args[0];
	log.info('Removing role ' + roleName);
	let member = message.member;
	let role = message.guild.roles.findAll('name', roleName);
	if (role.length == 0) {
		log.info('Role not found');
		message.channel.send('Role ' + roleName + ' does not exist!');
		return;
	}

	if (!member.roles.has(role[0].id)) {
		log.info('User does not have role');
		message.channel.send('You don\'t have that role!');
		return;
	}

	let roleIsEmpty = (role[0].members.length === 1);

	log.info('User has role');
	member.removeRole(role[0]).then(member => {
		log.info('Role removed');
		message.channel.send('Role removed :+1:');

		if (roleIsEmpty && isColorRole(role[0].name)) role[0].delete('No users left in color role');
	});
}

function addstaffrole(bot, message, args) {
	if (message.member.id !== message.guild.ownerID) return message.channel.send('You don\'t have permission to do that!');
	let roleName = args.join(' ');
	let role = message.guild.roles.find('name', roleName);
	if (!role) return message.channel.send('Sorry, I can\'t find the role "' + roleName + '"');
	if (!guildData.has(message.guild.id)) storage.buildGuild(message.guild);
	let guildSettings = guildData.get(message.guild.id);
	let roleData = (guildSettings.roles) ? guildSettings.roles : {};
	let staffRoles = (roleData.staff) ? roleData.staff : [];
	staffRoles.push(role);
	roleData.staff = staffRoles;
	guildSettings.roles = roleData;
	guildData.set(message.guild.id, guildSettings);
}

function getIsStaff(member) {
	// TODO: Check for staff roles on member
}

function isColorRole(roleName) {
	return (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(roleName));
}
