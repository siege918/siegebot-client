// Import the discord.js module
const Discord = require('discord.js');
const fs = require("fs");

var commandList = {
    "youtube": require("siegebot-youtube")
}

// Create an instance of a Discord client
const client = new Discord.Client();

var botname = process.argv[2];

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */
client.on('ready', function() {
    console.log('Bot "' + botname + '" ready');
});

let config = JSON.parse(fs.readFileSync(botname + ".config.json"));

// Create an event listener for messages
client.on('message', function(message)
    {
        for (var trigger in config.triggers)
        {
            if (message.content.startsWith(config.prefix + trigger))
            {
                var current = config.triggers[trigger];
                var command = current.command;
                var subcommand = current.subcommand;
                var commandConfig = current.config;

                commandList[command][subcommand](message, commandConfig)
                .then(
                    function(response) { }
                ).catch(function(error) {
                    console.log(error);
                });

                return;
            }
        }

        for (var alias in config.aliases)
        {
            if (message.content.startsWith(config.prefix + alias))
            {
                var current = config.triggers[config.aliases[alias]];
                var command = current.command;
                var subcommand = current.subcommand;
                var commandConfig = current.config;

                commandList[command][subcommand](message, commandConfig)
                .then(
                    function(message) { }
                ).catch(function(error) {
                    console.log(error);
                });

                return;
            }
        }
    }
);

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(config.token);