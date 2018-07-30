const fs = require('fs')
const eventHandler = evnt => require(`../events/${evnt}.js`)
const log = require('./logger.js')
const config = require('../config.json')
const storage = require('./storage.js')
const pageControls = require('./pageControls.js')
const md5hash = require('md5-file');
const EVENT_HANDLERS = {
	guildCreate: guildCreateHandler,
	guildDelete: guildDeleteHandler,
	channelDelete: channelDeleteHandler,
	roleUpdate: roleUpdateHandler,
	roleDelete: roleDeleteHandler,
	guildUpdate: guildUpdateHandler,
	messageReactionAdd: messageReactionAddHandler,
	messageReactionRemove: messageReactionRemoveHandler,
	message: messageHandler
}
let cmdsExtensions = [];
let fileHashes = {};
let cmdDir = config.bot.commandsDirectory;

if (fs.existsSync(cmdDir)) {
	log.general.info("Loading commands extensions from", config.bot.commandsDirectory);
	checkCommandsDir();
	fs.watch(cmdDir, checkCommandsDir);
} else {
	log.general.warning("Commands directory " + config.bot.commandsDirectory + " does not exist!");
}

function checkCommandsDir() {
	fs.readdir(cmdDir, (err, files) => {
		if (err) {
			log.general.error("Error: Unable to read commands directory at", config.bot.commandsDirectory);
			log.general.error(err.Error);
			return;
		}

		files.forEach(file => readCommandsFile(file));
	});
}

function readCommandsFile(file) {
	let fullPath = '../' + cmdDir + file;
	if (!/^[^.].*\.js$/.test(file)) return;
	let hash = md5hash.sync(__dirname + '/' + fullPath);
	if (!fileHashes[file]) fileHashes[file] = hash;
	else if (fileHashes[file] == hash) return;
	else fileHashes[file] = hash;
	try { delete require.cache[require.resolve(fullPath)] } catch (e) {}
	try {
		cmdsExtensions.push(require(fullPath));
		log.general.success(`Commands extension file ${fullPath} has been updated with hash ${fileHashes[file]}`);
	} catch (e) {
		log.general.warning(`Commands extension file ${fullPath} was changed, but could not be updated. Reason:\n`, e);
	}
}

function guildCreateHandler (guild) {
	eventHandler('guildCreate')(storage.bot, guild)
}

function guildDeleteHandler (guild) {
	eventHandler('guildDelete')(storage.bot, guild)
}

function channelDeleteHandler (channel) {
	eventHandler('channelDelete')(channel)
}

function roleUpdateHandler (oldRole, newRole) {
	if (oldRole.name === newRole.name) return
	eventHandler('roleUpdate')(storage.bot, oldRole, newRole)
}

function roleDeleteHandler (role) {
	eventHandler('roleDelete')(storage.bot, role)
}

function guildUpdateHandler (oldGuild, newGuild) {
	if (newGuild.name === oldGuild.name) return
	eventHandler('guildUpdate')(storage.bot, oldGuild, newGuild)
}

function messageReactionAddHandler (msgReaction, user) {
	if ((msgReaction.emoji.name !== '▶' && msgReaction.emoji.name !== '◀') || user.bot || !pageControls.has(msgReaction.message.id)) return
	eventHandler('messageReactionAdd')(storage.bot, msgReaction, user)
}

function messageReactionRemoveHandler (msgReaction, user) {
	if ((msgReaction.emoji.name !== '▶' && msgReaction.emoji.name !== '◀') || user.bot || !pageControls.has(msgReaction.message.id)) return
	eventHandler('messageReactionRemove')(storage.bot, msgReaction, user)
}

function messageHandler (message) {
	eventHandler('message')(storage.bot, message, config.bot.enableCommands === true ? null : true)
	if (message.content.startsWith(config.bot.prefix)) {
		try { cmdsExtensions.forEach(extension => extension(storage.bot, message)); } catch (e) {}
	}
}

exports.createManagers = () => {
	for (var eventName in EVENT_HANDLERS) {
		if (eventName !== 'message') storage.bot.on(eventName, EVENT_HANDLERS[eventName]);
	}
}

exports.enableCommands = () => {
	storage.bot.on('message', messageHandler)
	if (config.bot.enableCommands !== false) log.general.info(`${storage.bot.shard && storage.bot.shard.count > 0 ? 'SH ' + storage.bot.shard.id + ' ' : ''}Commands have been enabled`)
}

exports.disableAll = () => {
	for (var eventName in EVENT_HANDLERS) storage.bot.removeListener(eventName, EVENT_HANDLERS[eventName])
}
