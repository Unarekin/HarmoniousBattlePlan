const { RichEmbed } = require('discord.js');
const { Command } = require('discord-akairo');
const stringArgv = require('string-argv').default;
const { createCharacterEmbed } = require("../utils");

class InitCrashCommand extends Command {
  constructor() {
    super('initCrash', {
    });
  }

  trigger(message) {
    return new RegExp("^" + process.env.BOT_COMMAND_PREFIX + "init crash (.*?)$", 'i')
  }

  exec(message, match, groups) {
    let db = this.client.db;

    let args = match[1];
    let parsedArgs = stringArgv(args);
    
    let key = parsedArgs[0];
    let crashed = (parsedArgs[1] || 'yes').toLowerCase();

    if (crashed == "yes" || crashed == "true")
      crashed = true;
    if (crashed == "no" || crashed == "false")
      crashed=false;


    let session = db.session();
    let props = {
      user: message.author.id,
      character: key,
      guild: message.guild.id
    };

    return session.run('MATCH (u:User)-[o:Owns]->(c:Character {id: {character}})-[r:Within]->(g:Guild {id:{guild}}) RETURN u,c', props)
      .then((res) => {
        if (!res.records[0]) {
          return message.util.send("Character not found.");
        } else {
          let user = res.records[0]._fields[0].properties;
          let character = res.records[0]._fields[1].properties;
          

          if (character.owner == user.id || message.member.hasPermission('ADMINISTRATOR')) {
            // Allow
            return session.run("MATCH (c:Character {id: {id}}) SET c.crash={crashed} RETURN c", {id: character.id, crashed: crashed});
          } else {
            return message.util.send("Could not adjust initiative, permission denied.");
          }
        }
      })
      .then((res) => {
        session.close();
        if (res && res.records) {
          let character = res.records[0]._fields[0].properties;
          
          // let embed = createCharacterEmbed(character);
          // return message.util.send(embed);
          let msg = "";
          if (crashed)
            msg = (character.name || character.id) + " has crashed!";
          else
            msg = (character.name || character.id) + " is no longer crashed.";
          return message.util.send(msg);
          
        }
      })
      .catch((err) => {
        console.error(err);
        session.close();
        return message.util.send("There was an error adjusting initiative.  Please contact support.");
      });


    // let session = db.session();
    // return session
    //   .run('MATCH (u:User {id: {user}}), (c:Channel {id: {channel}}) CREATE (u)-[:Sees]->(c)', {user: message.author.id, channel: message.channel.id})
    //   .then((res) => {
        //return message.util.send("Reset.");    //   });
  }
}

module.exports = InitCrashCommand;