const config = require('./config.json');
const colors = require('colors');
const Discord = require('discord.js');
const rest = new Discord.REST({
	version: '10'
}).setToken(config.discord.token);
const client = new Discord.Client({
	intents: ["Guilds", "GuildWebhooks"]
});
const steam = require('steam-server-query');

function splitKeyword(keyword) {
	data = keyword.split("-")
	switch (data[1]) {
		case "0":
			dlcString = "None",
				dlcEmoji = ":x:"
			break;
		case "1":
			dlcString = "Weapons",
				dlcEmoji = ":gun:"
			break;
		case "2":
			dlcString = "Arid",
				dlcEmoji = ":desert:"
			break;
		case "3":
			dlcString = "Both",
				dlcEmoji = ":gun::desert:"
			break;
		default:
			break;
	}
	if (data[0] >= "v1.3.0") {
		return {
			"version": data[0],
			dlcString,
			dlcEmoji,
			dlc: data[1],
			"tps": data[2]
		}
	} else { // For older versions
		console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} Absolutely ancient server found, ${data}`);
		return {
			"version": data[0],
			"tps": data[1]
		}
	}
};

// checkServer function as a promise
function checkServer(address) {
	return new Promise((resolve, reject) => {
		steam.queryGameServerInfo(address).then(data => {
			data.keywords.split("-")
			data.address = address.split(":");
			data.serverInfo = splitKeyword(data.keywords);
			output = {
				"status": true,
				"name": data.name,
				"address": data.address[0],
				"port": data.address[1],
				"password": data.visibility == 1 ? true : false,
				"version": data.serverInfo.version,
				"dlc": data.serverInfo.dlc,
				"dlcString": data.serverInfo.dlcString,
				"dlcEmotes": data.serverInfo.dlcEmoji,
				"tps": data.serverInfo.tps,
				"players": data.bots,
				"maxPlayers": data.maxPlayers,
				"map": data.map,
				"gameId": data.gameId,
				"lastUpdated": new Date()
			}
			resolve(output);
		}).catch((err) => {
			output = {
				"status": false,
				"error": "Could not connect to server",
				"name": "Unknown",
				"address": address.split(":")[0],
				"port": address.split(":")[1],
				"version": "Unknown",
				"dlc": null,
				"dlcString": "Unknown",
				"tps": 0,
				"players": 0,
				"maxPlayers": 0,
				"map": "Unknown",
				"gameId": "573090"
			}
			resolve(output);
		});
	});
}


function updateStatus(addr, port, msg) {
	if (!serverEmbeds[`${addr}:${port}`]) {
		serverEmbeds[`${addr}:${port}`] = {
			"title": "Unknown",
			"fields": [{
					"name": "Status",
					"value": `<:lowtps:1108862303618728108>: \`Unknown\``,
					"inline": true
				},
				{
					"name": "Version",
					"value": `?`,
					"inline": true
				},
				{
					"name": "DLC",
					"value": `?`,
					"inline": true
				},
				{
					"name": "TPS",
					"value": `?`,
					"inline": true
				},
				{
					"name": "Players",
					"value": `?/?`,
					"inline": true
				}
			],
			"color": 0x00ffff,
			"footer": {
				"text": `Last Updated`
			},
			"timestamp": new Date()
		};
	}
	if(!serverStatus[`${addr}:${port}`]) {
		serverStatus[`${addr}:${port}`] = {
			"status": false,
			"error": "Could not connect to server",
			"name": "Unknown",
			"address": addr,
			"port": port,
			"version": "Unknown",
			"dlc": null,
			"dlcString": "Unknown",
			"tps": 0,
			"players": 0,
			"maxPlayers": 0,
			"map": "Unknown",
			"gameId": "573090"
		}
	}
	console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} Checking ${addr}:${port}`);
	checkServer(`${addr}:${port}`).then((data) => {
		if (data.status) {
			// If none of the info has changed, don't edit the embed
			if (data.name == serverStatus[`${addr}:${port}`].name && data.version == serverStatus[`${addr}:${port}`].version && data.dlc == serverStatus[`${addr}:${port}`].dlc && data.tps == serverStatus[`${addr}:${port}`].tps && data.players == serverStatus[`${addr}:${port}`].players && data.maxPlayers == serverStatus[`${addr}:${port}`].maxPlayers) {
				console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} ${addr}:${port} is online, but nothing has changed.`);
				setTimeout(() => {
					console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} Updating ${addr}:${port}`);
					updateStatus(addr, port, msg);
				}, 5000)
				return;
			}
			console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} ${addr}:${port} is online.`);
			serverStatus[`${addr}:${port}`] = data;
			embed = {
				"title": data.name,
				"fields": [{
						"name": "Status",
						"value": `${data.tps <= config.stormworks.lowTPS ? "<:lowtps:1108862303618728108>: `TPS Low`" : "<:online:1108862127021756457> `Online`"}`,
						"inline": true
					},
					{
						"name": "Version",
						"value": `${data.version}`,
						"inline": true
					},
					{
						"name": "DLC",
						"value": `${data.dlcEmotes} ${data.dlcString}`,
						"inline": true
					},
					{
						"name": "TPS",
						"value": `${data.tps}`,
						"inline": true
					},
					{
						"name": "Players",
						"value": `${data.players}/${data.maxPlayers}`,
						"inline": true
					}
				],
				"color": data.tps <= config.stormworks.lowTPS ? 0xfff000 : 0x00ff00,
				"footer": {
					"text": `Last Updated`
				},
				"timestamp": new Date()
			};
			serverEmbeds[`${addr}:${port}`] = embed;
			msg.edit({
				embeds: [embed]
			}).then(() => {
				console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} ${addr}:${port} is online, edited embed.`);
				setTimeout(() => {
					console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} Updating ${addr}:${port}`);
					updateStatus(addr, port, msg);
				}, 5000)
			}).catch((err) => {
				console.log(`${colors.red("[ERROR]")} ${err}`);
				setTimeout(() => {
					console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} Updating ${addr}:${port}`);
					updateStatus(addr, port, msg);
				}, 5000)
			});
		} else {
			// If the server was already offline, don't edit the embed
			if (!serverStatus[`${addr}:${port}`].status) {
				console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} ${addr}:${port} is offline, but was already offline.`);
				setTimeout(() => {
					console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} Updating ${addr}:${port}`);
					updateStatus(addr, port, msg);
				}, 5000)
				return;
			}
			serverStatus[`${addr}:${port}`].status = false;
			console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} ${addr}:${port} is offline.`);
			// Server is offline, modify embed slightly and edit it
			data2 = serverStatus[`${addr}:${port}`];
			embed = {
				"title": data2.name,
				"fields": [{
						"name": "Status",
						"value": `<:offline:1108862189793726485> \`Offline\``,
						"inline": true
					},
					{
						"name": "Version",
						"value": `${data2.version}`,
						"inline": true
					},
					{
						"name": "DLC",
						"value": `${data2.dlcEmotes} ${data2.dlcString}`,
						"inline": true
					},
					{
						"name": "TPS",
						"value": `0`,
						"inline": true
					},
					{
						"name": "Players",
						"value": `0/${data2.maxPlayers}`,
						"inline": true
					}
				],
				"color": 0xff0000,
				"footer": {
					"text": `Last Updated`
				},
				"timestamp": new Date()
			};
			serverEmbeds[`${addr}:${port}`] = embed;
			msg.edit({
				"embeds": [serverEmbeds[`${addr}:${port}`]]
			}).then((msg) => {
				console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} ${addr}:${port} is offline, edited embed.`);
				setTimeout(() => {
					console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} Updating ${addr}:${port}`);
					updateStatus(addr, port, msg);
				}, 5000)
			}).catch((err) => {
				console.log(`${colors.red("[ERROR]")} ${err}`);
				setTimeout(() => {
					console.log(`${colors.magenta(`[DEBUG ${new Date()}]`)} Updating ${addr}:${port}`);
					updateStatus(addr, port, msg);
				}, 5000)
			});
		}
	})
}



client.on("ready", async () => {
	console.log(`${colors.cyan("[INFO]")} Logged in as ${colors.green(client.user.tag)}`)
	// Load Commands
	console.log(`${colors.cyan("[INFO]")} Loading Commands...`)
	const commands = require('./commands.json');
	await (async () => {
		try {
			console.log(`${colors.cyan("[INFO]")} Registering Commands...`)
			let start = Date.now()
			// For every guild
			for (const guild of client.guilds.cache.values()) {
				let gStart = Date.now();
				console.log(`${colors.cyan("[INFO]")} Registering Commands for ${colors.green(guild.name)}...`);
				// Register commands
				await rest.put(
					Discord.Routes.applicationGuildCommands(client.user.id, guild.id), {
						body: commands
					},
				);
				console.log(`${colors.cyan("[INFO]")} Successfully registered commands for ${colors.green(guild.name)}. Took ${colors.green((Date.now() - gStart) / 1000)} seconds.`);
			};
			console.log(`${colors.cyan("[INFO]")} Successfully registered commands. Took ${colors.green((Date.now() - start) / 1000)} seconds.`);
		} catch (error) {
			console.error(error);
		}
	})();

	// Log startup time in seconds
	console.log(`${colors.cyan("[INFO]")} Startup took ${colors.green((Date.now() - initTime) / 1000)} seconds.`)

	config.stormworks.servers.forEach((server) => {
		client.channels.fetch(server.channelId).then((channel) => {
			channel.messages.fetch(server.messageId).then((message) => {
				updateStatus(server.ip, server.port, message)
			});
		});
	});
	// client.channels.fetch("1108126926045986856").then((channel) => {
	// 	channel.messages.fetch("1108860190935232592").then((message) => {
	// 		message.edit("UwU")
	// 	})
	// })
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;
	switch (interaction.commandName) {
		case "send": // Send a message with it's message ID
			// check if integer 'count' exists, if not, set it to 1
			if (!interaction.options.getInteger('count')) {
				count = 1;
			} else {
				count = interaction.options.getInteger('count');
			}

			// Send a message `count` fimes
			for (i = 0; i < count; i++) {
				interaction.channel.send({
					embeds: [{
						description: "Please Wait"
					}]
				}).then(async (msg) => {
					await msg.edit({
						embeds: [{
							description: `ID: ${msg.id}`
						}]
					});
				});
			}
			interaction.reply({
				"ephemeral": true,
				content: "Done!"
			})
			break;
	}
});

process.on('SIGINT', async () => {
	await console.log(`${colors.cyan("[INFO]")} Stop received, exiting...`);
	await client.user.setPresence({
		status: "invisible",
		activities: []
	});
	await client.destroy();
	await console.log(`${colors.cyan("[INFO]")} Goodbye!`);
	process.exit(0);
});

var serverEmbeds = {};
var serverStatus = {};

console.log(`${colors.cyan("[INFO]")} Starting...`)
// Start timer to see how long startup takes
const initTime = Date.now();
// Login to Discord
client.login(config.discord.token);