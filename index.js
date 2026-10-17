
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
// CHANNEL / ROLE IDS
// ==================================================

const WELCOME_CHANNEL_ID = "1530755165412524042";
const GOODBYE_CHANNEL_ID = "1530761366489530480";

const NITRO_CHANNEL_ID = "1555760937557041273";
const DECOR_CHANNEL_ID = "1555769588229345280";
const BOOSTIES_CHANNEL_ID = "1555769708928831489";

const SELLERS_CHANNEL_ID = "1551713598181605496";
const STAFF_CHANNEL_ID = "1561013244905132122";

const WELCOME_ROLE_ID = "1531039846871728248";

// ==================================================
// EMOJIS
// ==================================================

const SERVICE_EMOJI =
  "<a:aBouncyDiscord:1557138733717782599>";

const BOOST_EMOJI =
  "<:white_nitro_boost:1557165507600326756>";

const SELLER_EMOJI =
  "<:chuppyseller:1560283615445778503>";

// ==================================================
// WELCOME IMAGE
// ==================================================

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

// ==================================================
// PAYMENT INFORMATION
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
// WELCOME MESSAGE
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
          `Gave welcome role to ${member.user.tag}`
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
        "We're happy to have you here. Make sure to read the rules and enjoy your time in the server!"
      )
      .setColor("#FFFFFF")
      .setThumbnail(
        member.user.displayAvatarURL()
      )
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
// GOODBYE MESSAGE
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
        "We hope to see you again!"
      )
      .setColor("#FFFFFF")
      .setThumbnail(
        member.user.displayAvatarURL()
      )
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
// PAYMENT EMBED
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
// PAYMENT METHODS TEXT
// ==================================================

const PAYMENT_METHODS_TEXT =
  "**Payment Methods**\n" +
  "> Apple Pay\n" +
  "> Venmo\n" +
  "> Cash App";

// ==================================================
// DECOR MESSAGE
// ==================================================

async function sendDecorServices(channel) {
  const embed = new EmbedBuilder()
    .setDescription(
      `# DECOR ${SERVICE_EMOJI}\n\n` +

      "*original price • our price*\n\n" +

      "$4.99-$5.99 • **$3.00**\n" +
      "$6.99-$8.99 • **$5.00**\n" +
      "$9.99-$11.99 • **$8.00**\n" +
      "$12.99-$14.99 • **$9.00**\n" +
      "$15.99-$17.99 • **$10.00**\n" +
      "$18.99-$20.00 • **$13.00**\n" +
      "$21.99-$23.99 • **$15.00**\n\n" +

      `# BUNDLES ${SERVICE_EMOJI}\n\n` +

      "*original price • our price*\n\n" +

      "$8.99 • **$6.50**\n" +
      "$10.99 • **$7.50**\n" +
      "$12.99 • **$8.50**\n" +
      "$14.99 • **$9.50**\n" +
      "$17.99 • **$13.50**\n" +
      "$21.99 • **$15.00**\n" +
      "$22.99 • **$16.00**\n\n" +

      "All legally purchased and will be sent the same day!\n\n" +

      `${PAYMENT_METHODS_TEXT}\n\n` +

      "**.gg/chuppys**"
    )
    .setColor("#FFFFFF");

  await updateServiceMessage(channel, embed, "DECOR");
}

// ==================================================
// NITRO MESSAGE
// ==================================================

async function sendNitroServices(channel) {
  const embed = new EmbedBuilder()
    .setDescription(
      `# NITRO ${SERVICE_EMOJI}\n\n` +
      "**1 Month + No War — $7.25**\n\n" +
      "**1 Month + War — $9.25**\n\n" +
      `${PAYMENT_METHODS_TEXT}\n\n` +
      "**.gg/chuppys**"
    )
    .setColor("#FFFFFF");

  await updateServiceMessage(channel, embed, "NITRO");
}

// ==================================================
// BOOSTIES MESSAGE
// ==================================================

async function sendBoostiesServices(channel) {
  const embed = new EmbedBuilder()
    .setDescription(
      `# 1 MONTH ${BOOST_EMOJI}\n\n` +
      `${BOOST_EMOJI} **2 • $1.25**\n` +
      `${BOOST_EMOJI} **4 • $2.50**\n` +
      `${BOOST_EMOJI} **6 • $3.75**\n` +
      `${BOOST_EMOJI} **8 • $4.00**\n` +
      `${BOOST_EMOJI} **10 • $5.25**\n` +
      `${BOOST_EMOJI} **12 • $6.50**\n` +
      `${BOOST_EMOJI} **14 • $7.00**\n` +
      `${BOOST_EMOJI} **16 • $8.50**\n` +
      `${BOOST_EMOJI} **18 • $9.00**\n` +
      `${BOOST_EMOJI} **20 • $9.50**\n` +
      `${BOOST_EMOJI} **30 • $11.00**\n\n` +

      `# 3 MONTHS ${BOOST_EMOJI}\n\n` +
      `${BOOST_EMOJI} **2 • $2.00**\n` +
      `${BOOST_EMOJI} **4 • $4.00**\n` +
      `${BOOST_EMOJI} **6 • $6.00**\n` +
      `${BOOST_EMOJI} **8 • $8.00**\n` +
      `${BOOST_EMOJI} **10 • $10.00**\n` +
      `${BOOST_EMOJI} **12 • $12.00**\n` +
      `${BOOST_EMOJI} **14 • $14.00**\n` +
      `${BOOST_EMOJI} **16 • $16.00**\n` +
      `${BOOST_EMOJI} **18 • $18.00**\n` +
      `${BOOST_EMOJI} **20 • $20.00**\n` +
      `${BOOST_EMOJI} **30 • $27.00**\n\n` +

      `${PAYMENT_METHODS_TEXT}\n\n` +
      "**.gg/chuppys**"
    )
    .setColor("#FFFFFF");

  await updateServiceMessage(channel, embed, "BOOSTIES");
}

// ==================================================
// UPDATE EXISTING SERVICE MESSAGE
// ==================================================

async function updateServiceMessage(channel, embed, serviceName) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });

    const botMessages = messages.filter(
      (msg) =>
        msg.author.id === client.user.id &&
        msg.embeds.length > 0
    );

    let existingMessage = null;

    for (const msg of botMessages.values()) {
      const description = msg.embeds[0].description || "";

      if (
        serviceName === "DECOR" &&
        description.includes("# DECOR")
      ) {
        existingMessage = msg;
        break;
      }

      if (
        serviceName === "NITRO" &&
        description.includes("# NITRO")
      ) {
        existingMessage = msg;
        break;
      }

      if (
        serviceName === "BOOSTIES" &&
        (
          description.includes("# 1 MONTH") ||
          description.includes("# 3 MONTHS")
        )
      ) {
        existingMessage = msg;
        break;
      }
    }

    if (existingMessage) {
      await existingMessage.edit({
        content: "",
        embeds: [embed],
        components: []
      });

      console.log(`${serviceName} message updated.`);

      const duplicates = botMessages.filter(
        (msg) => msg.id !== existingMessage.id
      );

      for (const duplicate of duplicates.values()) {
        const description = duplicate.embeds[0]?.description || "";
        let isDuplicate = false;

        if (
          serviceName === "DECOR" &&
          description.includes("# DECOR")
        ) {
          isDuplicate = true;
        }

        if (
          serviceName === "NITRO" &&
          description.includes("# NITRO")
        ) {
          isDuplicate = true;
        }

        if (
          serviceName === "BOOSTIES" &&
          (
            description.includes("# 1 MONTH") ||
            description.includes("# 3 MONTHS")
          )
        ) {
          isDuplicate = true;
        }

        if (isDuplicate) {
          try {
            await duplicate.delete();
            console.log(`Deleted duplicate ${serviceName} message.`);
          } catch (error) {
            console.log(
              `Could not delete duplicate ${serviceName}:`,
              error.message
            );
          }
        }
      }

      return existingMessage;
    }

    const newMessage = await channel.send({
      content: "",
      embeds: [embed],
      components: []
    });

    console.log(`New ${serviceName} message created.`);
    return newMessage;

  } catch (error) {
    console.error(`Error updating ${serviceName} message:`, error);
    throw error;
  }
}

// ==================================================
// SELLERS EMBED
// LARGE, BOLD HEADER + CLICKABLE PROFILE NAMES
// ==================================================

function makeSellersEmbed() {
  return new EmbedBuilder()
    .setColor("#FFFFFF")
    .setDescription(
      [
        "# .gg/chuppys sellers",
        "",
        `${SELLER_EMOJI} **<@1192248188409749684>**`,
        "Role: services seller",
        "Limit: No limit",
        "ID: 1192248188409749684",
        "",
        `${SELLER_EMOJI} **<@1079241163455873074>**`,
        "Role: seller",
        "Limit: no limit",
        "ID: 1079241163455873074",
        "",
        `${SELLER_EMOJI} **<@1032693136163622993>**`,
        "Role: seller",
        "Limit: 25",
        "ID: 1032693136163622993",
        "",
        `${SELLER_EMOJI} **<@1320199904219496530>**`,
        "Role: seller",
        "Limit: 30",
        "ID: 1320199904219496530",
        "",
        `${SELLER_EMOJI} **<@952566845939023892>**`,
        "Role: seller",
        "Limit: 45",
        "ID: 952566845939023892",
        "",
        `${SELLER_EMOJI} **<@1473335012769267807>**`,
        "Role: seller",
        "Limit: 100",
        "ID: 1473335012769267807",
        "",
        `${SELLER_EMOJI} **<@1472856287527309313>**`,
        "Role: seller",
        "Limit: 100",
        "ID: 1472856287527309313",
        "",
        `${SELLER_EMOJI} **<@1269188505935024141>**`,
        "Role: seller",
        "Limit: 250",
        "ID: 1269188505935024141"
      ].join("\n")
    );
}

// ==================================================
// STAFF EMBED
// MATCHING LARGE, BOLD HEADER + CLICKABLE NAMES
// ==================================================

function makeStaffEmbed() {
  return new EmbedBuilder()
    .setColor("#FFFFFF")
    .setDescription(
      [
        "# .gg/chuppys staff",
        "",
        `${SELLER_EMOJI} **<@1530733554869473320>**`,
        "Role: owner | seller",
        "Limit: no limit",
        "ID: 1530733554869473320",
        "",
        `${SELLER_EMOJI} **<@1490962480963260466>**`,
        "Role: owner | seller",
        "Limit: no limit",
        "ID: 1490962480963260466",
        "",
        `${SELLER_EMOJI} **<@1381473377696350238>**`,
        "Role: Mod | staff",
        "ID: 1381473377696350238",
        "",
        `${SELLER_EMOJI} **<@727673410737668107>**`,
        "Role: Mod | staff",
        "ID: 727673410737668107"
      ].join("\n")
    );
}

// ==================================================
// SEND EMBED TO DESTINATION CHANNEL
// ==================================================

async function sendEmbedToChannel(guild, channelId, embed, label) {
  const channel = guild.channels.cache.get(channelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error(
      `${label} destination channel was not found or is not a text channel.`
    );
  }

  await channel.send({
    embeds: [embed],
    allowedMentions: {
      parse: []
    }
  });
}

// ==================================================
// MESSAGE COMMANDS
// ==================================================

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  const content = message.content.trim().toLowerCase();

  try {
    // !PAY / ,PAY

    if (content === "!pay" || content === ",pay") {
      await sendPaymentEmbed(message.channel);
      return;
    }

    // ADMIN COMMAND PERMISSION CHECK

    const adminCommands = [
      "!nitro", ",nitro",
      "!decor", ",decor",
      "!boosties", ",boosties",
      "!sellers", ",sellers",
      "!staff", ",staff"
    ];

    if (adminCommands.includes(content)) {
      if (
        !message.member.permissions.has(
          PermissionsBitField.Flags.ManageGuild
        )
      ) {
        await message.reply(
          "You need **Manage Server** permission to use this command."
        );
        return;
      }
    }

    // !NITRO / ,NITRO

    if (content === "!nitro" || content === ",nitro") {
      const channel = message.guild.channels.cache.get(
        NITRO_CHANNEL_ID
      );

      if (!channel) {
        await message.reply(
          "I couldn't find the Nitro Services channel."
        );
        return;
      }

      await sendNitroServices(channel);
      await message.reply("Nitro message updated successfully.");
      return;
    }

    // !DECOR / ,DECOR

    if (content === "!decor" || content === ",decor") {
      const channel = message.guild.channels.cache.get(
        DECOR_CHANNEL_ID
      );

      if (!channel) {
        await message.reply(
          "I couldn't find the Decor channel."
        );
        return;
      }

      await sendDecorServices(channel);
      await message.reply("Decor message updated successfully.");
      return;
    }

    // !BOOSTIES / ,BOOSTIES

    if (content === "!boosties" || content === ",boosties") {
      const channel = message.guild.channels.cache.get(
        BOOSTIES_CHANNEL_ID
      );

      if (!channel) {
        await message.reply(
          "I couldn't find the Boosties channel."
        );
        return;
      }

      await sendBoostiesServices(channel);
      await message.reply("Boosties message updated successfully.");
      return;
    }

    // !SELLERS / ,SELLERS

    if (content === "!sellers" || content === ",sellers") {
      await sendEmbedToChannel(
        message.guild,
        SELLERS_CHANNEL_ID,
        makeSellersEmbed(),
        "Sellers"
      );

      await message.reply("Seller embed sent successfully.");
      return;
    }

    // !STAFF / ,STAFF

    if (content === "!staff" || content === ",staff") {
      await sendEmbedToChannel(
        message.guild,
        STAFF_CHANNEL_ID,
        makeStaffEmbed(),
        "Staff"
      );

      await message.reply("Staff embed sent successfully.");
      return;
    }

    // TEST WELCOME

    if (content === "!testwelcome") {
      const channel = message.guild.channels.cache.get(
        WELCOME_CHANNEL_ID
      );

      if (!channel) {
        await message.reply("Welcome channel not found.");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Welcome to .gg/chuppys 🤍")
        .setDescription(
          `Welcome ${message.author}!\n\n` +
          "We're happy to have you here. Make sure to read the rules and enjoy your time in the server!"
        )
        .setColor("#FFFFFF")
        .setThumbnail(message.author.displayAvatarURL())
        .setImage(WELCOME_IMAGE)
        .setFooter({
          text: message.guild.name
        });

      await channel.send({
        content: `${message.author}`,
        embeds: [embed]
      });

      return;
    }

    // TEST GOODBYE

    if (content === "!testgoodbye") {
      const channel = message.guild.channels.cache.get(
        GOODBYE_CHANNEL_ID
      );

      if (!channel) {
        await message.reply("Goodbye channel not found.");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Goodbye 🤍")
        .setDescription(
          `**${message.author.username}** has left **${message.guild.name}**.\n\n` +
          "We hope to see you again!"
        )
        .setColor("#FFFFFF")
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({
          text: message.guild.name
        });

      await channel.send({
        embeds: [embed]
      });

      return;
    }

    // TEST PAYMENT

    if (content === "!testpay") {
      await sendPaymentEmbed(message.channel);
      return;
    }

  } catch (error) {
    console.error("Message command error:", error);

    if (message.channel && message.channel.isTextBased()) {
      await message.reply(
        `Something went wrong: ${error.message}`
      ).catch(() => {});
    }
  }
});

// ==================================================
// BUTTON INTERACTIONS
// ==================================================

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isButton()) return;

    // APPLE PAY

    if (interaction.customId === "payment_apple") {
      await interaction.reply({
        content: `**Apple Pay:** \`${APPLE_PAY}\``,
        ephemeral: true
      });

      return;
    }

    // ZELLE

    if (interaction.customId === "payment_zelle") {
      await interaction.reply({
        content: `**Zelle:** \`${ZELLE}\``,
        ephemeral: true
      });

      return;
    }

  } catch (error) {
    console.error("Interaction error:", error);

    try {
      if (interaction.deferred) {
        await interaction.editReply({
          content: "Something went wrong while processing this."
        });
      } else if (!interaction.replied) {
        await interaction.reply({
          content: "Something went wrong while processing this.",
          ephemeral: true
        });
      }
    } catch {}
  }
});

// ==================================================
// ERROR HANDLING
// ==================================================

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

// ==================================================
// CHECK TOKEN
// ==================================================

if (!TOKEN) {
  console.error(
    "DISCORD_BOT_TOKEN is missing from environment variables."
  );

  process.exit(1);
}

// ==================================================
// LOGIN
// ==================================================

client.login(TOKEN)
  .then(() => {
    console.log("Discord login successful.");
  })
  .catch((error) => {
    console.error("Discord login failed:", error);
  });
