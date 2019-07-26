const { RichEmbed } = require('discord.js');
const { Command } = require('discord-akairo');
const stringArgv = require('string-argv').default;
const { createCharacterEmbed } = require("../utils");

class InitOnslaughtCommand extends Command {
  constructor() {
    super('initOnslaught', {
    });
  }

  trigger(message) {
    return new RegExp("^" + process.env.BOT_COMMAND_PREFIX + "init onslaught (.*?)$", 'i')
  }

  exec(message, match, groups) {
    let db = this.client.db;

    let args = match[1];
    let parsedArgs = stringArgv(args);
    
    let key = parsedArgs[0];
    let amount = parseInt(parsedArgs[1]);


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
            return session.run("MATCH (c:Character {id: {id}}) SET c.onslaught={onslaught} RETURN c", {id: character.id, onslaught: amount});
          } else {
            return message.util.send("Could not set value, permission denied.");
          }
        }
      })
      .then((res) => {
        session.close();
        if (res && res.records) {
          let character = res.records[0]._fields[0].properties;
          
          // let embed = createCharacterEmbed(character);
          // return message.util.send(embed);
          return message.util.send("Set " + (character.name || character.id) + "'s onslaught penalty to " + amount);          
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

module.exports = InitOnslaughtCommand;