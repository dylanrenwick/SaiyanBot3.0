const logger = require('../util/logger.js');
const log = logger.command;
const config = require('../config.json');
const storage = require('../util/storage.js');
const guildData = storage.currentGuilds;

const typePrefix = 'role';

module.exports = function (bot, message) {
	let command = processCommand(message);
	if (!command) return;

	log.info('Received command ' + command.command + ' with args: ' + command.args.join(', '));
	command.action(bot, message, command.args);
};

function processCommand(message) {
	let content = message.content;
	if (!content.startsWith(config.bot.prefix + typePrefix)) return null;
	let contentArr = content.split(' ');
	let command = contentArr.shift().substring(config.bot.prefix.length);
	if (command !== typePrefix) command = command.substring(typePrefix.length);

	let foundCommands = commands.filter(c => c.aliases.includes(command));
	if (foundCommands.length === 0) return null;
	if (foundCommands.length > 1) log.warning('Multiple commands found with alias ' + command + ', selecting first');
	let runCommand = foundCommands[0];

	return {
		action: runCommand.action,
		command: command,
		args: contentArr
	};
}

const roles = {
	add: function (bot, message, args) {
		if (args.length == 0) return message.channel.send('What role?');
		let roleName = args[0];
		if (roleName.startsWith('#')) {
			if (!roles.isColorRole(roleName)) {
				message.channel.send('Sorry, that is not a valid color');
				return;
			}
			if (roleName.length == 4) roleName = '#' + roleName.substring(1).repeat(2);
			log.info('Role is color: ' + roleName);
			roles.addColorRole(roleName.toLowerCase(), message);
		} else {
			roles.addRegularRole(roleName, message);
		}
	},
	addColorRole: function (roleName, message) {
		let guild = message.guild;
		let member = message.member;
		let role = guild.roles.find('name', roleName);
		if (role) {
			roles.actuallyAddRole(message, guild, member, role);
			return;
		}

		let botRole = guild.roles.find('name', 'Bot');
		if (!botRole) {
			return log.error('Could not find bot role!');
		}

		let botPos = botRole.calculatedPosition;

		guild.createRole({
			name: roleName,
			color: roleName
		}).then(role => {
			log.info('Created role ' + roleName);
			guild.setRolePosition(role, botPos).then(guild => roles.actuallyAddRole(message, guild, member, role));
		});
	},
	actuallyAddRole: function(message, guild, member, role) {
		member.addRole(role).then(member => {
			let memberRoles = member.roles.array();
			for(let i = 0; i < memberRoles.length; i++) {
				let otherRole = memberRoles[i];
				if (roles.isColorRole(otherRole.name) && otherRole.name != role.name) {
					member.removeRole(otherRole);
				}
			}
			message.channel.send('Color changed :+1:');
		});
	},
	addRegularRole: function (roleName, message) {
		if (!guildData.has(message.guild.id)) storage.buildGuild(message.guild);
		let guildSettings = guildData.get(message.guild.id);
		let roleData = (guildSettings.roles) ? guildSettings.roles : {};
		let allowedRoles = (roleData.whitelist) ? roleData.whitelist : [];

		if (!allowedRoles.includes(roleName)) return message.channel.send('Sorry, you can\'t add that role');

		let role = message.guild.roles.find('name', roleName);
		if (!role) return message.channel.send('I\'ve been told I can give you this role, but I can\'t find it, let the admins know :frowning:');

		let member = message.member;
		member.addRole(role).then(member => {
			message.channel.send('Role added :+1:');
		});
	},
	del: function (bot, message, args) {
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

			if (roleIsEmpty && roles.isColorRole(role[0].name)) role[0].delete('No users left in color role');
		});
	},
	isColorRole: function (roleName) {
		return (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(roleName));
	}
};

const staff = {
	add: function (bot, message, args) {
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

		return message.channel.send(roleName + ' was whitelisted as a staff role :+1:');
	},
	del: function (bot, message, args) {
		if (message.member.id !== message.guild.ownerID) return message.channel.send('You don\'t have permission to do that!');
		let roleName = args.join(' ');
		let role = message.guild.roles.find('name', roleName);
		if (!role) return message.channel.send('Sorry, I can\'t find the role "' + roleName + '"');

		if (!guildData.has(message.guild.id)) storage.buildGuild(message.guild);
		let guildSettings = guildData.get(message.guild.id);
		let roleData = (guildSettings.roles) ? guildSettings.roles : {};
		let staffRoles = (roleData.staff) ? roleData.staff : [];

		if (staffRoles.indexOf(roleName) < 0) return message.channel.send('That role isn\'t a staff role');

		staffRoles = staffRoles.slice(0, staffRoles.indexOf(roleName)).concat(staffRoles.slice(staffRoles.indexOf(roleName) + 1));
		roleData.staff = staffRoles;
		guildSettings.roles = roleData;
		guildData.set(message.guild.ind, guildSettings);

		return message.channel.send(roleName + ' was removed from the staff whitelist :+1:');
	},
	getIsStaff: function (member, guild) {
		// TODO: Check for staff roles on member
		if (member.id === guild.ownerID) return true;
		if (!guildData.has(guild.id)) storage.buildGuild(guild);
		let guildSettings = guildData.get(guild.id);
		let roleData = (guildSettings.roles) ? guildSettings.roles : {};
		let staffRoles = (roleData.staff) ? roleData.staff : [];

		let memberRoles = member.roles;
		for(let i = 0; i < staffRoles.length; i++) {
			if (memberRoles.find('name', staffRoles[i])) return true;
		}

		return false;
	}
};

const whitelist = {
	add: function (bot, message, args) {
		if (!staff.getIsStaff(message.member, message.guild)) return message.channel.send('You don\'t have permission to do that!');
		let roleName = args.join(' ');
		let role = message.guild.roles.find('name', roleName);
		if (!role) return message.channel.send('Sorry, I can\'t find the role "' + roleName + '"');

		if (!guildData.has(message.guild.id)) storage.buildGuild(message.guild);
		let guildSettings = guildData.get(message.guild.id);
		let roleData = (guildSettings.roles) ? guildSettings.roles : {};
		let allowedRoles = (roleData.whitelist) ? roleData.whitelist : [];

		allowedRoles.push(role);
		roleData.whitelist = allowedRoles;
		guildSettings.roles = roleData;
		guildData.set(message.guild.id, guildSettings);

		return message.channel.send(roleName + ' was whitelisted, members can now add this role with ' + config.bot.prefix + 'roleadd :+1:');
	},
	del: function (bot, message, args) {
		if (!staff.getIsStaff(message.member, message.guild)) return message.channel.send('You don\'t have permission to do that!');
		let roleName = args.join(' ');
		let role = message.guild.roles.find('name', roleName);
		if (!role) return message.channel.send('Sorry, I can\'t find the role "' + roleName + '"');

		if (!guildData.has(message.guild.id)) storage.buildGuild(message.guild);
		let guildSettings = guildData.get(message.guild.id);
		let roleData = (guildSettings.roles) ? guildSettings.roles : {};
		let allowedRoles = (roleData.whitelist) ? roleData.whitelist : [];

		if (allowedRoles.indexOf(roleName) < 0) return message.channel.send('That role isn\'t whitelisted');

		allowedRoles = allowedRoles.slice(0, allowedRoles.indexOf(roleName)).concat(allowedRoles.slice(allowedRoles.indexOf(roleName) + 1));
		roleData.whitelist = allowedRoles;
		guildSettings.roles = roleData;
		guildData.set(message.guild.ind, guildSettings);

		return message.channel.send(roleName + ' was removed from the whitelist :+1:');
	}
};

const commands = [
	{
		action: roles.add,
		aliases: [
			'add',
			'give',
			'grant',
			'a'
		]
	},
	{
		action: roles.del,
		aliases: [
			'remove',
			'del',
			'rm',
			'delete',
			'r'
		]
	},
	{
		action: staff.add,
		aliases: [
			'addstaff'
		]
	},
	{
		action: staff.del,
		aliases: [
			'removestaff'
		]
	},
	{
		action: whitelist.add,
		aliases: [
			'whitelist',
			'wl'
		]
	},
	{
		action: whitelist.del,
		aliases: [
			'unwhitelist',
			'uwl',
			'blacklist',
			'bl'
		]
	}
];
