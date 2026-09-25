const http = require("http");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events
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
// SETTINGS
// ==================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;

const WELCOME_CHANNEL_ID = "1530755165412524042";
const GOODBYE_CHANNEL_ID = "1530761366489530480";
const WELCOME_ROLE_ID = "1531039846871728248";

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

// ==================================================
// PAYMENT INFORMATION
// ==================================================

const PAYMENT_INFO = {
  cashapp: "$yysluvv",
  paypal: "PayPal.me/twxnsrevenge",
  applepay: "929-554-5969",
  zelle: "631-401-8951"
};

// ==================================================
// BOT READY
// ==================================================

client.once(Events.ClientReady, (bot) => {
  console.log("=================================");
  console.log(`BOT ONLINE: ${bot.user.tag}`);
  console.log(`BOT ID: ${bot.user.id}`);
  console.log("Guilds:", bot.guilds.cache.size);
  console.log("=================================");
});

// ==================================================
// WELCOME
// ==================================================

client.on(Events.GuildMemberAdd, async (member) => {
  console.log(
    `WELCOME EVENT RECEIVED: ${member.user.tag} joined ${member.guild.name}`
  );

  try {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);

    if (!channel) {
      console.log("WELCOME ERROR: Welcome channel was not found.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle("﹕𐔌・welcome 〃・꒱")
      .setDescription(
        `🤍 welcome ${member} to **.gg/chuppys**!\n\n` +
        `we're happy to have you here ♡`
      )
      .setImage(WELCOME_IMAGE)
      .setFooter({
        text: ".gg/chuppys"
      });

    await channel.send({
      content: `${member}`,
      embeds: [embed]
    });

    console.log("WELCOME MESSAGE SENT.");

    // Give welcome role
    try {
      const role = member.guild.roles.cache.get(WELCOME_ROLE_ID);

      if (!role) {
        console.log("WELCOME ROLE ERROR: Role not found.");
        return;
      }

      await member.roles.add(role);
      console.log("WELCOME ROLE GIVEN.");
    } catch (roleError) {
      console.error("WELCOME ROLE ERROR:", roleError);
    }

  } catch (error) {
    console.error("WELCOME MESSAGE ERROR:", error);
  }
});

// ==================================================
// GOODBYE
// ==================================================

client.on(Events.GuildMemberRemove, async (member) => {
  console.log(
    `GOODBYE EVENT RECEIVED: ${member.user.tag} left ${member.guild.name}`
  );

  try {
    const channel = member.guild.channels.cache.get(GOODBYE_CHANNEL_ID);

    if (!channel) {
      console.log("GOODBYE ERROR: Goodbye channel was not found.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle("﹕𐔌・goodbye 〃・꒱")
      .setDescription(
        `🤍 **${member.user.username}** has left **.gg/chuppys**.\n\n` +
        `we'll miss you ♡`
      )
      .setFooter({
        text: ".gg/chuppys"
      });

    await channel.send({
      embeds: [embed]
    });

    console.log("GOODBYE MESSAGE SENT.");

  } catch (error) {
    console.error("GOODBYE MESSAGE ERROR:", error);
  }
});

// ==================================================
// MESSAGE COMMANDS
// ==================================================

client.on(Events.MessageCreate, async (message) => {
  console.log(
    `MESSAGE EVENT: ${message.author.tag} → ${message.content}`
  );

  if (message.author.bot) return;

  const args = message.content.trim().split(/\s+/);
  const command = args[0].toLowerCase();

  // ==================================================
  // ,PAY
  // ==================================================

  if (command === ",pay") {
    const amount = args[1];

    if (!amount) {
      await message.reply(
        "🤍 Please use `,pay <amount>`\nExample: `,pay 25`"
      );
      return;
    }

    const validAmount = /^\$?\d+(?:\.\d{1,2})?$/.test(amount);

    if (!validAmount) {
      await message.reply(
        "🤍 Please enter a valid amount.\nExample: `,pay 25`"
      );
      return;
    }

    const cleanAmount = amount.replace("$", "");

    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle("﹕𐔌・payment 〃・꒱")
      .setDescription(
        `🤍 **amount:** $${cleanAmount}\n\n` +
        `please select your payment method below ♡`
      )
      .setFooter({
        text: ".gg/chuppys"
      });

    const row = new ActionRowBuilder().addComponents(

      new ButtonBuilder()
        .setCustomId(`payment_cashapp_${cleanAmount}`)
        .setLabel("﹕𐔌・cash app 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_paypal_${cleanAmount}`)
        .setLabel("﹕𐔌・paypal 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_applepay_${cleanAmount}`)
        .setLabel("﹕𐔌・apple pay 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_zelle_${cleanAmount}`)
        .setLabel("﹕𐔌・zelle 〃・꒱")
        .setStyle(ButtonStyle.Secondary)
    );

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });

    console.log(`PAYMENT MENU SENT FOR $${cleanAmount}`);
    return;
  }

  // ==================================================
  // TEST WELCOME
  // ==================================================

  if (command === "!testwelcome") {
    console.log("TEST WELCOME COMMAND RECEIVED.");

    const channel = message.guild.channels.cache.get(
      WELCOME_CHANNEL_ID
    );

    if (!channel) {
      await message.reply("❌ Welcome channel not found.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle("﹕𐔌・welcome 〃・꒱")
      .setDescription(
        `🤍 welcome ${message.author} to **.gg/chuppys**!\n\n` +
        `we're happy to have you here ♡`
      )
      .setImage(WELCOME_IMAGE)
      .setFooter({
        text: ".gg/chuppys"
      });

    await channel.send({
      content: `${message.author}`,
      embeds: [embed]
    });

    await message.reply("🤍 Test welcome sent!");
    return;
  }

  // ==================================================
  // TEST GOODBYE
  // ==================================================

  if (command === "!testgoodbye") {
    console.log("TEST GOODBYE COMMAND RECEIVED.");

    const channel = message.guild.channels.cache.get(
      GOODBYE_CHANNEL_ID
    );

    if (!channel) {
      await message.reply("❌ Goodbye channel not found.");
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle("﹕𐔌・goodbye 〃・꒱")
      .setDescription(
        `🤍 **${message.author.username}** has left **.gg/chuppys**.\n\n` +
        `we'll miss you ♡`
      )
      .setFooter({
        text: ".gg/chuppys"
      });

    await channel.send({
      embeds: [embed]
    });

    await message.reply("🤍 Test goodbye sent!");
    return;
  }
});

// ==================================================
// PAYMENT BUTTONS
// ==================================================

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isButton()) return;

  if (!interaction.customId.startsWith("payment_")) return;

  try {
    const parts = interaction.customId.split("_");

    const method = parts[1];
    const amount = parts.slice(2).join("_");

    let paymentName;
    let paymentValue;

    if (method === "cashapp") {
      paymentName = "cash app";
      paymentValue = PAYMENT_INFO.cashapp;
    }

    if (method === "paypal") {
      paymentName = "paypal";
      paymentValue = PAYMENT_INFO.paypal;
    }

    if (method === "applepay") {
      paymentName = "apple pay";
      paymentValue = PAYMENT_INFO.applepay;
    }

    if (method === "zelle") {
      paymentName = "zelle";
      paymentValue = PAYMENT_INFO.zelle;
    }

    if (!paymentValue) {
      await interaction.reply({
        content: "❌ Payment information could not be found.",
        ephemeral: true
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xffffff)
      .setTitle(`﹕𐔌・${paymentName} 〃・꒱`)
      .setDescription(
        `🤍 **amount:** $${amount}\n\n` +
        `**send to:**\n` +
        `\`${paymentValue}\`\n\n` +
        `please make sure the information is correct before sending ♡`
      )
      .setFooter({
        text: ".gg/chuppys"
      });

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

  } catch (error) {
    console.error("PAYMENT BUTTON ERROR:", error);
  }
});

// ==================================================
// ERRORS
// ==================================================

client.on("error", (error) => {
  console.error("DISCORD CLIENT ERROR:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("UNHANDLED REJECTION:", error);
});

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION:", error);
});

// ==================================================
// LOGIN
// ==================================================

if (!TOKEN) {
  console.error("❌ DISCORD_BOT_TOKEN is missing from Render.");
  process.exit(1);
}

client.login(TOKEN);
