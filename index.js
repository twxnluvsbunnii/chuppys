
"use strict";

// ============================================================
// CHUPPYS MAIN BOT — DISCORD.JS V14 / RENDER
// COMPLETE UPDATED INDEX.JS
// ============================================================
//
// MODULES:
// - vouch.js
// - transactions.js
// - tickets.js
//
// UPDATES:
// - Shorter ,welcome embed
// - No hearts in ,welcome
// - Faster ,welcome response
// - No 1,000-message scan for ,welcome
// - Repeated ,welcome edits cached embed
// - No staff restriction on ,welcome
// - Correct rules channel for verification
// - All existing systems preserved
//
// REQUIREMENTS:
// - Node.js 18+
// - discord.js v14
// - Message Content intent enabled
// - Server Members intent enabled
// - DISCORD_BOT_TOKEN environment variable
// - DISCORD_GUILD_ID environment variable
//
// Run only one instance on Render.
//
// ============================================================
// IMPORTS
// ============================================================

const http = require("http");
const { createHash } = require("node:crypto");

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  Events,
  PermissionsBitField,
  PermissionFlagsBits,
  MessageFlags,
  SlashCommandBuilder,
  REST,
  Routes,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  ActivityType
} = require("discord.js");

// ============================================================
// RENDER SERVER
// ============================================================

const PORT = Number(process.env.PORT) || 3000;

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("Chuppys bot is running!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`[WEB] Listening on port ${PORT}`);
});

// ============================================================
// ENVIRONMENT
// ============================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const BRAND = ".gg/chuppys";
const WHITE = 0xffffff;
const EPHEMERAL = MessageFlags.Ephemeral;

const NONE = {
  parse: []
};

// ============================================================
// GENERAL CHANNELS
// ============================================================

const WELCOME_CHANNEL_ID = "1530755165412524042";
const GOODBYE_CHANNEL_ID = "1530761366489530480";

const NITRO_CHANNEL_ID = "1555760937557041273";
const DECOR_CHANNEL_ID = "1555769588229345280";
const BOOSTIES_CHANNEL_ID = "1555769708928831489";

const SELLERS_CHANNEL_ID = "1551713598181605496";
const STAFF_CHANNEL_ID = "1561013244905132122";

const ROBUX_CASHOUT_CHANNEL_ID =
  "1552385740405473513";

const ROBUX_CASHOUT_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561094713153429746.png";

const REQUEST_CHANNEL_ID =
  "1569732416388726834";

const REQUEST_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561388594625511514.png?size=128&quality=lossless";

const VERIFY_CHANNEL_ID =
  "1528716328985301052";

const ROLES_CHANNEL_ID =
  "1530808091380285592";

const RANKED_ROLES_CHANNEL_ID =
  "1567178497917718568";

const RANKED_ROLES_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1568404337154068618.png?size=128&quality=lossless";

const QUESTION_CHANNEL_ID =
  "1566490648549527602";

const QUESTION_TICKET_CHANNEL_ID =
  "1530811385678790716";

const TICKET_SUPPORT_ROLE_ID =
  "1563003884656398406";

// Correct rules channel.
const RULES_CHANNEL_ID =
  "1551275482857865336";

const QUICK_VOUCH_CHANNEL_ID =
  "1552903786077360269";

const PARTNER_AD_CHANNEL_ID =
  "1552387259276329110";

const INVITE_CHANNEL_ID =
  "1560249120667734016";

const INVITE_BOT_ID =
  "499595256270946326";

// ============================================================
// VOUCH TUTORIAL CHANNELS
// ============================================================

const VOUCH_TUTORIAL_CHANNEL_ID =
  "1562958688896028802";

const INVITE_VOUCH_TUTORIAL_CHANNEL_ID =
  "1572990426351407287";

const GIVEAWAY_VOUCH_TUTORIAL_CHANNEL_ID =
  "1572990469506596934";

const CONVERTER_VOUCH_TUTORIAL_CHANNEL_ID =
  "1573509380366925844";

// ============================================================
// VOUCH SOURCE CHANNELS
// ============================================================

const PERSONAL_VOUCH_CHANNEL_ID =
  "1562227276051910676";

const VOUCH_CHANNEL_ID =
  "1530811494168657980";

const GIVEAWAY_VOUCH_CHANNEL_ID =
  "1572974320781885450";

const INVITE_VOUCH_CHANNEL_ID =
  "1572972324930724041";

const CONVERTER_VOUCH_CHANNEL_ID =
  "1573189115162402857";

const VOUCH_SOURCE_CHANNEL_IDS = [
  PERSONAL_VOUCH_CHANNEL_ID,
  VOUCH_CHANNEL_ID,
  INVITE_VOUCH_CHANNEL_ID,
  GIVEAWAY_VOUCH_CHANNEL_ID,
  CONVERTER_VOUCH_CHANNEL_ID
];

// ============================================================
// VOUCH COUNTERS
// ============================================================

const COUNT_CATEGORY_ID =
  "1566512371521036329";

const CHUPPY_COUNT_CHANNEL_ID =
  "1553242286412922960";

const SERVER_COUNT_CHANNEL_ID =
  "1562266346891247688";

const INVITE_COUNT_CHANNEL_ID =
  process.env.INVITE_COUNT_CHANNEL_ID || "";

const GIVEAWAY_COUNT_CHANNEL_ID =
  process.env.GIVEAWAY_COUNT_CHANNEL_ID || "";

const CONVERTER_COUNT_CHANNEL_ID =
  process.env.CONVERTER_COUNT_CHANNEL_ID || "";

const COUNT_NAMES = Object.freeze({
  personal: "╭・chuppy total vouches : ",
  invite: "┃・invite・vouches : ",
  giveaway: "┃・giveaway・vouches : ",
  converter: "┃・converter・vouches : ",
  server: "╰・server total vouches : "
});

// ============================================================
// VOUCH SETTINGS
// ============================================================

const CHUPPY_TY_EMOJI =
  "<:uppyty:1561094713153429746>";

const AUTO_ROUTE_VOUCHES =
  process.env.AUTO_ROUTE_VOUCHES !== "false";

const VOUCH_ORIGIN_MARKER =
  "CHUPPYS_VOUCH_ORIGIN";

const PERSONAL_SELLER_IDS = [
  "1530733554869473320",
  "1490962480963260466"
];

// ============================================================
// STAFF ROLES
// ============================================================

const OWNER_ROLE_ID =
  "1530988662970650865";

const ADMIN_ROLE_ID =
  "1531800870444994641";

const MOD_ROLE_ID =
  "1531800784700706887";

const VERIFICATION_STAFF_ROLE_IDS = [
  OWNER_ROLE_ID,
  ADMIN_ROLE_ID,
  MOD_ROLE_ID,
  TICKET_SUPPORT_ROLE_ID
];

// ============================================================
// BLACKLIST
// ============================================================

const BLACKLIST_ROLE_NAME = "Blacklisted";

const BLACKLIST_ROLE_ID =
  process.env.BLACKLIST_ROLE_ID || "";

const BLACKLIST_LOG_CHANNEL_ID =
  "1572620097267437743";

const UNBLACKLIST_BUTTON_ID =
  "chuppys_unblacklist_request";

const UNBLACKLIST_PANEL_TITLE =
  "Request to Be Unblacklisted";

const UNBLACKLIST_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561103471325745242.png";

// ============================================================
// VERIFICATION
// ============================================================

const VERIFY_BUTTON_ID =
  "chuppys_verify";

const VERIFY_TICKET_BUTTON_ID =
  "chuppys_create_verification_ticket";

const VERIFY_SECURE_TICKET_BUTTON_ID =
  "chuppys_secure_verification_ticket_v2";

const VERIFY_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561103471325745242.png";

const VERIFY_BUTTON_EMOJI_ID =
  "1561103471325745242";

const CHUPPYS_ROLE_ID =
  "1550230619127021568";

const CLIENT_ROLE_ID =
  "1550373434301878282";

const CLIENT_BUTTON_ID =
  "chuppys_client";

const CLIENT_EMOJI_ID =
  "1569091548468219985";

const CLIENT_EMOJI =
  "<:unis:1569091548468219985>";

const WELCOME_ROLE_ID =
  "1531039846871728248";

const VERIFICATION_TICKET_CATEGORY_ID =
  process.env.VERIFICATION_TICKET_CATEGORY_ID || "";

// Updated welcome title — no hearts.
const VERIFICATION_WELCOME_TITLE =
  "Welcome to Chuppy's";

// ============================================================
// PING ROLES
// ============================================================

const PING_ROLES = Object.freeze({
  welcome: "1531039846871728248",
  announcement: "1531084435716571137",
  streaming: "1531104789075853472",
  giveaway: "1531104886630907925",
  stock: "1531105107586973696",
  cashout: "1551276593425682543",
  flashsale: "1558913216602706011",
  partnership: "1568240267344093254",
  adoptme: "1568240367076122634",
  robux: "1568283533879939123",
  mm2: "1568240484206514248"
});

const PING_ROLE_IDS =
  Object.values(PING_ROLES);

const AGE_ROLES = Object.freeze({
  under18: "1531084465126772877",
  age18to20: "1531084550849954003",
  age21plus: "1531084611399188640"
});

const AGE_ROLE_IDS =
  Object.values(AGE_ROLES);

const PRONOUN_ROLES = Object.freeze({
  sheher: "1531084942241697854",
  hehim: "1531086100867842190",
  theythem: "1531101006451048448"
});

const PRONOUN_ROLE_IDS =
  Object.values(PRONOUN_ROLES);

// ============================================================
// SELF ROLE MENUS
// ============================================================

const ROLE_MENU_IDS = {
  pings: "chuppys_self_roles",
  age: "chuppys_second_roles",
  pronouns: "chuppys_pronoun_roles"
};

const ROLE_MENU_CONFIG = {
  pings: {
    customId: ROLE_MENU_IDS.pings,
    title: "• pings // •",
    placeholder: "♡ choose your roles",
    roles: PING_ROLE_IDS,

    options: [
      ["Welcome Ping", PING_ROLES.welcome],
      ["Announcement Ping", PING_ROLES.announcement],
      ["Services Ping", PING_ROLES.streaming],
      ["Giveaway Ping", PING_ROLES.giveaway],
      ["Stock Ping", PING_ROLES.stock],
      ["Cash Out", PING_ROLES.cashout],
      ["Flash Sale Ping", PING_ROLES.flashsale],
      ["Partnership Ping", PING_ROLES.partnership],
      ["Adopt Me Ping", PING_ROLES.adoptme],
      ["Robux Ping", PING_ROLES.robux],
      ["MM2 Ping", PING_ROLES.mm2]
    ],

    thumbnail:
      "https://cdn.discordapp.com/emojis/1561034658311966761.png?size=128&quality=lossless",

    success:
      "﹕𐔌・your roles have been updated〃・꒱ 🤍"
  },

  age: {
    customId: ROLE_MENU_IDS.age,
    title: "• age // •",
    placeholder: "♡ choose your roles",
    roles: AGE_ROLE_IDS,

    options: [
      ["﹕𐔌・- 18 〃・꒱", AGE_ROLES.under18],
      ["﹕𐔌・18 - 20 〃・꒱", AGE_ROLES.age18to20],
      ["﹕𐔌・21 + 〃・꒱", AGE_ROLES.age21plus]
    ],

    success:
      "﹕𐔌・your age roles have been updated〃・꒱ 🤍"
  },

  pronouns: {
    customId: ROLE_MENU_IDS.pronouns,
    title: "• pronouns // •",
    placeholder: "♡ choose your pronouns",
    roles: PRONOUN_ROLE_IDS,

    options: [
      ["﹕𐔌・she / her〃・꒱", PRONOUN_ROLES.sheher],
      ["﹕𐔌・he / him〃・꒱", PRONOUN_ROLES.hehim],
      ["﹕𐔌・they / them〃・꒱", PRONOUN_ROLES.theythem]
    ],

    success:
      "﹕𐔌・your pronouns have been updated〃・꒱ 🤍"
  }
};

const ROLE_COMMANDS = {
  ",roles": "pings",
  ",pings": "pings",
  ",age": "age",
  ",pronouns": "pronouns",
  ",pronoun": "pronouns"
};

// ============================================================
// RANKED ROLES
// ============================================================

const RANKED_ROLE_IDS = [
  "1550374791217680485",
  "1562961485091573902",
  "1550374678449754163",
  "1561439464327483583",
  "1550374524640436235",
  "1550374377130827856",
  "1550374079385575454",
  "1550373983336144936",
  "1550373843170889728",
  "1550373695204360252",
  "1550373612144304219"
];

// ============================================================
// EMOJIS / IMAGES
// ============================================================

const INVITE_REACTION_EMOJI =
  "<:chuppynewinv:1561398288593330326>";

const AFK_GOING_EMOJI =
  "<:chuppybye:1561103844832846014>";

const AFK_RETURN_EMOJI =
  "<:chuppyhi:1561103471325745242>";

const QUESTION_EMOJI =
  "<:chuppypayment:1561388594625511514>";

const QUESTION_EMOJI_URL =
  "https://cdn.discordapp.com/emojis/1561388594625511514.png";

const PAYMENT_EMOJI_URL =
  QUESTION_EMOJI_URL;

const SERVICE_EMOJI =
  "<a:aBouncyDiscord:1557138733717782599>";

const BOOST_EMOJI =
  "<:white_nitro_boost:1557165507600326756>";

const SELLER_EMOJI =
  "<:chuppyseller:1560284517955141653>";

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

const VOUCH_TUTORIAL_IMAGES = {
  command:
    "https://raw.githubusercontent.com/twxnluvsbunnii/chuppys/main/IMG_5265.jpeg",

  completed:
    "https://raw.githubusercontent.com/twxnluvsbunnii/chuppys/main/IMG_5267.jpeg",

  success:
    "https://raw.githubusercontent.com/twxnluvsbunnii/chuppys/main/IMG_5266.jpeg"
};

// ============================================================
// PAYMENT SETTINGS
// ============================================================

const PAYMENT_METHODS_TEXT =
  "**Payment Methods**\n" +
  "> Apple Pay\n" +
  "> Venmo\n" +
  "> Cash App\n" +
  "> Chime";

const EXTRA_PAYMENT_METHODS = [5, 6].map(n => ({
  name: process.env[`PAYMENT_METHOD_${n}_NAME`] || "",
  details: process.env[`PAYMENT_METHOD_${n}_DETAILS`] || "",
  url: process.env[`PAYMENT_METHOD_${n}_URL`] || ""
}));

// ============================================================
// SLASH COMMANDS
// ============================================================

const QUESTION_COMMAND = new SlashCommandBuilder()
  .setName("question")
  .setDescription("Submit a question to the Chuppys team.")
  .addStringOption(option =>
    option
      .setName("question")
      .setDescription("Type the question you want to ask.")
      .setRequired(true)
      .setMaxLength(2000)
  )
  .addAttachmentOption(option =>
    option
      .setName("picture")
      .setDescription("Optionally attach a picture.")
      .setRequired(false)
  );

const REQUEST_COMMAND = new SlashCommandBuilder()
  .setName("request")
  .setDescription("Request items for Chuppys to stock up on.")
  .addStringOption(option =>
    option
      .setName("category")
      .setDescription("Choose the request category.")
      .setRequired(true)
      .addChoices(
        ...[
          "Baddies",
          "MM2",
          "Adopt Me",
          "Blade Ball",
          "Robux"
        ].map(name => ({
          name,
          value: name
        }))
      )
  )
  .addStringOption(option =>
    option
      .setName("items")
      .setDescription("What should Chuppys stock up on?")
      .setRequired(true)
      .setMaxLength(1000)
  );

const HELP_COMMAND = new SlashCommandBuilder()
  .setName("help")
  .setDescription("View Chuppys bot commands.");

// ============================================================
// RUNTIME
// ============================================================

const afkUsers = new Map();

const locks = {
  seller: new Set(),
  client: new Set(),
  welcome: new Set(),
  promoter: new Set(),
  role: new Set(),
  roleSelect: new Set(),
  payment: new Set(),
  blacklist: new Set(),
  appeal: new Set(),
  vouchRoute: new Set(),
  vouchTutorial: new Set(),
  verifyApprove: new Set()
};

// Fast welcome message tracking.
//
// Stores the message ID by channel.
// No full message-history scan required.
//
// Memory resets when the bot restarts.

const welcomeMessageIds = new Map();

const blacklistRoleJobs = new Map();

let vouchCounterTimer = null;
let vouchCounterUpdateRunning = false;
let vouchCounterRecountRequested = false;
let counterCache = null;

const routedMessages = new Set();

// ============================================================
// DISCORD CLIENT
// ============================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ============================================================
// LOAD MODULES
// ============================================================

require("./vouch")(client);
require("./transactions")(client);

const ticketModule = require("./tickets");

if (
  typeof ticketModule !== "function" ||
  !ticketModule.command
) {
  throw new Error(
    "tickets.js must export a setup function and command."
  );
}

ticketModule(client);

console.log(
  "[MODULES] Vouch, transactions and tickets loaded."
);

// ============================================================
// GENERAL HELPERS
// ============================================================

function safeText(value, max = 1900) {
  return String(value ?? "")
    .replace(/@/g, "＠")
    .slice(0, max);
}

function ephemeral(content) {
  return {
    content,
    flags: EPHEMERAL,
    allowedMentions: NONE
  };
}

function whiteEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(WHITE)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: BRAND
    });
}

function canManageServer(member) {
  return Boolean(
    member?.permissions?.has(
      PermissionFlagsBits.ManageGuild
    )
  );
}

function isTicketSupport(member) {
  return Boolean(
    member?.roles?.cache?.has(
      TICKET_SUPPORT_ROLE_ID
    )
  );
}

function isVerificationStaff(member) {
  if (!member?.guild) {
    return false;
  }

  return Boolean(
    member.id === member.guild.ownerId ||
    member.permissions?.has(
      PermissionFlagsBits.Administrator
    ) ||
    VERIFICATION_STAFF_ROLE_IDS.some(
      id => member.roles.cache.has(id)
    )
  );
}

function lock(set, key) {
  if (set.has(key)) {
    return false;
  }

  set.add(key);

  return true;
}

async function privateNotice(user, content) {
  try {
    await user.send({
      content,
      allowedMentions: NONE
    });
  } catch {
    console.warn(
      `[DM] Unable to notify ${user.id}`
    );
  }
}

async function interactionError(interaction, error) {
  console.error("[INTERACTION]", error);

  if (!interaction.isRepliable()) {
    return;
  }

  const content =
    "Something went wrong while processing that interaction.";

  try {
    if (interaction.deferred) {
      return await interaction.editReply({
        content
      });
    }

    if (interaction.replied) {
      return await interaction.followUp(
        ephemeral(content)
      );
    }

    return await interaction.reply(
      ephemeral(content)
    );

  } catch (replyError) {
    console.error(
      "[INTERACTION] Reply failed:",
      replyError
    );
  }
}

// ============================================================
// BOT MESSAGE HELPERS
// ============================================================
//
// Used for other panel commands.
//
// ,welcome DOES NOT use the history-scanning helper.
//
// ============================================================

async function findBotMessages(
  channel,
  predicate,
  pages = 10
) {
  const results = [];
  let before;

  for (let i = 0; i < pages; i++) {
    const batch = await channel.messages.fetch({
      limit: 100,
      ...(before ? { before } : {})
    });

    if (!batch.size) {
      break;
    }

    for (const message of batch.values()) {
      if (
        message.author?.id === client.user.id &&
        predicate(message)
      ) {
        results.push(message);
      }
    }

    if (batch.size < 100) {
      break;
    }

    before = batch.last().id;
  }

  results.sort(
    (a, b) =>
      b.createdTimestamp - a.createdTimestamp
  );

  return results;
}

async function upsertBotMessage(
  channel,
  predicate,
  payload,
  pages = 1
) {
  const matching = await findBotMessages(
    channel,
    predicate,
    pages
  );

  let result;

  if (matching.length) {
    result = await matching[0].edit(payload);

    for (const duplicate of matching.slice(1)) {
      await duplicate.delete().catch(console.error);
    }

  } else {
    result = await channel.send(payload);
  }

  return {
    message: result,
    updated: matching.length > 0
  };
}

// ============================================================
// FAST ,WELCOME EMBED
// ============================================================
//
// COMMAND:
// ,welcome
//
// FEATURES:
// - Short professional message
// - No hearts
// - White embed
// - No staff restrictions
// - No ticket category restrictions
// - Immediate send on first command
// - Edits cached message on repeated commands
// - No history scan
//
// ============================================================

function makeVerificationWelcomeEmbed() {
  return new EmbedBuilder()
    .setColor(WHITE)
    .setTitle(
      VERIFICATION_WELCOME_TITLE
    )
    .setThumbnail(
      VERIFY_THUMBNAIL_URL
    )
    .setDescription(
      "Welcome to **.gg/chuppys**!\n\n" +

      "Please complete these steps to get verified:\n\n" +

      "**1. Invited By**\n" +
      "Tell us who invited you.\n\n" +

      "**2. Invite Proof**\n" +
      "Send a clear screenshot showing your invite.\n\n" +

      "**3. Complete Your Roles**\n" +
      `Select your roles in <#${ROLES_CHANNEL_ID}>.\n\n` +

      "**4. Request Verification**\n" +
      `When finished, ping <@&${TICKET_SUPPORT_ROLE_ID}>.\n\n` +

      "-# Please complete all steps before pinging staff."
    )
    .setFooter({
      text: `${BRAND} • Verification`
    });
}

// ============================================================
// FAST ,WELCOME COMMAND HANDLER
// ============================================================

async function handleWelcomeCommand(message) {
  const channelId = message.channel.id;

  if (!lock(locks.welcome, channelId)) {
    return;
  }

  try {
    const payload = {
      content: "",
      embeds: [
        makeVerificationWelcomeEmbed()
      ],
      components: [],
      allowedMentions: NONE
    };

    const previousMessageId =
      welcomeMessageIds.get(channelId);

    // ========================================================
    // UPDATE PREVIOUS CACHED WELCOME
    // ========================================================

    if (previousMessageId) {
      try {
        // Direct message fetch only.
        // No searching through channel history.

        const previousMessage =
          message.channel.messages.cache.get(
            previousMessageId
          ) ||
          await message.channel.messages.fetch(
            previousMessageId
          );

        if (
          previousMessage &&
          previousMessage.author.id === client.user.id
        ) {
          await previousMessage.edit(payload);

          console.log(
            `[WELCOME] Updated embed in ${channelId}`
          );

          return;
        }

      } catch (error) {
        console.warn(
          "[WELCOME] Previous message unavailable:",
          error.message
        );
      }

      welcomeMessageIds.delete(channelId);
    }

    // ========================================================
    // SEND NEW WELCOME IMMEDIATELY
    // ========================================================

    const sent = await message.channel.send(
      payload
    );

    welcomeMessageIds.set(
      channelId,
      sent.id
    );

    console.log(
      `[WELCOME] Sent embed in ${channelId}`
    );

  } catch (error) {
    console.error(
      "[WELCOME COMMAND ERROR]",
      error
    );

    await message.reply({
      content:
        "I couldn't send the welcome embed. " +
        "Check my Send Messages and Embed Links permissions.",

      allowedMentions: {
        parse: [],
        repliedUser: false
      }
    }).catch(console.error);

  } finally {
    locks.welcome.delete(channelId);
  }
}

// ============================================================
// BLACKLIST LOOKUP
// ============================================================

async function findBlacklistRole(guild) {
  if (BLACKLIST_ROLE_ID) {
    const configured =
      guild.roles.cache.get(BLACKLIST_ROLE_ID) ||
      await guild.roles.fetch(
        BLACKLIST_ROLE_ID
      ).catch(() => null);

    if (configured) {
      return configured;
    }
  }

  let role = guild.roles.cache.find(
    r =>
      r.name.toLowerCase() ===
      BLACKLIST_ROLE_NAME.toLowerCase()
  );

  if (role) {
    return role;
  }

  await guild.roles.fetch();

  return guild.roles.cache.find(
    r =>
      r.name.toLowerCase() ===
      BLACKLIST_ROLE_NAME.toLowerCase()
  ) || null;
}

async function ensureBlacklistRole(guild) {
  if (blacklistRoleJobs.has(guild.id)) {
    return blacklistRoleJobs.get(guild.id);
  }

  const job = (async () => {
    const existing = await findBlacklistRole(guild);

    if (existing) {
      return existing;
    }

    return guild.roles.create({
      name: BLACKLIST_ROLE_NAME,
      color: 0x2b2b2b,
      hoist: false,
      mentionable: false,
      permissions: [],
      reason:
        "Chuppys blacklist moderation system"
    });
  })();

  blacklistRoleJobs.set(guild.id, job);

  try {
    return await job;
  } finally {
    blacklistRoleJobs.delete(guild.id);
  }
}

async function isBlacklisted(member) {
  if (!member?.guild) {
    return false;
  }

  const role = await findBlacklistRole(
    member.guild
  );

  return Boolean(
    role &&
    member.roles.cache.has(role.id)
  );
}

function canBlacklist(member) {
  if (!member?.guild) {
    return false;
  }

  return Boolean(
    member.id === member.guild.ownerId ||
    [
      OWNER_ROLE_ID,
      ADMIN_ROLE_ID,
      MOD_ROLE_ID
    ].some(
      id => member.roles.cache.has(id)
    )
  );
}

function canModerateTarget(actor, target) {
  return Boolean(
    actor &&
    target &&
    actor.id !== target.id &&
    target.id !== target.guild.ownerId &&
    (
      actor.id === actor.guild.ownerId ||
      actor.roles.highest.position >
        target.roles.highest.position
    )
  );
}

// ============================================================
// BLACKLIST EMBEDS
// ============================================================

function makeBlacklistEmbed(
  target,
  moderator,
  reason
) {
  return whiteEmbed(
    "Member Blacklisted",

    `**Member:** <@${target.id}>\n` +
    `**User ID:** \`${target.id}\`\n\n` +

    "**Reason for Blacklist**\n" +
    `${safeText(reason, 1000)}\n\n` +

    `**Blacklisted By:** <@${moderator.id}>\n\n` +

    "The member has received the Blacklisted role."
  )
    .setThumbnail(
      target.user.displayAvatarURL()
    )
    .setTimestamp();
}

function makeBlacklistDMEmbed(guild, reason) {
  return whiteEmbed(
    "You Have Been Blacklisted",

    `You have been blacklisted from **${safeText(guild.name)}**.\n\n` +

    "**Reason**\n" +
    `${safeText(reason, 1000)}\n\n` +

    "Your normal server access has been restricted.\n\n" +

    "**Want to Appeal?**\n" +
    "Use the server's unblacklist appeal panel " +
    "to request a review.\n\n" +

    "An appeal does not guarantee removal."
  )
    .setThumbnail(
      UNBLACKLIST_THUMBNAIL_URL
    )
    .setTimestamp();
}

function makeUnblacklistPanelEmbed() {
  return whiteEmbed(
    UNBLACKLIST_PANEL_TITLE,

    "Have you been blacklisted from **.gg/chuppys**?\n\n" +

    "If you believe your blacklist should be reconsidered, " +
    "you can request an appeal.\n\n" +

    "**How to Appeal**\n\n" +

    "1. Click **Request Unblacklist Ticket**.\n\n" +
    "2. Explain why you were blacklisted.\n\n" +
    "3. Explain why the blacklist should be removed.\n\n" +
    "4. Provide relevant screenshots or proof.\n\n" +
    "5. Wait for staff to review your appeal.\n\n" +

    "**Important**\n" +
    "Submitting an appeal does not guarantee approval. " +
    "Do not spam duplicate appeals."
  ).setThumbnail(
    UNBLACKLIST_THUMBNAIL_URL
  );
}

function makeUnblacklistPanelButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(
          UNBLACKLIST_BUTTON_ID
        )
        .setLabel(
          "Request Unblacklist Ticket"
        )
        .setEmoji({
          id: VERIFY_BUTTON_EMOJI_ID
        })
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

// ============================================================
// UNBLACKLIST PANEL
// ============================================================

async function postUnblacklistPanel(channel) {
  return upsertBotMessage(
    channel,

    message =>
      message.embeds.some(
        embed =>
          embed.title === UNBLACKLIST_PANEL_TITLE
      ) ||
      message.components.some(
        row =>
          row.components.some(
            component =>
              component.customId ===
              UNBLACKLIST_BUTTON_ID
          )
      ),

    {
      content: "",
      embeds: [
        makeUnblacklistPanelEmbed()
      ],
      components:
        makeUnblacklistPanelButtons(),
      allowedMentions: NONE
    },

    10
  );
}

async function handleUnblacklistPanelCommand(message) {
  if (!canBlacklist(message.member)) {
    return message.reply(
      "Only Owner, Admin and Mod can post this panel."
    );
  }

  if (!lock(
    locks.appeal,
    message.channel.id
  )) {
    return message.reply(
      "The appeal panel is already being updated."
    );
  }

  try {
    const result = await postUnblacklistPanel(
      message.channel
    );

    await message.reply({
      content:
        `Unblacklist appeal panel ` +
        `${result.updated ? "updated" : "posted"} successfully!`,

      allowedMentions: {
        repliedUser: false
      }
    });

  } finally {
    locks.appeal.delete(
      message.channel.id
    );
  }
}

// ============================================================
// BLACKLIST COMMAND
// ============================================================

async function handleBlacklistCommand(
  message,
  targetId,
  reason
) {
  if (!canBlacklist(message.member)) {
    return message.reply(
      "Only Owner, Admin and Mod can blacklist members."
    );
  }

  const clean =
    String(reason || "").trim();

  if (!clean) {
    return message.reply(
      "A blacklist reason is required."
    );
  }

  if (clean.length > 1000) {
    return message.reply(
      "The reason must be 1000 characters or fewer."
    );
  }

  const key =
    `${message.guild.id}:${targetId}`;

  if (!lock(locks.blacklist, key)) {
    return message.reply(
      "A blacklist action is already processing."
    );
  }

  try {
    const guild = message.guild;

    const actor = await guild.members.fetch({
      user: message.author.id,
      force: true
    });

    const target = await guild.members.fetch({
      user: targetId,
      force: true
    }).catch(() => null);

    if (!target) {
      return message.reply(
        "I couldn't find that member."
      );
    }

    if (target.user.bot) {
      return message.reply(
        "You cannot blacklist bots."
      );
    }

    if (!canModerateTarget(actor, target)) {
      return message.reply(
        "You cannot blacklist yourself, the owner, " +
        "or someone with an equal or higher role."
      );
    }

    const bot = await guild.members.fetchMe();

    if (!bot.permissions.has(
      PermissionFlagsBits.ManageRoles
    )) {
      return message.reply(
        "The bot needs Manage Roles permission."
      );
    }

    if (
      target.roles.highest.position >=
      bot.roles.highest.position
    ) {
      return message.reply(
        "Move the bot role above the target member's roles."
      );
    }

    const blacklisted =
      await ensureBlacklistRole(guild);

    if (
      blacklisted.managed ||
      blacklisted.position >=
        bot.roles.highest.position
    ) {
      return message.reply(
        "Move the Blacklisted role below the bot role."
      );
    }

    if (
      target.roles.cache.has(blacklisted.id)
    ) {
      return message.reply(
        "That member is already blacklisted."
      );
    }

    const unremovable =
      target.roles.cache.filter(
        role =>
          role.id !== guild.id &&
          role.id !== blacklisted.id &&
          (
            role.managed ||
            role.position >=
              bot.roles.highest.position
          )
      );

    if (unremovable.size) {
      return message.reply(
        "Some member roles cannot be removed. " +
        "Check the bot's role hierarchy."
      );
    }

    await target.roles.set(
      [blacklisted.id],
      `Blacklisted by ${actor.user.tag}: ${clean.slice(0, 400)}`
    );

    let logged = false;
    let dmed = false;

    try {
      const channel =
        await guild.channels.fetch(
          BLACKLIST_LOG_CHANNEL_ID
        );

      await channel.send({
        embeds: [
          makeBlacklistEmbed(
            target,
            actor,
            clean
          )
        ],
        allowedMentions: NONE
      });

      logged = true;

    } catch (error) {
      console.error(
        "[BLACKLIST] Log:",
        error
      );
    }

    try {
      await target.user.send({
        embeds: [
          makeBlacklistDMEmbed(
            guild,
            clean
          )
        ],
        allowedMentions: NONE
      });

      dmed = true;

    } catch (error) {
      console.error(
        "[BLACKLIST] DM:",
        error.message
      );
    }

    await message.reply({
      embeds: [
        whiteEmbed(
          "Blacklist Applied",

          `**Member:** <@${target.id}>\n\n` +
          `**Reason:** ${safeText(clean, 1000)}\n\n` +
          "**Roles:** Replaced with Blacklisted role.\n" +
          `**Log:** ${logged ? "Sent" : "Failed"}\n` +
          `**DM:** ${dmed ? "Sent" : "Failed"}`
        ).setTimestamp()
      ],

      allowedMentions: NONE
    });

  } finally {
    locks.blacklist.delete(key);
  }
}

// ============================================================
// ROLE PANELS
// ============================================================

function makeRoleEmbed(type) {
  const config =
    ROLE_MENU_CONFIG[type];

  const embed = whiteEmbed(
    config.title,

    config.roles
      .map(id => `<@&${id}>`)
      .join("\n\n") +

    "\n\nplease choose your roles below ♡"
  );

  if (config.thumbnail) {
    embed.setThumbnail(
      config.thumbnail
    );
  }

  return embed;
}

function makeRoleDropdown(type) {
  const config =
    ROLE_MENU_CONFIG[type];

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(config.customId)
      .setPlaceholder(config.placeholder)
      .setMinValues(0)
      .setMaxValues(config.options.length)
      .addOptions(
        config.options.map(
          ([label, value]) => ({
            label,
            value
          })
        )
      )
  );
}

async function postRolePanel(guild, type) {
  const channel =
    await guild.channels.fetch(
      ROLES_CHANNEL_ID
    );

  if (!channel?.messages || !channel.send) {
    throw new Error(
      "The roles channel is unavailable."
    );
  }

  return upsertBotMessage(
    channel,

    message =>
      message.components.some(
        row =>
          row.components.some(
            component =>
              component.customId ===
              ROLE_MENU_CONFIG[type].customId
          )
      ),

    {
      embeds: [
        makeRoleEmbed(type)
      ],
      components: [
        makeRoleDropdown(type)
      ],
      allowedMentions: NONE
    },

    10
  );
}

async function handleRolePanelCommand(message, type) {
  if (!canManageServer(message.member)) {
    return message.reply(
      "You need Manage Server permission."
    );
  }

  const key =
    `${message.guild.id}:${type}`;

  if (!lock(locks.role, key)) {
    return message.reply(
      "That role panel is already updating."
    );
  }

  try {
    const result = await postRolePanel(
      message.guild,
      type
    );

    await message.reply(
      `${type} panel ${result.updated ? "updated" : "posted"} ` +
      `in <#${ROLES_CHANNEL_ID}>!`
    );

  } finally {
    locks.role.delete(key);
  }
}

async function handleRoleSelection(
  interaction,
  type
) {
  const config =
    ROLE_MENU_CONFIG[type];

  if (!config || !interaction.inGuild()) {
    return interaction.reply(
      ephemeral("Invalid role selection.")
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const key =
    `${interaction.guildId}:${interaction.user.id}:${type}`;

  if (!lock(locks.roleSelect, key)) {
    return interaction.editReply(
      "Your previous role selection is still processing."
    );
  }

  try {
    const selected =
      new Set(interaction.values);

    if (
      [...selected].some(
        id => !config.roles.includes(id)
      )
    ) {
      throw new Error(
        "An invalid role was selected."
      );
    }

    const member =
      await interaction.guild.members.fetch({
        user: interaction.user.id,
        force: true
      });

    if (await isBlacklisted(member)) {
      return interaction.editReply(
        "You are blacklisted and cannot claim self roles."
      );
    }

    const bot =
      await interaction.guild.members.fetchMe();

    for (const id of config.roles) {
      const role =
        interaction.guild.roles.cache.get(id) ||
        await interaction.guild.roles.fetch(id)
          .catch(() => null);

      if (
        !role ||
        role.managed ||
        role.position >=
          bot.roles.highest.position
      ) {
        throw new Error(
          `The bot cannot manage role ${id}.`
        );
      }
    }

    const current =
      config.roles.filter(
        id => member.roles.cache.has(id)
      );

    const changed =
      current.length !== selected.size ||
      current.some(
        id => !selected.has(id)
      );

    if (changed) {
      const unchanged =
        member.roles.cache
          .filter(
            role =>
              !config.roles.includes(role.id)
          )
          .map(role => role.id);

      await member.roles.set(
        [...unchanged, ...selected],
        `Chuppys ${type} self-role selection`
      );
    }

    await interaction.editReply(
      config.success
    );

  } catch (error) {
    console.error(
      `[SELF ROLES] ${type}:`,
      error
    );

    await interaction.editReply(
      "Your roles could not be updated. Please contact staff."
    ).catch(console.error);

  } finally {
    locks.roleSelect.delete(key);
  }
}

// ============================================================
// VERIFICATION PANEL
// ============================================================

function makeVerificationEmbed() {
  return whiteEmbed(
    "Verify to Access .gg/chuppys",

    "Welcome to **.gg/chuppys**!\n\n" +

    "For the safety of our community, all new members " +
    "must complete **manual verification through a ticket**.\n\n" +

    "**HOW TO VERIFY**\n\n" +

    `**1.** Select your preferred roles in <#${ROLES_CHANNEL_ID}>.\n\n` +

    "**2.** Click **Create Verification Ticket** below.\n\n" +

    "**3.** Answer the questions asked by our staff.\n\n" +

    "**4.** Wait for staff to review and approve your verification.\n\n" +

    "**IMPORTANT**\n\n" +

    "Verification is not automatic.\n\n" +

    "Opening a ticket does not instantly grant server access.\n\n" +

    "Please do not open duplicate tickets or share " +
    "passwords, login codes, or private account information."
  ).setThumbnail(
    VERIFY_THUMBNAIL_URL
  );
}

function makeVerificationButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(
        VERIFY_TICKET_BUTTON_ID
      )
      .setLabel(
        "Create Verification Ticket"
      )
      .setEmoji({
        id: VERIFY_BUTTON_EMOJI_ID
      })
      .setStyle(
        ButtonStyle.Primary
      )
  );
}

async function sendOrUpdateVerificationMessage() {
  try {
    const channel =
      await client.channels.fetch(
        VERIFY_CHANNEL_ID
      );

    if (!channel?.messages) {
      throw new Error(
        "Verification channel unavailable."
      );
    }

    await upsertBotMessage(
      channel,

      message =>
        message.embeds.some(
          embed =>
            embed.title ===
            "Verify to Access .gg/chuppys"
        ) ||
        message.components.some(
          row =>
            row.components.some(
              component =>
                [
                  VERIFY_BUTTON_ID,
                  VERIFY_TICKET_BUTTON_ID,
                  VERIFY_SECURE_TICKET_BUTTON_ID
                ].includes(component.customId)
            )
        ),

      {
        content: "",
        embeds: [
          makeVerificationEmbed()
        ],
        components: [
          makeVerificationButton()
        ],
        allowedMentions: NONE
      },

      10
    );

    console.log(
      "[VERIFY] Verification panel updated."
    );

  } catch (error) {
    console.error(
      "[VERIFY] Panel:",
      error
    );
  }
}

// ============================================================
// OFFICIAL VERIFICATION TICKET CHECK
// ============================================================

async function isOfficialVerificationTicket(channel) {
  if (
    !channel?.guild ||
    channel.type !== ChannelType.GuildText
  ) {
    return false;
  }

  if (
    !/^(?:closed-)?verification-\d+$/i.test(
      channel.name
    )
  ) {
    return false;
  }

  if (!channel.parentId) {
    return false;
  }

  const parent =
    await channel.guild.channels.fetch(
      channel.parentId
    ).catch(() => null);

  if (
    !parent ||
    parent.type !== ChannelType.GuildCategory
  ) {
    return false;
  }

  if (VERIFICATION_TICKET_CATEGORY_ID) {
    return (
      parent.id ===
      VERIFICATION_TICKET_CATEGORY_ID
    );
  }

  const normalized =
    parent.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  const approvedNames = new Set([
    "chuppysverification",
    "verificationtickets",
    "verificationticket",
    "verification",
    "verifytickets",
    "verify"
  ]);

  return approvedNames.has(normalized);
}

// ============================================================
// VERIFICATION TICKET OPENER
// ============================================================

async function verificationTicketOwnerId(channel) {
  if (
    !(await isOfficialVerificationTicket(channel))
  ) {
    return null;
  }

  const numberMatch =
    channel.name.match(
      /verification-(\d+)$/i
    );

  if (!numberMatch) {
    return null;
  }

  const expectedNumber =
    Number(numberMatch[1]);

  let before;

  for (let page = 0; page < 10; page++) {
    const messages =
      await channel.messages.fetch({
        limit: 100,
        ...(before ? { before } : {})
      });

    if (!messages.size) {
      break;
    }

    for (const message of messages.values()) {
      if (
        message.author.id !== client.user.id
      ) {
        continue;
      }

      const hasControls =
        message.components.some(
          row =>
            row.components.some(
              component =>
                [
                  "chuppys_ticket_claim",
                  "chuppys_ticket_close"
                ].includes(component.customId) ||
                String(
                  component.customId || ""
                ).startsWith("chuppys_ticket:")
            )
        );

      if (!hasControls) {
        continue;
      }

      for (const embed of message.embeds) {
        const title =
          String(embed.title || "");

        if (
          !/verification\s+ticket/i.test(title)
        ) {
          continue;
        }

        const titleNumber =
          title.match(/#\s*0*(\d+)/);

        if (
          !titleNumber ||
          Number(titleNumber[1]) !==
            expectedNumber
        ) {
          continue;
        }

        const description =
          String(embed.description || "");

        const ownerMatch =
          description.match(
            /welcome\s*<@!?(\d{17,20})>/i
          );

        if (ownerMatch) {
          return ownerMatch[1];
        }
      }
    }

    if (messages.size < 100) {
      break;
    }

    before =
      messages.last().id;
  }

  return null;
}

// ============================================================
// HIDE VERIFICATION COMMAND
// ============================================================

async function hideVerificationCommand(message) {
  const bot =
    await message.guild.members.fetchMe();

  const permissions =
    message.channel.permissionsFor(bot);

  if (
    !permissions?.has(
      PermissionFlagsBits.ManageMessages
    )
  ) {
    await privateNotice(
      message.author,
      "Verification was not processed because " +
      "the bot needs Manage Messages permission."
    );

    return false;
  }

  try {
    await message.delete();

    return true;

  } catch (error) {
    console.error(
      "[VERIFY] Could not delete command:",
      error
    );

    await privateNotice(
      message.author,
      "Verification was not processed because " +
      "the command could not be hidden."
    );

    return false;
  }
}

// ============================================================
// MANUAL VERIFICATION
// ============================================================
//
// COMMAND:
// ,r @user c
//
// ============================================================

async function approveVerification(message, targetId) {
  if (!isVerificationStaff(message.member)) {
    return;
  }

  const official =
    await isOfficialVerificationTicket(
      message.channel
    );

  if (!official) {
    await privateNotice(
      message.author,
      "Verification approval only works " +
      "inside an official verification ticket."
    );

    return;
  }

  const ticketOwnerId =
    await verificationTicketOwnerId(
      message.channel
    );

  if (!ticketOwnerId) {
    await privateNotice(
      message.author,
      "I couldn't verify the owner of this ticket. " +
      "Make sure the original ticket message still exists."
    );

    return;
  }

  if (ticketOwnerId !== targetId) {
    await privateNotice(
      message.author,
      "You can only verify the member " +
      "who opened this verification ticket."
    );

    return;
  }

  const key =
    `${message.guild.id}:${targetId}`;

  if (!lock(locks.verifyApprove, key)) {
    await privateNotice(
      message.author,
      "Verification is already processing."
    );

    return;
  }

  try {
    const guild = message.guild;

    const member =
      await guild.members.fetch({
        user: targetId,
        force: true
      }).catch(() => null);

    if (!member) {
      await privateNotice(
        message.author,
        "That member is no longer in the server."
      );

      return;
    }

    if (member.user.bot) {
      return;
    }

    if (await isBlacklisted(member)) {
      await privateNotice(
        message.author,
        "This member is blacklisted and cannot be verified."
      );

      return;
    }

    if (
      member.roles.cache.has(
        CHUPPYS_ROLE_ID
      )
    ) {
      await privateNotice(
        message.author,
        "This member is already verified."
      );

      return;
    }

    const bot =
      await guild.members.fetchMe();

    const verifiedRole =
      guild.roles.cache.get(
        CHUPPYS_ROLE_ID
      ) ||
      await guild.roles.fetch(
        CHUPPYS_ROLE_ID
      ).catch(() => null);

    if (!verifiedRole) {
      await privateNotice(
        message.author,
        "The verified role could not be found."
      );

      return;
    }

    if (
      !bot.permissions.has(
        PermissionFlagsBits.ManageRoles
      ) ||
      verifiedRole.managed ||
      verifiedRole.position >=
        bot.roles.highest.position
    ) {
      await privateNotice(
        message.author,
        "The bot needs Manage Roles permission " +
        "and must be above the verified role."
      );

      return;
    }

    await member.roles.add(
      CHUPPYS_ROLE_ID,
      `Manually verified by ${message.author.tag} ` +
      `in ticket ${message.channel.id}`
    );

    const rulesUrl =
      `https://discord.com/channels/` +
      `${guild.id}/${RULES_CHANNEL_ID}`;

    const embed = whiteEmbed(
      "Verification Approved ♡",

      `**Member:** <@${member.id}>\n\n` +

      `**Approved by:** <@${message.author.id}>\n\n` +

      "Your verification has been approved!\n\n" +

      "You now have access to **.gg/chuppys**.\n\n" +

      "**♡ SERVER RULES**\n" +
      `Please review <#${RULES_CHANNEL_ID}>.\n\n` +

      `[Click Here to Read the Rules](${rulesUrl})\n\n` +

      "**♡ SERVER ROLES**\n" +
      `Please select your roles in <#${ROLES_CHANNEL_ID}>.\n\n` +

      "Thank you for verifying! Welcome to Chuppy's! ♡"
    ).setTimestamp();

    await message.channel.send({
      content: `<@${member.id}>`,
      embeds: [embed],

      allowedMentions: {
        users: [member.id]
      }
    });

    console.log(
      `[VERIFY] ${member.id} approved by ${message.author.id}`
    );

  } catch (error) {
    console.error(
      "[VERIFY] Approval failed:",
      error
    );

    await privateNotice(
      message.author,
      "Verification failed. Check the bot's permissions."
    );

  } finally {
    locks.verifyApprove.delete(key);
  }
}

// ============================================================
// SLASH COMMAND REGISTRATION
// ============================================================

async function registerQuestionCommand() {
  if (!TOKEN || !GUILD_ID || !client.user) {
    return;
  }

  const rest = new REST({
    version: "10"
  }).setToken(TOKEN);

  const route =
    Routes.applicationGuildCommands(
      client.user.id,
      GUILD_ID
    );

  try {
    const existing =
      await rest.get(route);

    const commands = [
      QUESTION_COMMAND,
      REQUEST_COMMAND,
      HELP_COMMAND,
      ticketModule.command
    ];

    for (const definition of commands) {
      const body =
        definition.toJSON();

      const found =
        existing.find(
          command =>
            command.name === body.name
        );

      if (found) {
        await rest.patch(
          Routes.applicationGuildCommand(
            client.user.id,
            GUILD_ID,
            found.id
          ),
          { body }
        );

      } else {
        await rest.post(
          route,
          { body }
        );
      }

      console.log(
        `[COMMANDS] Registered /${body.name}`
      );
    }

  } catch (error) {
    console.error(
      "[COMMANDS] Registration failed:",
      error
    );
  }
}

// ============================================================
// QUESTION PERMISSIONS
// ============================================================

function canReplyToQuestion(interaction) {
  if (!interaction.inGuild()) {
    return false;
  }

  const permissions =
    interaction.memberPermissions;

  if (
    permissions?.has(
      PermissionsBitField.Flags.Administrator
    ) ||
    permissions?.has(
      PermissionsBitField.Flags.ManageGuild
    ) ||
    permissions?.has(
      PermissionsBitField.Flags.ManageMessages
    )
  ) {
    return true;
  }

  const roles =
    interaction.member?.roles;

  return Boolean(
    roles?.cache?.has?.(
      TICKET_SUPPORT_ROLE_ID
    ) ||
    (
      Array.isArray(roles) &&
      roles.includes(
        TICKET_SUPPORT_ROLE_ID
      )
    )
  );
}

// ============================================================
// CLIENT PANEL
// ============================================================

function makeClientEmbed() {
  return new EmbedBuilder()
    .setColor(WHITE)
    .setDescription(
      "Thank you for shopping at **.gg/chuppys**!\n\n" +

      "Please click the button below for the client role " +
      "to be able to successfully submit a vouch."
    )
    .setThumbnail(
      `https://cdn.discordapp.com/emojis/${CLIENT_EMOJI_ID}.png`
    )
    .setFooter({
      text: BRAND
    });
}

function makeClientButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(CLIENT_BUTTON_ID)
      .setLabel("client")
      .setEmoji({
        id: CLIENT_EMOJI_ID
      })
      .setStyle(ButtonStyle.Secondary)
  );
}

// ============================================================
// VOUCH FORWARD HELPERS
// ============================================================

function isForward(message) {
  const type =
    message.reference?.type ??
    message.messageReference?.type ??
    -1;

  return Number(type) === 1;
}

function getSnapshot(message) {
  return (
    message.messageSnapshots?.first?.() ||
    [
      ...(message.messageSnapshots?.values?.() || [])
    ][0] ||
    null
  );
}

function getVouchData(message) {
  return getSnapshot(message) || message;
}

function getEmbeds(message) {
  const data = getVouchData(message);

  return [
    ...(data.embeds || [])
  ];
}

function getAttachments(message) {
  const data = getVouchData(message);

  return [
    ...(data.attachments?.values?.() || [])
  ];
}

function getOriginalReference(message) {
  const reference =
    message.reference ||
    message.messageReference;

  if (!isForward(message)) {
    return null;
  }

  const messageId =
    reference?.messageId ||
    reference?.message_id;

  const channelId =
    reference?.channelId ||
    reference?.channel_id;

  if (messageId && channelId) {
    return `${channelId}:${messageId}`;
  }

  return null;
}

function getMoveOrigin(message) {
  for (const embed of getEmbeds(message)) {
    const footer =
      embed.footer?.text || "";

    const match = footer.match(
      /CHUPPYS_VOUCH_ORIGIN:(\d{17,20}):(\d{17,20})/
    );

    if (match) {
      return `${match[1]}:${match[2]}`;
    }
  }

  return null;
}

function normalizedVouchText(value) {
  return String(value || "")
    .replace(
      /CHUPPYS_VOUCH_ORIGIN:\d{17,20}:\d{17,20}/g,
      ""
    )
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function vouchFingerprint(message) {
  const data = getVouchData(message);

  const embeds =
    getEmbeds(message).map(embed => ({
      title:
        normalizedVouchText(embed.title),

      description:
        normalizedVouchText(embed.description),

      fields:
        (embed.fields || []).map(field => ({
          name:
            normalizedVouchText(field.name),

          value:
            normalizedVouchText(field.value)
        })),

      image: embed.image?.url || ""
    }));

  const attachments =
    getAttachments(message)
      .map(
        attachment =>
          attachment.url ||
          attachment.name ||
          ""
      )
      .sort();

  const content =
    normalizedVouchText(data.content);

  if (
    !content &&
    !embeds.length &&
    !attachments.length
  ) {
    return null;
  }

  return createHash("sha256")
    .update(JSON.stringify({
      content,
      embeds,
      attachments
    }))
    .digest("hex");
}

function originalVouchKey(message) {
  const movedOrigin =
    getMoveOrigin(message);

  if (movedOrigin) {
    return movedOrigin;
  }

  const originalReference =
    getOriginalReference(message);

  if (originalReference) {
    return originalReference;
  }

  if (isForward(message)) {
    const fingerprint =
      vouchFingerprint(message);

    if (fingerprint) {
      return `forward:${fingerprint}`;
    }
  }

  return `${message.channel.id}:${message.id}`;
}

// ============================================================
// VOUCH TYPE DETECTION
// ============================================================

function detectVouchType(message) {
  const embeds =
    getEmbeds(message);

  for (const embed of embeds) {
    const description =
      embed.description || "";

    const typeMatch =
      description.match(
        /\*\*vouch type:\*\*\s*([^\n]+)/i
      );

    if (typeMatch) {
      const type =
        typeMatch[1]
          .replace(/<a?:\w+:\d+>/g, "")
          .trim()
          .toLowerCase();

      if (/converter/.test(type)) {
        return "converter";
      }

      if (/invite/.test(type)) {
        return "invite";
      }

      if (/giveaway/.test(type)) {
        return "giveaway";
      }

      if (
        /market|purchase|cash out/.test(type)
      ) {
        return "market";
      }
    }
  }

  const data =
    getVouchData(message);

  const text = [
    data.content || "",

    ...embeds.map(
      embed =>
        `${embed.title || ""}\n` +
        `${embed.description || ""}`
    )
  ].join("\n").toLowerCase();

  if (
    !/\bvouch(?:es|ed|ing)?\b/.test(text)
  ) {
    return null;
  }

  const types = [];

  if (
    /converter|conversion fee/.test(text)
  ) {
    types.push("converter");
  }

  if (
    /invite challenge|invite vouch/.test(text)
  ) {
    types.push("invite");
  }

  if (
    /giveaway vouch|giveaway reward/.test(text)
  ) {
    types.push("giveaway");
  }

  if (
    /market vouch|market purchase|market cash out/.test(text)
  ) {
    types.push("market");
  }

  return types.length === 1
    ? types[0]
    : null;
}

function looksLikeVouch(message) {
  if (message.system) {
    return false;
  }

  if (getMoveOrigin(message)) {
    return true;
  }

  const embeds =
    getEmbeds(message);

  if (
    embeds.some(embed =>
      /^new vouch$/i.test(
        (embed.title || "").trim()
      )
    )
  ) {
    return true;
  }

  if (detectVouchType(message)) {
    return true;
  }

  const data =
    getVouchData(message);

  const text = [
    data.content || "",

    ...embeds.map(
      embed =>
        `${embed.title || ""}\n` +
        `${embed.description || ""}`
    )
  ].join("\n");

  return /\bvouch\b/i.test(text);
}

function vouchDestination(type, message) {
  if (type === "converter") {
    return CONVERTER_VOUCH_CHANNEL_ID;
  }

  if (type === "giveaway") {
    return GIVEAWAY_VOUCH_CHANNEL_ID;
  }

  if (type === "invite") {
    return INVITE_VOUCH_CHANNEL_ID;
  }

  if (type === "market") {
    const description =
      getEmbeds(message)
        .map(
          embed => embed.description || ""
        )
        .join("\n");

    const sellerId =
      description.match(
        /\*\*seller:\*\*\s*<@!?(\d{17,20})>/i
      )?.[1];

    if (
      PERSONAL_SELLER_IDS.includes(sellerId)
    ) {
      return PERSONAL_VOUCH_CHANNEL_ID;
    }

    if (sellerId) {
      return VOUCH_CHANNEL_ID;
    }
  }

  return null;
}

function buildMovedVouch(message) {
  const data = getVouchData(message);
  const embeds = getEmbeds(message);

  const origin =
    getMoveOrigin(message) ||
    getOriginalReference(message) ||
    `${message.channel.id}:${message.id}`;

  const movedEmbeds =
    embeds.slice(0, 10).map(original => {
      const json =
        typeof original.toJSON === "function"
          ? original.toJSON()
          : { ...original };

      const previousFooter =
        json.footer?.text || "";

      return new EmbedBuilder(json)
        .setFooter({
          text:
            `${previousFooter ? previousFooter + " • " : ""}` +
            `${VOUCH_ORIGIN_MARKER}:${origin}`
        });
    });

  if (!movedEmbeds.length) {
    movedEmbeds.push(
      new EmbedBuilder()
        .setColor(WHITE)
        .setTitle("NEW VOUCH")
        .setDescription(
          safeText(
            data.content || "Vouch",
            3500
          )
        )
        .setFooter({
          text:
            `${VOUCH_ORIGIN_MARKER}:${origin}`
        })
        .setTimestamp()
    );
  }

  const attachmentUrls =
    getAttachments(message)
      .map(attachment => attachment.url)
      .filter(Boolean);

  return {
    content: "",
    embeds: movedEmbeds,
    attachmentUrls,
    origin
  };
}

// ============================================================
// VOUCH REACTIONS
// ============================================================

async function reactToVouch(message) {
  if (!looksLikeVouch(message)) {
    return;
  }

  try {
    await message.react(
      CHUPPY_TY_EMOJI
    );

  } catch (error) {
    console.error(
      `[VOUCH REACTION] ${message.id}:`,
      error.message
    );
  }
}

// ============================================================
// VOUCH ROUTING
// ============================================================

async function routeVouch(message) {
  if (!AUTO_ROUTE_VOUCHES) {
    return false;
  }

  if (!message.guild) {
    return false;
  }

  if (
    !VOUCH_SOURCE_CHANNEL_IDS.includes(
      message.channel.id
    )
  ) {
    return false;
  }

  if (!looksLikeVouch(message)) {
    return false;
  }

  if (getMoveOrigin(message)) {
    return false;
  }

  const type =
    detectVouchType(message);

  if (!type) {
    return false;
  }

  const destinationId =
    vouchDestination(type, message);

  if (
    !destinationId ||
    destinationId === message.channel.id
  ) {
    return false;
  }

  if (routedMessages.has(message.id)) {
    return false;
  }

  if (!lock(
    locks.vouchRoute,
    message.id
  )) {
    return false;
  }

  try {
    const destination =
      await message.guild.channels.fetch(
        destinationId
      );

    if (!destination?.send) {
      throw new Error(
        "Destination channel unavailable."
      );
    }

    const bot =
      await message.guild.members.fetchMe();

    const sourcePermissions =
      message.channel.permissionsFor(bot);

    const destinationPermissions =
      destination.permissionsFor(bot);

    const canDelete =
      message.author.id === client.user.id ||
      sourcePermissions?.has(
        PermissionFlagsBits.ManageMessages
      );

    if (!canDelete) {
      console.warn(
        "[VOUCH ROUTER] Missing Manage Messages."
      );

      return false;
    }

    if (
      !destinationPermissions?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks
      ])
    ) {
      return false;
    }

    const payload =
      buildMovedVouch(message);

    if (
      getAttachments(message).length !==
      payload.attachmentUrls.length
    ) {
      return false;
    }

    const files =
      payload.attachmentUrls.map(
        (url, index) => ({
          attachment: url,
          name: `vouch-proof-${index + 1}`
        })
      );

    if (
      files.length &&
      !destinationPermissions.has(
        PermissionFlagsBits.AttachFiles
      )
    ) {
      return false;
    }

    const recent =
      await destination.messages.fetch({
        limit: 100
      });

    const existingCopy =
      recent.find(
        candidate =>
          getMoveOrigin(candidate) ===
          payload.origin
      );

    if (existingCopy) {
      await message.delete();

      routedMessages.add(message.id);
      scheduleVouchCounterUpdate();

      return true;
    }

    const copied =
      await destination.send({
        content: payload.content,
        embeds: payload.embeds,
        files,
        allowedMentions: NONE
      });

    try {
      await message.delete();

    } catch (error) {
      console.error(
        "[VOUCH ROUTER] Source deletion failed:",
        error
      );

      routedMessages.add(message.id);
      scheduleVouchCounterUpdate();

      return true;
    }

    routedMessages.add(message.id);

    console.log(
      `[VOUCH ROUTER] ${type}: ` +
      `${message.channel.id} -> ${destinationId}`
    );

    console.log(
      `[VOUCH ROUTER] New message: ${copied.id}`
    );

    scheduleVouchCounterUpdate();

    return true;

  } catch (error) {
    console.error(
      "[VOUCH ROUTER] Failed:",
      error
    );

    return false;

  } finally {
    locks.vouchRoute.delete(
      message.id
    );
  }
}

// ============================================================
// VOUCH RECORDS
// ============================================================

function makeVouchRecord(message) {
  if (!looksLikeVouch(message)) {
    return null;
  }

  const key =
    originalVouchKey(message);

  if (!key) {
    return null;
  }

  return {
    key,
    fingerprint:
      vouchFingerprint(message),

    channelId:
      message.channel.id,

    forwarded:
      isForward(message),

    created:
      message.createdTimestamp
  };
}

async function fetchChannelVouches(channelId) {
  const channel =
    await client.channels.fetch(channelId);

  if (
    !channel?.messages ||
    !channel.isTextBased()
  ) {
    throw new Error(
      `Vouch source channel ${channelId} unavailable.`
    );
  }

  const results = [];
  let before;

  while (true) {
    const messages =
      await channel.messages.fetch({
        limit: 100,
        ...(before ? { before } : {})
      });

    if (!messages.size) {
      break;
    }

    for (const message of messages.values()) {
      if (message.system) {
        continue;
      }

      const marketChannel = [
        PERSONAL_VOUCH_CHANNEL_ID,
        VOUCH_CHANNEL_ID
      ].includes(channelId);

      let record =
        makeVouchRecord(message);

      if (!record && marketChannel) {
        if (
          message.author?.bot ||
          !(
            message.content?.trim() ||
            message.embeds?.length ||
            message.attachments?.size
          )
        ) {
          continue;
        }

        record = {
          key:
            `${channelId}:${message.id}`,

          fingerprint:
            vouchFingerprint(message),

          channelId,

          forwarded:
            isForward(message),

          created:
            message.createdTimestamp
        };
      }

      if (record) {
        results.push(record);
      }
    }

    if (messages.size < 100) {
      break;
    }

    before =
      messages.last().id;
  }

  console.log(
    `[VOUCH SCAN] ${channelId}: ${results.length} candidates`
  );

  return results;
}

function uniqueVouchRecords(records) {
  const byKey =
    new Map();

  const sorted =
    [...records].sort(
      (a, b) => a.created - b.created
    );

  for (const record of sorted) {
    if (!byKey.has(record.key)) {
      byKey.set(
        record.key,
        record
      );
    }
  }

  const values =
    [...byKey.values()];

  const seenForwardFingerprints =
    new Set();

  return values.filter(record => {
    if (
      record.key.startsWith("forward:") &&
      record.fingerprint
    ) {
      if (
        seenForwardFingerprints.has(
          record.fingerprint
        )
      ) {
        return false;
      }

      seenForwardFingerprints.add(
        record.fingerprint
      );
    }

    return true;
  });
}

function uniqueVouches(records) {
  return uniqueVouchRecords(records).length;
}

// ============================================================
// COUNTER CHANNEL CREATION
// ============================================================

async function findOrCreateCountChannel(
  guild,
  configuredId,
  prefix
) {
  if (configuredId) {
    const existing =
      await guild.channels.fetch(
        configuredId
      ).catch(() => null);

    if (existing) {
      return existing;
    }
  }

  await guild.channels.fetch();

  const found =
    guild.channels.cache.find(
      channel =>
        channel.parentId === COUNT_CATEGORY_ID &&
        channel.name?.startsWith(prefix)
    );

  if (found) {
    return found;
  }

  const original =
    await guild.channels.fetch(
      CHUPPY_COUNT_CHANNEL_ID
    );

  if (!original) {
    throw new Error(
      "Original Chuppy counter unavailable."
    );
  }

  const category =
    await guild.channels.fetch(
      COUNT_CATEGORY_ID
    );

  if (
    !category ||
    category.type !== ChannelType.GuildCategory
  ) {
    throw new Error(
      "Counter category unavailable."
    );
  }

  const type =
    original.type === ChannelType.GuildVoice
      ? ChannelType.GuildVoice
      : ChannelType.GuildText;

  const permission =
    type === ChannelType.GuildVoice
      ? PermissionFlagsBits.Connect
      : PermissionFlagsBits.SendMessages;

  const created =
    await guild.channels.create({
      name: `${prefix}0`,
      type,
      parent: COUNT_CATEGORY_ID,

      permissionOverwrites: [
        {
          id: guild.id,
          deny: [permission]
        }
      ],

      reason:
        "Chuppys automatic vouch counter"
    });

  console.log(
    `[VOUCH COUNTER] Created ${created.id}`
  );

  return created;
}

// ============================================================
// COUNTER RENAMING
// ============================================================

async function renameCounterChannel(
  channel,
  name
) {
  if (
    !channel ||
    typeof channel.setName !== "function"
  ) {
    throw new Error(
      "Counter channel unavailable."
    );
  }

  if (channel.name !== name) {
    await channel.setName(
      name,
      "Chuppys automatic vouch recount"
    );
  }
}

// ============================================================
// COUNTER ORDER
// ============================================================

async function orderVouchCounters(
  guild,
  personal,
  invite,
  giveaway,
  converter,
  server
) {
  const counters = [
    personal,
    invite,
    giveaway,
    converter,
    server
  ];

  for (const channel of [
    invite,
    giveaway,
    converter
  ]) {
    if (
      channel.parentId !== COUNT_CATEGORY_ID
    ) {
      await channel.setParent(
        COUNT_CATEGORY_ID,
        {
          lockPermissions: false
        }
      );
    }
  }

  const refreshed =
    await Promise.all(
      counters.map(
        channel =>
          guild.channels.fetch(channel.id)
      )
    );

  if (
    !refreshed.every(
      channel =>
        channel.parentId === COUNT_CATEGORY_ID
    )
  ) {
    console.warn(
      "[VOUCH COUNTER] Original counter locations preserved."
    );

    return;
  }

  const alreadyOrdered =
    refreshed.every(
      (channel, index) =>
        index === 0 ||
        refreshed[index - 1].position <
          channel.position
    );

  if (alreadyOrdered) {
    return;
  }

  const base =
    refreshed[0].position;

  await guild.channels.setPositions(
    refreshed.map(
      (channel, index) => ({
        channel: channel.id,
        position: base + index
      })
    )
  );
}

// ============================================================
// RECOUNT VOUCHES
// ============================================================

async function recountAllVouches() {
  if (vouchCounterUpdateRunning) {
    vouchCounterRecountRequested = true;
    return;
  }

  vouchCounterUpdateRunning = true;

  try {
    const guild =
      client.guilds.cache.get(GUILD_ID) ||
      await client.guilds.fetch(GUILD_ID);

    const [
      personalMessages,
      marketMessages,
      inviteMessages,
      giveawayMessages,
      converterMessages
    ] = await Promise.all([
      fetchChannelVouches(
        PERSONAL_VOUCH_CHANNEL_ID
      ),

      fetchChannelVouches(
        VOUCH_CHANNEL_ID
      ),

      fetchChannelVouches(
        INVITE_VOUCH_CHANNEL_ID
      ),

      fetchChannelVouches(
        GIVEAWAY_VOUCH_CHANNEL_ID
      ),

      fetchChannelVouches(
        CONVERTER_VOUCH_CHANNEL_ID
      )
    ]);

    const personalCount =
      uniqueVouches(personalMessages);

    const marketCount =
      uniqueVouches(marketMessages);

    const inviteCount =
      uniqueVouches(inviteMessages);

    const giveawayCount =
      uniqueVouches(giveawayMessages);

    const converterCount =
      uniqueVouches(converterMessages);

    // CHUPPY TOTAL:
    // PERSONAL + INVITE + GIVEAWAY + CONVERTER

    const chuppyTotal =
      uniqueVouches([
        ...personalMessages,
        ...inviteMessages,
        ...giveawayMessages,
        ...converterMessages
      ]);

    // SERVER TOTAL:
    // ALL FIVE VOUCH SOURCES

    const serverTotal =
      uniqueVouches([
        ...personalMessages,
        ...marketMessages,
        ...inviteMessages,
        ...giveawayMessages,
        ...converterMessages
      ]);

    const personalCounter =
      await guild.channels.fetch(
        CHUPPY_COUNT_CHANNEL_ID
      );

    const serverCounter =
      await guild.channels.fetch(
        SERVER_COUNT_CHANNEL_ID
      );

    if (
      !personalCounter ||
      !serverCounter
    ) {
      throw new Error(
        "Original counter channels missing."
      );
    }

    const inviteCounter =
      await findOrCreateCountChannel(
        guild,
        INVITE_COUNT_CHANNEL_ID,
        COUNT_NAMES.invite
      );

    const giveawayCounter =
      await findOrCreateCountChannel(
        guild,
        GIVEAWAY_COUNT_CHANNEL_ID,
        COUNT_NAMES.giveaway
      );

    const converterCounter =
      await findOrCreateCountChannel(
        guild,
        CONVERTER_COUNT_CHANNEL_ID,
        COUNT_NAMES.converter
      );

    const updates =
      await Promise.allSettled([
        renameCounterChannel(
          personalCounter,
          `${COUNT_NAMES.personal}${chuppyTotal}`
        ),

        renameCounterChannel(
          inviteCounter,
          `${COUNT_NAMES.invite}${inviteCount}`
        ),

        renameCounterChannel(
          giveawayCounter,
          `${COUNT_NAMES.giveaway}${giveawayCount}`
        ),

        renameCounterChannel(
          converterCounter,
          `${COUNT_NAMES.converter}${converterCount}`
        ),

        renameCounterChannel(
          serverCounter,
          `${COUNT_NAMES.server}${serverTotal}`
        )
      ]);

    for (const result of updates) {
      if (result.status === "rejected") {
        console.error(
          "[VOUCH COUNTER] Rename failed:",
          result.reason
        );
      }
    }

    await orderVouchCounters(
      guild,
      personalCounter,
      inviteCounter,
      giveawayCounter,
      converterCounter,
      serverCounter
    ).catch(console.error);

    counterCache = {
      personal: personalCount,
      market: marketCount,
      invite: inviteCount,
      giveaway: giveawayCount,
      converter: converterCount,
      chuppyTotal,
      serverTotal,
      checkedAt:
        new Date().toISOString()
    };

    console.log(
      "[VOUCH COUNTER] Recount:",
      counterCache
    );

  } catch (error) {
    console.error(
      "[VOUCH COUNTER] Recount failed:",
      error
    );

  } finally {
    vouchCounterUpdateRunning = false;

    if (vouchCounterRecountRequested) {
      vouchCounterRecountRequested = false;
      scheduleVouchCounterUpdate();
    }
  }
}

function scheduleVouchCounterUpdate() {
  clearTimeout(vouchCounterTimer);

  vouchCounterTimer = setTimeout(() => {
    void recountAllVouches();
  }, 3500);
}

// ============================================================
// VOUCH TUTORIAL SETTINGS
// ============================================================

const VOUCH_COMMAND_BOX =
  "`/vouch`";

const VOUCH_TUTORIAL_CHANNELS = Object.freeze({
  personal: VOUCH_TUTORIAL_CHANNEL_ID,
  market: VOUCH_TUTORIAL_CHANNEL_ID,
  invite: INVITE_VOUCH_TUTORIAL_CHANNEL_ID,
  giveaway: GIVEAWAY_VOUCH_TUTORIAL_CHANNEL_ID,
  converter: CONVERTER_VOUCH_TUTORIAL_CHANNEL_ID
});

// ============================================================
// VOUCH TUTORIAL DEFINITIONS
// ============================================================

const VOUCH_TUTORIALS = {
  personal: {
    title:
      "HOW TO VOUCH — CHUPPYS MARKET",

    description:
      "Thank you for shopping at **.gg/chuppys**!\n\n" +

      "Please follow this tutorial to leave a " +
      "market vouch for **bunnii or twxn**.\n\n" +

      "**STEP 1 — USE /VOUCH**\n" +
      "Stay inside your purchase or cash out ticket " +
      "and enter:\n\n" +

      VOUCH_COMMAND_BOX + "\n\n" +

      "**STEP 2 — SELECT MARKET**\n" +
      "Choose **Market** from the vouch categories.\n\n" +

      "**STEP 3 — COMPLETE YOUR VOUCH**\n" +
      "• Choose Purchase or Cash Out.\n" +
      "• Select bunnii or twxn as your seller.\n" +
      "• Enter the items purchased or cashed out.\n" +
      "• Rate your experience from 1–5.\n" +
      "• Attach proof of the completed transaction.\n\n" +

      "**STEP 4 — SUBMIT**\n" +
      "Double-check your information and submit.\n\n" +

      "**WHERE DOES IT GO?**\n" +
      `Your vouch appears in <#${PERSONAL_VOUCH_CHANNEL_ID}>.\n\n` +

      "**IMPORTANT**\n" +
      "Only submit genuine, completed transactions. " +
      "Duplicate or fake vouches are not allowed.",

    images: [
      VOUCH_TUTORIAL_IMAGES.command,
      VOUCH_TUTORIAL_IMAGES.completed,
      VOUCH_TUTORIAL_IMAGES.success
    ]
  },

  market: {
    title:
      "HOW TO VOUCH — MARKET SELLERS",

    description:
      "Thank you for shopping with a seller at **.gg/chuppys**!\n\n" +

      "**STEP 1 — USE /VOUCH**\n" +
      "Go to your purchase or cash out ticket and enter:\n\n" +

      VOUCH_COMMAND_BOX + "\n\n" +

      "**STEP 2 — SELECT MARKET**\n" +
      "Choose the **Market** category.\n\n" +

      "**STEP 3 — COMPLETE YOUR VOUCH**\n" +
      "• Choose Purchase or Cash Out.\n" +
      "• Select the seller who completed your transaction.\n" +
      "• Enter the items purchased or cashed out.\n" +
      "• Rate your seller from 1–5.\n" +
      "• Attach screenshot proof.\n\n" +

      "**STEP 4 — SUBMIT**\n" +
      "Make sure you selected the correct seller.\n\n" +

      "**WHERE DOES IT GO?**\n" +
      `Regular seller vouches go to <#${VOUCH_CHANNEL_ID}>.\n\n` +

      "**IMPORTANT**\n" +
      "Vouches must be genuine and submitted " +
      "after the transaction is complete.",

    images: [
      VOUCH_TUTORIAL_IMAGES.command,
      VOUCH_TUTORIAL_IMAGES.completed,
      VOUCH_TUTORIAL_IMAGES.success
    ]
  },

  invite: {
    title:
      "HOW TO VOUCH — INVITE CHALLENGE",

    description:
      "Congratulations on completing an **Invite Challenge** " +
      "at **.gg/chuppys**!\n\n" +

      "**STEP 1 — OPEN /VOUCH**\n" +
      "Go to your ticket and enter:\n\n" +

      VOUCH_COMMAND_BOX + "\n\n" +

      "**STEP 2 — SELECT INVITE CHALLENGE**\n" +
      "Choose **Invite Challenge**.\n\n" +

      "**STEP 3 — COMPLETE YOUR VOUCH**\n" +
      "• Select bunnii or twxn.\n" +
      "• Rate your experience from 1–5.\n" +
      "• Attach proof of your completed challenge " +
      "and received reward.\n\n" +

      "**STEP 4 — SUBMIT**\n" +
      "Review your answers and submit.\n\n" +

      "**WHERE DOES IT GO?**\n" +
      `Your vouch belongs in <#${INVITE_VOUCH_CHANNEL_ID}>.\n\n` +

      "**IMPORTANT**\n" +
      "Invite vouches are counted separately. " +
      "Only submit after receiving your reward.",

    images: []
  },

  giveaway: {
    title:
      "HOW TO VOUCH — GIVEAWAY",

    description:
      "Congratulations on winning a giveaway " +
      "at **.gg/chuppys**!\n\n" +

      "Please leave a vouch after receiving your prize.\n\n" +

      "**STEP 1 — OPEN /VOUCH**\n" +
      "Go to your ticket and enter:\n\n" +

      VOUCH_COMMAND_BOX + "\n\n" +

      "**STEP 2 — SELECT GIVEAWAY**\n" +
      "Choose **Giveaway**.\n\n" +

      "**STEP 3 — COMPLETE YOUR VOUCH**\n" +
      "• Select bunnii or twxn.\n" +
      "• Rate your experience from 1–5.\n" +
      "• Attach proof that you received your reward.\n\n" +

      "**STEP 4 — SUBMIT**\n" +
      "Review and submit your vouch.\n\n" +

      "**WHERE DOES IT GO?**\n" +
      `Your vouch belongs in <#${GIVEAWAY_VOUCH_CHANNEL_ID}>.\n\n` +

      "**IMPORTANT**\n" +
      "Only submit after receiving your giveaway prize. " +
      "Do not submit duplicates.",

    images: []
  },

  converter: {
    title:
      "HOW TO VOUCH — CONVERTER FEES",

    description:
      "Thank you for using payment conversion services " +
      "at **.gg/chuppys**!\n\n" +

      "**WHAT IS A CONVERTER VOUCH?**\n" +
      "A converter vouch is for a completed service " +
      "where money was converted from one payment " +
      "method to another.\n\n" +

      "**STEP 1 — USE /VOUCH**\n" +
      "Stay inside your converter ticket and enter:\n\n" +

      VOUCH_COMMAND_BOX + "\n\n" +

      "**STEP 2 — SELECT CONVERTER FEES**\n" +
      "Choose **Converter Fees**.\n\n" +

      "**STEP 3 — COMPLETE YOUR VOUCH**\n" +
      "• Select bunnii or twxn.\n" +
      "• Enter payment conversion details.\n" +
      "• Enter the conversion fee.\n" +
      "• Rate your experience from 1–5.\n" +
      "• Attach proof of the completed conversion.\n\n" +

      "**EXAMPLE**\n" +
      "**Conversion:** Cash App to PayPal\n" +
      "**Amount:** $50\n" +
      "**Fee:** $3\n\n" +

      "**STEP 4 — SUBMIT**\n" +
      "Double-check and submit your vouch.\n\n" +

      "**WHERE DOES IT GO?**\n" +
      `Your vouch belongs in <#${CONVERTER_VOUCH_CHANNEL_ID}>.\n\n` +

      "**IMPORTANT**\n" +
      "Only completed conversion services qualify.",

    images: []
  }
};

// ============================================================
// VOUCH TUTORIAL COMMANDS
// ============================================================

const VOUCH_TUTORIAL_COMMANDS = Object.freeze({
  "!vouchtut": "all",
  "!personalvouchtut": "personal",
  "!marketvouchtut": "market",
  "!invitevouchtut": "invite",
  "!giveawayvouchtut": "giveaway",
  "!convertervouchtut": "converter"
});

function makeVouchTutorialEmbed(type) {
  const tutorial =
    VOUCH_TUTORIALS[type];

  if (!tutorial) {
    throw new Error(
      "Invalid vouch tutorial type."
    );
  }

  return new EmbedBuilder()
    .setColor(WHITE)
    .setTitle(tutorial.title)
    .setDescription(tutorial.description)
    .setFooter({
      text: BRAND
    });
}

function makeVouchTutorialImageEmbeds(type) {
  const tutorial =
    VOUCH_TUTORIALS[type];

  if (!tutorial) {
    return [];
  }

  const labels = [
    "STEP 1 — USE /VOUCH",
    "EXAMPLE OF A COMPLETED VOUCH",
    "SUCCESSFULLY SUBMITTED"
  ];

  return tutorial.images
    .filter(Boolean)
    .slice(0, 9)
    .map((url, index) =>
      new EmbedBuilder()
        .setColor(WHITE)
        .setDescription(
          `**${labels[index] || "VOUCH EXAMPLE"}**`
        )
        .setImage(url)
    );
}

function getVouchTutorialChannelId(type) {
  const channelId =
    VOUCH_TUTORIAL_CHANNELS[type];

  if (!channelId) {
    throw new Error(
      `No tutorial channel configured for ${type}.`
    );
  }

  return channelId;
}

async function sendSingleVouchTutorial(
  guild,
  type
) {
  const tutorial =
    VOUCH_TUTORIALS[type];

  if (!tutorial) {
    throw new Error(
      "Unknown vouch tutorial."
    );
  }

  const channelId =
    getVouchTutorialChannelId(type);

  const channel =
    await guild.channels.fetch(
      channelId
    );

  if (!channel?.send || !channel?.messages) {
    throw new Error(
      `Tutorial channel ${channelId} unavailable.`
    );
  }

  const embeds = [
    makeVouchTutorialEmbed(type),
    ...makeVouchTutorialImageEmbeds(type)
  ];

  const result =
    await upsertBotMessage(
      channel,

      message =>
        message.embeds.some(
          existing =>
            existing.title === tutorial.title
        ),

      {
        content: "",
        embeds,
        components: [],
        allowedMentions: NONE
      },

      10
    );

  return {
    ...result,
    channelId,
    type
  };
}

async function sendVouchTutorial(guild) {
  const types = [
    "personal",
    "market",
    "invite",
    "giveaway",
    "converter"
  ];

  const results = [];

  for (const type of types) {
    try {
      const result =
        await sendSingleVouchTutorial(
          guild,
          type
        );

      results.push({
        type,
        channelId: result.channelId,
        success: true,
        updated: result.updated
      });

    } catch (error) {
      console.error(
        `[VOUCH TUTORIAL] ${type}:`,
        error
      );

      results.push({
        type,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

async function handleVouchTutorialCommand(
  message,
  type
) {
  if (!canManageServer(message.member)) {
    return message.reply(
      "You need Manage Server permission."
    );
  }

  const key =
    `${message.guild.id}:vouch-tutorials`;

  if (!lock(locks.vouchTutorial, key)) {
    return message.reply(
      "A vouch tutorial is already updating."
    );
  }

  try {
    if (type === "all") {
      const results =
        await sendVouchTutorial(
          message.guild
        );

      const successful =
        results.filter(r => r.success);

      const failed =
        results.filter(r => !r.success);

      const details =
        successful.map(
          r =>
            `**${r.type}:** <#${r.channelId}>`
        );

      if (failed.length) {
        details.push(
          "",
          "**Failed:**",
          ...failed.map(
            r =>
              `${r.type}: ${safeText(r.error, 150)}`
          )
        );
      }

      return message.reply({
        content:
          `**${successful.length}/5 tutorials updated.**\n\n` +
          details.join("\n"),

        allowedMentions: NONE
      });
    }

    const result =
      await sendSingleVouchTutorial(
        message.guild,
        type
      );

    return message.reply({
      content:
        `The **${type}** tutorial was ` +
        `${result.updated ? "updated" : "posted"} ` +
        `in <#${result.channelId}>!`,

      allowedMentions: NONE
    });

  } finally {
    locks.vouchTutorial.delete(key);
  }
}

// ============================================================
// VOUCH REMINDERS
// ============================================================

const VOUCH_REMINDER_TYPES = Object.freeze({
  r: "market",
  rmarket: "market",
  rinv: "invite",
  rgive: "giveaway",
  rconv: "converter",
  rall: "all"
});

function makeMarketVouchReminder() {
  return whiteEmbed(
    "Reminder to Vouch — Market",

    "Thank you for shopping at **.gg/chuppys**!\n\n" +

    "If you completed a purchase or cash out, " +
    "please submit your market vouch.\n\n" +

    `**Tutorial:** <#${VOUCH_TUTORIAL_CHANNEL_ID}>\n\n` +

    `**Quick Vouch:** <#${QUICK_VOUCH_CHANNEL_ID}>\n\n` +

    "**HOW TO VOUCH**\n\n" +
    VOUCH_COMMAND_BOX + "\n\n" +

    "Select **Market**, choose your seller, " +
    "complete the form and attach proof.\n\n" +

    "Please submit genuine vouches within " +
    "the server's 2-day grace period."
  );
}

function makeInviteVouchReminder() {
  return whiteEmbed(
    "Reminder to Vouch — Invite Challenge",

    "Thank you for completing an **Invite Challenge** " +
    "at **.gg/chuppys**!\n\n" +

    "After receiving your reward, submit your vouch.\n\n" +

    `**Tutorial:** <#${INVITE_VOUCH_TUTORIAL_CHANNEL_ID}>\n\n` +

    `**Invite Vouches:** <#${INVITE_VOUCH_CHANNEL_ID}>\n\n` +

    "**HOW TO VOUCH**\n\n" +
    VOUCH_COMMAND_BOX + "\n\n" +

    "Select **Invite Challenge**, complete the form, " +
    "and include proof of your reward.\n\n" +

    "Only submit after the challenge is complete."
  );
}

function makeGiveawayVouchReminder() {
  return whiteEmbed(
    "Reminder to Vouch — Giveaway",

    "Congratulations on your giveaway win " +
    "at **.gg/chuppys**!\n\n" +

    "After receiving your prize, please submit a vouch.\n\n" +

    `**Tutorial:** <#${GIVEAWAY_VOUCH_TUTORIAL_CHANNEL_ID}>\n\n` +

    `**Giveaway Vouches:** <#${GIVEAWAY_VOUCH_CHANNEL_ID}>\n\n` +

    "**HOW TO VOUCH**\n\n" +
    VOUCH_COMMAND_BOX + "\n\n" +

    "Select **Giveaway**, complete the form, " +
    "and attach proof of your received reward.\n\n" +

    "Only one genuine vouch per completed reward."
  );
}

function makeConverterVouchReminder() {
  return whiteEmbed(
    "Reminder to Vouch — Converter Fees",

    "Thank you for using the payment conversion services " +
    "at **.gg/chuppys**!\n\n" +

    "If your conversion is complete, submit your vouch.\n\n" +

    `**Tutorial:** <#${CONVERTER_VOUCH_TUTORIAL_CHANNEL_ID}>\n\n` +

    `**Converter Vouches:** <#${CONVERTER_VOUCH_CHANNEL_ID}>\n\n` +

    "**HOW TO VOUCH**\n\n" +
    VOUCH_COMMAND_BOX + "\n\n" +

    "Select **Converter Fees**, enter the details " +
    "and fee, and attach proof.\n\n" +

    "Only completed conversions qualify."
  );
}

function makeAllVouchReminder() {
  return whiteEmbed(
    "Reminder to Vouch — .gg/chuppys",

    "Thank you for supporting **.gg/chuppys**!\n\n" +

    "Please use the correct category " +
    "for your completed transaction or reward.\n\n" +

    "**MARKET**\n" +
    `<#${VOUCH_TUTORIAL_CHANNEL_ID}>\n\n` +

    "**INVITE CHALLENGE**\n" +
    `<#${INVITE_VOUCH_TUTORIAL_CHANNEL_ID}>\n\n` +

    "**GIVEAWAY**\n" +
    `<#${GIVEAWAY_VOUCH_TUTORIAL_CHANNEL_ID}>\n\n` +

    "**CONVERTER FEES**\n" +
    `<#${CONVERTER_VOUCH_TUTORIAL_CHANNEL_ID}>\n\n` +

    "**QUICK VOUCH**\n" +
    `<#${QUICK_VOUCH_CHANNEL_ID}>\n\n` +

    "**HOW TO VOUCH**\n\n" +
    VOUCH_COMMAND_BOX + "\n\n" +

    "Choose the matching category, complete the form, " +
    "and attach proof.\n\n" +

    "Please do not submit duplicate or fake vouches."
  );
}

function makeVouchReminder(type) {
  switch (type) {
    case "market":
      return makeMarketVouchReminder();

    case "invite":
      return makeInviteVouchReminder();

    case "giveaway":
      return makeGiveawayVouchReminder();

    case "converter":
      return makeConverterVouchReminder();

    case "all":
      return makeAllVouchReminder();

    default:
      throw new Error(
        `Unknown reminder type: ${type}`
      );
  }
}

async function sendVouchReminder(
  message,
  target,
  type
) {
  await message.channel.send({
    content: `<@${target.id}>`,

    embeds: [
      makeVouchReminder(type)
    ],

    allowedMentions: {
      users: [target.id]
    }
  });
}

// ============================================================
// HELP EMBED
// ============================================================

function makeHelpEmbed() {
  return new EmbedBuilder()
    .setTitle(
      ".gg/chuppys Bot Commands"
    )
    .setDescription(
      "Here is a list of available commands."
    )
    .addFields(
      {
        name: "General Commands",
        value:
          "`/help` — Command menu\n" +
          "`/question` — Ask a question\n" +
          "`/request` — Request stock\n" +
          "`/vouch` — Submit a vouch\n" +
          "`,afk [reason]` — Set AFK\n" +
          "`,pay` — Payment methods\n" +
          "`,client` — Client role panel\n" +
          "`,welcome` — Verification welcome embed"
      },

      {
        name: "Vouch Tutorial Commands",
        value:
          "`!vouchtut` — Update all tutorials\n" +
          "`!personalvouchtut` — Chuppys Market\n" +
          "`!marketvouchtut` — Regular Market\n" +
          "`!invitevouchtut` — Invite Challenge\n" +
          "`!giveawayvouchtut` — Giveaway\n" +
          "`!convertervouchtut` — Converter Fees"
      },

      {
        name: "Vouch Reminder Commands",
        value:
          "`,r @user r` — Market\n" +
          "`,r @user rmarket` — Market\n" +
          "`,r @user rinv` — Invite\n" +
          "`,r @user rgive` — Giveaway\n" +
          "`,r @user rconv` — Converter\n" +
          "`,r @user rall` — All categories"
      },

      {
        name: "Verification",
        value:
          `Create a private verification ticket in <#${VERIFY_CHANNEL_ID}>. ` +
          "Staff reviews and approves verification manually."
      },

      {
        name: "Self Role Commands",
        value:
          "`,roles`, `,pings`, `,age`, `,pronouns`"
      },

      {
        name: "Tickets",
        value:
          "`/ticketpanel` — Open the ticket panel\n" +
          "Use the controls inside your ticket."
      },

      {
        name: "Support Commands",
        value:
          "`,partner`, `,mod`, `,seller`, `,promoter`"
      },

      {
        name: "Service Commands",
        value:
          "`,nitro` / `!nitro`\n" +
          "`,decor` / `!decor`\n" +
          "`,boosties` / `!boosties`\n" +
          "`,sellers` / `!sellers`\n" +
          "`,staff` / `!staff`"
      },

      {
        name: "Additional Commands",
        value:
          "`!ranked`, `!robuxcashout`, " +
          "`!testwelcome`, `!testgoodbye`"
      }
    )
    .setColor(WHITE)
    .setThumbnail(
      "https://cdn.discordapp.com/emojis/1569039366880235560.png"
    )
    .setFooter({
      text: BRAND
    });
}

// ============================================================
// PROMOTER EMBED
// ============================================================

function makePromoterEmbed() {
  return whiteEmbed(
    ".gg/chuppys promoter information",

    "**Interested in becoming a .gg/chuppys promoter?**\n\n" +

    "**Promoter Responsibilities**\n" +
    "• Actively advertise and promote .gg/chuppys.\n" +
    "• Help bring genuine new members into the server.\n" +
    "• Share the server with your audience.\n" +
    "• Help the community grow and attract customers.\n" +
    "• Represent Chuppys positively.\n" +
    "• Follow platform rules and avoid spam.\n\n" +

    "**Promoter Application Questions**\n" +

    "1. Do you have a following base? " +
    "How many followers and on which platform?\n\n" +

    "2. How many invites do you think you will gain monthly?\n\n" +

    "**Payment Information**\n" +

    "Promoters are paid **monthly**. " +
    "Details will be discussed with management."
  );
}

// ============================================================
// PAYMENT METHODS
// ============================================================

function paymentMethods() {
  return [
    {
      name: "Cash App",
      details: "$yysluvv",
      url: "https://cash.app/$yysluvv"
    },

    {
      name: "PayPal",
      details: "PayPal.me/twxnsrevenge",
      url: "https://paypal.me/twxnsrevenge"
    },

    {
      name: "Venmo",
      details: "@chuppys",
      url: "https://venmo.com/u/chuppys"
    },

    {
      name: "Chime",
      details: "chuppysss",
      url:
        "https://app.chime.com/link/qr?u=chuppysss"
    },

    {
      name: "Apple Pay",
      details: "929-554-5969",
      url: ""
    },

    {
      name: "Zelle",
      details: "631-401-8951",
      url: ""
    },

    ...EXTRA_PAYMENT_METHODS.filter(
      method => method.name.trim()
    )
  ];
}

function validPaymentUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function makePaymentEmbed() {
  const embed = whiteEmbed(
    "Payment Methods",

    "Choose a payment method below.\n\n" +
    "Please confirm payment details before sending."
  ).setThumbnail(
    PAYMENT_EMOJI_URL
  );

  for (const method of paymentMethods()) {
    embed.addFields({
      name:
        method.name.slice(0, 256),

      value:
        `\`${String(method.details || "Ask staff")
          .replace(/`/g, "")
          .slice(0, 1000)}\``
    });
  }

  return embed;
}

function makePaymentButtons() {
  const buttons =
    paymentMethods()
      .filter(
        method => validPaymentUrl(method.url)
      )
      .slice(0, 5)
      .map(
        method =>
          new ButtonBuilder()
            .setLabel(
              method.name.slice(0, 80)
            )
            .setStyle(ButtonStyle.Link)
            .setURL(method.url)
      );

  return buttons.length
    ? [
        new ActionRowBuilder().addComponents(
          buttons
        )
      ]
    : [];
}

async function sendPaymentEmbed(channel) {
  if (!channel?.send) {
    throw new Error(
      "Payment channel unavailable."
    );
  }

  const sent =
    await channel.send({
      content: "",
      embeds: [
        makePaymentEmbed()
      ],
      components:
        makePaymentButtons(),
      allowedMentions: NONE
    });

  console.log(
    `[PAY] New payment embed ${sent.id}`
  );

  return sent;
}

// ============================================================
// SERVICE UPDATER
// ============================================================

async function updateServiceMessage(
  channel,
  embed,
  serviceName
) {
  if (!channel?.messages) {
    throw new Error(
      `${serviceName} channel unavailable.`
    );
  }

  return upsertBotMessage(
    channel,

    message =>
      message.embeds.some(existing => {
        const description =
          existing.description || "";

        if (serviceName === "DECOR") {
          return description.includes("# DECOR");
        }

        if (serviceName === "NITRO") {
          return description.includes("# NITRO");
        }

        return (
          description.includes("# 1 MONTH") ||
          description.includes("# 3 MONTHS")
        );
      }),

    {
      content: "",
      embeds: [embed],
      components: [],
      allowedMentions: NONE
    }
  );
}

// ============================================================
// DECOR
// ============================================================

async function sendDecorServices(channel) {
  const embed =
    new EmbedBuilder()
      .setColor(WHITE)
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

        "All legally purchased and sent the same day!\n\n" +

        `${PAYMENT_METHODS_TEXT}\n\n` +

        "**.gg/chuppys**"
      );

  return updateServiceMessage(
    channel,
    embed,
    "DECOR"
  );
}

// ============================================================
// NITRO
// ============================================================

async function sendNitroServices(channel) {
  const embed =
    new EmbedBuilder()
      .setColor(WHITE)
      .setDescription(
        `# NITRO ${SERVICE_EMOJI}\n\n` +

        "**1 Month + No War — $7.25**\n\n" +

        "**1 Month + War — $9.25**\n\n" +

        `${PAYMENT_METHODS_TEXT}\n\n` +

        "**.gg/chuppys**"
      );

  return updateServiceMessage(
    channel,
    embed,
    "NITRO"
  );
}

// ============================================================
// BOOSTIES
// ============================================================

async function sendBoostiesServices(channel) {
  const one = [
    [2, "$1.25"],
    [4, "$2.50"],
    [6, "$3.75"],
    [8, "$4.00"],
    [10, "$5.25"],
    [12, "$6.50"],
    [14, "$7.00"],
    [16, "$8.50"],
    [18, "$9.00"],
    [20, "$9.50"],
    [30, "$11.00"]
  ];

  const three = [
    [2, "$2.00"],
    [4, "$4.00"],
    [6, "$6.00"],
    [8, "$8.00"],
    [10, "$10.00"],
    [12, "$12.00"],
    [14, "$14.00"],
    [16, "$16.00"],
    [18, "$18.00"],
    [20, "$20.00"],
    [30, "$27.00"]
  ];

  const lines =
    list =>
      list.map(
        ([count, price]) =>
          `${BOOST_EMOJI} **${count} • ${price}**`
      ).join("\n");

  const embed =
    new EmbedBuilder()
      .setColor(WHITE)
      .setDescription(
        `# 1 MONTH ${BOOST_EMOJI}\n\n` +

        `${lines(one)}\n\n` +

        `# 3 MONTHS ${BOOST_EMOJI}\n\n` +

        `${lines(three)}\n\n` +

        `${PAYMENT_METHODS_TEXT}\n\n` +

        "**.gg/chuppys**"
      );

  return updateServiceMessage(
    channel,
    embed,
    "BOOSTIES"
  );
}

// ============================================================
// SELLERS EMBED
// ============================================================

function makeSellersEmbed() {
  const sellers = [
    ["1192248188409749684", "services seller", "no limit"],
    ["1079241163455873074", "seller", "no limit"],
    ["1032693136163622993", "seller", "$75"],
    ["1320199904219496530", "seller", "$65"],
    ["952566845939023892", "seller", "no limit"],
    ["1473335012769267807", "seller", "$100"],
    ["1472856287527309313", "seller", "$100"],
    ["1269188505935024141", "seller", "$250"],
    ["1427118849215692920", "seller", "$50"],
    ["1328450205774909441", "seller", "$100"],
    ["1475237851414401105", "seller", "$75"]
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
    "-# my sellers are prohibited from dm’ing you, " +
    "if for whatever reason they do please open a support ticket."
  );

  return new EmbedBuilder()
    .setColor(WHITE)
    .setDescription(
      lines.join("\n")
    );
}

// ============================================================
// STAFF EMBED
// ============================================================

function makeStaffEmbed() {
  const staff = [
    ["1530733554869473320", "owner | seller", "no limit"],
    ["1490962480963260466", "owner | seller", "no limit"],
    ["1381473377696350238", "Admin | staff", ""],
    ["727673410737668107", "Admin | staff", ""],
    ["1079241163455873074", "Admin | staff", ""],
    ["1398772218359451668", "Mod | staff", ""],
    ["941559349808091167", "Mod | staff", ""],
    ["1494112860341670020", "Mod | staff", ""],
    ["952566845939023892", "Mod | seller", "no limit"]
  ];

  const lines = [
    "# .gg/chuppys staff",
    ""
  ];

  for (const [id, role, limit] of staff) {
    lines.push(
      `${SELLER_EMOJI} **<@${id}>**`,
      `Role: ${role}`
    );

    if (limit) {
      lines.push(
        `Limit: ${limit}`
      );
    }

    lines.push(
      `ID: ${id}`,
      ""
    );
  }

  return new EmbedBuilder()
    .setColor(WHITE)
    .setDescription(
      lines.join("\n")
    );
}

// ============================================================
// MOD RESPONSIBILITIES
// ============================================================

function makeModEmbed() {
  return whiteEmbed(
    ".gg/chuppys moderator responsibilities",

    "**Server Moderation**\n" +
    "• Keep the server organized, safe and welcoming.\n" +
    "• Monitor chats and apply rules fairly.\n" +
    "• Prevent spam, harassment, scams and inappropriate behavior.\n\n" +

    "**Ticket Assistance**\n" +
    "• Respond promptly to member tickets.\n" +
    "• Escalate difficult situations to an owner.\n\n" +

    "**Member Assistance**\n" +
    "• Explain server systems and assist with verification.\n" +
    "• Treat members with respect.\n\n" +

    "**Seller & Transaction Safety**\n" +
    "• Help explain the vouch process.\n" +
    "• Take scam reports seriously.\n\n" +

    "**Staff Expectations**\n" +
    "• Remain active and professional.\n" +
    "• Do not abuse permissions or share private staff discussions.\n" +
    "• Avoid arguments and be fair.\n\n" +

    "**Important Rules**\n" +
    "• Never use staff status for personal benefit.\n" +
    "• Do not threaten members with permissions.\n" +
    "• Contact an owner when unsure.\n\n" +

    "-# Thank you for keeping .gg/chuppys safe."
  );
}

// ============================================================
// EMBED SENDER
// ============================================================

async function sendEmbedToChannel(
  guild,
  id,
  embed,
  label
) {
  const channel =
    await guild.channels.fetch(id);

  if (!channel?.send) {
    throw new Error(
      `${label} channel unavailable.`
    );
  }

  return channel.send({
    embeds: [embed],
    allowedMentions: NONE
  });
}

// ============================================================
// ROBUX CASHOUT
// ============================================================

async function sendRobuxCashoutEmbed(channel) {
  if (!channel?.messages) {
    throw new Error(
      "Robux Cash Out channel unavailable."
    );
  }

  const embed =
    new EmbedBuilder()
      .setColor(WHITE)
      .setTitle(
        "Cashing Out Robux"
      )
      .setThumbnail(
        ROBUX_CASHOUT_THUMBNAIL_URL
      )
      .setDescription(
        "RATES\n\n" +

        "**Below 10k**\n3/k\n\n" +

        "**Above 10k**\n3.5/k\n\n" +

        "-# make a cash out ticket now !! " +
        "make sure u ping me in tickets " +
        "<:uppyty:1561094713153429746>"
      )
      .setFooter({
        text: BRAND
      });

  return upsertBotMessage(
    channel,

    message =>
      message.embeds.some(
        existing =>
          (existing.title || "").startsWith(
            "Cashing Out Robux"
          ) ||
          (existing.title || "").startsWith(
            "Robux Cash out"
          )
      ),

    {
      embeds: [embed],
      allowedMentions: NONE
    }
  );
}

// ============================================================
// RANKED ROLES
// ============================================================

async function sendRankedRoles(guild) {
  const embed = whiteEmbed(
    ".gg/chuppys ranked roles",

    RANKED_ROLE_IDS.map(
      (id, index) =>
        `**${index + 1}.** <@&${id}>`
    ).join("\n\n")
  ).setThumbnail(
    RANKED_ROLES_THUMBNAIL_URL
  );

  return sendEmbedToChannel(
    guild,
    RANKED_ROLES_CHANNEL_ID,
    embed,
    "Ranked roles"
  );
}

// ============================================================
// AFK
// ============================================================

async function handleAFK(message) {
  const key =
    `${message.guild.id}:${message.author.id}`;

  const match =
    message.content.trim().match(
      /^,afk(?:\s+([\s\S]*))?$/i
    );

  if (match) {
    const reason =
      (match[1] || "No reason provided.")
        .trim()
        .slice(0, 500) ||
      "No reason provided.";

    afkUsers.set(
      key,
      {
        reason,
        since: Date.now()
      }
    );

    await message.reply({
      content:
        `${AFK_GOING_EMOJI} ${message.author}, you're now AFK!\n` +
        `**Reason:** ${reason}`,

      allowedMentions: {
        repliedUser: false
      }
    });

    return true;
  }

  if (afkUsers.has(key)) {
    afkUsers.delete(key);

    await message.channel.send({
      content:
        `${AFK_RETURN_EMOJI} Welcome back, ${message.author}! ` +
        "Your AFK status has been removed.",

      allowedMentions: NONE
    });
  }

  for (const [id, user] of message.mentions.users) {
    if (
      user.bot ||
      id === message.author.id
    ) {
      continue;
    }

    const info =
      afkUsers.get(
        `${message.guild.id}:${id}`
      );

    if (info) {
      await message.channel.send({
        content:
          `${AFK_GOING_EMOJI} **${user.username} is currently AFK.**\n` +
          `**Reason:** ${info.reason}`,

        allowedMentions: NONE
      });
    }
  }

  return false;
}

// ============================================================
// READY
// ============================================================

client.once(
  Events.ClientReady,

  async readyClient => {
    console.log(
      `[READY] Logged in as ${readyClient.user.tag}`
    );

    readyClient.user.setActivity(
      BRAND,
      {
        type: ActivityType.Watching
      }
    );

    const tasks = [
      registerQuestionCommand(),
      recountAllVouches(),
      sendOrUpdateVerificationMessage()
    ];

    const results =
      await Promise.allSettled(tasks);

    for (const result of results) {
      if (result.status === "rejected") {
        console.error(
          "[READY] Task failed:",
          result.reason
        );
      }
    }

    setInterval(() => {
      if (client.isReady()) {
        scheduleVouchCounterUpdate();
      }
    }, 5 * 60 * 1000);

    console.log(
      "[READY] Ticket module loaded."
    );

    console.log(
      "[READY] Vouch module loaded."
    );

    console.log(
      "[READY] Transactions module loaded."
    );

    console.log(
      "[READY] Fast ,welcome command enabled."
    );

    console.log(
      "[READY] ,welcome history scanning disabled."
    );

    console.log(
      "[READY] ,welcome embed shortened."
    );

    console.log(
      `[READY] Rules channel: ${RULES_CHANNEL_ID}`
    );

    console.log(
      "[READY] Manual verification approval enabled."
    );

    console.log(
      "[READY] Verification creation handled by tickets.js."
    );

    console.log(
      "[READY] No automatic verification."
    );

    console.log(
      "[READY] Vouch tutorial commands enabled."
    );

    console.log(
      "[READY] Vouch reminders enabled."
    );

    console.log(
      "[READY] Vouch counters enabled."
    );

    console.log(
      `[READY] Automatic vouch routing: ${AUTO_ROUTE_VOUCHES}`
    );
  }
);

// ============================================================
// INTERACTION HANDLER
// ============================================================

client.on(
  Events.InteractionCreate,

  async interaction => {

    // ========================================================
    // TICKET MODULE INTERACTIONS
    // ========================================================

    if (
      interaction.isButton() &&
      (
        interaction.customId.startsWith(
          "chuppys_ticket_"
        ) ||
        interaction.customId.startsWith(
          "chuppys_ticket:"
        ) ||
        interaction.customId ===
          VERIFY_TICKET_BUTTON_ID ||
        interaction.customId ===
          UNBLACKLIST_BUTTON_ID
      )
    ) {
      return;
    }

    if (
      interaction.isChatInputCommand() &&
      [
        "ticketpanel",
        "vouch"
      ].includes(interaction.commandName)
    ) {
      return;
    }

    if (
      interaction.isStringSelectMenu() &&
      [
        "chuppys_ticket_select",
        "chuppys_ticket_category",
        "chuppys_tickets",
        "ticket_select",
        "ticket_category",
        "ticket_open",
        "ticket_create"
      ].includes(interaction.customId)
    ) {
      return;
    }

    if (
      interaction.isModalSubmit() &&
      (
        interaction.customId.startsWith(
          "chuppys_ticket_form:"
        ) ||
        interaction.customId.startsWith(
          "chuppys_ticket_close_modal:"
        )
      )
    ) {
      return;
    }

    try {

      // ======================================================
      // OLD AUTO-VERIFY BUTTON
      // ======================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          VERIFY_BUTTON_ID
      ) {
        return interaction.reply(
          ephemeral(
            "Automatic verification is disabled.\n\n" +
            `Visit <#${VERIFY_CHANNEL_ID}> ` +
            "and create a verification ticket."
          )
        );
      }

      // ======================================================
      // OLD VERIFICATION BUTTON
      // ======================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          VERIFY_SECURE_TICKET_BUTTON_ID
      ) {
        return interaction.reply(
          ephemeral(
            "This verification panel has been updated.\n\n" +
            `Visit <#${VERIFY_CHANNEL_ID}> ` +
            "and use the current verification ticket button."
          )
        );
      }

      // ======================================================
      // SELF ROLE SELECTION
      // ======================================================

      if (
        interaction.isStringSelectMenu()
      ) {
        const type =
          Object.keys(
            ROLE_MENU_CONFIG
          ).find(
            key =>
              ROLE_MENU_CONFIG[key].customId ===
              interaction.customId
          );

        if (type) {
          return await handleRoleSelection(
            interaction,
            type
          );
        }
      }

      // ======================================================
      // /HELP
      // ======================================================

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "help"
      ) {
        return interaction.reply({
          embeds: [
            makeHelpEmbed()
          ],
          flags: EPHEMERAL
        });
      }

      // ======================================================
      // /REQUEST
      // ======================================================

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "request"
      ) {
        if (
          interaction.channelId !==
          REQUEST_CHANNEL_ID
        ) {
          return interaction.reply(
            ephemeral(
              `Please use /request in <#${REQUEST_CHANNEL_ID}>.`
            )
          );
        }

        const category =
          interaction.options.getString(
            "category",
            true
          );

        const items =
          interaction.options.getString(
            "items",
            true
          ).trim();

        if (!items) {
          return interaction.reply(
            ephemeral(
              "Please enter the requested items."
            )
          );
        }

        await interaction.deferReply({
          flags: EPHEMERAL
        });

        const embed = whiteEmbed(
          `${category} Request`,

          `**Requested by:** <@${interaction.user.id}>\n\n` +
          `**Category:** ${category}\n\n` +

          "**What they'd like Chuppys to stock up on:**\n" +
          safeText(items)
        )
          .setThumbnail(
            REQUEST_THUMBNAIL_URL
          )
          .setTimestamp();

        const channel =
          await client.channels.fetch(
            REQUEST_CHANNEL_ID
          );

        await channel.send({
          embeds: [embed],
          allowedMentions: NONE
        });

        return interaction.editReply(
          `Your **${category}** request has been submitted! ♡`
        );
      }

      // ======================================================
      // CLIENT ROLE BUTTON
      // ======================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          CLIENT_BUTTON_ID
      ) {
        if (!interaction.inGuild()) {
          return interaction.reply(
            ephemeral(
              "This button only works in the server."
            )
          );
        }

        await interaction.deferReply({
          flags: EPHEMERAL
        });

        const member =
          await interaction.guild.members.fetch({
            user: interaction.user.id,
            force: true
          });

        if (await isBlacklisted(member)) {
          return interaction.editReply(
            "You cannot claim the client role while blacklisted."
          );
        }

        if (
          !member.roles.cache.has(
            CHUPPYS_ROLE_ID
          )
        ) {
          return interaction.editReply(
            "You must complete staff-approved verification " +
            `in <#${VERIFY_CHANNEL_ID}> before claiming the client role.`
          );
        }

        if (
          member.roles.cache.has(
            CLIENT_ROLE_ID
          )
        ) {
          return interaction.editReply(
            "You already have the client role!"
          );
        }

        await member.roles.add(
          CLIENT_ROLE_ID,
          "Verified member claimed the Chuppys client role."
        );

        return interaction.editReply(
          `${CLIENT_EMOJI} You've received the client role! ` +
          "You can now submit your vouch."
        );
      }

      // ======================================================
      // /QUESTION
      // ======================================================

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "question"
      ) {
        if (
          interaction.channelId !==
          QUESTION_CHANNEL_ID
        ) {
          return interaction.reply(
            ephemeral(
              `Please use /question in <#${QUESTION_CHANNEL_ID}>.`
            )
          );
        }

        const questionText =
          interaction.options.getString(
            "question",
            true
          );

        const picture =
          interaction.options.getAttachment(
            "picture"
          );

        if (
          picture &&
          !picture.contentType?.startsWith(
            "image/"
          )
        ) {
          return interaction.reply(
            ephemeral(
              "The picture must be an image."
            )
          );
        }

        await interaction.deferReply({
          flags: EPHEMERAL
        });

        const embed = whiteEmbed(
          `Question from ${interaction.user.username}`,

          `**Question**\n${safeText(questionText)}`
        )
          .setThumbnail(
            QUESTION_EMOJI_URL
          )
          .setFooter({
            text:
              `${BRAND} • Question User ID: ${interaction.user.id}`
          })
          .setTimestamp();

        if (picture) {
          embed.setImage(
            picture.url
          );
        }

        const buttons =
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(
                "question_ticket"
              )
              .setLabel(
                "Make a Support Ticket"
              )
              .setEmoji({
                id: VERIFY_BUTTON_EMOJI_ID
              })
              .setStyle(
                ButtonStyle.Secondary
              ),

            new ButtonBuilder()
              .setCustomId(
                "question_reply"
              )
              .setLabel(
                "Reply to Question"
              )
              .setEmoji({
                id: VERIFY_BUTTON_EMOJI_ID
              })
              .setStyle(
                ButtonStyle.Primary
              )
          );

        await interaction.channel.send({
          embeds: [embed],
          components: [buttons],
          allowedMentions: NONE
        });

        return interaction.editReply(
          "Your question has been submitted!"
        );
      }

      // ======================================================
      // QUESTION TICKET BUTTON
      // ======================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
          "question_ticket"
      ) {
        const embed =
          new EmbedBuilder()
            .setColor(WHITE)
            .setThumbnail(
              QUESTION_EMOJI_URL
            )
            .setDescription(
              "This question requires a support ticket.\n\n" +

              `Please make one in <#${QUESTION_TICKET_CHANNEL_ID}> ` +
              "using the ticket dropdown menu.\n\n" +

              `Our <@&${TICKET_SUPPORT_ROLE_ID}> team ` +
              "will assist you there.\n\n" +

              "Thank you! <:uppyty:1561094713153429746>"
            )
            .setFooter({
              text: BRAND
            });

        return interaction.reply({
          embeds: [embed],
          flags: EPHEMERAL,
          allowedMentions: NONE
        });
      }

      // ======================================================
      // QUESTION REPLY BUTTON
      // ======================================================

      if (
        interaction.isButton() &&
        interaction.customId.startsWith(
          "question_reply"
        )
      ) {
        if (!canReplyToQuestion(interaction)) {
          return interaction.reply(
            ephemeral(
              "Only Ticket Support and moderators can reply."
            )
          );
        }

        const footer =
          interaction.message?.embeds?.[0]
            ?.footer?.text || "";

        const userId =
          footer.match(
            /Question User ID:\s*(\d{17,20})/
          )?.[1] ||
          interaction.customId.match(
            /^question_reply:(\d{17,20})$/
          )?.[1] ||
          null;

        const suffix =
          userId
            ? `${userId}:${interaction.message.id}`
            : interaction.message.id;

        const modal =
          new ModalBuilder()
            .setCustomId(
              `question_reply_modal:${suffix}`
            )
            .setTitle(
              "Reply to Question"
            );

        const input =
          new TextInputBuilder()
            .setCustomId(
              "question_reply_text"
            )
            .setLabel(
              "Your response"
            )
            .setPlaceholder(
              "Write your response..."
            )
            .setStyle(
              TextInputStyle.Paragraph
            )
            .setRequired(true)
            .setMaxLength(2000);

        modal.addComponents(
          new ActionRowBuilder()
            .addComponents(input)
        );

        return interaction.showModal(
          modal
        );
      }

      // ======================================================
      // QUESTION REPLY MODAL
      // ======================================================

      if (
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(
          "question_reply_modal:"
        )
      ) {
        if (!canReplyToQuestion(interaction)) {
          return interaction.reply(
            ephemeral(
              "You cannot reply to questions."
            )
          );
        }

        await interaction.deferReply({
          flags: EPHEMERAL
        });

        const parts =
          interaction.customId.split(":");

        const messageId =
          parts.length === 3
            ? parts[2]
            : parts[1];

        const fallbackId =
          parts.length === 3
            ? parts[1]
            : null;

        const channel =
          await client.channels.fetch(
            QUESTION_CHANNEL_ID
          );

        const questionMessage =
          await channel?.messages?.fetch(
            messageId
          ).catch(() => null);

        if (!questionMessage) {
          return interaction.editReply(
            "Original question not found."
          );
        }

        const footer =
          questionMessage.embeds[0]?.footer?.text ||
          "";

        const userId =
          footer.match(
            /Question User ID:\s*(\d+)/
          )?.[1] ||
          fallbackId;

        if (!userId) {
          return interaction.editReply(
            "Couldn't identify the question author."
          );
        }

        const user =
          await client.users.fetch(
            userId
          ).catch(() => null);

        if (!user) {
          return interaction.editReply(
            "Couldn't find the user."
          );
        }

        const answer =
          interaction.fields.getTextInputValue(
            "question_reply_text"
          );

        const embed = whiteEmbed(
          "Response to Your Question",

          `${QUESTION_EMOJI} **Replied by:** ` +
          `${interaction.user.username}\n\n` +
          `**Response:**\n${safeText(answer)}`
        )
          .setThumbnail(
            QUESTION_EMOJI_URL
          )
          .setTimestamp();

        try {
          await user.send({
            embeds: [embed],
            allowedMentions: NONE
          });

        } catch {
          return interaction.editReply(
            "I couldn't DM the user. Their DMs may be disabled."
          );
        }

        return interaction.editReply(
          `Your response was sent privately to **${user.username}**.`
        );
      }

    } catch (error) {
      await interactionError(
        interaction,
        error
      );
    }
  }
);

// ============================================================
// MESSAGE COMMANDS
// ============================================================

client.on(
  Events.MessageCreate,

  async message => {
    if (
      !message.guild ||
      message.author.bot
    ) {
      return;
    }

    const raw =
      message.content.trim();

    const cmd =
      raw.toLowerCase();

    // Normal ticket commands belong to tickets.js.

    if (
      /^,(?:claim|forceclaim|close|reopen|delete)(?:\s|$)/i
        .test(raw)
    ) {
      return;
    }

    const reply =
      content =>
        message.reply({
          content,

          allowedMentions: {
            parse: [],
            repliedUser: false
          }
        });

    try {

      // ======================================================
      // FAST ,WELCOME
      // ======================================================

      if (cmd === ",welcome") {
        return handleWelcomeCommand(
          message
        );
      }

      // ======================================================
      // OLD VERIFICATION CLOSE COMMANDS
      // ======================================================

      if (
        cmd === ",vclose" ||
        cmd === ",vcancel"
      ) {
        if (
          await isOfficialVerificationTicket(
            message.channel
          )
        ) {
          const hidden =
            await hideVerificationCommand(
              message
            );

          if (hidden) {
            await privateNotice(
              message.author,
              "Verification tickets now use the normal ticket controls."
            );
          }
        }

        return;
      }

      // ======================================================
      // HIDDEN MANUAL VERIFICATION
      // ======================================================

      const verifyCommand =
        raw.match(
          /^,r\s+<@!?(\d{17,20})>\s+c\s*$/i
        );

      if (verifyCommand) {
        if (
          !isVerificationStaff(
            message.member
          )
        ) {
          return;
        }

        const hidden =
          await hideVerificationCommand(
            message
          );

        if (!hidden) {
          return;
        }

        return approveVerification(
          message,
          verifyCommand[1]
        );
      }

      // ======================================================
      // GREETING
      // ======================================================

      if (
        /^(?:hi+|hey+|hello+|heya+)[!.?,\s]*$/i
          .test(raw)
      ) {
        return reply(
          `Hi ! ${AFK_RETURN_EMOJI}`
        );
      }

      // ======================================================
      // AFK
      // ======================================================

      if (await handleAFK(message)) {
        return;
      }

      // ======================================================
      // ROLE COMMANDS
      // ======================================================

      if (
        Object.prototype.hasOwnProperty.call(
          ROLE_COMMANDS,
          cmd
        )
      ) {
        await handleRolePanelCommand(
          message,
          ROLE_COMMANDS[cmd]
        );

        return;
      }

      // ======================================================
      // APPEAL PANEL
      // ======================================================

      if (
        [
          ",appealpanel",
          ",unblacklistpanel"
        ].includes(cmd)
      ) {
        await handleUnblacklistPanelCommand(
          message
        );

        return;
      }

      // ======================================================
      // CLIENT PANEL
      // ======================================================

      if (cmd === ",client") {
        if (!lock(
          locks.client,
          message.channel.id
        )) {
          return;
        }

        try {
          await upsertBotMessage(
            message.channel,

            msg =>
              msg.embeds.some(
                embed =>
                  (embed.description || "").includes(
                    "Please click the button below for the client role"
                  )
              ),

            {
              embeds: [
                makeClientEmbed()
              ],
              components: [
                makeClientButton()
              ],
              allowedMentions: NONE
            }
          );

        } finally {
          locks.client.delete(
            message.channel.id
          );
        }

        return;
      }

      // ======================================================
      // PROMOTER
      // ======================================================

      if (cmd === ",promoter") {
        if (!lock(
          locks.promoter,
          message.channel.id
        )) {
          return;
        }

        try {
          await upsertBotMessage(
            message.channel,

            msg =>
              msg.embeds.some(
                embed =>
                  embed.title ===
                  ".gg/chuppys promoter information"
              ),

            {
              content: "",
              embeds: [
                makePromoterEmbed()
              ],
              components: [],
              allowedMentions: NONE
            }
          );

        } finally {
          locks.promoter.delete(
            message.channel.id
          );
        }

        return;
      }

      // ======================================================
      // VOUCH TUTORIAL COMMANDS
      // ======================================================

      if (
        Object.prototype.hasOwnProperty.call(
          VOUCH_TUTORIAL_COMMANDS,
          cmd
        )
      ) {
        await handleVouchTutorialCommand(
          message,
          VOUCH_TUTORIAL_COMMANDS[cmd]
        );

        return;
      }

      // ======================================================
      // RANKED ROLES
      // ======================================================

      if (cmd === "!ranked") {
        if (!canManageServer(message.member)) {
          return reply(
            "You need Manage Server permission."
          );
        }

        await sendRankedRoles(
          message.guild
        );

        return reply(
          "The ranked roles embed has been sent!"
        );
      }

      // ======================================================
      // ,R @USER COMMANDS
      // ======================================================

      if (/^,r(?:\s|$)/i.test(raw)) {
        const match =
          raw.match(
            /^,r\s+<@!?(\d{17,20})>\s+(b|r|rmarket|rinv|rgive|rconv|rall)(?:\s+([\s\S]*))?$/i
          );

        if (!match) {
          return reply(
            "**Chuppys Vouch Reminders**\n\n" +

            "`,r @user r` — Market\n" +
            "`,r @user rmarket` — Market\n" +
            "`,r @user rinv` — Invite Challenge\n" +
            "`,r @user rgive` — Giveaway\n" +
            "`,r @user rconv` — Converter\n" +
            "`,r @user rall` — All categories"
          );
        }

        const [
          ,
          targetId,
          actionRaw,
          reason = ""
        ] = match;

        const action =
          actionRaw.toLowerCase();

        // BLACKLIST
        if (action === "b") {
          return handleBlacklistCommand(
            message,
            targetId,
            reason
          );
        }

        // VOUCH REMINDERS
        if (
          !isVerificationStaff(
            message.member
          )
        ) {
          return reply(
            "Only authorized staff can send vouch reminders."
          );
        }

        const target =
          await message.guild.members.fetch(
            targetId
          ).catch(() => null);

        if (!target) {
          return reply(
            "I couldn't find that member."
          );
        }

        const reminderType =
          VOUCH_REMINDER_TYPES[action];

        if (reminderType) {
          await sendVouchReminder(
            message,
            target,
            reminderType
          );

          return;
        }
      }

      // ======================================================
      // PARTNER
      // ======================================================

      if (cmd === ",partner") {
        if (!isTicketSupport(message.member)) {
          return reply(
            "Only Ticket Support can use this command."
          );
        }

        const embed = whiteEmbed(
          ".gg/chuppys partnership",

          "Please make sure all questions from the " +
          ".gg/chuppys ticket bot are answered!\n\n" +

          "1. **How many vouches? Please show proof!**\n\n" +

          "2. **How many server members?**\n\n" +

          "After answering, copy and paste your server ad " +
          "in the ticket. Staff will post it in " +
          "<#1552387314049618041>.\n\n" +

          "Go to <#1552387259276329110> to copy " +
          "Chuppys' ad and send screenshot proof."
        );

        await upsertBotMessage(
          message.channel,

          msg =>
            msg.embeds.some(
              existing =>
                (existing.description || "").includes(
                  ".gg/chuppys partnership"
                )
            ),

          {
            content: "",
            embeds: [embed],
            components: [],
            allowedMentions: NONE
          }
        );

        return;
      }

      // ======================================================
      // MOD
      // ======================================================

      if (cmd === ",mod") {
        if (!isTicketSupport(message.member)) {
          return reply(
            "Only Ticket Support can use this command."
          );
        }

        await upsertBotMessage(
          message.channel,

          msg =>
            msg.embeds.some(
              embed =>
                embed.title ===
                ".gg/chuppys moderator responsibilities"
            ),

          {
            content: "",
            embeds: [
              makeModEmbed()
            ],
            components: [],
            allowedMentions: NONE
          }
        );

        return;
      }

      // ======================================================
      // SELLER
      // ======================================================

      if (cmd === ",seller") {
        if (!lock(
          locks.seller,
          message.channel.id
        )) {
          return;
        }

        try {
          const embed =
            new EmbedBuilder()
              .setColor(WHITE)
              .setDescription(
                "**Interested in selling at .gg/chuppys**\n\n" +

                "**Permanent fees**\n\n" +

                "$10 - permanent fee with no personal commands\n\n" +

                "$15 - permanent fee with personal commands\n\n" +

                "Personal commands are commands we can create " +
                "for you or insert your code for.\n\n" +

                "Your limit is based primarily on your " +
                "personal vouches. Server vouches from " +
                "other sellers do not increase your limit.\n\n" +

                "After your limit is determined, every " +
                "2 vouches gained in .gg/chuppys increases " +
                "your limit by $5.\n\n" +

                `If you agree, please ping <@&${TICKET_SUPPORT_ROLE_ID}> ` +
                "to assist you further. Thank you!"
              )
              .setFooter({
                text: BRAND
              });

          await upsertBotMessage(
            message.channel,

            msg =>
              msg.embeds.some(
                existing =>
                  (existing.description || "").includes(
                    "Interested in selling at .gg/chuppys"
                  )
              ),

            {
              content: "",
              embeds: [embed],
              components: [],
              allowedMentions: NONE
            }
          );

        } finally {
          locks.seller.delete(
            message.channel.id
          );
        }

        return;
      }

      // ======================================================
      // ROBUX CASHOUT
      // ======================================================

      if (cmd === "!robuxcashout") {
        if (!canManageServer(message.member)) {
          return reply(
            "You need Manage Server permission."
          );
        }

        await sendRobuxCashoutEmbed(
          await client.channels.fetch(
            ROBUX_CASHOUT_CHANNEL_ID
          )
        );

        return reply(
          "Robux Cash Out message updated successfully!"
        );
      }

      // ======================================================
      // PAY
      // ======================================================

      if (cmd === ",pay") {
        if (!lock(
          locks.payment,
          message.channel.id
        )) {
          return;
        }

        try {
          await sendPaymentEmbed(
            message.channel
          );

        } catch (error) {
          console.error(
            "[PAY] Error:",
            error
          );

          await reply(
            "I couldn't send the payment methods."
          );

        } finally {
          locks.payment.delete(
            message.channel.id
          );
        }

        return;
      }

      // ======================================================
      // ADMIN SERVICE COMMANDS
      // ======================================================

      const adminCommands = [
        "!nitro",
        ",nitro",
        "!decor",
        ",decor",
        "!boosties",
        ",boosties",
        "!sellers",
        ",sellers",
        "!staff",
        ",staff"
      ];

      if (adminCommands.includes(cmd)) {
        if (!canManageServer(message.member)) {
          return reply(
            "You need Manage Server permission."
          );
        }

        if (
          ["!nitro", ",nitro"].includes(cmd)
        ) {
          await sendNitroServices(
            await client.channels.fetch(
              NITRO_CHANNEL_ID
            )
          );

          return reply(
            "Nitro message updated successfully."
          );
        }

        if (
          ["!decor", ",decor"].includes(cmd)
        ) {
          await sendDecorServices(
            await client.channels.fetch(
              DECOR_CHANNEL_ID
            )
          );

          return reply(
            "Decor message updated successfully."
          );
        }

        if (
          ["!boosties", ",boosties"].includes(cmd)
        ) {
          await sendBoostiesServices(
            await client.channels.fetch(
              BOOSTIES_CHANNEL_ID
            )
          );

          return reply(
            "Boosties message updated successfully."
          );
        }

        if (
          ["!sellers", ",sellers"].includes(cmd)
        ) {
          await sendEmbedToChannel(
            message.guild,
            SELLERS_CHANNEL_ID,
            makeSellersEmbed(),
            "Sellers"
          );

          return reply(
            "The sellers message was sent!"
          );
        }

        if (
          ["!staff", ",staff"].includes(cmd)
        ) {
          await sendEmbedToChannel(
            message.guild,
            STAFF_CHANNEL_ID,
            makeStaffEmbed(),
            "Staff"
          );

          return reply(
            "The staff message was sent!"
          );
        }
      }

      // ======================================================
      // TEST WELCOME
      // ======================================================

      if (cmd === "!testwelcome") {
        const channel =
          await client.channels.fetch(
            WELCOME_CHANNEL_ID
          );

        const embed = whiteEmbed(
          `Welcome to .gg/chuppys ${AFK_RETURN_EMOJI}`,

          `Welcome <@${message.author.id}>!\n\n` +
          "We're happy to have you here. " +
          "Read the rules and enjoy your time!"
        )
          .setThumbnail(
            message.author.displayAvatarURL()
          )
          .setImage(
            WELCOME_IMAGE
          )
          .setFooter({
            text: message.guild.name
          });

        await channel.send({
          content: `<@${message.author.id}>`,
          embeds: [embed],

          allowedMentions: {
            users: [
              message.author.id
            ]
          }
        });

        return;
      }

      // ======================================================
      // TEST GOODBYE
      // ======================================================

      if (cmd === "!testgoodbye") {
        const channel =
          await client.channels.fetch(
            GOODBYE_CHANNEL_ID
          );

        const embed = whiteEmbed(
          `Goodbye ${AFK_GOING_EMOJI}`,

          `**${message.author.username}** has left ` +
          `**${message.guild.name}**.\n\n` +

          "We hope to see you again!"
        )
          .setThumbnail(
            message.author.displayAvatarURL()
          )
          .setFooter({
            text: message.guild.name
          });

        await channel.send({
          embeds: [embed]
        });

        return;
      }

    } catch (error) {
      console.error(
        "[MESSAGE COMMAND] Error:",
        error
      );

      await reply(
        `Something went wrong: ${safeText(error.message)}`
      ).catch(() => {});
    }
  }
);

// ============================================================
// INVITE BOT REACTIONS
// ============================================================

client.on(
  Events.MessageCreate,

  async message => {
    if (!message.guild) {
      return;
    }

    if (
      message.channel.id !== INVITE_CHANNEL_ID ||
      message.author.id !== INVITE_BOT_ID
    ) {
      return;
    }

    try {
      await message.react(
        INVITE_REACTION_EMOJI
      );

    } catch (error) {
      console.error(
        "[INVITE REACTION]",
        error
      );
    }
  }
);

// ============================================================
// VOUCH REACTIONS / ROUTING / COUNTERS
// ============================================================

client.on(
  Events.MessageCreate,

  async message => {
    if (
      !message.guild ||
      !VOUCH_SOURCE_CHANNEL_IDS.includes(
        message.channel.id
      )
    ) {
      return;
    }

    try {
      if (looksLikeVouch(message)) {
        await reactToVouch(message);
      }

      if (AUTO_ROUTE_VOUCHES) {
        await routeVouch(message);
      }

    } catch (error) {
      console.error(
        "[VOUCH MESSAGE] Error:",
        error
      );
    }

    scheduleVouchCounterUpdate();
  }
);

// ============================================================
// VOUCH MESSAGE DELETE
// ============================================================

client.on(
  Events.MessageDelete,

  message => {
    if (
      message.channel &&
      VOUCH_SOURCE_CHANNEL_IDS.includes(
        message.channel.id
      )
    ) {
      scheduleVouchCounterUpdate();
    }
  }
);

// ============================================================
// VOUCH BULK DELETE
// ============================================================

client.on(
  Events.MessageBulkDelete,

  messages => {
    if (
      messages.some(
        message =>
          message.channel &&
          VOUCH_SOURCE_CHANNEL_IDS.includes(
            message.channel.id
          )
      )
    ) {
      scheduleVouchCounterUpdate();
    }
  }
);

// ============================================================
// VOUCH MESSAGE UPDATE
// ============================================================

client.on(
  Events.MessageUpdate,

  (oldMessage, newMessage) => {
    const channelId =
      newMessage.channelId ||
      oldMessage.channelId;

    if (
      VOUCH_SOURCE_CHANNEL_IDS.includes(
        channelId
      )
    ) {
      scheduleVouchCounterUpdate();
    }
  }
);

// ============================================================
// AUTOMATIC MEMBER WELCOME
// ============================================================

client.on(
  Events.GuildMemberAdd,

  async member => {
    try {
      await member.roles.add(
        WELCOME_ROLE_ID
      ).catch(error => {
        console.error(
          "[WELCOME] Role:",
          error
        );
      });

      const channel =
        await member.guild.channels.fetch(
          WELCOME_CHANNEL_ID
        );

      if (!channel?.send) {
        return;
      }

      const embed = whiteEmbed(
        `Welcome to .gg/chuppys ${AFK_RETURN_EMOJI}`,

        `Welcome ${member}!\n\n` +

        "We're happy to have you here. " +
        "Make sure to read the rules and enjoy your time!"
      )
        .setThumbnail(
          member.user.displayAvatarURL()
        )
        .setImage(
          WELCOME_IMAGE
        )
        .setFooter({
          text: member.guild.name
        });

      await channel.send({
        content: `${member}`,
        embeds: [embed],

        allowedMentions: {
          users: [member.id]
        }
      });

    } catch (error) {
      console.error(
        "[WELCOME] Error:",
        error
      );
    }
  }
);

// ============================================================
// GOODBYE
// ============================================================

client.on(
  Events.GuildMemberRemove,

  async member => {
    try {
      const channel =
        await member.guild.channels.fetch(
          GOODBYE_CHANNEL_ID
        );

      if (!channel?.send) {
        return;
      }

      const embed = whiteEmbed(
        `Goodbye ${AFK_GOING_EMOJI}`,

        `**${member.user.username}** has left ` +
        `**${member.guild.name}**.\n\n` +

        "We hope to see you again!"
      )
        .setThumbnail(
          member.user.displayAvatarURL()
        )
        .setFooter({
          text: member.guild.name
        });

      await channel.send({
        embeds: [embed]
      });

    } catch (error) {
      console.error(
        "[GOODBYE] Error:",
        error
      );
    }
  }
);

// ============================================================
// ERROR HANDLING
// ============================================================

client.on("error", error => {
  console.error(
    "[DISCORD CLIENT]",
    error
  );
});

process.on("unhandledRejection", error => {
  console.error(
    "[PROCESS] Unhandled rejection:",
    error
  );
});

// ============================================================
// LOGIN
// ============================================================

if (!TOKEN) {
  console.error(
    "[LOGIN] DISCORD_BOT_TOKEN is missing."
  );

} else if (!GUILD_ID) {
  console.error(
    "[LOGIN] DISCORD_GUILD_ID is missing."
  );

} else {
  client.login(TOKEN).catch(error => {
    console.error(
      "[LOGIN] Discord login failed:",
      error
    );
  });
}

// ============================================================
// END OF CHUPPYS MAIN BOT INDEX.JS
// ============================================================
