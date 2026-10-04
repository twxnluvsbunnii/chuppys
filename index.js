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

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

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
// TOKEN
// ==================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;

// ==================================================
// CHANNELS
// ==================================================

const WELCOME_CHANNEL_ID = "1530755165412524042";
const GOODBYE_CHANNEL_ID = "1530761366489530480";
const NITRO_CHANNEL_ID = "1555760937557041273";

// ==================================================
// ROLES
// ==================================================

const WELCOME_ROLE_ID = "1531039846871728248";

// ==================================================
// NITRO TICKET CATEGORY
// ==================================================

const NITRO_TICKET_CATEGORY_ID =
  process.env.NITRO_TICKET_CATEGORY_ID;

// ==================================================
// CUSTOM NITRO EMOJI
// ==================================================

const NITRO_EMOJI =
  "<:C18DEA07FFB44B08AF04005B0D373ECB:1531028121866998012>";

// ==================================================
// WELCOME IMAGE
// ==================================================

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

// ==================================================
// NORMAL PAYMENT INFORMATION
// ==================================================

const CASHAPP_USERNAME = "$yysluvv";
const CASHAPP_URL = "https://cash.app/$yysluvv";

const PAYPAL_USERNAME = "PayPal.me/twxnsrevenge";
const PAYPAL_URL = "https://paypal.me/twxnsrevenge";

const APPLE_PAY = "929-554-5969";
const ZELLE = "631-401-8951";

// ==================================================
// BOT READY
// ==================================================

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log("Chuppys bot is online.");

  readyClient.user.setActivity(".gg/chuppys", {
    type: 3
  });
});

// ==================================================
// WELCOME
// ==================================================

client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const channel = member.guild.channels.cache.get(
      WELCOME_CHANNEL_ID
    );

    if (!channel) {
      console.log("Welcome channel not found.");
      return;
    }

    try {
      const role = member.guild.roles.cache.get(
        WELCOME_ROLE_ID
      );

      if (role) {
        await member.roles.add(role);
        console.log(
          `Added welcome role to ${member.user.tag}`
        );
      }
    } catch (roleError) {
      console.log(
        "Could not give welcome role:",
        roleError.message
      );
    }

    const embed = new EmbedBuilder()
      .setTitle("Welcome to .gg/chuppys 🤍")
      .setDescription(
        `Welcome ${member}!\n\n` +
        `We're happy to have you here. Make sure to read the rules and enjoy your time in the server!`
      )
      .setColor("#FFFFFF")
      .setThumbnail(member.user.displayAvatarURL())
      .setImage(WELCOME_IMAGE)
      .setFooter({
        text: member.guild.name
      });

    await channel.send({
      content: `${member}`,
      embeds: [embed]
    });

    console.log(
      `Welcome message sent for ${member.user.tag}`
    );
  } catch (error) {
    console.error("Welcome error:", error);
  }
});

// ==================================================
// GOODBYE
// ==================================================

client.on(Events.GuildMemberRemove, async (member) => {
  try {
    const channel = member.guild.channels.cache.get(
      GOODBYE_CHANNEL_ID
    );

    if (!channel) {
      console.log("Goodbye channel not found.");
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle("Goodbye 🤍")
      .setDescription(
        `**${member.user.username}** has left **${member.guild.name}**.\n\n` +
        `We hope to see you again!`
      )
      .setColor("#FFFFFF")
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({
        text: member.guild.name
      });

    await channel.send({
      embeds: [embed]
    });

    console.log(
      `Goodbye message sent for ${member.user.tag}`
    );
  } catch (error) {
    console.error("Goodbye error:", error);
  }
});

// ==================================================
// NORMAL PAYMENT EMBED
// ==================================================

async function sendPaymentEmbed(channel) {
  const embed = new EmbedBuilder()
    .setTitle("Payment Methods")
    .setDescription(
      "Choose a payment method below.\n\n" +
      "Please make sure the payment information is correct before sending."
    )
    .addFields(
      {
        name: "Cash App",
        value: `\`${CASHAPP_USERNAME}\``,
        inline: true
      },
      {
        name: "PayPal",
        value: `\`${PAYPAL_USERNAME}\``,
        inline: true
      },
      {
        name: "Apple Pay",
        value: `\`${APPLE_PAY}\``,
        inline: true
      },
      {
        name: "Zelle",
        value: `\`${ZELLE}\``,
        inline: true
      }
    )
    .setColor("#FFFFFF")
    .setFooter({
      text: ".gg/chuppys"
    });

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Cash App")
      .setStyle(ButtonStyle.Link)
      .setURL(CASHAPP_URL),

    new ButtonBuilder()
      .setLabel("PayPal")
      .setStyle(ButtonStyle.Link)
      .setURL(PAYPAL_URL)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("payment_apple")
      .setLabel("Apple Pay")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("payment_zelle")
      .setLabel("Zelle")
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({
    embeds: [embed],
    components: [row1, row2]
  });
}

// ==================================================
// NITRO SERVICES EMBED
// ==================================================

async function sendNitroServices(channel) {
  const embed = new EmbedBuilder()
    .setTitle("N1tr0")
    .setDescription(
      `${NITRO_EMOJI} **1 Month Nitro — $7.25**\n` +
      `No war\n\n` +

      `${NITRO_EMOJI} **1 Month Nitro + War — $9.25**\n\n` +

      `**Payment Methods**\n` +
      `> Apple Pay\n` +
      `> Venmo`
    )
    .setColor("#FFFFFF")
    .setFooter({
      text: ".gg/chuppys"
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("nitro_725")
      .setLabel("1 Month — $7.25")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("nitro_925")
      .setLabel("1 Month + War — $9.25")
      .setStyle(ButtonStyle.Secondary)
  );

  await channel.send({
    embeds: [embed],
    components: [row]
  });
}

// ==================================================
// MESSAGE COMMANDS
// ==================================================

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();

  // ==================================================
  // !PAY
  // ==================================================

  if (
    content === "!pay" ||
    content === ",pay"
  ) {
    await sendPaymentEmbed(message.channel);
    return;
  }

  // ==================================================
  // !NITRO
  // ==================================================

  if (
    content === "!nitro" ||
    content === ",nitro"
  ) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )
    ) {
      return message.reply(
        "You need **Manage Server** permission to use this command."
      );
    }

    const nitroChannel =
      message.guild.channels.cache.get(
        NITRO_CHANNEL_ID
      );

    if (!nitroChannel) {
      return message.reply(
        "I couldn't find the Nitro Services channel."
      );
    }

    await sendNitroServices(nitroChannel);

    await message.reply(
      "Nitro Services embed sent successfully."
    );

    return;
  }

  // ==================================================
  // TEST WELCOME
  // ==================================================

  if (content === "!testwelcome") {
    const channel =
      message.guild.channels.cache.get(
        WELCOME_CHANNEL_ID
      );

    if (!channel) {
      return message.reply(
        "Welcome channel not found."
      );
    }

    const embed = new EmbedBuilder()
      .setTitle("Welcome to .gg/chuppys 🤍")
      .setDescription(
        `Welcome ${message.author}!\n\n` +
        `We're happy to have you here.`
      )
      .setColor("#FFFFFF")
      .setThumbnail(
        message.author.displayAvatarURL()
      )
      .setImage(WELCOME_IMAGE);

    await channel.send({
      content: `${message.author}`,
      embeds: [embed]
    });

    await message.reply(
      "Test welcome message sent."
    );

    return;
  }

  // ==================================================
  // TEST GOODBYE
  // ==================================================

  if (content === "!testgoodbye") {
    const channel =
      message.guild.channels.cache.get(
        GOODBYE_CHANNEL_ID
      );

    if (!channel) {
      return message.reply(
        "Goodbye channel not found."
      );
    }

    const embed = new EmbedBuilder()
      .setTitle("Goodbye 🤍")
      .setDescription(
        `**${message.author.username}** has left **${message.guild.name}**.\n\n` +
        `We hope to see you again!`
      )
      .setColor("#FFFFFF")
      .setThumbnail(
        message.author.displayAvatarURL()
      );

    await channel.send({
      embeds: [embed]
    });

    await message.reply(
      "Test goodbye message sent."
    );

    return;
  }

  // ==================================================
  // TEST PAYMENT
  // ==================================================

  if (content === "!testpay") {
    await sendPaymentEmbed(message.channel);

    await message.reply(
      "Test payment embed sent."
    );

    return;
  }
});

// ==================================================
// BUTTON INTERACTIONS
// ==================================================

client.on(
  Events.InteractionCreate,
  async (interaction) => {
    try {
      if (!interaction.isButton()) return;

      // ==================================================
      // APPLE PAY
      // ==================================================

      if (
        interaction.customId ===
        "payment_apple"
      ) {
        return interaction.reply({
          content:
            `**Apple Pay:** \`${APPLE_PAY}\``,
          ephemeral: true
        });
      }

      // ==================================================
      // ZELLE
      // ==================================================

      if (
        interaction.customId ===
        "payment_zelle"
      ) {
        return interaction.reply({
          content:
            `**Zelle:** \`${ZELLE}\``,
          ephemeral: true
        });
      }

      // ==================================================
      // NITRO PRODUCTS
      // ==================================================

      if (
        interaction.customId === "nitro_725" ||
        interaction.customId === "nitro_925"
      ) {
        if (!interaction.guild) {
          return interaction.reply({
            content:
              "This can only be used inside the server.",
            ephemeral: true
          });
        }

        // ==================================================
        // CHECK CATEGORY
        // ==================================================

        if (
          !NITRO_TICKET_CATEGORY_ID ||
          NITRO_TICKET_CATEGORY_ID ===
            "YOUR_CATEGORY_ID"
        ) {
          return interaction.reply({
            content:
              "The Nitro ticket category has not been configured yet. Add NITRO_TICKET_CATEGORY_ID to your Render environment variables.",
            ephemeral: true
          });
        }

        // ==================================================
        // PRODUCT INFORMATION
        // ==================================================

        const products = {
          nitro_725: {
            name: "1 Month Nitro",
            price: "$7.25",
            war: "No",
            ticketPrefix: "nitro-1month"
          },

          nitro_925: {
            name: "1 Month Nitro + War",
            price: "$9.25",
            war: "Yes",
            ticketPrefix: "nitro-1month-war"
          }
        };

        const product =
          products[interaction.customId];

        await interaction.deferReply({
          ephemeral: true
        });

        // ==================================================
        // CHECK EXISTING TICKET
        // ==================================================

        const existingTicket =
          interaction.guild.channels.cache.find(
            (channel) =>
              channel.type ===
                ChannelType.GuildText &&
              channel.topic ===
                `Nitro ticket for ${interaction.user.id}`
          );

        if (existingTicket) {
          return interaction.editReply({
            content:
              `You already have a Nitro ticket open: ${existingTicket}`
          });
        }

        // ==================================================
        // CLEAN USERNAME
        // ==================================================

        let username =
          interaction.user.username
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, "")
            .slice(0, 20);

        if (!username) {
          username = interaction.user.id;
        }

        // ==================================================
        // TICKET NAME
        // ==================================================

        const ticketName =
          `${product.ticketPrefix}-${username}`.slice(
            0,
            100
          );

        // ==================================================
        // CREATE PRIVATE TICKET
        // ==================================================

        const ticket =
          await interaction.guild.channels.create({
            name: ticketName,
            type: ChannelType.GuildText,
            parent: NITRO_TICKET_CATEGORY_ID,

            topic:
              `Nitro ticket for ${interaction.user.id}`,

            permissionOverwrites: [
              {
                id:
                  interaction.guild.roles.everyone.id,

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
                id: interaction.client.user.id,

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

        // ==================================================
        // TICKET EMBED
        // ==================================================

        const ticketEmbed =
          new EmbedBuilder()
            .setTitle("Nitro Purchase")
            .setDescription(
              `${NITRO_EMOJI} **Product:** ${product.name}\n` +
              `${NITRO_EMOJI} **Price:** ${product.price}\n` +
              `${NITRO_EMOJI} **War:** ${product.war}\n\n` +

              `**Payment Methods**\n` +
              `> Apple Pay\n` +
              `> Venmo\n\n` +

              `Please send proof of payment after paying.`
            )
            .setColor("#FFFFFF")
            .setFooter({
              text: ".gg/chuppys"
            });

        // ==================================================
        // CLOSE BUTTON
        // ==================================================

        const closeRow =
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(
                "close_nitro_ticket"
              )
              .setLabel("Close Ticket")
              .setStyle(ButtonStyle.Danger)
          );

        await ticket.send({
          content: `${interaction.user}`,
          embeds: [ticketEmbed],
          components: [closeRow]
        });

        await interaction.editReply({
          content:
            `Your Nitro ticket has been created: ${ticket}`
        });

        console.log(
          `Created Nitro ticket ${ticket.name} for ${interaction.user.tag}`
        );

        return;
      }

      // ==================================================
      // CLOSE NITRO TICKET
      // ==================================================

      if (
        interaction.customId ===
        "close_nitro_ticket"
      ) {
        await interaction.reply({
          content: "Closing this ticket...",
          ephemeral: true
        });

        setTimeout(async () => {
          try {
            await interaction.channel.delete();
          } catch (error) {
            console.log(
              "Could not delete ticket:",
              error.message
            );
          }
        }, 1500);

        return;
      }
    } catch (error) {
      console.error(
        "Interaction error:",
        error
      );

      try {
        if (interaction.deferred) {
          await interaction.editReply({
            content:
              "Something went wrong while processing this."
          });
        } else if (!interaction.replied) {
          await interaction.reply({
            content:
              "Something went wrong while processing this.",
            ephemeral: true
          });
        }
      } catch {}
    }
  }
);

// ==================================================
// ERROR HANDLING
// ==================================================

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "Unhandled promise rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught exception:",
      error
    );
  }
);

// ==================================================
// LOGIN
// ==================================================

if (!TOKEN) {
  console.error(
    "DISCORD_BOT_TOKEN is missing from environment variables."
  );

  process.exit(1);
}

client
  .login(TOKEN)
  .then(() => {
    console.log(
      "Discord login successful."
    );
  })
  .catch((error) => {
    console.error(
      "Discord login failed:",
      error
    );
  });
