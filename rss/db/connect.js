const config = require('../../config.json');
const log = require('../../util/logger.js');

module.exports = callback => {
	let uri = process.env.DRSS_DATABASE_URI || config.database.uri;
	let dbType = config.database.type;
	log.general.info(`Connecting to DB URI ${uri} with type ${dbType}`);
	switch(dbType) {
		case 'mongo':
			// TODO: Add MongoDB Support
		case 'mysql':
			// TODO: Add MySQL Support
		case 'sqlite':
			// TODO: Add SQLite Support
		default:
			log.general.warning(`Unknown or unsupported DB type "${dbType}", defaulting to file storage`);
		case 'json':
		case 'file':
			return callback();
	}
}
