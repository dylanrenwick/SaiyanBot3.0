const config = require('../config.json');

exports.list = config.log.debugFeed !== undefined ? config.log.debugFeed : false;
