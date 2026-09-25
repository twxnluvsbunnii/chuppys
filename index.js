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

http
  .createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/plain"
    });

    res.end("Chuppys bot is running!");
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Web server running on port ${PORT}`);
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
// CONFIG
// ==================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN?.trim();

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
  console.log("====================================");
  console.log("🤍 CHUPPYS BOT IS ONLINE");
  console.log(`🤖 Bot: ${bot.user.tag}`);
  console.log(`🆔 Bot ID: ${bot.user.id}`);
  console.log(`🏠 Servers: ${bot.guilds.cache.size}`);
  console.log("====================================");
});

// ==================================================
// SHARD / CONNECTION EVENTS
// ==================================================

client.on("shardConnecting", (id) => {
  console.log(`🔌 Shard ${id} connecting to Discord...`);
});

client.on("shardReady", (id) => {
  console.log(`✅ Shard ${id} connected and ready.`);
});

client.on("shardReconnecting", (id) => {
  console.log(`🔄 Shard ${id} reconnecting...`);
});

client.on("shardError", (error, id) => {
  console.error(`❌ Shard ${id} error:`);
  console.error(error);
});

client.on("warn", (warning) => {
  console.warn(`⚠️ Discord warning: ${warning}`);
});

// IMPORTANT:
// We intentionally DO NOT use client.on("debug")
// because Discord.js debug logs can expose sensitive
// authentication information.

// ==================================================
// WELCOME
// ==================================================

client.on(Events.GuildMemberAdd, async (member) => {
  console.log(
    `👋 MEMBER JOIN DETECTED: ${member.user.tag} (${member.id})`
  );

  try {
    const channel = await member.guild.channels
      .fetch(WELCOME_CHANNEL_ID)
      .catch(() => null);

    if (!channel) {
      console.error(
        `❌ Welcome channel ${WELCOME_CHANNEL_ID} not found.`
      );
      return;
    }

    // ----------------------------------------------
    // ADD WELCOME ROLE
    // ----------------------------------------------

    try {
      const role = await member.guild.roles
        .fetch(WELCOME_ROLE_ID)
        .catch(() => null);

      if (!role) {
        console.error(
          `❌ Welcome role ${WELCOME_ROLE_ID} not found.`
        );
      } else {
        await member.roles.add(role);

        console.log(
          `✅ Welcome role added to ${member.user.tag}`
        );
      }
    } catch (error) {
      console.error("❌ Could not add welcome role:");
      console.error(error);
    }

    // ----------------------------------------------
    // WELCOME EMBED
    // ----------------------------------------------

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 welcome to .gg/chuppys")
      .setDescription(
        `welcome ${member}!\n\n` +
        `we hope you enjoy your stay here 🤍`
      )
      .setThumbnail(
        member.user.displayAvatarURL({
          dynamic: true
        })
      )
      .setImage(WELCOME_IMAGE)
      .setFooter({
        text: ".gg/chuppys"
      })
      .setTimestamp();

    await channel.send({
      content: `<@&${WELCOME_ROLE_ID}> ${member}`,
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
// GOODBYE
// ==================================================

client.on(Events.GuildMemberRemove, async (member) => {
  console.log(
    `👋 MEMBER LEAVE DETECTED: ${member.user.tag} (${member.id})`
  );

  try {
    const channel = await member.guild.channels
      .fetch(GOODBYE_CHANNEL_ID)
      .catch(() => null);

    if (!channel) {
      console.error(
        `❌ Goodbye channel ${GOODBYE_CHANNEL_ID} not found.`
      );
      return;
    }

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 goodbye")
      .setDescription(
        `${member.user} has left **.gg/chuppys**.\n\n` +
        `we'll miss you 🤍`
      )
      .setThumbnail(
        member.user.displayAvatarURL({
          dynamic: true
        })
      )
      .setFooter({
        text: ".gg/chuppys"
      })
      .setTimestamp();

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
// MESSAGE COMMANDS
// ==================================================

client.on(Events.MessageCreate, async (message) => {
  console.log(
    `💬 MESSAGE RECEIVED: "${message.content}" from ${message.author.tag}`
  );

  if (message.author.bot) return;

  if (!message.guild) return;

  const content = message.content.trim();

  // ==================================================
  // ,PAY
  // Example:
  // ,pay 25
  // ==================================================

  const payMatch = content.match(
    /^,pay(?:\s+\$?(\d+(?:\.\d{1,2})?))?\s*$/i
  );

  if (payMatch) {
    console.log("💰 ,PAY COMMAND DETECTED");

    const rawAmount = payMatch[1];

    if (!rawAmount) {
      await message.reply(
        "❌ Please enter an amount.\n\nExample: `,pay 25`"
      );

      return;
    }

    const amountNumber = Number(rawAmount);

    if (
      !Number.isFinite(amountNumber) ||
      amountNumber <= 0
    ) {
      await message.reply(
        "❌ Invalid amount.\n\nExample: `,pay 25`"
      );

      return;
    }

    const amount = amountNumber.toFixed(2);

    console.log(`💰 PAYMENT AMOUNT: $${amount}`);

    // ----------------------------------------------
    // PAYMENT BUTTONS
    // ----------------------------------------------

    const paymentRow =
      new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId(`payment_cashapp_${amount}`)
          .setLabel("﹕𐔌・cash app 〃・꒱")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`payment_paypal_${amount}`)
          .setLabel("﹕𐔌・paypal 〃・꒱")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`payment_applepay_${amount}`)
          .setLabel("﹕𐔌・apple pay 〃・꒱")
          .setStyle(ButtonStyle.Secondary),

        new ButtonBuilder()
          .setCustomId(`payment_zelle_${amount}`)
          .setLabel("﹕𐔌・zelle 〃・꒱")
          .setStyle(ButtonStyle.Secondary)
      );

    // ----------------------------------------------
    // PAYMENT EMBED
    // ----------------------------------------------

    const paymentEmbed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 payment methods")
      .setDescription(
        `**amount:** $${amount}\n\n` +
        `select your preferred payment method below.`
      )
      .setFooter({
        text: ".gg/chuppys"
      })
      .setTimestamp();

    try {
      await message.channel.send({
        embeds: [paymentEmbed],
        components: [paymentRow]
      });

      console.log(
        `✅ PAYMENT MENU SENT FOR $${amount}`
      );
    } catch (error) {
      console.error("❌ PAYMENT MENU ERROR:");
      console.error(error);

      try {
        await message.reply(
          "❌ I couldn't send the payment menu."
        );
      } catch {}
    }

    return;
  }

  // ==================================================
  // TEST WELCOME
  // ==================================================

  if (content.toLowerCase() === "!testwelcome") {
    console.log("🧪 !testwelcome detected.");

    try {
      const channel = await message.guild.channels
        .fetch(WELCOME_CHANNEL_ID)
        .catch(() => null);

      if (!channel) {
        await message.reply(
          "❌ I couldn't find the welcome channel."
        );

        return;
      }

      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle("🤍 welcome to .gg/chuppys")
        .setDescription(
          `welcome ${message.author}!\n\n` +
          `we hope you enjoy your stay here 🤍`
        )
        .setThumbnail(
          message.author.displayAvatarURL({
            dynamic: true
          })
        )
        .setImage(WELCOME_IMAGE)
        .setFooter({
          text: ".gg/chuppys"
        })
        .setTimestamp();

      await channel.send({
        content:
          `<@&${WELCOME_ROLE_ID}> ${message.author}`,
        embeds: [embed]
      });

      await message.reply(
        "✅ Test welcome message sent."
      );
    } catch (error) {
      console.error("❌ TEST WELCOME ERROR:");
      console.error(error);

      await message.reply(
        "❌ Something went wrong sending the test welcome."
      );
    }

    return;
  }

  // ==================================================
  // TEST GOODBYE
  // ==================================================

  if (content.toLowerCase() === "!testgoodbye") {
    console.log("🧪 !testgoodbye detected.");

    try {
      const channel = await message.guild.channels
        .fetch(GOODBYE_CHANNEL_ID)
        .catch(() => null);

      if (!channel) {
        await message.reply(
          "❌ I couldn't find the goodbye channel."
        );

        return;
      }

      const embed = new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle("🤍 goodbye")
        .setDescription(
          `${message.author} has left **.gg/chuppys**.\n\n` +
          `we'll miss you 🤍`
        )
        .setThumbnail(
          message.author.displayAvatarURL({
            dynamic: true
          })
        )
        .setFooter({
          text: ".gg/chuppys"
        })
        .setTimestamp();

      await channel.send({
        embeds: [embed]
      });

      await message.reply(
        "✅ Test goodbye message sent."
      );
    } catch (error) {
      console.error("❌ TEST GOODBYE ERROR:");
      console.error(error);

      await message.reply(
        "❌ Something went wrong sending the test goodbye."
      );
    }

    return;
  }
});

// ==================================================
// PAYMENT BUTTON INTERACTIONS
// ==================================================

client.on(
  Events.InteractionCreate,
  async (interaction) => {
    if (!interaction.isButton()) return;

    const id = interaction.customId;

    console.log(
      `🔘 PAYMENT BUTTON: ${id}`
    );

    let method = null;
    let information = null;
    let amount = null;

    // ----------------------------------------------
    // CASH APP
    // ----------------------------------------------

    if (id.startsWith("payment_cashapp_")) {
      method = "cash app";
      information = PAYMENT_INFO.cashapp;
      amount = id.replace(
        "payment_cashapp_",
        ""
      );
    }

    // ----------------------------------------------
    // PAYPAL
    // ----------------------------------------------

    else if (id.startsWith("payment_paypal_")) {
      method = "paypal";
      information = PAYMENT_INFO.paypal;
      amount = id.replace(
        "payment_paypal_",
        ""
      );
    }

    // ----------------------------------------------
    // APPLE PAY
    // ----------------------------------------------

    else if (id.startsWith("payment_applepay_")) {
      method = "apple pay";
      information = PAYMENT_INFO.applepay;
      amount = id.replace(
        "payment_applepay_",
        ""
      );
    }

    // ----------------------------------------------
    // ZELLE
    // ----------------------------------------------

    else if (id.startsWith("payment_zelle_")) {
      method = "zelle";
      information = PAYMENT_INFO.zelle;
      amount = id.replace(
        "payment_zelle_",
        ""
      );
    }

    if (!method || !information || !amount) {
      console.error(
        "❌ Unknown payment button:"
      );

      console.error(id);

      return;
    }

    // ----------------------------------------------
    // PRIVATE PAYMENT RESPONSE
    // ----------------------------------------------

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle(`🤍 ${method}`)
      .setDescription(
        `**amount:** $${amount}\n\n` +
        `**${method}:** ${information}\n\n` +
        `send **$${amount}** using the information above.`
      )
      .setFooter({
        text: ".gg/chuppys"
      })
      .setTimestamp();

    try {
      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

      console.log(
        `✅ ${method} payment information sent privately.`
      );
    } catch (error) {
      console.error(
        "❌ PAYMENT BUTTON ERROR:"
      );

      console.error(error);
    }
  }
);

// ==================================================
// PROCESS ERRORS
// ==================================================

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "❌ UNHANDLED REJECTION:"
    );

    console.error(error);
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "❌ UNCAUGHT EXCEPTION:"
    );

    console.error(error);
  }
);

// ==================================================
// TOKEN CHECK
// ==================================================

if (!TOKEN) {
  console.error("====================================");
  console.error("❌ DISCORD_BOT_TOKEN IS MISSING");
  console.error(
    "Add DISCORD_BOT_TOKEN to Render Environment Variables."
  );
  console.error("====================================");

  process.exit(1);
}

console.log("====================================");
console.log("🔐 DISCORD TOKEN FOUND");
console.log(`TOKEN LENGTH: ${TOKEN.length}`);
console.log("====================================");

// ==================================================
// CONNECT TO DISCORD
// ==================================================

console.log("🔌 Connecting to Discord...");

client
  .login(TOKEN)
  .then(() => {
    console.log(
      "✅ Discord login request completed."
    );
  })
  .catch((error) => {
    console.error("====================================");
    console.error("❌ DISCORD LOGIN FAILED");
    console.error(error);
    console.error("====================================");
  });
