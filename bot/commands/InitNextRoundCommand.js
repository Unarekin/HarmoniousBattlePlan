const { RichEmbed } = require('discord.js');
const { Command } = require('discord-akairo');
const { createCharacterEmbed } = require('../utils');

class InitNextRoundCommand extends Command {
  constructor() {
    super('initNextRound', {});
  }

  trigger(message) {
    return new RegExp("^" + process.env.BOT_COMMAND_PREFIX + "init next round", 'i');
  }

  exec(message) {
    let db = this.client.db;


    if (message.member.hasPermission("ADMINISTRATOR")) {
      let session = db.session();
      return session.run("MATCH (g:Guild {id: {guild}})<-[:Within]-(c:Character {inBattle: true}) SET c.hasGone=false return c", {guild: message.guild.id})
        .then((res) => {
          let characters = res.records.map((record) => { return record._fields[0].properties; })
          .sort((a, b) => {
            if (a.hasGone && !b.hasGone)
              return 1;
            if (!a.hasGone && b.hasGone)
              return -1;

            return b.initiative - a.initiative;
          })
          ;

          if (characters.length === 0) {
            return message.util.send("There are no characters in initiative.");
          } else {
            let chain = Promise.resolve();
            characters.forEach((character) => {
              chain = chain.then(() => {
                let embed = createCharacterEmbed(character);
                return message.util.send(embed);
              });
            });
          }
      })
      .then(() => { session.close(); })
      .catch((err) => {
        session.close();
        console.error(err);
        message.util.send("Could not advance to the next round.  Please contact support.");
      });
    } else {
      return message.util.send("Could not advance to the next round: Permission denied.");
    }
  }

  wait(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
    });
  }
}


module.exports = InitNextRoundCommand;