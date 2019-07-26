const { RichEmbed } = require('discord.js');
const { Command } = require('discord-akairo');
const { createCharacterEmbed } = require('../utils');

class InitShowCommand extends Command {
  constructor() {
    super('initShow', {});
  }

  trigger(message) {
    return new RegExp("^" + process.env.BOT_COMMAND_PREFIX + "init show$", 'i');
  }

  exec(message) {
    let db = this.client.db;


    let session = db.session();
    return session.run("MATCH (g:Guild {id: {guild}})<-[:Within]-(c:Character {inBattle: true}) RETURN c", {guild: message.guild.id})
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

          let prevHasGone = false;
          

          characters.forEach((character, index) => {

            // if (title.length < 50)
            //   title += "⠀".repeat(50-title.length);

            // if (character.hasGone && !prevHasGone && index > 0) {
            //   chain = chain.then(() => {
            //     // return message.util.send(new RichEmbed({
            //     //   description: "-".repeat(50)
            //     // }));
            //     return message.util.send("Already gone:");
            //   })
            //   //chain = chain.then(() => { return message.util.send("━".repeat(50)); })
            // }

            prevHasGone = character.hasGone;

            let embed = createCharacterEmbed(character);
            chain = chain.then(() => { return message.util.send(embed); })
          })
          return chain;
        }

      })
      .then(() => { session.close(); })
      .catch((err) => {
        session.close();
        console.error(err);
        message.util.send("Unable to display initiative.  Please contact support.");
      });
  }

  wait(ms) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
    });
  }
}


module.exports = InitShowCommand;