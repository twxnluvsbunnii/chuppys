const http = require("http");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField
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
  cashapp: {
    name: "cash app",
    username: "$yysluvv",
    url: "https://cash.app/$yysluvv"
  },

  paypal: {
    name: "paypal",
    username: "PayPal.me/twxnsrevenge",
    url: "https://paypal.me/twxnsrevenge"
  },

  applepay: {
    name: "apple pay",
    username: "929-554-5969"
  },

  zelle: {
    name: "zelle",
    username: "631-401-8951"
  }
};

// ==================================================
// READY
// ==================================================

client.once(Events.ClientReady, (bot) => {
  console.log("====================================");
  console.log("🤍 CHUPPYS BOT IS ONLINE");
  console.log(`🤖 Bot: ${bot.user.tag}`);
  console.log(`🆔 Bot ID: ${bot.user.id}`);
  console.log(`🏠 Servers: ${bot.guilds.cache.size}`);
  console.log("====================================");

  for (const guild of bot.guilds.cache.values()) {
    console.log(
      `🏠 Connected to: ${guild.name} (${guild.id})`
    );
  }
});

// ==================================================
// CONNECTION EVENTS
// ==================================================

client.on("shardConnecting", (id) => {
  console.log(`🔌 Shard ${id} connecting...`);
});

client.on("shardReady", (id) => {
  console.log(`✅ Shard ${id} ready.`);
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

// ==================================================
// WELCOME
// ==================================================

client.on(Events.GuildMemberAdd, async (member) => {
  console.log("====================================");
  console.log("👋 MEMBER JOIN DETECTED");
  console.log(`👤 User: ${member.user.tag}`);
  console.log(`🆔 ID: ${member.id}`);
  console.log(`🏠 Guild: ${member.guild.name}`);
  console.log("====================================");

  try {
    // ----------------------------------------------
    // FETCH WELCOME CHANNEL
    // ----------------------------------------------

    const channel = await member.guild.channels
      .fetch(WELCOME_CHANNEL_ID)
      .catch((error) => {
        console.error("❌ Could not fetch welcome channel:");
        console.error(error);
        return null;
      });

    if (!channel) {
      console.error(
        `❌ Welcome channel ${WELCOME_CHANNEL_ID} not found.`
      );
      return;
    }

    console.log(`✅ Welcome channel found: ${channel.name}`);

    // ----------------------------------------------
    // CHECK SEND PERMISSION
    // ----------------------------------------------

    const permissions = channel.permissionsFor(
      member.guild.members.me
    );

    if (
      !permissions?.has(
        PermissionsBitField.Flags.SendMessages
      )
    ) {
      console.error(
        "❌ Bot does not have Send Messages permission in welcome channel."
      );
      return;
    }

    console.log("✅ Bot can send messages.");

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
        console.log(
          `✅ Welcome role found: ${role.name}`
        );

        console.log(
          `📊 Role position: ${role.position}`
        );

        console.log(
          `📊 Bot highest role position: ${
            member.guild.members.me.roles.highest.position
          }`
        );

        if (
          role.position >=
          member.guild.members.me.roles.highest.position
        ) {
          console.error(
            "❌ Bot cannot give this role because the role is above the bot."
          );
        } else {
          await member.roles.add(role);

          console.log(
            `✅ Welcome role added to ${member.user.tag}`
          );
        }
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
          dynamic: true,
          size: 1024
        })
      )
      .setImage(WELCOME_IMAGE)
      .setFooter({
        text: ".gg/chuppys"
      })
      .setTimestamp();

    // ----------------------------------------------
    // SEND WELCOME
    // ----------------------------------------------

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
  console.log("====================================");
  console.log("👋 MEMBER LEAVE DETECTED");
  console.log(`👤 User: ${member.user.tag}`);
  console.log(`🆔 ID: ${member.id}`);
  console.log(`🏠 Guild: ${member.guild.name}`);
  console.log("====================================");

  try {
    // ----------------------------------------------
    // FETCH GOODBYE CHANNEL
    // ----------------------------------------------

    const channel = await member.guild.channels
      .fetch(GOODBYE_CHANNEL_ID)
      .catch((error) => {
        console.error("❌ Could not fetch goodbye channel:");
        console.error(error);
        return null;
      });

    if (!channel) {
      console.error(
        `❌ Goodbye channel ${GOODBYE_CHANNEL_ID} not found.`
      );
      return;
    }

    console.log(`✅ Goodbye channel found: ${channel.name}`);

    // ----------------------------------------------
    // CHECK SEND PERMISSION
    // ----------------------------------------------

    const permissions = channel.permissionsFor(
      member.guild.members.me
    );

    if (
      !permissions?.has(
        PermissionsBitField.Flags.SendMessages
      )
    ) {
      console.error(
        "❌ Bot does not have Send Messages permission in goodbye channel."
      );
      return;
    }

    console.log("✅ Bot can send goodbye messages.");

    // ----------------------------------------------
    // GOODBYE EMBED
    // ----------------------------------------------

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 goodbye")
      .setDescription(
        `${member.user} has left **.gg/chuppys**.\n\n` +
        `we'll miss you 🤍`
      )
      .setThumbnail(
        member.user.displayAvatarURL({
          dynamic: true,
          size: 1024
        })
      )
      .setFooter({
        text: ".gg/chuppys"
      })
      .setTimestamp();

    // ----------------------------------------------
    // SEND GOODBYE
    // ----------------------------------------------

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
  if (message.author.bot) return;
  if (!message.guild) return;

  console.log(
    `💬 MESSAGE RECEIVED: "${message.content}" from ${message.author.tag}`
  );

  const content = message.content.trim();

  // ==================================================
  // ,PAY
  //
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

    console.log(
      `💰 PAYMENT MENU FOR $${amount}`
    );

    // ----------------------------------------------
    // CASH APP DIRECT LINK
    // ----------------------------------------------

    const cashAppButton = new ButtonBuilder()
      .setLabel("﹕𐔌・cash app 〃・꒱")
      .setStyle(ButtonStyle.Link)
      .setURL(PAYMENT_INFO.cashapp.url);

    // ----------------------------------------------
    // PAYPAL DIRECT LINK
    // ----------------------------------------------

    const paypalButton = new ButtonBuilder()
      .setLabel("﹕𐔌・paypal 〃・꒱")
      .setStyle(ButtonStyle.Link)
      .setURL(PAYMENT_INFO.paypal.url);

    // ----------------------------------------------
    // APPLE PAY BUTTON
    // ----------------------------------------------

    const applePayButton = new ButtonBuilder()
      .setCustomId(`payment_applepay_${amount}`)
      .setLabel("﹕𐔌・apple pay 〃・꒱")
      .setStyle(ButtonStyle.Secondary);

    // ----------------------------------------------
    // ZELLE BUTTON
    // ----------------------------------------------

    const zelleButton = new ButtonBuilder()
      .setCustomId(`payment_zelle_${amount}`)
      .setLabel("﹕𐔌・zelle 〃・꒱")
      .setStyle(ButtonStyle.Secondary);

    const paymentRow =
      new ActionRowBuilder().addComponents(
        cashAppButton,
        paypalButton,
        applePayButton,
        zelleButton
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
      console.error(
        "❌ PAYMENT MENU ERROR:"
      );

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
  // !TESTWELCOME
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
            dynamic: true,
            size: 1024
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
  // !TESTGOODBYE
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
            dynamic: true,
            size: 1024
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

  // ==================================================
  // !TESTPAY
  // ==================================================

  if (content.toLowerCase() === "!testpay") {
    console.log("🧪 !testpay detected.");

    const amount = "25.00";

    const cashAppButton = new ButtonBuilder()
      .setLabel("﹕𐔌・cash app 〃・꒱")
      .setStyle(ButtonStyle.Link)
      .setURL(PAYMENT_INFO.cashapp.url);

    const paypalButton = new ButtonBuilder()
      .setLabel("﹕𐔌・paypal 〃・꒱")
      .setStyle(ButtonStyle.Link)
      .setURL(PAYMENT_INFO.paypal.url);

    const applePayButton = new ButtonBuilder()
      .setCustomId(`payment_applepay_${amount}`)
      .setLabel("﹕𐔌・apple pay 〃・꒱")
      .setStyle(ButtonStyle.Secondary);

    const zelleButton = new ButtonBuilder()
      .setCustomId(`payment_zelle_${amount}`)
      .setLabel("﹕𐔌・zelle 〃・꒱")
      .setStyle(ButtonStyle.Secondary);

    const paymentRow =
      new ActionRowBuilder().addComponents(
        cashAppButton,
        paypalButton,
        applePayButton,
        zelleButton
      );

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

      await message.reply(
        "✅ Test payment menu sent."
      );

      console.log(
        "✅ TEST PAYMENT MENU SENT"
      );

    } catch (error) {
      console.error(
        "❌ TEST PAYMENT ERROR:"
      );

      console.error(error);

      await message.reply(
        "❌ Could not send the test payment menu."
      );
    }

    return;
  }
});

// ==================================================
// BUTTON INTERACTIONS
// ==================================================

client.on(
  Events.InteractionCreate,
  async (interaction) => {

    // ----------------------------------------------
    // LOG EVERY INTERACTION
    // ----------------------------------------------

    console.log("====================================");
    console.log("🔘 INTERACTION RECEIVED");
    console.log(`Type: ${interaction.type}`);
    console.log(`User: ${interaction.user.tag}`);
    console.log(`Custom ID: ${interaction.customId || "NONE"}`);
    console.log("====================================");

    // Only buttons below
    if (!interaction.isButton()) return;

    const id = interaction.customId;

    // Link buttons never reach this handler.
    // Cash App and PayPal are direct links.

    if (!id.startsWith("payment_")) {
      console.log(
        `ℹ️ Non-payment button ignored: ${id}`
      );

      return;
    }

    let method = null;
    let information = null;
    let amount = null;

    // ----------------------------------------------
    // APPLE PAY
    // ----------------------------------------------

    if (id.startsWith("payment_applepay_")) {
      method = PAYMENT_INFO.applepay.name;
      information = PAYMENT_INFO.applepay.username;

      amount = id.replace(
        "payment_applepay_",
        ""
      );
    }

    // ----------------------------------------------
    // ZELLE
    // ----------------------------------------------

    else if (id.startsWith("payment_zelle_")) {
      method = PAYMENT_INFO.zelle.name;
      information = PAYMENT_INFO.zelle.username;

      amount = id.replace(
        "payment_zelle_",
        ""
      );
    }

    // ----------------------------------------------
    // INVALID
    // ----------------------------------------------

    if (!method || !information || !amount) {
      console.error(
        `❌ Invalid payment button: ${id}`
      );

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content:
            "❌ This payment button is invalid or expired.",
          ephemeral: true
        }).catch(() => {});
      }

      return;
    }

    console.log(
      `💳 PAYMENT BUTTON CLICKED: ${method}`
    );

    console.log(
      `💵 Amount: $${amount}`
    );

    // ----------------------------------------------
    // ACKNOWLEDGE IMMEDIATELY
    // ----------------------------------------------

    try {
      await interaction.deferReply({
        ephemeral: true
      });

      console.log(
        "✅ PAYMENT INTERACTION ACKNOWLEDGED"
      );

    } catch (error) {
      console.error(
        "❌ COULD NOT ACKNOWLEDGE INTERACTION:"
      );

      console.error(error);

      return;
    }

    // ----------------------------------------------
    // PAYMENT RESPONSE
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
      await interaction.editReply({
        embeds: [embed]
      });

      console.log(
        `✅ ${method} payment information sent privately.`
      );

    } catch (error) {
      console.error(
        "❌ PAYMENT RESPONSE ERROR:"
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
