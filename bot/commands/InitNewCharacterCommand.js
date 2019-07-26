const { RichEmbed } = require('discord.js');
const { Command } = require('discord-akairo');

const stringArgv = require('string-argv').default;
const { createCharacterEmbed } = require("../utils");

class InitNewCharacterCommand extends Command {
  

  constructor() {
    super('initNewCharacter', {});
    this.triggerRegExp = new RegExp("^" + process.env.BOT_COMMAND_PREFIX + "init new (.*?)$", 'i');;
  }

  trigger(message) {
    return this.triggerRegExp;
  }

  exec(message, match, groups) {
    let args = match[1];
    
    let parsedArgs = stringArgv(args);

    let characterID = parsedArgs[0];
    let characterName = parsedArgs[1];
    let characterAvatar = parsedArgs[2];

    let owner = message.author.id;

    if (message.mentions && message.mentions.users && message.mentions.users.length) {
      let users = message.mentions.users.array();
      owner = users[0].id;
    }


    let session = this.client.db.session();
    let props = {character: characterID, guild: message.channel.guild.id};

    session.run("MATCH (g:Guild {id: {guild}})<-[:Within]-(c:Character {id:{character}}) RETURN c", props)
    .then((res) => {
      if (res.records.length >0) {
        return message.util.send("Could not add character.  Character with given key already exists.");
      } else {
        // Doesn't exist, create
        let characterNode = {
          id: characterID,
          guild: message.channel.guild.id,
          owner: owner,
          name: characterName,
          avatar: characterAvatar,
          initiative: 0,
          onslaught: 0,
          crash: false,
          hasGone: false,
          inBattle: false
        };

        let props = {
          node: characterNode,
          guild: characterNode.guild,
          owner: characterNode.owner,
          id: characterNode.id
        };

        return session.run("MATCH (g:Guild {id: {guild}}), (u:User {id: {owner}}) MERGE (u)-[:Owns]->(c:Character {id:{id}, guild: {guild}})-[:Within]->(g) SET c={node} RETURN c", props)
      }
    })
    .then((res) => {
      // Output
      // console.log(res);
      if (res && res.records) {
        let character = res.records[0]._fields[0].properties;

        let embed = createCharacterEmbed(character);
        session.close();
        //let output = "Added character '" + (characterName ? characterName : characterID) + "'" + (characterName ? " (" + characterID + ")" : "") + ".";
        return message.util.send(embed);
      }
    })
    .catch((err) => {
      console.error(err);
      session.close();
      return message.util.send("Could not add character.   Please contact support.");
    })



  }
}


module.exports = InitNewCharacterCommand;