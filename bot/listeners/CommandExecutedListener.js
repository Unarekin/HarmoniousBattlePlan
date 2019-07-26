const { Listener } = require('discord-akairo');

class CommandExecutedListener extends Listener {
  constructor() {
    super('commandExecuted', {
      emitter: 'commandHandler',
      eventName: 'commandStarted'
    });
  }

  exec(message, command, edited) {
    //console.log(message);
    let db = this.client.db;

    let session = db.session();
    session.run('MATCH (u:User {id: {user}}), (c:Channel {id: {channel}}) CREATE UNIQUE (u)-[:Sees]->(c)', {user: message.author.id, channel: message.channel.id})
    .catch(console.error);
  }
}

module.exports = CommandExecutedListener;