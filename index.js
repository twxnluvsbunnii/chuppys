const http = require("http");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

// ==================================================
// RENDER WEB SERVER
// ==================================================

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Chuppys bot is running!");
}).listen(PORT, () => {
  console.log(`Web server running on port ${PORT}`);
});

// ==================================================
// DISCORD CLIENT
// ==================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==================================================
// BOT TOKEN
// ==================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// ==================================================
// CHANNEL IDS
// ==================================================

const WELCOME_CHANNEL_ID = "1530755165412524042";
const GOODBYE_CHANNEL_ID = "1530761366489530480";

// ==================================================
// WELCOME ROLE
// ==================================================

const WELCOME_ROLE_ID = "1531039846871728248";

// ==================================================
// WELCOME IMAGE
// ==================================================

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

// ==================================================
// BOT READY
// ==================================================

client.once("clientReady", () => {
  console.log("=================================");
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Bot ID: ${client.user.id}`);
  console.log("Chuppys bot is ready!");
  console.log("=================================");
});

// ==================================================
// AUTOMATIC WELCOME
// ==================================================

client.on("guildMemberAdd", async (member) => {
  console.log(
    `JOIN EVENT: ${member.user.tag} joined ${member.guild.name}`
  );

  // Ignore bots
  if (member.user.bot) {
    console.log("Joined member is a bot. Welcome skipped.");
    return;
  }

  try {
    const channel = await member.guild.channels.fetch(
      WELCOME_CHANNEL_ID
    );

    if (!channel) {
      console.log("❌ Welcome channel was not found.");
      return;
    }

    if (!channel.isTextBased()) {
      console.log("❌ Welcome channel is not a text channel.");
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

    console.log(
      `✅ Welcome message sent for ${member.user.tag}`
    );

  } catch (error) {
    console.error("❌ WELCOME ERROR:");
    console.error(error);
  }
});

// ==================================================
// AUTOMATIC GOODBYE
// ==================================================

client.on("guildMemberRemove", async (member) => {
  console.log(
    `LEAVE EVENT: ${member.user.tag} left ${member.guild.name}`
  );

  // Ignore bots
  if (member.user.bot) {
    console.log("Leaving member is a bot. Goodbye skipped.");
    return;
  }

  try {
    const channel = await member.guild.channels.fetch(
      GOODBYE_CHANNEL_ID
    );

    if (!channel) {
      console.log("❌ Goodbye channel was not found.");
      return;
    }

    if (!channel.isTextBased()) {
      console.log("❌ Goodbye channel is not a text channel.");
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

    console.log(
      `✅ Goodbye message sent for ${member.user.tag}`
    );

  } catch (error) {
    console.error("❌ GOODBYE ERROR:");
    console.error(error);
  }
});

// ==================================================
// COMMANDS
// ==================================================

client.on("messageCreate", async (message) => {

  // Ignore bots
  if (message.author.bot) return;

  // Ignore DMs
  if (!message.guild) return;

  console.log(
    `MESSAGE: ${message.author.tag} → "${message.content}"`
  );

  const command = message.content.trim().toLowerCase();

  // ==================================================
  // !testwelcome
  // ==================================================

  if (command === "!testwelcome") {

    console.log("🧪 TEST WELCOME COMMAND DETECTED");

    try {
      const channel = await message.guild.channels.fetch(
        WELCOME_CHANNEL_ID
      );

      if (!channel) {
        await message.reply(
          "❌ I couldn't find the welcome channel."
        );
        return;
      }

      if (!channel.isTextBased()) {
        await message.reply(
          "❌ The welcome channel is not a text channel."
        );
        return;
      }

      const embed = new EmbedBuilder()
        .setColor(0xffffff)
        .setDescription(
          `♡ welcome <@${message.author.id}> ♡\n\n` +
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

      await message.reply(
        "✅ Test welcome message sent!"
      );

      console.log("✅ Test welcome message sent!");

    } catch (error) {
      console.error("❌ TEST WELCOME ERROR:");
      console.error(error);

      await message.reply(
        "❌ I couldn't send the welcome message. Check the Render logs."
      ).catch(() => {});
    }
  }

  // ==================================================
  // !testgoodbye
  // ==================================================

  if (command === "!testgoodbye") {

    console.log("🧪 TEST GOODBYE COMMAND DETECTED");

    try {
      const channel = await message.guild.channels.fetch(
        GOODBYE_CHANNEL_ID
      );

      if (!channel) {
        console.log(
          `❌ Goodbye channel ${GOODBYE_CHANNEL_ID} was not found.`
        );

        await message.reply(
          "❌ I couldn't find the goodbye channel."
        );

        return;
      }

      if (!channel.isTextBased()) {
        console.log(
          "❌ Goodbye channel is not a text channel."
        );

        await message.reply(
          "❌ The goodbye channel is not a text channel."
        );

        return;
      }

      console.log(
        `GOODBYE CHANNEL FOUND: #${channel.name}`
      );

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

      await message.reply(
        "✅ Test goodbye message sent!"
      );

      console.log(
        "✅ Test goodbye message sent successfully!"
      );

    } catch (error) {
      console.error("❌ TEST GOODBYE ERROR:");
      console.error(error);

      await message.reply(
        "❌ I couldn't send the goodbye message. Check the Render logs."
      ).catch(() => {});
    }
  }
});

// ==================================================
// ERROR HANDLING
// ==================================================

client.on("error", (error) => {
  console.error("❌ Discord client error:");
  console.error(error);
});

process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled promise rejection:");
  console.error(error);
});

// ==================================================
// LOGIN
// ==================================================

if (!TOKEN) {
  console.error(
    "❌ DISCORD_BOT_TOKEN is missing from Render environment variables."
  );
} else {
  client.login(TOKEN).catch((error) => {
    console.error("❌ Failed to login:");
    console.error(error);
  });
}
