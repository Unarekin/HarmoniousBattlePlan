const { Command } = require('discord-akairo');

class InitResetCommand extends Command {
  constructor() {
    super('initReset', {
      trigger: /^init reset$/i,
      userPermissions: ['ADMINISTRATOR']
    });
  }

  trigger(message) {
    return new RegExp("^" + process.env.BOT_COMMAND_PREFIX + "init reset$", 'i');
  }

  exec(message) {
    let db = this.client.db;


    let session = db.session();
    return session.run('MATCH (u:User)-[o:Owns]->(c:Character)-[r:Within]->(g:Guild {id:{guild}}) SET c.inCombat=false', {guild: message.channel.guild.id})
      .then((res) => {
        session.close();
        return message.util.send("Initiative cleared.");
      })
      .catch((err) => {
        console.error(err);
        session.close();
        return message.util.send("There was an error clearing initiative.  Please contact support.");
      });

    // let session = db.session();
    // return session
    //   .run('MATCH (u:User {id: {user}}), (c:Channel {id: {channel}}) CREATE (u)-[:Sees]->(c)', {user: message.author.id, channel: message.channel.id})
    //   .then((res) => {
        //return message.util.send("Reset.");    //   });
  }
}

module.exports = InitResetCommand;