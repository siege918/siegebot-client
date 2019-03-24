// Import the discord.js module
const Discord = require('discord.js');
const fs = require('fs');

function help(message, config) {
  var content = '**COMMAND LIST**\n';

  for (var trigger in config.triggers) {
    content += '\n**';
    content += config.prefix;
    content += trigger;
    content += '** - ';
    content += config.triggers[trigger].description;
  }

  message.channel.send(content);
}

function checkWhitelistRegex(regexString, text) {
  var whitelistRegex = new RegExp(regexString, 'i');
  return whitelistRegex.test(text);
}

function checkChannelWhitelist(current, message) {
  if (!current.whitelist && !current.whitelistRegex) return true;

  if (current.whitelist && current.whitelist.includes(message.channel.id))
    return true;

  if (current.whitelistRegex) {
    if (!Array.isArray(current.whitelistRegex))
      current.whitelistRegex = [current.whitelistRegex];

    for (var i = 0; i < current.whitelistRegex.length; i++) {
      if (checkWhitelistRegex(current.whitelistRegex, message.channel.name))
        return true;
    }
  }

  return false;
}

function checkChannelBlacklist(current, message) {
  if (current.blacklist && !current.blacklistRegex) return true;

  if (current.blacklist && current.blacklist.includes(message.channel.id))
    return false;

  if (current.blacklistRegex) {
    if (!Array.isArray(current.blacklistRegex))
      current.blacklistRegex = [current.blacklistRegex];

    for (var i = 0; i < current.blacklistRegex.length; i++) {
      if (checkWhitelistRegex(current.blacklistRegex, message.channel.name))
        return false;
    }
  }

  return true;
}

function checkRoleWhitelist(current, message) {
  if (!current.roleWhitelist && !current.roleWhitelistRegex) return true;

  if (!message.member) return false;

  if (
    current.roleWhitelist &&
    message.member.roles.some(function(el) {
      current.roleWhitelist.includes(el.name);
    })
  )
    return true;

  if (current.roleWhitelistRegex) {
    if (!Array.isArray(current.roleWhitelistRegex))
      current.roleWhitelistRegex = [current.roleWhitelistRegex];

    for (var i = 0; i < current.roleWhitelistRegex.length; i++) {
      if (
        message.member.roles.some(function(el) {
          return checkWhitelistRegex(current.roleWhitelistRegex, el.name);
        })
      )
        return true;
    }
  }

  return false;
}

function checkRoleBlacklist(current, message) {
  if (!current.roleBlacklist && !current.roleBlacklistRegex) return true;

  if (!message.member) return false;

  if (current.roleBlacklist) {
    if (
      message.member.roles.some(function(el) {
        current.roleBlacklist.includes(el.name);
      })
    )
      return false;
  }

  if (current.roleBlacklistRegex) {
    if (!Array.isArray(current.roleBlacklistRegex))
      current.roleBlacklistRegex = [current.roleBlacklistRegex];

    for (var i = 0; i < current.roleBlacklistRegex.length; i++) {
      if (
        message.member.roles.some(function(el) {
          return checkWhitelistRegex(current.roleBlacklistRegex, el.name);
        })
      )
        return false;
    }
  }

  return true;
}

function authenticate(current, message) {
  return (
    checkChannelWhitelist(current, message) &&
    checkChannelBlacklist(current, message) &&
    checkRoleWhitelist(current, message) &&
    checkRoleBlacklist(current, message)
  );
}

function run(current, message, commandList) {
  if (!authenticate(current, message)) return;

  var command = current.command;
  var subcommand = current.subcommand;
  var commandConfig = current.config;

  commandList[command][subcommand](message, commandConfig)
    .then(function(response) {})
    .catch(function(error) {
      console.log(error);
    });
}

function activate(botname, moduleRef) {
  // Create an instance of a Discord client
  const client = new Discord.Client();

  /**
   * The ready event is vital, it means that only _after_ this will your bot start reacting to information
   * received from Discord
   */
  client.on('ready', function() {
    console.log('Bot "' + botname + '" ready');
  });

  var config = JSON.parse(fs.readFileSync(botname + '.config.json'));

  var commandList = {};
  var importErrors = [];

  for (var comm in config.commands) {
    try {
      commandList[comm] = moduleRef.require(config.commands[comm]);
    } catch (error) {
      importErrors.push("The module '" + config.commands[comm] + "' is listed in your config but cannot be found. Please install this module before running.");
    }
  }

  if (importErrors.length > 0) {
    for (var i = 0; i < importErrors.length; i++) {
      console.log(importErrors[i]);
    }
    return;
  }

  // Create an event listener for messages
  client.on('message', function(message) {
    if (message.isMentioned(message.client.user) && config.mention) {
      var current = config.mention;
      run(current, message, commandList);

      return;
    }

    //Short-circuit if it isn't a command
    if (!message.content.startsWith(config.prefix)) return;

    if (message.content.startsWith(config.prefix + 'help'))
      return help(message, config);

    for (var trigger in config.triggers) {
      if (message.content.startsWith(config.prefix + trigger)) {
        var current = config.triggers[trigger];
        run(current, message, commandList);

        return;
      }
    }

    for (var alias in config.aliases) {
      if (message.content.startsWith(config.prefix + alias)) {
        var current = config.triggers[config.aliases[alias]];
        run(current, message, commandList);

        return;
      }
    }
  });

  // Log our bot in using the token from https://discordapp.com/developers/applications/me
  client.login(config.token);
}

if (require.main === module) {
  var botname = process.argv[2];
  activate(botname, module);
}

module.exports = {
  activate: (botname) => activate(botname, module.parent),
};
