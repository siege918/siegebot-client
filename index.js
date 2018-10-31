// Import the discord.js module
const Discord = require('discord.js');
const fs = require("fs");

var commandList = {
    "youtube": require("siegebot-youtube"),
    "quotes": require("siegebot-quotes"),
    "http": require("siegebot-http"),
    "echo": require("siegebot-echo")
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

var config = JSON.parse(fs.readFileSync(botname + ".config.json"));

function help(message) {
    var content = "**COMMAND LIST**\n";

    for (var trigger in config.triggers){
        content += "\n**";
        content += config.prefix;
        content += trigger;
        content += "** - ";
        content += config.triggers[trigger].description;
    }

    message.channel.send(content);
}

function run(current, message)
{
    var command = current.command;
    var subcommand = current.subcommand;
    var commandConfig = current.config;
    
    commandList[command][subcommand](message, commandConfig)
    .then(
        function(response) { }
    ).catch(function(error) {
        console.log(error);
    });
}

// Create an event listener for messages
client.on('message', function(message)
    {
        if (message.isMentioned(message.client.user) && config.mention)
        {
            var current = config.mention;
            run(current, message);

            return;
        }

        //Short-circuit if it isn't a command
        if (!message.content.startsWith(config.prefix))
            return;

        if (message.content.startsWith(config.prefix + "help"))
            return help(message);

        for (var trigger in config.triggers)
        {
            if (message.content.startsWith(config.prefix + trigger))
            {
                var current = config.triggers[trigger];
                run(current, message);

                return;
            }
        }

        for (var alias in config.aliases)
        {
            if (message.content.startsWith(config.prefix + alias))
            {
                var current = config.triggers[config.aliases[alias]];
                run(current, message);

                return;
            }
        }
    }
);

// Log our bot in using the token from https://discordapp.com/developers/applications/me
client.login(config.token);