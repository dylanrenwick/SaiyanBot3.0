import config from './config.json';
import * as DiscordRSS from './index';

const drss = new DiscordRSS.Client();
let token = config.bot.token;

try {
	import override from './settings/configOverride.json';
	if (override.bot && override.bot.token) {
		token = override.bot.token;
	}
} catch (e) {
	console.log('Could not load overrides');
}

drss.login(token);
