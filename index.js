const http = require("http");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

// Render needs an open port
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Chuppys bot is running!");
}).listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// Channel IDs
const WELCOME_CHANNEL_ID = "1530755165412524042";
const GOODBYE_CHANNEL_ID = "1530761366489530480";

// Welcome role
const WELCOME_ROLE_ID = "1531039846871728248";

// Welcome image
const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  console.log("Bot is ready!");
});

// =========================
// AUTOMATIC WELCOME
// =========================

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
    .setFooter({
      text: ".gg/chuppys"
    });

  await channel.send({
    content: `<@&${WELCOME_ROLE_ID}>`,
    embeds: [embed]
  });

  console.log(`Welcome message sent for ${member.user.tag}`);
});

// =========================
// AUTOMATIC GOODBYE
// =========================

client.on("guildMemberRemove", async (member) => {
  if (member.user.bot) return;

  const channel = member.guild.channels.cache.get(GOODBYE_CHANNEL_ID);

  if (!channel) {
    console.log("Goodbye channel not found.");
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0xffffff)
    .setDescription(
      `♡ goodbye <@${member.id}> ♡\n\n` +
      `goodbye from **.gg/chuppys** !\n` +
      `we hope you had a great time ♡`
    )
    .setFooter({
      text: ".gg/chuppys"
    });

  await channel.send({
    embeds: [embed]
  });

  console.log(`Goodbye message sent for ${member.user.tag}`);
});

// =========================
// !testwelcome
// =========================

client.on("messageCreate", async (message) => {
  console.log(`Message received: ${message.content}`);

  if (message.author.bot) return;
  if (!message.guild) return;

  // -------------------------
  // TEST WELCOME
  // -------------------------

  if (message.content === "!testwelcome") {
    console.log("Test welcome command detected!");

    const member = message.member;
    const channel = message.guild.channels.cache.get(WELCOME_CHANNEL_ID);

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
      .setFooter({
        text: ".gg/chuppys"
      });

    await channel.send({
      content: `<@&${WELCOME_ROLE_ID}>`,
      embeds: [embed]
    });

    console.log("Test welcome message sent!");
  }

  // -------------------------
  // TEST GOODBYE
  // -------------------------

  if (message.content === "!testgoodbye") {
    console.log("Test goodbye command detected!");

    const channel = message.guild.channels.cache.get(GOODBYE_CHANNEL_ID);

    if (!channel) {
      console.log("Goodbye channel not found.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setDescription(
        `♡ goodbye <@${message.author.id}> ♡\n\n` +
        `goodbye from **.gg/chuppys** !\n` +
        `we hope you had a great time ♡`
      )
      .setFooter({
        text: ".gg/chuppys"
      });

    await channel.send({
      embeds: [embed]
    });

    console.log("Test goodbye message sent!");
  }
});

client.login(TOKEN);
