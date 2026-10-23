
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

const ROBUX_CASHOUT_CHANNEL_ID = "1552385740405473513";
const ROBUX_CASHOUT_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561094713153429746.png";

// ==================================================
// VOUCH COUNTER SETTINGS
// ==================================================

const PERSONAL_VOUCH_CHANNEL_ID = "1562227276051910676";
const VOUCH_CHANNEL_ID = "1530811494168657980";

const CHUPPY_COUNT_CHANNEL_ID = "1553242286412922960";
const SERVER_COUNT_CHANNEL_ID = "1562266346891247688";

const VOUCH_SOURCE_CHANNEL_IDS = [
  PERSONAL_VOUCH_CHANNEL_ID,
  VOUCH_CHANNEL_ID
];

const CHUPPY_COUNT_PREFIX = "﹕𐔌・chuppy total vouches : ";
const CHUPPY_COUNT_SUFFIX = " 〃・꒱";

const SERVER_COUNT_PREFIX = "﹕𐔌・server total vouches : ";
const SERVER_COUNT_SUFFIX = " 〃・꒱";

const WELCOME_ROLE_ID = "1531039846871728248";

const CHUPPY_TY_EMOJI = "<:uppyty:1561094713153429746>";

const INVITE_CHANNEL_ID = "1560249120667734016";
const INVITE_BOT_ID = "499595256270946326";
const INVITE_REACTION_EMOJI =
  "<:chuppynewinv:1561398288593330326>";

const AFK_GOING_EMOJI = "<:chuppybye:1561103844832846014>";
const AFK_RETURN_EMOJI = "<:chuppyhi:1561103471325745242>";

const PAYMENT_EMOJI_ID = "1561388594625511514";
const PAYMENT_EMOJI_URL =
  `https://cdn.discordapp.com/emojis/${PAYMENT_EMOJI_ID}.png`;

const SERVICE_EMOJI = "<a:aBouncyDiscord:1557138733717782599>";
const BOOST_EMOJI = "<:white_nitro_boost:1557165507600326756>";
const SELLER_EMOJI = "<:chuppyseller:1560283615445778503>";

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

// ==================================================
// AUTOMATIC VOUCH COUNTER STATE
// ==================================================

let vouchCounterTimer = null;
let vouchCounterUpdateRunning = false;
let vouchCounterRecountRequested = false;

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

// Existing vouch system
require("./vouch")(client);

// NEW: Transaction commands
// Keep transactions.js in the same folder as index.js.
require("./transactions")(client);

// ==================================================
// ROBUX CASH OUT EMBED
// ==================================================

async function sendRobuxCashoutEmbed(channel) {
  if (!channel || !channel.isTextBased() || !channel.messages) {
    throw new Error("Robux Cash Out channel not found or invalid.");
  }

  const embed = new EmbedBuilder()
    .setTitle("Cashing Out Robux\n\n")
    .setThumbnail(ROBUX_CASHOUT_THUMBNAIL_URL)
    .setDescription(
      "RATES\n\n" +
      "**Below 10k**\n" +
      "3/k\n\n" +
      "**Above 10k**\n" +
      "3.5/k\n\n" +
      "-# make a cash out ticket now !! make sure u ping me in tickets <:uppyty:1561094713153429746>"
    )
    .setColor("#FFFFFF")
    .setFooter({ text: ".gg/chuppys" });

  const payload = {
    embeds: [embed],
    allowedMentions: { parse: [] }
  };

  const messages = await channel.messages.fetch({ limit: 100 });

  const matches = messages.filter(message =>
    message.author.id === client.user.id &&
    message.embeds.some(existingEmbed => {
      const title = existingEmbed.title || "";
      return (
        title.startsWith("Cashing Out Robux") ||
        title.startsWith("Robux Cash out")
      );
    })
  );

  const existing = matches.first();

  if (existing) {
    await existing.edit(payload);

    for (const duplicate of matches.values()) {
      if (duplicate.id !== existing.id) {
        await duplicate.delete().catch(error => {
          console.error(
            "[ROBUX CASHOUT] Could not delete duplicate:",
            error
          );
        });
      }
    }

    console.log("[ROBUX CASHOUT] Existing embed updated.");
    return existing;
  }

  const sent = await channel.send(payload);
  console.log("[ROBUX CASHOUT] New embed created.");
  return sent;
}

// ==================================================
// AUTOMATIC VOUCH COUNTER FUNCTIONS
// ==================================================

async function countChannelMessages(channel) {
  if (!channel || !channel.isTextBased() || !channel.messages) {
    throw new Error(
      `Vouch source channel ${channel?.id || "unknown"} is unavailable.`
    );
  }

  let count = 0;
  let before;

  while (true) {
    const options = { limit: 100 };
    if (before) options.before = before;

    const messages = await channel.messages.fetch(options);

    if (messages.size === 0) break;

    count += messages.size;
    before = messages.last().id;

    if (messages.size < 100) break;
  }

  return count;
}

async function renameCounterChannel(channelId, name) {
  const channel = await client.channels.fetch(channelId);

  if (!channel || typeof channel.setName !== "function") {
    throw new Error(
      `Counter channel ${channelId} was not found or cannot be renamed.`
    );
  }

  if (channel.name !== name) {
    await channel.setName(name);
    console.log(`[VOUCH COUNTER] Updated channel name: ${name}`);
  }
}

async function recountAllVouches() {
  if (vouchCounterUpdateRunning) {
    vouchCounterRecountRequested = true;
    return;
  }

  vouchCounterUpdateRunning = true;

  try {
    do {
      vouchCounterRecountRequested = false;

      console.log("[VOUCH COUNTER] Starting full recount...");

      const personalChannel = await client.channels.fetch(
        PERSONAL_VOUCH_CHANNEL_ID
      );

      const regularChannel = await client.channels.fetch(
        VOUCH_CHANNEL_ID
      );

      const personalCount = await countChannelMessages(personalChannel);
      const regularCount = await countChannelMessages(regularChannel);

      const chuppyName =
        `${CHUPPY_COUNT_PREFIX}${personalCount}${CHUPPY_COUNT_SUFFIX}`;

      const serverTotal = personalCount + regularCount;
      const serverName =
        `${SERVER_COUNT_PREFIX}${serverTotal}${SERVER_COUNT_SUFFIX}`;

      await Promise.all([
        renameCounterChannel(CHUPPY_COUNT_CHANNEL_ID, chuppyName),
        renameCounterChannel(SERVER_COUNT_CHANNEL_ID, serverName)
      ]);

      console.log(
        `[VOUCH COUNTER] Personal: ${personalCount} | ` +
        `Regular: ${regularCount} | Server total: ${serverTotal}`
      );
    } while (vouchCounterRecountRequested);
  } catch (error) {
    console.error("[VOUCH COUNTER] Recount failed:", error);
  } finally {
    vouchCounterUpdateRunning = false;

    if (vouchCounterRecountRequested) {
      scheduleVouchCounterUpdate();
    }
  }
}

function scheduleVouchCounterUpdate() {
  clearTimeout(vouchCounterTimer);

  vouchCounterTimer = setTimeout(() => {
    recountAllVouches();
  }, 2000);
}

// ==================================================
// BOT READY
// ==================================================

client.once(Events.ClientReady, async readyClient => {
  console.log(`[READY] Logged in as ${readyClient.user.tag}`);
  console.log("[READY] Chuppys bot is online.");

  readyClient.user.setActivity(".gg/chuppys", { type: 3 });

  await recountAllVouches();

  setInterval(() => {
    if (client.isReady()) scheduleVouchCounterUpdate();
  }, 5 * 60 * 1000);
});

// ==================================================
// VOUCH COUNTER MESSAGE / DELETION LISTENERS
// ==================================================

client.on(Events.MessageCreate, message => {
  if (!VOUCH_SOURCE_CHANNEL_IDS.includes(message.channel.id)) return;
  scheduleVouchCounterUpdate();
});

client.on(Events.MessageDelete, message => {
  if (!VOUCH_SOURCE_CHANNEL_IDS.includes(message.channel.id)) return;
  scheduleVouchCounterUpdate();
});

client.on(Events.MessageBulkDelete, messages => {
  const affectsVouchChannel = messages.some(message =>
    VOUCH_SOURCE_CHANNEL_IDS.includes(message.channel.id)
  );

  if (affectsVouchChannel) scheduleVouchCounterUpdate();
});

// ==================================================
// WELCOME MESSAGE
// ==================================================

client.on(Events.GuildMemberAdd, async member => {
  try {
    const channel = await member.guild.channels.fetch(WELCOME_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    await member.roles.add(WELCOME_ROLE_ID).catch(error => {
      console.error("[WELCOME] Could not assign role:", error);
    });

    const embed = new EmbedBuilder()
      .setTitle(`Welcome to .gg/chuppys ${AFK_RETURN_EMOJI}`)
      .setDescription(
        `Welcome ${member}!\n\n` +
        "We're happy to have you here. Make sure to read the rules and enjoy your time in the server!"
      )
      .setColor("#FFFFFF")
      .setThumbnail(member.user.displayAvatarURL())
      .setImage(WELCOME_IMAGE)
      .setFooter({ text: member.guild.name });

    await channel.send({ content: `${member}`, embeds: [embed] });
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
    const channel = await member.guild.channels.fetch(GOODBYE_CHANNEL_ID);
    if (!channel || !channel.isTextBased()) return;

    const embed = new EmbedBuilder()
      .setTitle(`Goodbye ${AFK_GOING_EMOJI}`)
      .setDescription(
        `**${member.user.username}** has left **${member.guild.name}**.\n\n` +
        "We hope to see you again!"
      )
      .setColor("#FFFFFF")
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: member.guild.name });

    await channel.send({ embeds: [embed] });
    console.log(`[GOODBYE] Sent for ${member.user.tag}`);
  } catch (error) {
    console.error("[GOODBYE] Error:", error);
  }
});

// ==================================================
// PAYMENT EMBED — ,pay
// ==================================================

async function sendPaymentEmbed(channel) {
  if (!channel || !channel.isTextBased() || !channel.messages) {
    throw new Error("Payment channel not found or invalid.");
  }

  const embed = new EmbedBuilder()
    .setTitle("Payment Methods")
    .setDescription(
      "Choose a payment method below.\n\n" +
      "Please make sure the payment information is correct before sending."
    )
    .addFields(
      { name: "Cash App", value: `\`${CASHAPP_USERNAME}\`` },
      { name: "PayPal", value: `\`${PAYPAL_USERNAME}\`` },
      { name: "Apple Pay", value: `\`${APPLE_PAY}\`` },
      { name: "Zelle", value: `\`${ZELLE}\`` }
    )
    .setColor("#FFFFFF")
    .setThumbnail(PAYMENT_EMOJI_URL)
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

  const payload = { embeds: [embed], components: [row] };
  const messages = await channel.messages.fetch({ limit: 100 });

  const matches = messages.filter(msg =>
    msg.author.id === client.user.id &&
    msg.embeds.some(embed => embed.title === "Payment Methods")
  );

  const existing = matches.first();

  if (existing) {
    await existing.edit(payload);

    for (const duplicate of matches.values()) {
      if (duplicate.id !== existing.id) {
        await duplicate.delete().catch(error => {
          console.error("[PAYMENT] Could not delete duplicate:", error);
        });
      }
    }

    console.log("[PAYMENT] Existing message updated.");
    return existing;
  }

  const sent = await channel.send(payload);
  console.log("[PAYMENT] New message created.");
  return sent;
}

// ==================================================
// SERVICE MESSAGE UPDATER
// ==================================================

async function updateServiceMessage(channel, embed, serviceName) {
  try {
    if (!channel || !channel.isTextBased() || !channel.messages) {
      throw new Error(`${serviceName} channel not found or invalid.`);
    }

    const messages = await channel.messages.fetch({ limit: 100 });

    const matching = messages.filter(msg => {
      if (msg.author.id !== client.user.id || !msg.embeds.length) {
        return false;
      }

      const description = msg.embeds[0].description || "";

      if (serviceName === "DECOR") return description.includes("# DECOR");
      if (serviceName === "NITRO") return description.includes("# NITRO");

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
      await existing.edit({ content: "", embeds: [embed], components: [] });

      for (const duplicate of matching.values()) {
        if (duplicate.id !== existing.id) {
          await duplicate.delete().catch(() => {});
        }
      }

      console.log(`[${serviceName}] Message updated.`);
      return existing;
    }

    const sent = await channel.send({ embeds: [embed] });
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
      `${PAYMENT_METHODS_TEXT}\n\n**.gg/chuppys**`
    )
    .setColor("#FFFFFF");

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
    .setColor("#FFFFFF");

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

  const lines = ["# .gg/chuppys sellers", ""];

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
    .setColor("#FFFFFF")
    .setDescription(lines.join("\n"));
}

// ==================================================
// STAFF EMBED
// ==================================================

function makeStaffEmbed() {
  return new EmbedBuilder()
    .setColor("#FFFFFF")
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
// SHARED EMBED SENDER
// ==================================================

async function sendEmbedToChannel(guild, channelId, embed, label) {
  const channel = await guild.channels.fetch(channelId);

  if (!channel || !channel.isTextBased()) {
    throw new Error(
      `${label} channel not found or is not a text channel.`
    );
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
      allowedMentions: { repliedUser: false }
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
      allowedMentions: { parse: [] }
    });

    console.log(
      `[AFK] ${message.author.tag} returned. Previous reason: ${oldAFK.reason}`
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
      allowedMentions: { parse: [] }
    });
  }

  return false;
}

// ==================================================
// MESSAGE COMMANDS
// ==================================================

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) return;

  const content = message.content.trim().toLowerCase();

  try {
    const wasAFKCommand = await handleAFK(message);
    if (wasAFKCommand) return;

    if (content === "!robuxcashout") {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        await message.reply(
          "You need **Manage Server** permission to use this command."
        );
        return;
      }

      const channel = await client.channels.fetch(ROBUX_CASHOUT_CHANNEL_ID);
      await sendRobuxCashoutEmbed(channel);

      await message.reply(
        "Robux Cash Out message sent or updated successfully!"
      );
      return;
    }

    if (content === ",pay") {
      await sendPaymentEmbed(message.channel);
      return;
    }

    const adminCommands = [
      "!nitro", ",nitro",
      "!decor", ",decor",
      "!boosties", ",boosties",
      "!sellers", ",sellers",
      "!staff", ",staff"
    ];

    if (adminCommands.includes(content)) {
      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        await message.reply(
          "You need **Manage Server** permission to use this command."
        );
        return;
      }
    }

    if (["!nitro", ",nitro"].includes(content)) {
      const channel = await client.channels.fetch(NITRO_CHANNEL_ID);
      await sendNitroServices(channel);
      await message.reply("Nitro message updated successfully.");
      return;
    }

    if (["!decor", ",decor"].includes(content)) {
      const channel = await client.channels.fetch(DECOR_CHANNEL_ID);
      await sendDecorServices(channel);
      await message.reply("Decor message updated successfully.");
      return;
    }

    if (["!boosties", ",boosties"].includes(content)) {
      const channel = await client.channels.fetch(BOOSTIES_CHANNEL_ID);
      await sendBoostiesServices(channel);
      await message.reply("Boosties message updated successfully.");
      return;
    }

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

    if (content === "!testwelcome") {
      const channel = await client.channels.fetch(WELCOME_CHANNEL_ID);

      if (!channel || !channel.isTextBased()) {
        await message.reply("Welcome channel not found.");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Welcome to .gg/chuppys ${AFK_RETURN_EMOJI}`)
        .setDescription(
          `Welcome ${message.author}!\n\n` +
          "We're happy to have you here. Make sure to read the rules and enjoy your time in the server!"
        )
        .setColor("#FFFFFF")
        .setThumbnail(message.author.displayAvatarURL())
        .setImage(WELCOME_IMAGE)
        .setFooter({ text: message.guild.name });

      await channel.send({ content: `${message.author}`, embeds: [embed] });
      return;
    }

    if (content === "!testgoodbye") {
      const channel = await client.channels.fetch(GOODBYE_CHANNEL_ID);

      if (!channel || !channel.isTextBased()) {
        await message.reply("Goodbye channel not found.");
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Goodbye ${AFK_GOING_EMOJI}`)
        .setDescription(
          `**${message.author.username}** has left **${message.guild.name}**.\n\n` +
          "We hope to see you again!"
        )
        .setColor("#FFFFFF")
        .setThumbnail(message.author.displayAvatarURL())
        .setFooter({ text: message.guild.name });

      await channel.send({ embeds: [embed] });
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
// AUTOMATIC REACTION — INVITE BOT MESSAGES
// ==================================================

client.on(Events.MessageCreate, async message => {
  if (!message.guild) return;
  if (message.channel.id !== INVITE_CHANNEL_ID) return;
  if (message.author.id !== INVITE_BOT_ID) return;

  try {
    await message.react(INVITE_REACTION_EMOJI);

    console.log(
      `[INVITE REACTION] Added reaction to message ${message.id}`
    );
  } catch (error) {
    console.error(
      "[INVITE REACTION] Could not react to invite message:",
      error
    );
  }
});

// ==================================================
// ERROR HANDLING
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
// START BOT
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

client.login(TOKEN).catch(error => {
  console.error("[STARTUP] Discord login failed:", error);
});
