require('dotenv').config();

const { AkairoClient } = require('discord-akairo');
const neo4j = require('neo4j-driver').v1;


//const db = new neo4j.GraphDatabase(process.env.DATABASE_URL);
const db = neo4j.driver(process.env.DATABASE_URL, neo4j.auth.basic(process.env.DATABASE_USER, process.env.DATABASE_PASSWORD));


const botClient = new AkairoClient({
  ownerID: process.env.DISCORD_BOT_OWNER,
  prefix: process.env.BOT_COMMAND_PREFIX,
  commandDirectory: process.env.BOT_COMMAND_DIR,
  listenerDirectory: process.env.BOT_LISTENER_DIR,
  inhibitorDirectory: process.env.BOT_INHIBITOR_DIR,
  commandUtil: true,
  fetchMembers: true
}, {
  disableEveryone: true
});

botClient.login(process.env.DISCORD_BOT_TOKEN)
.then(() => {
  botClient.db = db;
  botClient.user.setActivity("See '" + process.env.BOT_COMMAND_PREFIX + "init help' for assistance!")
  console.log("Bot connected.");
  return addGuildsAndChannels();
})
.then(() => {
  console.log("Added guilds and channels.");
})
.catch(console.error);


process.on('exit', (code) => {
  db.close();
});

function addGuildsAndChannels() {
  return new Promise((resolve, reject) => {

    let guildNodes = [];
    let channelNodes = [];
    let memberNodes = [];

    let guildChannels = [];
    let guildMemberships = [];
    let channelMemberships = [];

    let guilds = botClient.guilds.array();

    for (let i=0;i<guilds.length;i++) {
      let guild = guilds[i];
      guildNodes.push({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        region: guild.region,
        ownerId: guild.ownerID
      });

      let guildChannel = {
        guild: guild.id,
        channels: []
      };

      let guildMembership = {
        guild: guild.id,
        members: []
      };



      guildChannels.push(guildChannel);
      guildMemberships.push(guildMembership);


      let channels = guild.channels.array();
      channels.forEach((channel) => {
        if (channel.type === 'text') {
          channelNodes.push({
            id: channel.id,
            type: channel.type,
            name: channel.name,
            guild: guild.id
          });

          guildChannel.channels.push(channel.id);

          let channelMembership = {
            channel: channel.id,
            members: []
          };
          channelMemberships.push(channelMembership);
        }
      });

      let members = guild.members.array();

      members.forEach((member) => {

        // Does it already exist?
        let index = memberNodes.findIndex((item) => { return item.id == member.id; })
        if (index === -1) {
          // Don't add to the array if it already has been, to prevent excess work.
          memberNodes.push({
            id: member.user.id,
            username: member.user.username,
            discriminator: member.user.discriminator,
            avatar: member.user.avatar,
            bot: member.user.bot,
            nickname: member.nickname
          });          
        }

        guildMembership.members.push(member.user.id);
      });
    }


    let session = db.session();
    session
      // Create guilds
      .run('UNWIND $guilds as guild MERGE (g:Guild {id: guild.id}) SET g = guild RETURN g', { guilds: guildNodes })
      // Create channels
      .then((res) => {
        return session.run('UNWIND $channels AS channel MERGE (c:Channel {id: channel.id}) SET c = channel RETURN c', { channels: channelNodes});
      })
      // Add guild->channel relationships
      .then((res) => {
        let promises = [];
        for (let i=0;i<guildChannels.length;i++) {
          let rel = guildChannels[i];
          promises.push(session.run('MATCH (g:Guild {id: {guild}}), (c:Channel) WHERE c.id IN {channels} CREATE UNIQUE (g)-[r:Has]->(c)', rel));
        }

        return Promise.all(promises);
      })
      // Create users
      .then((res) => {
        return session.run('UNWIND $users AS user MERGE (u:User {id: user.id}) SET u = user RETURN u', { users: memberNodes});
      })
      // Add guild->user relationships
      .then((res) => {
        let promises = [];
        guildMemberships.forEach((rel) => {
          promises.push(session.run("MATCH (g:Guild {id: {guild}}), (u:User) WHERE u.id IN {members} CREATE UNIQUE (g)-[r:Member]->(u)", rel));
        });
        return Promise.all(promises);
      })
      // Add user->channel relationships
      .then((res) => {

      })
      // Done
      .then((res) => {
        resolve();
      })
      .catch(reject);
  });
}



process.on('unhandledReject', (err) => {
  console.error("Unhandled rejection: ", err);
})