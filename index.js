const http = require("http");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Events,
  PermissionsBitField,
  ChannelType
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

// ==================================================
// NITRO SERVICES
// ==================================================

const NITRO_CHANNEL_ID = "1555760937557041273";

const NITRO_EMOJI =
  "<:C18DEA07FFB44B08AF04005B0D373ECB:1531028121866998012>";

const NITRO_TICKET_BUTTON_ID = "nitro_create_ticket";

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

    // ADD WELCOME ROLE

    try {
      const role = await member.guild.roles
        .fetch(WELCOME_ROLE_ID)
        .catch(() => null);

      if (!role) {
        console.error(
          `❌ Welcome role ${WELCOME_ROLE_ID} not found.`
        );
      } else {
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
// NITRO SERVICES EMBED
// ==================================================

async function sendNitroServices(guild) {
  try {
    const channel = await guild.channels
      .fetch(NITRO_CHANNEL_ID)
      .catch(() => null);

    if (!channel) {
      console.error(
        `❌ Nitro Services channel ${NITRO_CHANNEL_ID} not found.`
      );

      return false;
    }

    const ticketButton = new ButtonBuilder()
      .setCustomId(NITRO_TICKET_BUTTON_ID)
      .setLabel("Create a ticket")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder()
      .addComponents(ticketButton);

    const nitroEmbed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("N1tr0")
      .setDescription(
        `${NITRO_EMOJI} **1 month perm n1tr0 — $7.25** no war\n\n` +
        `${NITRO_EMOJI} **1 month perm n1tr0 + war — $9.25**\n\n` +

        `• gift link delivery\n` +
        `• quick & reliable delivery\n` +
        `• same-day delivery available\n` +
        `• 100% legitimately purchased\n\n` +

        `**PAYMENT METHOD**\n\n` +
        `Cash App\n` +
        `PayPal\n` +
        `Apple Pay\n` +
        `Zelle`
      )
      .setFooter({
        text: ".gg/chuppys"
      })
      .setTimestamp();

    await channel.send({
      embeds: [nitroEmbed],
      components: [row]
    });

    console.log(
      `✅ Nitro Services embed sent to ${channel.name}`
    );

    return true;

  } catch (error) {
    console.error(
      "❌ NITRO SERVICES ERROR:"
    );

    console.error(error);

    return false;
  }
}

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
  // !NITRO
  // ==================================================

  if (content.toLowerCase() === "!nitro") {
    console.log("💿 !NITRO COMMAND DETECTED");

    // Optional: only members with Manage Guild can post it
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )
    ) {
      await message.reply(
        "❌ You need **Manage Server** permission to use this command."
      );

      return;
    }

    const sent = await sendNitroServices(
      message.guild
    );

    if (sent) {
      await message.reply(
        `✅ Nitro Services embed sent to <#${NITRO_CHANNEL_ID}>.`
      );
    } else {
      await message.reply(
        "❌ I couldn't send the Nitro Services embed. Check the channel ID and my permissions."
      );
    }

    return;
  }

  // ==================================================
  // ,PAY
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

      console.log(
        `✅ PAYMENT MENU SENT FOR $${amount}`
      );

    } catch (error) {
      console.error(
        "❌ PAYMENT MENU ERROR:"
      );

      console.error(error);

      await message.reply(
        "❌ I couldn't send the payment menu."
      ).catch(() => {});
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

    console.log("====================================");
    console.log("🔘 INTERACTION RECEIVED");
    console.log(`Type: ${interaction.type}`);
    console.log(`User: ${interaction.user.tag}`);
    console.log(
      `Custom ID: ${interaction.customId || "NONE"}`
    );
    console.log("====================================");

    if (!interaction.isButton()) return;

    const id = interaction.customId;

    // ==================================================
    // CREATE NITRO TICKET
    // ==================================================

    if (id === NITRO_TICKET_BUTTON_ID) {

      try {
        await interaction.deferReply({
          ephemeral: true
        });

        const guild = interaction.guild;

        if (!guild) {
          await interaction.editReply(
            "❌ This button can only be used inside the server."
          );

          return;
        }

        // ----------------------------------------------
        // CHECK FOR EXISTING TICKET
        // ----------------------------------------------

        const existingTicket = guild.channels.cache.find(
          (channel) =>
            channel.type === ChannelType.GuildText &&
            channel.name ===
              `nitro-${interaction.user.username.toLowerCase()}`
        );

        if (existingTicket) {
          await interaction.editReply(
            `❌ You already have a Nitro ticket: ${existingTicket}`
          );

          return;
        }

        // ----------------------------------------------
        // GET NITRO CHANNEL
        // ----------------------------------------------

        const nitroChannel = await guild.channels
          .fetch(NITRO_CHANNEL_ID)
          .catch(() => null);

        if (!nitroChannel) {
          await interaction.editReply(
            "❌ Nitro Services channel could not be found."
          );

          return;
        }

        // ----------------------------------------------
        // CREATE TICKET
        // ----------------------------------------------

        const ticketChannel = await guild.channels.create({
          name: `nitro-${interaction.user.username}`
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "-")
            .slice(0, 90),

          type: ChannelType.GuildText,

          parent: nitroChannel.parentId || undefined,

          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [
                PermissionsBitField.Flags.ViewChannel
              ]
            },

            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks
              ]
            },

            {
              id: guild.members.me.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.ManageChannels,
                PermissionsBitField.Flags.ManageMessages
              ]
            }
          ]
        });

        // ----------------------------------------------
        // CLOSE BUTTON
        // ----------------------------------------------

        const closeButton = new ButtonBuilder()
          .setCustomId("nitro_close_ticket")
          .setLabel("Close Ticket")
          .setStyle(ButtonStyle.Danger);

        const closeRow =
          new ActionRowBuilder()
            .addComponents(closeButton);

        // ----------------------------------------------
        // TICKET EMBED
        // ----------------------------------------------

        const ticketEmbed = new EmbedBuilder()
          .setColor("#FFFFFF")
          .setTitle("🤍 Nitro Ticket")
          .setDescription(
            `${interaction.user}, welcome to your Nitro ticket.\n\n` +
            `${NITRO_EMOJI} **1 month perm n1tr0 — $7.25** no war\n` +
            `${NITRO_EMOJI} **1 month perm n1tr0 + war — $9.25**\n\n` +
            `Please tell us which Nitro option you want.\n\n` +
            `**Payment methods:**\n` +
            `Cash App • PayPal • Apple Pay • Zelle`
          )
          .setFooter({
            text: ".gg/chuppys"
          })
          .setTimestamp();

        await ticketChannel.send({
          content: `${interaction.user}`,
          embeds: [ticketEmbed],
          components: [closeRow]
        });

        await interaction.editReply(
          `✅ Your Nitro ticket has been created: ${ticketChannel}`
        );

        console.log(
          `✅ Nitro ticket created for ${interaction.user.tag}`
        );

      } catch (error) {
        console.error(
          "❌ NITRO TICKET ERROR:"
        );

        console.error(error);

        if (
          interaction.deferred ||
          interaction.replied
        ) {
          await interaction.editReply(
            "❌ I couldn't create your ticket. Make sure the bot has **Manage Channels** permission."
          ).catch(() => {});
        } else {
          await interaction.reply({
            content:
              "❌ I couldn't create your ticket.",
            ephemeral: true
          }).catch(() => {});
        }
      }

      return;
    }

    // ==================================================
    // CLOSE NITRO TICKET
    // ==================================================

    if (id === "nitro_close_ticket") {

      try {
        await interaction.deferReply({
          ephemeral: true
        });

        const channel = interaction.channel;

        if (!channel) {
          await interaction.editReply(
            "❌ Ticket channel not found."
          );

          return;
        }

        await interaction.editReply(
          "🗑️ Closing this ticket..."
        );

        setTimeout(async () => {
          try {
            await channel.delete(
              "Nitro ticket closed"
            );

            console.log(
              `🗑️ Nitro ticket deleted: ${channel.name}`
            );

          } catch (error) {
            console.error(
              "❌ Could not delete Nitro ticket:"
            );

            console.error(error);
          }
        }, 2000);

      } catch (error) {
        console.error(
          "❌ CLOSE TICKET ERROR:"
        );

        console.error(error);
      }

      return;
    }

    // ==================================================
    // PAYMENT BUTTONS
    // ==================================================

    if (!id.startsWith("payment_")) {
      console.log(
        `ℹ️ Non-payment button ignored: ${id}`
      );

      return;
    }

    let method = null;
    let information = null;
    let amount = null;

    // APPLE PAY

    if (id.startsWith("payment_applepay_")) {
      method = PAYMENT_INFO.applepay.name;
      information = PAYMENT_INFO.applepay.username;

      amount = id.replace(
        "payment_applepay_",
        ""
      );
    }

    // ZELLE

    else if (id.startsWith("payment_zelle_")) {
      method = PAYMENT_INFO.zelle.name;
      information = PAYMENT_INFO.zelle.username;

      amount = id.replace(
        "payment_zelle_",
        ""
      );
    }

    if (!method || !information || !amount) {
      console.error(
        `❌ Invalid payment button: ${id}`
      );

      if (
        !interaction.replied &&
        !interaction.deferred
      ) {
        await interaction.reply({
          content:
            "❌ This payment button is invalid or expired.",
          ephemeral: true
        }).catch(() => {});
      }

      return;
    }

    try {
      await interaction.deferReply({
        ephemeral: true
      });

    } catch (error) {
      console.error(
        "❌ COULD NOT ACKNOWLEDGE INTERACTION:"
      );

      console.error(error);

      return;
    }

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
