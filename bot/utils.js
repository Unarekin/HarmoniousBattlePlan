const { RichEmbed } = require('discord.js');


function createCharacterEmbed(character) {
  let embed = new RichEmbed();
  let title = (character.name || character.id);
  embed.setTitle(title)
  //.addField("Init", character.initiative, true)
  .setDescription(`\`\`\`
Init:          ${character.initiative}
Onslaught:     ${character.onslaught}
Crash:         ${(character.crash ? "Yes" : "No")}
Gone:          ${(character.hasGone ? "Yes" : "No")}
\`\`\``)
  .setFooter("⠀".repeat(50));
  ;
  if (character.avatar)
  	embed.setThumbnail(character.avatar)

  return embed;
}


module.exports.createCharacterEmbed = createCharacterEmbed