"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_json_1 = require("./config.json");
const DiscordRSS = require("./index");
const drss = new DiscordRSS.Client();
let token = config_json_1.default.bot.token;
try {
    import override from './settings/configOverride.json';
    if (configOverride_json_1.default.bot && configOverride_json_1.default.bot.token) {
        token = configOverride_json_1.default.bot.token;
    }
}
catch (e) {
    console.log('Could not load overrides');
}
drss.login(token);
