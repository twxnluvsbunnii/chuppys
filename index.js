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
  cashapp: "$yysluvv",
  paypal: "PayPal.me/twxnsrevenge",
  applepay: "929-554-5969",
  zelle: "631-401-8951"
};

// ==================================================
// HELPER: GET CHANNEL
// ==================================================

async function getTextChannel(guild, channelId, name) {
  try {
    const channel = await guild.channels.fetch(channelId);

    if (!channel) {
      console.error(`❌ ${name}: channel does not exist.`);
      return null;
    }

    if (!channel.isTextBased()) {
      console.error(`❌ ${name}: channel is not text based.`);
      return null;
    }

    return channel;
  } catch (error) {
    console.error(`❌ ${name}: could not fetch channel ${channelId}`);
    console.error(error);
    return null;
  }
}

// ==================================================
// BOT READY
// ==================================================

client.once(Events.ClientReady, async (bot) => {
  console.log("====================================");
  console.log("🤍 CHUPPYS BOT IS ONLINE");
  console.log(`🤖 Bot: ${bot.user.tag}`);
  console.log(`🆔 Bot ID: ${bot.user.id}`);
  console.log(`🏠 Servers: ${bot.guilds.cache.size}`);
  console.log("====================================");

  // ----------------------------------------------
  // CHECK EVERY SERVER
  // ----------------------------------------------

  for (const guild of bot.guilds.cache.values()) {
    console.log(`🔎 Checking server: ${guild.name}`);

    try {
      const me = await guild.members.fetch(bot.user.id);

      console.log(
        `👤 Bot member found in ${guild.name}`
      );

      console.log(
        `🔐 Administrator: ${
          me.permissions.has(PermissionsBitField.Flags.Administrator)
        }`
      );

      // Welcome channel
      const welcomeChannel = await getTextChannel(
        guild,
        WELCOME_CHANNEL_ID,
        "WELCOME"
      );

      if (welcomeChannel) {
        console.log(
          `✅ Welcome channel found: #${welcomeChannel.name}`
        );

        console.log(
          `✉️ Can send messages: ${
            welcomeChannel
              .permissionsFor(me)
              ?.has(PermissionsBitField.Flags.SendMessages)
          }`
        );

        console.log(
          `📎 Can embed links: ${
            welcomeChannel
              .permissionsFor(me)
              ?.has(PermissionsBitField.Flags.EmbedLinks)
          }`
        );
      }

      // Goodbye channel
      const goodbyeChannel = await getTextChannel(
        guild,
        GOODBYE_CHANNEL_ID,
        "GOODBYE"
      );

      if (goodbyeChannel) {
        console.log(
          `✅ Goodbye channel found: #${goodbyeChannel.name}`
        );

        console.log(
          `✉️ Can send messages: ${
            goodbyeChannel
              .permissionsFor(me)
              ?.has(PermissionsBitField.Flags.SendMessages)
          }`
        );

        console.log(
          `📎 Can embed links: ${
            goodbyeChannel
              .permissionsFor(me)
              ?.has(PermissionsBitField.Flags.EmbedLinks)
          }`
        );
      }

      // Welcome role
      try {
        const role = await guild.roles.fetch(WELCOME_ROLE_ID);

        if (!role) {
          console.error(
            `❌ Welcome role ${WELCOME_ROLE_ID} does not exist.`
          );
        } else {
          console.log(
            `✅ Welcome role found: ${role.name}`
          );

          console.log(
            `📊 Role position: ${role.position}`
          );

          console.log(
            `📊 Bot highest role position: ${me.roles.highest.position}`
          );

          if (role.position >= me.roles.highest.position) {
            console.error(
              "❌ IMPORTANT: Welcome role is ABOVE or equal to the bot's highest role."
            );
            console.error(
              "Move the bot role ABOVE the Welcome role."
            );
          }
        }
      } catch (error) {
        console.error("❌ Could not check welcome role:");
        console.error(error);
      }
    } catch (error) {
      console.error(
        `❌ Could not check server ${guild.name}`
      );

      console.error(error);
    }
  }

  console.log("====================================");
  console.log("🧪 BOT STARTUP CHECK COMPLETE");
  console.log("====================================");
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
  console.log("👋 GUILD MEMBER ADD EVENT RECEIVED");
  console.log(`👤 User: ${member.user.tag}`);
  console.log(`🆔 User ID: ${member.id}`);
  console.log(`🏠 Server: ${member.guild.name}`);
  console.log("====================================");

  try {
    const channel = await getTextChannel(
      member.guild,
      WELCOME_CHANNEL_ID,
      "WELCOME"
    );

    if (!channel) return;

    // ----------------------------------------------
    // ADD ROLE
    // ----------------------------------------------

    try {
      const role = await member.guild.roles.fetch(
        WELCOME_ROLE_ID
      );

      if (!role) {
        console.error(
          `❌ Welcome role ${WELCOME_ROLE_ID} not found.`
        );
      } else {
        const botMember =
          await member.guild.members.fetch(client.user.id);

        if (role.position >= botMember.roles.highest.position) {
          console.error(
            "❌ Cannot give welcome role because the role is above the bot."
          );
        } else {
          await member.roles.add(
            role,
            "Automatic Chuppys welcome role"
          );

          console.log(
            `✅ Welcome role added to ${member.user.tag}`
          );
        }
      }
    } catch (error) {
      console.error("❌ WELCOME ROLE ERROR:");
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
          size: 256
        })
      )
      .setImage(WELCOME_IMAGE)
      .setFooter({
        text: ".gg/chuppys"
      })
      .setTimestamp();

    await channel.send({
      content: `<@&${WELCOME_ROLE_ID}> ${member}`,
      embeds: [embed],
      allowedMentions: {
        users: [member.id],
        roles: [WELCOME_ROLE_ID]
      }
    });

    console.log(
      `✅ WELCOME MESSAGE SENT FOR ${member.user.tag}`
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
  console.log("👋 GUILD MEMBER REMOVE EVENT RECEIVED");
  console.log(`👤 User: ${member.user.tag}`);
  console.log(`🆔 User ID: ${member.id}`);
  console.log(`🏠 Server: ${member.guild.name}`);
  console.log("====================================");

  try {
    const channel = await getTextChannel(
      member.guild,
      GOODBYE_CHANNEL_ID,
      "GOODBYE"
    );

    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("🤍 goodbye")
      .setDescription(
        `${member.user} has left **.gg/chuppys**.\n\n` +
        `we'll miss you 🤍`
      )
      .setThumbnail(
        member.user.displayAvatarURL({
          size: 256
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
      `✅ GOODBYE MESSAGE SENT FOR ${member.user.tag}`
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
    `💬 MESSAGE: ${message.content} | ${message.author.tag}`
  );

  const content = message.content.trim();

  // ==================================================
  // ,PAY
  // ==================================================

  const payMatch = content.match(
    /^,pay(?:\s+\$?(\d+(?:\.\d{1,2})?))?\s*$/i
  );

  if (payMatch) {
    console.log("💰 ,PAY DETECTED");

    const rawAmount = payMatch[1];

    if (!rawAmount) {
      await message.reply(
        "❌ Please enter an amount.\n\nExample: `,pay 25`"
      );
      return;
    }

    const amountNumber = Number(rawAmount);

    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      await message.reply(
        "❌ Invalid amount.\n\nExample: `,pay 25`"
      );
      return;
    }

    const amount = amountNumber.toFixed(2);

    console.log(`💰 Creating payment menu for $${amount}`);

    const paymentRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`payment_cashapp|${amount}`)
        .setLabel("﹕𐔌・cash app 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_paypal|${amount}`)
        .setLabel("﹕𐔌・paypal 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_applepay|${amount}`)
        .setLabel("﹕𐔌・apple pay 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_zelle|${amount}`)
        .setLabel("﹕𐔌・zelle 〃・꒱")
        .setStyle(ButtonStyle.Secondary)
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

      console.log(
        `✅ PAYMENT MENU SENT FOR $${amount}`
      );
    } catch (error) {
      console.error("❌ PAYMENT MENU SEND ERROR:");
      console.error(error);

      await message.reply(
        "❌ I couldn't send the payment menu. Check the bot's permissions in this channel."
      );
    }

    return;
  }

  // ==================================================
  // TEST WELCOME
  // ==================================================

  if (content.toLowerCase() === "!testwelcome") {
    console.log("🧪 TEST WELCOME");

    try {
      const channel = await getTextChannel(
        message.guild,
        WELCOME_CHANNEL_ID,
        "WELCOME"
      );

      if (!channel) {
        await message.reply(
          "❌ Welcome channel could not be found."
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
            size: 256
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
        embeds: [embed],
        allowedMentions: {
          users: [message.author.id],
          roles: [WELCOME_ROLE_ID]
        }
      });

      await message.reply(
        "✅ Test welcome message sent."
      );
    } catch (error) {
      console.error("❌ TEST WELCOME ERROR:");
      console.error(error);

      await message.reply(
        "❌ Test welcome failed. Check the Render logs."
      );
    }

    return;
  }

  // ==================================================
  // TEST GOODBYE
  // ==================================================

  if (content.toLowerCase() === "!testgoodbye") {
    console.log("🧪 TEST GOODBYE");

    try {
      const channel = await getTextChannel(
        message.guild,
        GOODBYE_CHANNEL_ID,
        "GOODBYE"
      );

      if (!channel) {
        await message.reply(
          "❌ Goodbye channel could not be found."
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
            size: 256
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
        "❌ Test goodbye failed. Check the Render logs."
      );
    }

    return;
  }

  // ==================================================
  // TEST PAYMENT
  // ==================================================

  if (content.toLowerCase() === "!testpay") {
    console.log("🧪 TEST PAYMENT");

    const amount = "25.00";

    const paymentRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`payment_cashapp|${amount}`)
        .setLabel("﹕𐔌・cash app 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_paypal|${amount}`)
        .setLabel("﹕𐔌・paypal 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_applepay|${amount}`)
        .setLabel("﹕𐔌・apple pay 〃・꒱")
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`payment_zelle|${amount}`)
        .setLabel("﹕𐔌・zelle 〃・꒱")
        .setStyle(ButtonStyle.Secondary)
    );

    const embed = new EmbedBuilder()
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
        embeds: [embed],
        components: [paymentRow]
      });

      await message.reply(
        "✅ Test payment menu sent."
      );
    } catch (error) {
      console.error("❌ TEST PAYMENT ERROR:");
      console.error(error);

      await message.reply(
        "❌ Test payment failed."
      );
    }

    return;
  }
});

// ==================================================
// PAYMENT BUTTONS
// ==================================================

client.on(Events.InteractionCreate, async (interaction) => {
  console.log("====================================");
  console.log("🔘 INTERACTION RECEIVED");
  console.log(`Type: ${interaction.type}`);
  console.log(`Custom ID: ${interaction.customId || "NONE"}`);
  console.log(`User: ${interaction.user?.tag || "UNKNOWN"}`);
  console.log("====================================");

  if (!interaction.isButton()) {
    return;
  }

  const id = interaction.customId;

  if (!id.startsWith("payment_")) {
    return;
  }

  try {
    const parts = id.split("|");

    if (parts.length !== 2) {
      console.error(
        `❌ Invalid payment button ID: ${id}`
      );

      await interaction.reply({
        content: "❌ This payment button is invalid.",
        ephemeral: true
      });

      return;
    }

    const paymentType = parts[0];
    const amount = parts[1];

    let method;
    let information;

    switch (paymentType) {
      case "payment_cashapp":
        method = "cash app";
        information = PAYMENT_INFO.cashapp;
        break;

      case "payment_paypal":
        method = "paypal";
        information = PAYMENT_INFO.paypal;
        break;

      case "payment_applepay":
        method = "apple pay";
        information = PAYMENT_INFO.applepay;
        break;

      case "payment_zelle":
        method = "zelle";
        information = PAYMENT_INFO.zelle;
        break;

      default:
        console.error(
          `❌ Unknown payment type: ${paymentType}`
        );

        await interaction.reply({
          content: "❌ Unknown payment method.",
          ephemeral: true
        });

        return;
    }

    console.log(
      `💳 ${method.toUpperCase()} BUTTON CLICKED`
    );

    console.log(
      `💵 Amount: $${amount}`
    );

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

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

    console.log(
      `✅ PRIVATE PAYMENT RESPONSE SENT TO ${interaction.user.tag}`
    );
  } catch (error) {
    console.error("❌ PAYMENT INTERACTION ERROR:");
    console.error(error);

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content:
            "❌ Something went wrong with this payment button.",
          ephemeral: true
        });
      } else {
        await interaction.reply({
          content:
            "❌ Something went wrong with this payment button.",
          ephemeral: true
        });
      }
    } catch (replyError) {
      console.error(
        "❌ Could not send payment error response:"
      );

      console.error(replyError);
    }
  }
});

// ==================================================
// PROCESS ERRORS
// ==================================================

process.on("unhandledRejection", (error) => {
  console.error("❌ UNHANDLED REJECTION:");
  console.error(error);
});

process.on("uncaughtException", (error) => {
  console.error("❌ UNCAUGHT EXCEPTION:");
  console.error(error);
});

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
// LOGIN
// ==================================================

console.log("🔌 Connecting to Discord...");

client
  .login(TOKEN)
  .then(() => {
    console.log("✅ Discord login request completed.");
  })
  .catch((error) => {
    console.error("====================================");
    console.error("❌ DISCORD LOGIN FAILED");
    console.error(error);
    console.error("====================================");
  });
