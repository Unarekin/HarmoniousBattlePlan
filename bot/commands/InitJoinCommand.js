const { RichEmbed } = require('discord.js');
const { Command } = require('discord-akairo');
const stringArgv = require('string-argv').default;
const { createCharacterEmbed } = require('../utils');
const Roll = require('roll');



class InitJoinCommand extends Command {
  constructor() {
    super('initJoin', {
    });

    this.roll = new Roll();
  }

  trigger(message) {
    return new RegExp("^" + process.env.BOT_COMMAND_PREFIX + "init join (.*?)$", 'i')
  }

  exec(message, match, groups) {
    let db = this.client.db;

    let args = match[1];
    let parsedArgs = stringArgv(args);

    let key = parsedArgs[0];
    let joinBattle = parsedArgs[1];

    if (joinBattle) {
      // Roll Join Battle!
      joinBattle = 
        this.roll.roll(joinBattle + "d10").rolled
          .filter((roll) => { return roll >= 7})
          .reduce((a, b) => a+1, 0);
      joinBattle += 3;
    }

    let session = db.session();

    // Start off with a Promise that resolves to whether or not they have permission
    return new Promise((resolve, reject) => {
      if (message.member.hasPermission("ADMINISTRATOR")) {
        resolve(true);
      } else {
        let props = {
          user: message.author.id,
          character: key,
          guild: message.guild.id
        };
        session.run('MATCH (u:User)-[Owns]->(c:Character {id: {character}})-[Within]->(g:Guild {id: {guild}}) RETURN u,c', props)
        .then((res) => {
          let user = null;
          let character = null;
          if (res &&
              res.records &&
              res.records[0] &&
              res.records[0]._fields
          ) {
            if (res.records[0]._fields[0] && res.records[0]._fields[0].properties)
              user = res.records[0]._fields[0].properties;
            if (res.records[0]._fields[1] && res.records[0]._fields[1].properties)
              character = res.records[0]._fields[1].properties;
          }

          if (!user || !character)
            resolve(false);
          else
            resolve(true);
        });
      }
    })
    .then((admin) => {
      if (!admin) {
        return message.util.send("Either could not locate character '" + key + "', or you do not have permission to affect this character.");
      } else {
        let query="MATCH (c:Character {id: {key}}) SET c.inBattle=true";
        if (joinBattle)
          query += ", c.initiative={init}";

        query += " RETURN c";

        let props =  {init: joinBattle, key: key};

        return session.run(query,props);
      }
    })
    .then((res) => {
      if (res && res.records && res.records[0] && res.records[0]._fields && res.records[0]._fields[0].properties) {
        let character = res.records[0]._fields[0].properties;
        return message.util.send((character.name || character.id) + " joined battle with an Initiative of " + character.initiative);
      } else {
        throw new Error("Query returned no results.");
      }
    })
    .catch((err) => {
      console.error(err);
      return message.util.send("Unable to join character to battle.  Please contact support.");
    });

  }
}

module.exports = InitJoinCommand;