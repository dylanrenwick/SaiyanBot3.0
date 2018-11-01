const Discord = require('./index.js')
const config = require('./config.json')

const bot = new Discord.Client({ readFileSchedules: true, setPresence: true })
let token = config.bot.token

try {
  const override = require('./settings/configOverride.json')
  token = override.bot && override.bot.token ? override.bot.token : token
} catch (err) {}

bot.login(token)
