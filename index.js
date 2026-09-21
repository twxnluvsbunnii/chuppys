const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

const WELCOME_CHANNEL_ID = "1530755165412524042";
const WELCOME_ROLE_ID = "1531039846871728248";

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// Automatic welcome when someone joins
client.on("guildMemberAdd", async (member) => {
  if (member.user.bot) return;

  const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);

  if (!channel) {
    console.log("Welcome channel not found.");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setDescription(
      `♡ welcome <@${member.id}> ♡\n\n` +
      `welcome to .gg/chuppys !\n` +
      `we hope you enjoy your stay ♡`
    )
    .setImage(WELCOME_IMAGE)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({
      text: ".gg/chuppys"
    });

  await channel.send({
    content: `<@&${WELCOME_ROLE_ID}>`,
    embeds: [embed]
  });
});

// Test command
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (message.content !== "!testwelcome") return;

  const member = message.member;
  const channel = message.guild.channels.cache.get(WELCOME_CHANNEL_ID);

  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setDescription(
      `♡ welcome <@${member.id}> ♡\n\n` +
      `welcome to .gg/chuppys !\n` +
      `we hope you enjoy your stay ♡`
    )
    .setImage(WELCOME_IMAGE)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({
      text: ".gg/chuppys"
    });

  await channel.send({
    content: `<@&${WELCOME_ROLE_ID}>`,
    embeds: [embed]
  });
});

client.login(TOKEN);
