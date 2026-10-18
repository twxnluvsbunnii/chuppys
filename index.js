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
  SlashCommandBuilder,
  REST,
  Routes
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
// CONFIGURATION
// ==================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const WELCOME_CHANNEL_ID = "1530755165412524042";
const GOODBYE_CHANNEL_ID = "1530761366489530480";

const NITRO_CHANNEL_ID = "1555760937557041273";
const DECOR_CHANNEL_ID = "1555769588229345280";
const BOOSTIES_CHANNEL_ID = "1555769708928831489";

const SELLERS_CHANNEL_ID = "1551713598181605496";
const STAFF_CHANNEL_ID = "1561013244905132122";

const VOUCH_CHANNEL_ID = "1530811494168657980";
const WELCOME_ROLE_ID = "1531039846871728248";

const CHUPPY_TY_CHANNEL_ID = "1530811494168657980";
const CHUPPY_TY_EMOJI = "<:uppyty:1561094713153429746>";

const AFK_GOING_EMOJI = "<:chuppybye:1561103844832846014>";
const AFK_RETURN_EMOJI = "<:chuppyhi:1561103471325745242>";

const SERVICE_EMOJI = "<a:aBouncyDiscord:1557138733717782599>";
const BOOST_EMOJI = "<:white_nitro_boost:1557165507600326756>";
const SELLER_EMOJI = "<:chuppyseller:1560283615445778503>";

const VOUCH_EMOJI_ID = "1561197586554036318";
const VOUCH_EMOJI_URL =
  `https://cdn.discordapp.com/emojis/${VOUCH_EMOJI_ID}.png`;

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

const CASHAPP_USERNAME = "$yysluvv";
const CASHAPP_URL = "https://cash.app/$yysluvv";

const PAYPAL_USERNAME = "PayPal.me/twxnsrevenge";
const PAYPAL_URL = "https://paypal.me/twxnsrevenge";

const APPLE_PAY = "929-554-5969";
const ZELLE = "631-401-8951";

const PAYMENT_METHODS_TEXT =
  "**Payment Methods**\n> Apple Pay\n> Venmo\n> Cash App";

const afkUsers = new Map();
const processedVouchCommands = new Set();

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
// SLASH COMMAND DEFINITION
// ==================================================

const vouchSlashCommand = new SlashCommandBuilder()
  .setName("vouch")
  .setDescription("Submit a seller vouch")
  .addUserOption(option =>
    option
      .setName("seller")
      .setDescription("Who are you vouching for?")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName("rating")
      .setDescription("Rate the seller from 1 to 5")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(5)
  )
  .addStringOption(option =>
    option
      .setName("order")
      .setDescription("What did you purchase?")
      .setRequired(true)
      .setMaxLength(500)
  )
  .addAttachmentOption(option =>
    option
      .setName("proof")
      .setDescription("Upload a picture as proof")
      .setRequired(true)
  );

// ==================================================
// REGISTER /VOUCH WITHOUT REMOVING OTHER COMMANDS
// ==================================================

async function registerSlashCommands(readyClient) {
  if (!GUILD_ID || !TOKEN) {
    console.error(
      "[COMMANDS] DISCORD_GUILD_ID or DISCORD_BOT_TOKEN is missing."
    );
    return;
  }

  try {
    const rest = new REST({ version: "10" }).setToken(TOKEN);

    const route = Routes.applicationGuildCommands(
      readyClient.user.id,
      GUILD_ID
    );

    // Fetch the existing guild commands.
    const existingCommands = await rest.get(route);

    // Preserve all existing commands except the old /vouch.
    const preservedCommands = existingCommands
      .filter(command => command.name !== "vouch")
      .map(command => {
        const payload = {
          name: command.name,
          description: command.description,
          type: command.type
        };

        if (command.options?.length) {
          payload.options = command.options;
        }

        if (command.default_member_permissions != null) {
          payload.default_member_permissions =
            command.default_member_permissions;
        }

        if (command.dm_permission != null) {
          payload.dm_permission = command.dm_permission;
        }

        if (command.nsfw != null) {
          payload.nsfw = command.nsfw;
        }

        if (command.integration_types != null) {
          payload.integration_types = command.integration_types;
        }

        if (command.contexts != null) {
          payload.contexts = command.contexts;
        }

        return payload;
      });

    // Replace /vouch while preserving the other guild commands.
    await rest.put(route, {
      body: [
        ...preservedCommands,
        vouchSlashCommand.toJSON()
      ]
    });

    console.log(
      `[COMMANDS] /vouch registered for guild ${GUILD_ID}.`
    );
  } catch (error) {
    console.error("[COMMANDS] Registration failed:", error);
  }
}

// ==================================================
// VOUCH EMBED
// ==================================================

function makeVouchEmbed({
  sellerId,
  buyerId,
  item,
  rating,
  proofName
}) {
  return new EmbedBuilder()
    .setColor(0xE8B9E8)
    .setThumbnail(VOUCH_EMOJI_URL)
    .setDescription([
      "# NEW VOUCH",
      "",
      `**seller:** <@${sellerId}>`,
      `**buyer:** <@${buyerId}>`,
      `**items purchased:** ${item}`,
      `**rating:** ${rating}/5`,
      `**proof:** 📎 ${proofName}`,
      "",
      "*thank you for vouching! shop again ♡*"
    ].join("\n"))
    .setImage(`attachment://${proofName}`);
}

// ==================================================
// VOUCH VALIDATION AND POSTING
// ==================================================

async function submitVouch({
  guild,
  seller,
  buyer,
  rating,
  item,
  proof,
  uniqueId
}) {
  if (!guild) {
    throw new Error("This command must be used inside a server.");
  }

  if (!seller || !buyer) {
    throw new Error("Seller or buyer was not found.");
  }

  if (seller.id === buyer.id || seller.id === client.user.id) {
    throw new Error("You cannot vouch for yourself or the bot.");
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("Rating must be from 1 to 5.");
  }

  item = (item || "").trim();

  if (!item || item.length > 500) {
    throw new Error(
      "Order description must be between 1 and 500 characters."
    );
  }

  if (!proof || !proof.url) {
    throw new Error("Please attach a proof image.");
  }

  const isImage =
    proof.contentType?.startsWith("image/") ||
    /\.(png|jpe?g|gif|webp|avif)$/i.test(proof.name || "");

  if (!isImage) {
    throw new Error("Proof must be an image file.");
  }

  // Verify that the seller is a member of this server.
  const sellerMember = await guild.members
    .fetch(seller.id)
    .catch(() => null);

  if (!sellerMember) {
    throw new Error("I couldn't find that seller in this server.");
  }

  const channel = await guild.channels
    .fetch(VOUCH_CHANNEL_ID)
    .catch(() => null);

  if (
    !channel ||
    !channel.isTextBased() ||
    typeof channel.send !== "function"
  ) {
    throw new Error(
      "The configured vouch channel could not be found."
    );
  }

  const originalName = proof.name || "proof.png";

  const extension = originalName.match(
    /\.(png|jpe?g|gif|webp|avif)$/i
  )?.[0]?.toLowerCase() || ".png";

  const proofName = `vouch-${uniqueId}${extension}`;

  const embed = makeVouchEmbed({
    sellerId: seller.id,
    buyerId: buyer.id,
    item,
    rating,
    proofName
  });

  // Send the embed and proof image to the vouch channel.
  const posted = await channel.send({
    embeds: [embed],
    files: [
      {
        attachment: proof.url,
        name: proofName
      }
    ],
    allowedMentions: {
      users: [seller.id, buyer.id]
    }
  });

  // Add the thank-you reaction.
  await posted.react(CHUPPY_TY_EMOJI).catch(error => {
    console.error("[VOUCH] Could not add reaction:", error);
  });

  console.log(
    `[VOUCH] Embed posted successfully in #${channel.name}.`
  );

  return posted;
}

// ==================================================
// BOT READY
// ==================================================

client.once(Events.ClientReady, async readyClient => {
  console.log(`[READY] Logged in as ${readyClient.user.tag}`);
  console.log("[READY] Chuppys bot is online.");

  readyClient.user.setActivity(".gg/chuppys", {
    type: 3
  });

  await registerSlashCommands(readyClient);
});

// ==================================================
// SLASH COMMAND HANDLER
// LOG ALL INTERACTIONS BEFORE FILTERING
// ==================================================

client.on(Events.InteractionCreate, async interaction => {
  console.log(
    `[INTERACTION] Received interaction type ${interaction.type}` +
    (
      interaction.isChatInputCommand()
        ? `: /${interaction.commandName}`
        : ""
    )
  );

  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "vouch") return;

  console.log(
    `[VOUCH] Received /vouch from ${interaction.user.tag} ` +
    `(ID: ${interaction.user.id})`
  );

  // Acknowledge immediately so Discord does not time out.
  try {
    await interaction.deferReply({
      ephemeral: true
    });

    console.log("[VOUCH] Interaction acknowledged successfully.");
  } catch (error) {
    console.error(
      "[VOUCH] Could not acknowledge interaction:",
      error
    );
    return;
  }

  try {
    const seller = interaction.options.getUser("seller");
    const rating = interaction.options.getInteger("rating");
    const item = interaction.options.getString("order");
    const proof = interaction.options.getAttachment("proof");

    await submitVouch({
      guild: interaction.guild,
      seller,
      buyer: interaction.user,
      rating,
      item,
      proof,
      uniqueId: interaction.id
    });

    await interaction.editReply({
      content: "Your vouch has been submitted successfully!"
    });

    console.log(
      `[VOUCH] Success: buyer=${interaction.user.id}, ` +
      `seller=${seller.id}, rating=${rating}/5, order=${item}`
    );
  } catch (error) {
    console.error("[VOUCH] Interaction failed:", error);

    const errorMessage =
      error.message && error.message.length < 500
        ? error.message
        : "Unknown error. Please contact staff.";

    await interaction.editReply({
      content: `Your vouch could not be posted: ${errorMessage}`
    }).catch(editError => {
      console.error(
        "[VOUCH] Could not edit interaction reply:",
        editError
      );
    });
  }
});

// ==================================================
// WELCOME MESSAGE
// ==================================================

client.on(Events.GuildMemberAdd, async member => {
  try {
    const channel = await member.guild.channels.fetch(
      WELCOME_CHANNEL_ID
    );

    if (!channel || !channel.isTextBased()) return;

    await member.roles.add(WELCOME_ROLE_ID).catch(error => {
      console.error("[WELCOME] Could not assign role:", error);
    });

    const embed = new EmbedBuilder()
      .setTitle("Welcome to .gg/chuppys 🤍")
      .setDescription(
        `Welcome ${member}!\n\n` +
        "We're happy to have you here. Make sure to read the rules and enjoy your time in the server!"
      )
      .setColor(0xFFFFFF)
      .setThumbnail(member.user.displayAvatarURL())
      .setImage(WELCOME_IMAGE)
      .setFooter({
        text: member.guild.name
      });

    await channel.send({
      content: `${member}`,
      embeds: [embed]
    });

    console.log(`[WELCOME] Sent for ${member.user.tag}`);
  } catch (error) {
    console.error("[WELCOME] Error:", error);
  }
});

// ==================================================
// GOODBYE MESSAGE
// ==================================================

client.on(Events.GuildMemberRemove, async member => {
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
      .setFooter({
        text: member.guild.name
      });

    await channel.send({
      embeds: [embed]
    });

    console.log(`[GOODBYE] Sent for ${member.user.tag}`);
  } catch (error) {
    console.error("[GOODBYE] Error:", error);
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
        value: `\`${CASHAPP_USERNAME}\``
      },
      {
        name: "PayPal",
        value: `\`${PAYPAL_USERNAME}\``
      },
      {
        name: "Apple Pay",
        value: `\`${APPLE_PAY}\``
      },
      {
        name: "Zelle",
        value: `\`${ZELLE}\``
      }
    )
    .setColor(0xFFFFFF)
    .setFooter({
      text: ".gg/chuppys"
    });

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

  const messages = await channel.messages.fetch({
    limit: 100
  });

  const matches = messages.filter(msg =>
    msg.author.id === client.user.id &&
    msg.embeds.some(e => e.title === "Payment Methods")
  );

  const existing = matches.first();

  if (existing) {
    await existing.edit(payload);

    for (const duplicate of matches.values()) {
      if (duplicate.id !== existing.id) {
        await duplicate.delete().catch(() => {});
      }
    }

    console.log("[PAYMENT] Existing message updated.");
    return existing;
  }

  return channel.send(payload);
}

// ==================================================
// SERVICE MESSAGE UPDATER
// ==================================================

async function updateServiceMessage(channel, embed, serviceName) {
  try {
    const messages = await channel.messages.fetch({
      limit: 100
    });

    const matching = messages.filter(msg => {
      if (
        msg.author.id !== client.user.id ||
        !msg.embeds.length
      ) {
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

      console.log(`[${serviceName}] Message updated.`);
      return existing;
    }

    const sent = await channel.send({
      embeds: [embed]
    });

    console.log(`[${serviceName}] Message created.`);
    return sent;
  } catch (error) {
    console.error(`[${serviceName}] Update error:`, error);
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
      `${PAYMENT_METHODS_TEXT}\n\n**.gg/chuppys**`
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
      `${PAYMENT_METHODS_TEXT}\n\n**.gg/chuppys**`
    )
    .setColor(0xFFFFFF);

  await updateServiceMessage(channel, embed, "NITRO");
}

// ==================================================
// BOOSTIES MESSAGE
// ==================================================

async function sendBoostiesServices(channel) {
  const oneMonth = [
    ["2", "$1.25"],
    ["4", "$2.50"],
    ["6", "$3.75"],
    ["8", "$4.00"],
    ["10", "$5.25"],
    ["12", "$6.50"],
    ["14", "$7.00"],
    ["16", "$8.50"],
    ["18", "$9.00"],
    ["20", "$9.50"],
    ["30", "$11.00"]
  ];

  const threeMonths = [
    ["2", "$2.00"],
    ["4", "$4.00"],
    ["6", "$6.00"],
    ["8", "$8.00"],
    ["10", "$10.00"],
    ["12", "$12.00"],
    ["14", "$14.00"],
    ["16", "$16.00"],
    ["18", "$18.00"],
    ["20", "$20.00"],
    ["30", "$27.00"]
  ];

  const embed = new EmbedBuilder()
    .setDescription(
      `# 1 MONTH ${BOOST_EMOJI}\n\n` +
      oneMonth.map(([count, price]) =>
        `${BOOST_EMOJI} **${count} • ${price}**`
      ).join("\n") +
      `\n\n# 3 MONTHS ${BOOST_EMOJI}\n\n` +
      threeMonths.map(([count, price]) =>
        `${BOOST_EMOJI} **${count} • ${price}**`
      ).join("\n") +
      `\n\n${PAYMENT_METHODS_TEXT}\n\n**.gg/chuppys**`
    )
    .setColor(0xFFFFFF);

  await updateServiceMessage(channel, embed, "BOOSTIES");
}

// ==================================================
// SELLERS EMBED
// ==================================================

function makeSellersEmbed() {
  const sellers = [
    ["1192248188409749684", "Services Seller", "No limit"],
    ["1079241163455873074", "seller", "no limit"],
    ["1032693136163622993", "seller", "$25"],
    ["1320199904219496530", "seller", "$30"],
    ["952566845939023892", "seller", "$45"],
    ["1473335012769267807", "seller", "$100"],
    ["1472856287527309313", "seller", "$100"],
    ["1269188505935024141", "seller", "$250"]
  ];

  const lines = [
    "# .gg/chuppys sellers",
    ""
  ];

  for (const [id, role, limit] of sellers) {
    lines.push(
      `${SELLER_EMOJI} **<@${id}>**`,
      `Role: ${role}`,
      `Limit: ${limit}`,
      `ID: ${id}`,
      ""
    );
  }

  lines.push(
    "-# my sellers are prohibited from dm’ing you, if for whatever reason they do please open a support ticket."
  );

  return new EmbedBuilder()
    .setColor(0xFFFFFF)
    .setDescription(lines.join("\n"));
}

// ==================================================
// STAFF EMBED
// ==================================================

function makeStaffEmbed() {
  return new EmbedBuilder()
    .setColor(0xFFFFFF)
    .setDescription([
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
    ].join("\n"));
}

// ==================================================
// AFK HANDLER
// ==================================================

async function handleAFK(message) {
  const guildId = message.guild.id;
  const userId = message.author.id;
  const afkKey = `${guildId}:${userId}`;
  const rawContent = message.content.trim();

  const afkMatch = rawContent.match(
    /^,afk(?:\s+([\s\S]*))?$/i
  );

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

    console.log(`[AFK] ${message.author.tag}: ${reason}`);
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
      `[AFK] ${message.author.tag} returned. ` +
      `Previous reason: ${oldAFK.reason}`
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
// MESSAGE COMMANDS
// PREFIX VOUCH AND OTHER FEATURES
// ==================================================

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;

  const rawContent = message.content.trim();
  const content = rawContent.toLowerCase();

  // --------------------------------------------------
  // PREFIX VOUCH
  // Usage: ,vouch @seller 5 Nitro + attach proof image
  // --------------------------------------------------

  if (/^,vouch(?:\s|$)/i.test(rawContent)) {
    if (processedVouchCommands.has(message.id)) return;

    processedVouchCommands.add(message.id);

    const match = rawContent.match(
      /^,vouch\s+<@!?(\d+)>\s+([1-5])\s+([\s\S]+)$/i
    );

    if (!match) {
      await message.reply({
        content:
          "Use `,vouch @seller 5 Nitro` and attach your proof screenshot.",
        allowedMentions: {
          repliedUser: false
        }
      });

      return;
    }

    const sellerId = match[1];
    const rating = Number(match[2]);
    const item = match[3].trim();

    if (
      sellerId === message.author.id ||
      sellerId === client.user.id
    ) {
      await message.reply({
        content: "You cannot vouch for yourself or the bot.",
        allowedMentions: {
          repliedUser: false
        }
      });

      return;
    }

    const proof = message.attachments.find(attachment =>
      attachment.contentType?.startsWith("image/") ||
      /\.(png|jpe?g|gif|webp|avif)$/i.test(
        attachment.name || ""
      )
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

    try {
      await submitVouch({
        guild: message.guild,
        seller: { id: sellerId },
        buyer: message.author,
        rating,
        item,
        proof,
        uniqueId: message.id
      });

      await message.delete().catch(error => {
        console.error(
          "[VOUCH] Could not delete prefix command:",
          error
        );
      });

      console.log(
        `[VOUCH] Prefix vouch posted by ${message.author.tag}`
      );
    } catch (error) {
      console.error("[VOUCH] Prefix command failed:", error);

      await message.reply({
        content: `The vouch could not be posted: ${error.message}`,
        allowedMentions: {
          repliedUser: false
        }
      }).catch(() => {});
    }

    return;
  }

  // --------------------------------------------------
  // AFK
  // --------------------------------------------------

  try {
    const wasAFKCommand = await handleAFK(message);

    if (wasAFKCommand) return;

    // ------------------------------------------------
    // PAYMENT
    // ------------------------------------------------

    if (
      ["!pay", ",pay", "!testpay"].includes(content)
    ) {
      await sendPaymentEmbed(message.channel);
      return;
    }

    // ------------------------------------------------
    // ADMIN COMMANDS
    // ------------------------------------------------

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

    // ------------------------------------------------
    // NITRO
    // ------------------------------------------------

    if (["!nitro", ",nitro"].includes(content)) {
      const channel = await client.channels.fetch(
        NITRO_CHANNEL_ID
      );

      await sendNitroServices(channel);

      await message.reply(
        "Nitro message updated successfully."
      );

      return;
    }

    // ------------------------------------------------
    // DECOR
    // ------------------------------------------------

    if (["!decor", ",decor"].includes(content)) {
      const channel = await client.channels.fetch(
        DECOR_CHANNEL_ID
      );

      await sendDecorServices(channel);

      await message.reply(
        "Decor message updated successfully."
      );

      return;
    }

    // ------------------------------------------------
    // BOOSTIES
    // ------------------------------------------------

    if (["!boosties", ",boosties"].includes(content)) {
      const channel = await client.channels.fetch(
        BOOSTIES_CHANNEL_ID
      );

      await sendBoostiesServices(channel);

      await message.reply(
        "Boosties message updated successfully."
      );

      return;
    }

    // ------------------------------------------------
    // SELLERS
    // ------------------------------------------------

    if (["!sellers", ",sellers"].includes(content)) {
      await sendEmbedToChannel(
        message.guild,
        SELLERS_CHANNEL_ID,
        makeSellersEmbed(),
        "Sellers"
      );

      await message.reply(
        "The sellers message was sent!"
      );

      return;
    }

    // ------------------------------------------------
    // STAFF
    // ------------------------------------------------

    if (["!staff", ",staff"].includes(content)) {
      await sendEmbedToChannel(
        message.guild,
        STAFF_CHANNEL_ID,
        makeStaffEmbed(),
        "Staff"
      );

      await message.reply(
        "The staff message was sent!"
      );

      return;
    }

    // ------------------------------------------------
    // TEST WELCOME
    // ------------------------------------------------

    if (content === "!testwelcome") {
      const channel = await client.channels.fetch(
        WELCOME_CHANNEL_ID
      );

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

    // ------------------------------------------------
    // TEST GOODBYE
    // ------------------------------------------------

    if (content === "!testgoodbye") {
      const channel = await client.channels.fetch(
        GOODBYE_CHANNEL_ID
      );

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
    console.error("[MESSAGE COMMAND] Error:", error);

    await message.reply(
      `Something went wrong: ${error.message}`
    ).catch(() => {});
  }
});

// ==================================================
// AUTOMATIC REACTION IN CHUPPY TY CHANNEL
// ==================================================

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;

  if (message.channel.id !== CHUPPY_TY_CHANNEL_ID) return;

  try {
    await message.react(CHUPPY_TY_EMOJI);
  } catch (error) {
    console.error(
      "[REACTION] Could not add Chuppy TY reaction:",
      error
    );
  }
});

// ==================================================
// OTHER ERROR HANDLING
// ==================================================

client.on("error", error => {
  console.error("[DISCORD CLIENT] Error:", error);
});

process.on("unhandledRejection", error => {
  console.error("[PROCESS] Unhandled promise rejection:", error);
});

process.on("uncaughtException", error => {
  console.error("[PROCESS] Uncaught exception:", error);
});

// ==================================================
// SHARED EMBED SENDER
// ==================================================

async function sendEmbedToChannel(
  guild,
  channelId,
  embed,
  label
) {
  const channel = await guild.channels.fetch(channelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error(
      `${label} channel not found or is not a text channel.`
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
// TOKEN CHECK AND LOGIN
// ==================================================

if (!TOKEN) {
  console.error(
    "[STARTUP] DISCORD_BOT_TOKEN is missing from Render environment variables."
  );

  process.exit(1);
}

if (!GUILD_ID) {
  console.error(
    "[STARTUP] DISCORD_GUILD_ID is missing from Render environment variables."
  );

  process.exit(1);
}

client.login(TOKEN)
  .then(() => {
    console.log("[STARTUP] Discord login successful.");
  })
  .catch(error => {
    console.error("[STARTUP] Discord login failed:", error);
  });
