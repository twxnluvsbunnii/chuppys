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
// HELPER - FETCH TEXT CHANNEL
// ==================================================

async function getTextChannel(guild, channelId, channelName) {
  try {
    const channel = await guild.channels.fetch(channelId);

    if (!channel) {
      console.error(
        `❌ ${channelName}: Channel ${channelId} does not exist.`
      );

      return null;
    }

    if (!channel.isTextBased()) {
      console.error(
        `❌ ${channelName}: Channel is not a text channel.`
      );

      return null;
    }

    return channel;
  } catch (error) {
    console.error(
      `❌ ${channelName}: Could not fetch channel ${channelId}`
    );

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
  // CHECK SERVERS
  // ----------------------------------------------

  for (const guild of bot.guilds.cache.values()) {
    console.log(`🔎 Checking server: ${guild.name}`);

    try {
      const botMember = await guild.members.fetch(bot.user.id);

      console.log(
        `👤 Bot member found in ${guild.name}`
      );

      console.log(
        `🔐 Administrator: ${
          botMember.permissions.has(
            PermissionsBitField.Flags.Administrator
          )
        }`
      );

      // ----------------------------------------------
      // WELCOME CHANNEL
      // ----------------------------------------------

      const welcomeChannel = await getTextChannel(
        guild,
        WELCOME_CHANNEL_ID,
        "WELCOME"
      );

      if (welcomeChannel) {
        console.log(
          `✅ Welcome channel found: #${welcomeChannel.name}`
        );

        const permissions =
          welcomeChannel.permissionsFor(botMember);

        console.log(
          `✉️ Can send messages: ${
            permissions?.has(
              PermissionsBitField.Flags.SendMessages
            )
          }`
        );

        console.log(
          `📎 Can embed links: ${
            permissions?.has(
              PermissionsBitField.Flags.EmbedLinks
            )
          }`
        );
      }

      // ----------------------------------------------
      // GOODBYE CHANNEL
      // ----------------------------------------------

      const goodbyeChannel = await getTextChannel(
        guild,
        GOODBYE_CHANNEL_ID,
        "GOODBYE"
      );

      if (goodbyeChannel) {
        console.log(
          `✅ Goodbye channel found: #${goodbyeChannel.name}`
        );

        const permissions =
          goodbyeChannel.permissionsFor(botMember);

        console.log(
          `✉️ Can send messages: ${
            permissions?.has(
              PermissionsBitField.Flags.SendMessages
            )
          }`
        );

        console.log(
          `📎 Can embed links: ${
            permissions?.has(
              PermissionsBitField.Flags.EmbedLinks
            )
          }`
        );
      }

      // ----------------------------------------------
      // WELCOME ROLE
      // ----------------------------------------------

      try {
        const role = await guild.roles.fetch(
          WELCOME_ROLE_ID
        );

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
            `📊 Bot highest role position: ${botMember.roles.highest.position}`
          );

          if (
            role.position >=
            botMember.roles.highest.position
          ) {
            console.error(
              "❌ WARNING: Welcome role is above the bot."
            );
          } else {
            console.log(
              "✅ Bot is above the welcome role."
            );
          }
        }
      } catch (error) {
        console.error(
          "❌ Could not check welcome role:"
        );

        console.error(error);
      }
    } catch (error) {
      console.error(
        `❌ Server check failed for ${guild.name}`
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
  console.log(
    `🔌 Shard ${id} connecting to Discord...`
  );
});

client.on("shardReady", (id) => {
  console.log(
    `✅ Shard ${id} connected and ready.`
  );
});

client.on("shardReconnecting", (id) => {
  console.log(
    `🔄 Shard ${id} reconnecting...`
  );
});

client.on("shardError", (error, id) => {
  console.error(
    `❌ Shard ${id} error:`
  );

  console.error(error);
});

client.on("warn", (warning) => {
  console.warn(
    `⚠️ Discord warning: ${warning}`
  );
});

// ==================================================
// WELCOME MESSAGE
// ==================================================

client.on(Events.GuildMemberAdd, async (member) => {
  console.log("====================================");
  console.log("👋 MEMBER JOIN DETECTED");
  console.log(`👤 User: ${member.user.tag}`);
  console.log(`🆔 ID: ${member.id}`);
  console.log(`🏠 Server: ${member.guild.name}`);
  console.log("====================================");

  try {
    const channel = await getTextChannel(
      member.guild,
      WELCOME_CHANNEL_ID,
      "WELCOME"
    );

    if (!channel) {
      return;
    }

    // ----------------------------------------------
    // ADD WELCOME ROLE
    // ----------------------------------------------

    try {
      const role = await member.guild.roles.fetch(
        WELCOME_ROLE_ID
      );

      if (!role) {
        console.error(
          "❌ Welcome role not found."
        );
      } else {
        const botMember =
          await member.guild.members.fetch(
            client.user.id
          );

        if (
          role.position >=
          botMember.roles.highest.position
        ) {
          console.error(
            "❌ Cannot add welcome role."
          );

          console.error(
            "Move the bot role ABOVE the welcome role."
          );
        } else {
          await member.roles.add(
            role,
            "Chuppys automatic welcome role"
          );

          console.log(
            `✅ Welcome role added to ${member.user.tag}`
          );
        }
      }
    } catch (error) {
      console.error(
        "❌ WELCOME ROLE ERROR:"
      );

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
      content:
        `<@&${WELCOME_ROLE_ID}> ${member}`,
      embeds: [embed],
      allowedMentions: {
        users: [member.id],
        roles: [WELCOME_ROLE_ID]
      }
    });

    console.log(
      `✅ Welcome message sent for ${member.user.tag}`
    );
  } catch (error) {
    console.error(
      "❌ WELCOME ERROR:"
    );

    console.error(error);
  }
});

// ==================================================
// GOODBYE MESSAGE
// ==================================================

client.on(Events.GuildMemberRemove, async (member) => {
  console.log("====================================");
  console.log("👋 MEMBER LEAVE DETECTED");
  console.log(`👤 User: ${member.user.tag}`);
  console.log(`🆔 ID: ${member.id}`);
  console.log(`🏠 Server: ${member.guild.name}`);
  console.log("====================================");

  try {
    const channel = await getTextChannel(
      member.guild,
      GOODBYE_CHANNEL_ID,
      "GOODBYE"
    );

    if (!channel) {
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
      `✅ Goodbye message sent for ${member.user.tag}`
    );
  } catch (error) {
    console.error(
      "❌ GOODBYE ERROR:"
    );

    console.error(error);
  }
});

// ==================================================
// MESSAGE COMMANDS
// ==================================================

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) {
    return;
  }

  if (!message.guild) {
    return;
  }

  const content = message.content.trim();

  console.log(
    `💬 MESSAGE RECEIVED: "${content}" from ${message.author.tag}`
  );

  // ==================================================
  // ,PAY
  // ==================================================

  const payMatch = content.match(
    /^,pay(?:\s+\$?(\d+(?:\.\d{1,2})?))?\s*$/i
  );

  if (payMatch) {
    console.log(
      "💰 ,PAY COMMAND DETECTED"
    );

    const rawAmount = payMatch[1];

    if (!rawAmount) {
      await message.reply(
        "❌ Please enter an amount.\n\n" +
        "Example: `,pay 25`"
      );

      return;
    }

    const amountNumber = Number(rawAmount);

    if (
      !Number.isFinite(amountNumber) ||
      amountNumber <= 0
    ) {
      await message.reply(
        "❌ Invalid amount.\n\n" +
        "Example: `,pay 25`"
      );

      return;
    }

    const amount = amountNumber.toFixed(2);

    console.log(
      `💰 PAYMENT MENU FOR $${amount}`
    );

    // ----------------------------------------------
    // PAYMENT BUTTONS
    // ----------------------------------------------

    const paymentRow =
      new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId(
            `payment_cashapp|${amount}`
          )
          .setLabel(
            "﹕𐔌・cash app 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            `payment_paypal|${amount}`
          )
          .setLabel(
            "﹕𐔌・paypal 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            `payment_applepay|${amount}`
          )
          .setLabel(
            "﹕𐔌・apple pay 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            `payment_zelle|${amount}`
          )
          .setLabel(
            "﹕𐔌・zelle 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          )
      );

    // ----------------------------------------------
    // PAYMENT EMBED
    // ----------------------------------------------

    const paymentEmbed =
      new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle(
          "🤍 payment methods"
        )
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
  // TEST PAYMENT
  // ==================================================

  if (
    content.toLowerCase() ===
    "!testpay"
  ) {
    console.log(
      "🧪 !TESTPAY DETECTED"
    );

    const amount = "25.00";

    const paymentRow =
      new ActionRowBuilder().addComponents(

        new ButtonBuilder()
          .setCustomId(
            `payment_cashapp|${amount}`
          )
          .setLabel(
            "﹕𐔌・cash app 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            `payment_paypal|${amount}`
          )
          .setLabel(
            "﹕𐔌・paypal 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            `payment_applepay|${amount}`
          )
          .setLabel(
            "﹕𐔌・apple pay 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          ),

        new ButtonBuilder()
          .setCustomId(
            `payment_zelle|${amount}`
          )
          .setLabel(
            "﹕𐔌・zelle 〃・꒱"
          )
          .setStyle(
            ButtonStyle.Secondary
          )
      );

    const paymentEmbed =
      new EmbedBuilder()
        .setColor("#FFFFFF")
        .setTitle(
          "🤍 payment methods"
        )
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
    } catch (error) {
      console.error(
        "❌ TEST PAYMENT ERROR:"
      );

      console.error(error);

      await message.reply(
        "❌ Test payment failed."
      );
    }

    return;
  }

  // ==================================================
  // TEST WELCOME
  // ==================================================

  if (
    content.toLowerCase() ===
    "!testwelcome"
  ) {
    console.log(
      "🧪 !TESTWELCOME DETECTED"
    );

    try {
      const channel =
        await getTextChannel(
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

      const embed =
        new EmbedBuilder()
          .setColor("#FFFFFF")
          .setTitle(
            "🤍 welcome to .gg/chuppys"
          )
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
      console.error(
        "❌ TEST WELCOME ERROR:"
      );

      console.error(error);

      await message.reply(
        "❌ Test welcome failed."
      );
    }

    return;
  }

  // ==================================================
  // TEST GOODBYE
  // ==================================================

  if (
    content.toLowerCase() ===
    "!testgoodbye"
  ) {
    console.log(
      "🧪 !TESTGOODBYE DETECTED"
    );

    try {
      const channel =
        await getTextChannel(
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

      const embed =
        new EmbedBuilder()
          .setColor("#FFFFFF")
          .setTitle(
            "🤍 goodbye"
          )
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
      console.error(
        "❌ TEST GOODBYE ERROR:"
      );

      console.error(error);

      await message.reply(
        "❌ Test goodbye failed."
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

    // ----------------------------------------------
    // LOG EVERY INTERACTION
    // ----------------------------------------------

    console.log("====================================");
    console.log("🔘 INTERACTION RECEIVED");
    console.log(
      `👤 User: ${
        interaction.user
          ? interaction.user.tag
          : "Unknown"
      }`
    );
    console.log(
      `📦 Type: ${interaction.type}`
    );
    console.log(
      `🆔 Custom ID: ${
        interaction.customId || "NONE"
      }`
    );
    console.log("====================================");

    // ----------------------------------------------
    // ONLY BUTTONS
    // ----------------------------------------------

    if (!interaction.isButton()) {
      return;
    }

    // ----------------------------------------------
    // ONLY PAYMENT BUTTONS
    // ----------------------------------------------

    if (
      !interaction.customId.startsWith(
        "payment_"
      )
    ) {
      return;
    }

    console.log(
      `💳 PAYMENT BUTTON CLICKED: ${interaction.customId}`
    );

    try {

      // ==================================================
      // ACKNOWLEDGE DISCORD IMMEDIATELY
      // ==================================================

      await interaction.deferReply({
        ephemeral: true
      });

      console.log(
        "✅ PAYMENT INTERACTION ACKNOWLEDGED"
      );

      // ==================================================
      // SPLIT BUTTON ID
      // ==================================================

      const parts =
        interaction.customId.split("|");

      if (parts.length !== 2) {

        console.error(
          "❌ INVALID PAYMENT BUTTON:"
        );

        console.error(
          interaction.customId
        );

        await interaction.editReply({
          content:
            "❌ This payment button is invalid."
        });

        return;
      }

      const paymentType =
        parts[0];

      const amount =
        parts[1];

      // ==================================================
      // VALIDATE AMOUNT
      // ==================================================

      const amountNumber =
        Number(amount);

      if (
        !Number.isFinite(
          amountNumber
        ) ||
        amountNumber <= 0
      ) {

        await interaction.editReply({
          content:
            "❌ Invalid payment amount."
        });

        return;
      }

      // ==================================================
      // FIND PAYMENT METHOD
      // ==================================================

      let method = null;
      let information = null;

      switch (paymentType) {

        case "payment_cashapp":
          method = "cash app";
          information =
            PAYMENT_INFO.cashapp;
          break;

        case "payment_paypal":
          method = "paypal";
          information =
            PAYMENT_INFO.paypal;
          break;

        case "payment_applepay":
          method = "apple pay";
          information =
            PAYMENT_INFO.applepay;
          break;

        case "payment_zelle":
          method = "zelle";
          information =
            PAYMENT_INFO.zelle;
          break;

        default:

          console.error(
            `❌ UNKNOWN PAYMENT TYPE: ${paymentType}`
          );

          await interaction.editReply({
            content:
              "❌ Unknown payment method."
          });

          return;
      }

      console.log(
        `💳 Method: ${method}`
      );

      console.log(
        `💵 Amount: $${amount}`
      );

      // ==================================================
      // PRIVATE PAYMENT EMBED
      // ==================================================

      const paymentEmbed =
        new EmbedBuilder()
          .setColor("#FFFFFF")
          .setTitle(
            `🤍 ${method}`
          )
          .setDescription(
            `**amount:** $${amount}\n\n` +
            `**${method}:** ${information}\n\n` +
            `send **$${amount}** using the information above.`
          )
          .setFooter({
            text: ".gg/chuppys"
          })
          .setTimestamp();

      // ==================================================
      // SEND PRIVATE RESPONSE
      // ==================================================

      await interaction.editReply({
        embeds: [paymentEmbed]
      });

      console.log(
        `✅ ${method} INFORMATION SENT PRIVATELY`
      );

      console.log(
        `👤 Sent to: ${interaction.user.tag}`
      );

    } catch (error) {

      console.error(
        "===================================="
      );

      console.error(
        "❌ PAYMENT BUTTON ERROR"
      );

      console.error(error);

      console.error(
        "===================================="
      );

      try {

        if (
          interaction.deferred ||
          interaction.replied
        ) {

          await interaction.editReply({
            content:
              "❌ Something went wrong processing this payment."
          });

        } else {

          await interaction.reply({
            content:
              "❌ Something went wrong processing this payment.",
            ephemeral: true
          });

        }

      } catch (replyError) {

        console.error(
          "❌ Could not send payment error:"
        );

        console.error(
          replyError
        );
      }
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

  console.error(
    "===================================="
  );

  console.error(
    "❌ DISCORD_BOT_TOKEN IS MISSING"
  );

  console.error(
    "Add DISCORD_BOT_TOKEN to Render Environment Variables."
  );

  console.error(
    "===================================="
  );

  process.exit(1);
}

console.log(
  "===================================="
);

console.log(
  "🔐 DISCORD TOKEN FOUND"
);

console.log(
  `TOKEN LENGTH: ${TOKEN.length}`
);

console.log(
  "===================================="
);

// ==================================================
// LOGIN
// ==================================================

console.log(
  "🔌 Connecting to Discord..."
);

client
  .login(TOKEN)
  .then(() => {

    console.log(
      "✅ Discord login request completed."
    );

  })
  .catch((error) => {

    console.error(
      "===================================="
    );

    console.error(
      "❌ DISCORD LOGIN FAILED"
    );

    console.error(error);

    console.error(
      "===================================="
    );
  });
