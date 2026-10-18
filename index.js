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
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Chuppys bot is running!");
}).listen(PORT, "0.0.0.0", () => {
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

const VOUCH_CHANNEL_ID = "1530811494168657980";
const WELCOME_ROLE_ID = "1531039846871728248";

// ==================================================
// AUTOMATIC REACTION
// ==================================================

const CHUPPY_TY_CHANNEL_ID = "1530811494168657980";
const CHUPPY_TY_EMOJI = "<:uppyty:1561094713153429746>";

// ==================================================
// AFK SETTINGS
// ==================================================

const AFK_GOING_EMOJI = "<:chuppybye:1561103844832846014>";
const AFK_RETURN_EMOJI = "<:chuppyhi:1561103471325745242>";

const afkUsers = new Map();

// ==================================================
// EMOJIS
// ==================================================

const SERVICE_EMOJI = "<a:aBouncyDiscord:1557138733717782599>";
const BOOST_EMOJI = "<:white_nitro_boost:1557165507600326756>";
const SELLER_EMOJI = "<:chuppyseller:1560283615445778503>";

const VOUCH_EMOJI_ID = "1561197586554036318";
const VOUCH_EMOJI_URL =
  `https://cdn.discordapp.com/emojis/${VOUCH_EMOJI_ID}.png`;

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
    const channel = await member.guild.channels.fetch(
      WELCOME_CHANNEL_ID
    );

    if (!channel || !channel.isTextBased()) return;

    try {
      await member.roles.add(WELCOME_ROLE_ID);
    } catch (error) {
      console.error("Could not assign welcome role:", error.message);
    }

    const embed = new EmbedBuilder()
      .setTitle("Welcome to .gg/chuppys 🤍")
      .setDescription(
        `Welcome ${member}!\n\n` +
        "We're happy to have you here. Make sure to read the rules and enjoy your time in the server!"
      )
      .setColor(0xFFFFFF)
      .setThumbnail(member.user.displayAvatarURL())
      .setImage(WELCOME_IMAGE)
      .setFooter({ text: member.guild.name });

    await channel.send({
      content: `${member}`,
      embeds: [embed]
    });

    console.log(`Welcome message sent for ${member.user.tag}`);
  } catch (error) {
    console.error("Welcome error:", error);
  }
});

// ==================================================
// GOODBYE MESSAGE
// ==================================================

client.on(Events.GuildMemberRemove, async (member) => {
  try {
    const channel = await member.guild.channels.fetch(
      GOODBYE_CHANNEL_ID
    );

    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle("Goodbye 🤍")
      .setDescription(
        `**${member.user.username}** has left **${member.guild.name}**.\n\n` +
        "We hope to see you again!"
      )
      .setColor(0xFFFFFF)
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: member.guild.name });

    await channel.send({ embeds: [embed] });

    console.log(`Goodbye message sent for ${member.user.tag}`);
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
        inline: false
      },
      {
        name: "PayPal",
        value: `\`${PAYPAL_USERNAME}\``,
        inline: false
      },
      {
        name: "Apple Pay",
        value: `\`${APPLE_PAY}\``,
        inline: false
      },
      {
        name: "Zelle",
        value: `\`${ZELLE}\``,
        inline: false
      }
    )
    .setColor(0xFFFFFF)
    .setFooter({ text: ".gg/chuppys" });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Cash App")
      .setStyle(ButtonStyle.Link)
      .setURL(CASHAPP_URL),

    new ButtonBuilder()
      .setLabel("PayPal")
      .setStyle(ButtonStyle.Link)
      .setURL(PAYPAL_URL)
  );

  const payload = {
    embeds: [embed],
    components: [row]
  };

  const messages = await channel.messages.fetch({ limit: 100 });

  const paymentMessages = messages.filter(
    (msg) =>
      msg.author.id === client.user.id &&
      msg.embeds.some((e) => e.title === "Payment Methods")
  );

  const existingMessage = paymentMessages.first();

  if (existingMessage) {
    await existingMessage.edit(payload);

    for (const duplicate of paymentMessages.values()) {
      if (duplicate.id !== existingMessage.id) {
        await duplicate.delete().catch(() => {});
      }
    }

    console.log("Existing payment message updated.");
    return existingMessage;
  }

  const newMessage = await channel.send(payload);
  console.log("New payment message created.");
  return newMessage;
}

// ==================================================
// SERVICE PAYMENT TEXT
// ==================================================

const PAYMENT_METHODS_TEXT =
  "**Payment Methods**\n" +
  "> Apple Pay\n" +
  "> Venmo\n" +
  "> Cash App";

// ==================================================
// UPDATE SERVICE MESSAGE
// ==================================================

async function updateServiceMessage(channel, embed, serviceName) {
  try {
    const messages = await channel.messages.fetch({ limit: 100 });

    const matching = messages.filter((msg) => {
      if (msg.author.id !== client.user.id || !msg.embeds.length) {
        return false;
      }

      const description = msg.embeds[0].description || "";

      if (serviceName === "DECOR") {
        return description.includes("# DECOR");
      }

      if (serviceName === "NITRO") {
        return description.includes("# NITRO");
      }

      if (serviceName === "BOOSTIES") {
        return (
          description.includes("# 1 MONTH") ||
          description.includes("# 3 MONTHS")
        );
      }

      return false;
    });

    const existing = matching.first();

    if (existing) {
      await existing.edit({
        content: "",
        embeds: [embed],
        components: []
      });

      for (const duplicate of matching.values()) {
        if (duplicate.id !== existing.id) {
          await duplicate.delete().catch(() => {});
        }
      }

      console.log(`${serviceName} message updated.`);
      return existing;
    }

    const sent = await channel.send({ embeds: [embed] });
    console.log(`${serviceName} message created.`);
    return sent;
  } catch (error) {
    console.error(`${serviceName} message error:`, error);
    throw error;
  }
}

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
    .setColor(0xFFFFFF);

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
    .setColor(0xFFFFFF);

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
    .setColor(0xFFFFFF);

  await updateServiceMessage(channel, embed, "BOOSTIES");
}

// ==================================================
// SELLERS EMBED
// ==================================================

function makeSellersEmbed() {
  return new EmbedBuilder()
    .setColor(0xFFFFFF)
    .setDescription(
      [
        "# .gg/chuppys sellers",
        "",
        `${SELLER_EMOJI} **<@1192248188409749684>**`,
        "Role: Services Seller",
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
        "Limit: $25",
        "ID: 1032693136163622993",
        "",
        `${SELLER_EMOJI} **<@1320199904219496530>**`,
        "Role: seller",
        "Limit: $30",
        "ID: 1320199904219496530",
        "",
        `${SELLER_EMOJI} **<@952566845939023892>**`,
        "Role: seller",
        "Limit: $45",
        "ID: 952566845939023892",
        "",
        `${SELLER_EMOJI} **<@1473335012769267807>**`,
        "Role: seller",
        "Limit: $100",
        "ID: 1473335012769267807",
        "",
        `${SELLER_EMOJI} **<@1472856287527309313>**`,
        "Role: seller",
        "Limit: $100",
        "ID: 1472856287527309313",
        "",
        `${SELLER_EMOJI} **<@1269188505935024141>**`,
        "Role: seller",
        "Limit: $250",
        "ID: 1269188505935024141",
        "",
        "-# my sellers are prohibited from dm’ing you, if for whatever reason they do please make a support ticket."
      ].join("\n")
    );
}

// ==================================================
// STAFF EMBED
// ==================================================

function makeStaffEmbed() {
  return new EmbedBuilder()
    .setColor(0xFFFFFF)
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
// CHUPPYS VOUCH EMBED
// ==================================================

function makeVouchEmbed({
  sellerId,
  buyerId,
  item,
  rating,
  proofUrl,
  proofName
}) {
  const stars = "⭐".repeat(rating);

  const embed = new EmbedBuilder()
    .setColor("#F2C8F2")
    .setAuthor({
      name: "new vouch  !!"
    })
    .setThumbnail(VOUCH_EMOJI_URL)
    .setDescription(
      [
        `**seller:** <@${sellerId}>`,
        `**buyer:** <@${buyerId}>`,
        `**item purchased:** ${item}`,
        `**rating:** ${rating}/5 ${stars}`,
        `**proof:** [${proofName}](${proofUrl})`,
        "",
        "*thank you for vouching! shop again ♡*"
      ].join("\n")
    );

  if (proofUrl && /\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(proofUrl)) {
    embed.setImage(proofUrl);
  }

  return embed;
}

// ==================================================
// SEND EMBED TO A DESTINATION CHANNEL
// ==================================================

async function sendEmbedToChannel(guild, channelId, embed, label) {
  const channel = await guild.channels.fetch(channelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error(`${label} channel not found or is not a text channel.`);
  }

  await channel.send({
    embeds: [embed],
    allowedMentions: { parse: [] }
  });
}

// ==================================================
// AFK HANDLER
// ==================================================

async function handleAFK(message) {
  const guildId = message.guild.id;
  const userId = message.author.id;
  const afkKey = `${guildId}:${userId}`;
  const rawContent = message.content.trim();

  const afkMatch = rawContent.match(/^,afk(?:\s+([\s\S]*))?$/i);

  if (afkMatch) {
    const reason = (afkMatch[1] || "No reason provided.")
      .trim()
      .slice(0, 500) || "No reason provided.";

    afkUsers.set(afkKey, {
      reason,
      since: Date.now(),
      username: message.author.username
    });

    await message.reply({
      content:
        `${AFK_GOING_EMOJI} ${message.author}, you're now AFK!\n` +
        `**Reason:** ${reason}`,
      allowedMentions: {
        repliedUser: false
      }
    });

    console.log(`${message.author.tag} is now AFK: ${reason}`);
    return true;
  }

  if (afkUsers.has(afkKey)) {
    const oldAFK = afkUsers.get(afkKey);
    afkUsers.delete(afkKey);

    await message.channel.send({
      content:
        `${AFK_RETURN_EMOJI} Welcome back, ${message.author}! ` +
        "Your AFK status has been removed.",
      allowedMentions: {
        parse: []
      }
    });

    console.log(
      `${message.author.tag} returned from AFK. Previous reason: ${oldAFK.reason}`
    );
  }

  const notifiedUsers = new Set();

  for (const [mentionedUserId, user] of message.mentions.users) {
    if (mentionedUserId === userId || user.bot) continue;

    const mentionedAFKKey = `${guildId}:${mentionedUserId}`;
    const afkData = afkUsers.get(mentionedAFKKey);

    if (!afkData || notifiedUsers.has(mentionedUserId)) continue;

    notifiedUsers.add(mentionedUserId);

    await message.channel.send({
      content:
        `${AFK_GOING_EMOJI} **${user.username} is currently AFK.**\n` +
        `**Reason:** ${afkData.reason}`,
      allowedMentions: {
        parse: []
      }
    });
  }

  return false;
}

// ==================================================
// MESSAGE COMMANDS + REACTION + AFK + VOUCH
// ==================================================

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot || !message.guild) return;

  // AUTOMATIC CHUPPY TY REACTION
  if (message.channel.id === CHUPPY_TY_CHANNEL_ID) {
    try {
      await message.react(CHUPPY_TY_EMOJI);
      console.log(`Added Chuppy TY reaction to message ${message.id}`);
    } catch (error) {
      console.error("Could not add Chuppy TY reaction:", error.message);
    }
  }

  try {
    // AFK SYSTEM
    const wasAFKCommand = await handleAFK(message);
    if (wasAFKCommand) return;

    const rawContent = message.content.trim();
    const content = rawContent.toLowerCase();

    // ==================================================
    // VOUCH COMMAND
    // Usage: ,vouch @seller 5 item purchased
    // Attach proof screenshot to the same message.
    // ==================================================

    if (content.startsWith(",vouch")) {
      if (message.channel.id !== VOUCH_CHANNEL_ID) {
        await message.reply({
          content: `Please submit vouches in <#${VOUCH_CHANNEL_ID}>.`,
          allowedMentions: {
            repliedUser: false
          }
        });
        return;
      }

      const match = rawContent.match(
        /^,vouch\s+<@!?(\d+)>\s+([1-5])\s+([\s\S]+)$/i
      );

      if (!match) {
        await message.reply({
          content:
            "Use `,vouch @seller 5 item purchased` and attach your proof screenshot to the same message.",
          allowedMentions: {
            repliedUser: false
          }
        });
        return;
      }

      const sellerId = match[1];
      const rating = Number(match[2]);
      const item = match[3].trim();

      if (sellerId === message.author.id) {
        await message.reply({
          content: "You cannot vouch for yourself.",
          allowedMentions: {
            repliedUser: false
          }
        });
        return;
      }

      if (sellerId === client.user.id) {
        await message.reply({
          content: "You cannot submit a seller vouch for the bot.",
          allowedMentions: {
            repliedUser: false
          }
        });
        return;
      }

      if (!item || item.length > 500) {
        await message.reply({
          content: "Please provide an item name (maximum 500 characters).",
          allowedMentions: {
            repliedUser: false
          }
        });
        return;
      }

      const proof = message.attachments.find((attachment) =>
        attachment.contentType?.startsWith("image/")
      );

      if (!proof) {
        await message.reply({
          content: "Please attach a proof screenshot to your vouch.",
          allowedMentions: {
            repliedUser: false
          }
        });
        return;
      }

      const sellerMember = await message.guild.members
        .fetch(sellerId)
        .catch(() => null);

      if (!sellerMember) {
        await message.reply({
          content:
            "I couldn't find that seller in this server. Please mention a server member.",
          allowedMentions: {
            repliedUser: false
          }
        });
        return;
      }

      const embed = makeVouchEmbed({
        sellerId,
        buyerId: message.author.id,
        item,
        rating,
        proofUrl: proof.url,
        proofName: proof.name || "proof.png"
      });

      await message.channel.send({
        embeds: [embed],
        allowedMentions: {
          users: [sellerId, message.author.id]
        }
      });

      await message.reply({
        content: "Your vouch has been submitted!",
        allowedMentions: {
          repliedUser: false
        }
      });

      console.log(
        `Vouch submitted by ${message.author.tag} for ${sellerMember.user.tag}: ${rating}/5, ${item}`
      );

      return;
    }

    // ==================================================
    // PAYMENT
    // ==================================================

    if (["!pay", ",pay", "!testpay"].includes(content)) {
      await sendPaymentEmbed(message.channel);
      return;
    }

    // ==================================================
    // ADMIN COMMAND PERMISSION CHECK
    // ==================================================

    const adminCommands = [
      "!nitro", ",nitro",
      "!decor", ",decor",
      "!boosties", ",boosties",
      "!sellers", ",sellers",
      "!staff", ",staff"
    ];

    if (adminCommands.includes(content)) {
      if (!message.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )) {
        await message.reply(
          "You need **Manage Server** permission to use this command."
        );
        return;
      }
    }

    // ==================================================
    // NITRO
    // ==================================================

    if (["!nitro", ",nitro"].includes(content)) {
      const channel = await client.channels.fetch(NITRO_CHANNEL_ID);
      await sendNitroServices(channel);
      await message.reply("Nitro message updated successfully.");
      return;
    }

    // ==================================================
    // DECOR
    // ==================================================

    if (["!decor", ",decor"].includes(content)) {
      const channel = await client.channels.fetch(DECOR_CHANNEL_ID);
      await sendDecorServices(channel);
      await message.reply("Decor message updated successfully.");
      return;
    }

    // ==================================================
    // BOOSTIES
    // ==================================================

    if (["!boosties", ",boosties"].includes(content)) {
      const channel = await client.channels.fetch(BOOSTIES_CHANNEL_ID);
      await sendBoostiesServices(channel);
      await message.reply("Boosties message updated successfully.");
      return;
    }

    // ==================================================
    // SELLERS
    // ==================================================

    if (["!sellers", ",sellers"].includes(content)) {
      await sendEmbedToChannel(
        message.guild,
        SELLERS_CHANNEL_ID,
        makeSellersEmbed(),
        "Sellers"
      );

      await message.reply("The sellers message was sent!");
      return;
    }

    // ==================================================
    // STAFF
    // ==================================================

    if (["!staff", ",staff"].includes(content)) {
      await sendEmbedToChannel(
        message.guild,
        STAFF_CHANNEL_ID,
        makeStaffEmbed(),
        "Staff"
      );

      await message.reply("The staff message was sent!");
      return;
    }

    // ==================================================
    // TEST WELCOME
    // ==================================================

    if (content === "!testwelcome") {
      const channel = await client.channels.fetch(WELCOME_CHANNEL_ID);

      if (!channel || !channel.isTextBased()) {
        await message.reply("Welcome channel not found.");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Welcome to .gg/chuppys 🤍")
        .setDescription(
          `Welcome ${message.author}!\n\n` +
          "We're happy to have you here. Make sure to read the rules and enjoy your time in the server!"
        )
        .setColor(0xFFFFFF)
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

    // ==================================================
    // TEST GOODBYE
    // ==================================================

    if (content === "!testgoodbye") {
      const channel = await client.channels.fetch(GOODBYE_CHANNEL_ID);

      if (!channel || !channel.isTextBased()) {
        await message.reply("Goodbye channel not found.");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Goodbye 🤍")
        .setDescription(
          `**${message.author.username}** has left **${message.guild.name}**.\n\n` +
          "We hope to see you again!"
        )
        .setColor(0xFFFFFF)
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({
          text: message.guild.name
        });

      await channel.send({
        embeds: [embed]
      });

      return;
    }
  } catch (error) {
    console.error("Message command error:", error);

    await message.reply(
      `Something went wrong: ${error.message}`
    ).catch(() => {});
  }
});

// ==================================================
// ERROR HANDLING
// ==================================================

client.on("error", (error) => {
  console.error("Discord client error:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
});

// ==================================================
// TOKEN CHECK AND LOGIN
// ==================================================

if (!TOKEN) {
  console.error(
    "DISCORD_BOT_TOKEN is missing from Render environment variables."
  );
  process.exit(1);
}

client.login(TOKEN)
  .then(() => console.log("Discord login successful."))
  .catch((error) => console.error("Discord login failed:", error));
