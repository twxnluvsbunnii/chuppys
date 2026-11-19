
"use strict";

// ============================================================
// CHUPPYS MAIN BOT — DISCORD.JS V14 / RENDER
// ============================================================
//
// MODULES:
// vouch.js
// transactions.js
// tickets.js
//
// VOUCH COUNTERS:
// - Personal vouches
// - Invite Challenge vouches
// - Giveaway vouches
// - Server total vouches
//
// COUNTER ORDER:
// ╭・chuppy total vouches : ##
// ┃・invite・vouches : ##
// ┃・giveaway・vouches : ##
// ╰・server total vouches : ##
//
// COUNTER CATEGORY:
// 1566512371521036329
//
// FEATURES:
// - Counts existing messages and new vouches
// - Detects native Discord forwarded messages
// - Deduplicates known original message references
// - Recounts after restarts
// - Creates missing Invite/Giveaway counter channels
// - Keeps existing personal/server counter IDs
//
// PRESERVED COMMANDS:
//
// /help
// /question
// /request
// /vouch (handled by vouch.js)
// /ticketpanel (handled by tickets.js)
//
// ,claim
// ,forceclaim
// ,close
// ,reopen
// ,delete
// ,roles
// ,pings
// ,age
// ,pronouns
// ,client
// ,promoter
// ,seller
// ,partner
// ,mod
// ,r @user c
// ,r @user r
// ,r @user b reason
// ,appealpanel
// ,unblacklistpanel
// ,afk
// ,pay
// ,nitro / !nitro
// ,decor / !decor
// ,boosties / !boosties
// ,sellers / !sellers
// ,staff / !staff
// !vouchtut
// !ranked
// !robuxcashout
// !testwelcome
// !testgoodbye
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
  ChannelType
} = require("discord.js");

// ============================================================
// RENDER WEB SERVER
// ============================================================

const PORT = Number(process.env.PORT) || 3000;

http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("Chuppys bot is running!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`[WEB] Server running on ${PORT}`);
});

// ============================================================
// ENVIRONMENT
// ============================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const EPHEMERAL = MessageFlags.Ephemeral;
const BRAND = ".gg/chuppys";
const WHITE = 0xffffff;

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

const VERIFY_CHANNEL_ID = "1528716328985301052";
const ROLES_CHANNEL_ID = "1530808091380285592";

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

const RULES_CHANNEL_ID = "1551275482857865333";

const VOUCH_TUTORIAL_CHANNEL_ID =
  "1562958688896028802";

const QUICK_VOUCH_CHANNEL_ID =
  "1552903786077360269";

const PARTNER_AD_CHANNEL_ID =
  "1552387259276329110";

const INVITE_CHANNEL_ID =
  "1560249120667734016";

const INVITE_BOT_ID =
  "499595256270946326";

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

// ============================================================
// COUNTER CATEGORY AND CHANNELS
// ============================================================

const COUNT_CATEGORY_ID =
  "1566512371521036329";

// Existing counter channels.

const CHUPPY_COUNT_CHANNEL_ID =
  "1553242286412922960";

const SERVER_COUNT_CHANNEL_ID =
  "1562266346891247688";

// Optional Render environment variables.
//
// If the new counter channels already exist,
// place their IDs in these environment variables.
//
// Otherwise, the bot searches by channel name
// or creates the missing counter channels.

const GIVEAWAY_COUNT_CHANNEL_ID =
  process.env.GIVEAWAY_COUNT_CHANNEL_ID || "";

const INVITE_COUNT_CHANNEL_ID =
  process.env.INVITE_COUNT_CHANNEL_ID || "";

// ============================================================
// COUNTER NAMES
// ============================================================

const COUNT_NAMES = Object.freeze({
  personal: "╭・chuppy total vouches : ",
  invite: "┃・invite・vouches : ",
  giveaway: "┃・giveaway・vouches : ",
  server: "╰・server total vouches : "
});

const VOUCH_SOURCE_CHANNEL_IDS = [
  PERSONAL_VOUCH_CHANNEL_ID,
  VOUCH_CHANNEL_ID,
  GIVEAWAY_VOUCH_CHANNEL_ID,
  INVITE_VOUCH_CHANNEL_ID
];

// ============================================================
// VOUCH EMOJIS
// ============================================================

const CHUPPY_TY_EMOJI =
  "<:uppyty:1561094713153429746>";

const VOUCH_TYPE_EMOJI =
  "<:zymochadance:1565501941675462719>";

// ============================================================
// ROLE CONFIGURATION
// ============================================================

const OWNER_ROLE_ID = "1530988662970650865";
const ADMIN_ROLE_ID = "1531800870444994641";
const MOD_ROLE_ID = "1531800784700706887";

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

const VERIFY_BUTTON_ID = "chuppys_verify";

const VERIFY_TICKET_BUTTON_ID =
  "chuppys_create_verification_ticket";

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

const PING_ROLE_IDS = Object.values(PING_ROLES);

const VERIFICATION_PING_ROLE_IDS = [
  ...new Set([
    ...PING_ROLE_IDS,
    "1551276593425685333",
    "1569731217799127210",
    "1569731506706849872"
  ])
];

// ============================================================
// AGE ROLES
// ============================================================

const AGE_ROLES = Object.freeze({
  under18: "1531084465126772877",
  age18to20: "1531084550849954003",
  age21plus: "1531084611399188640"
});

const AGE_ROLE_IDS = Object.values(AGE_ROLES);

// ============================================================
// PRONOUN ROLES
// ============================================================

const PRONOUN_ROLES = Object.freeze({
  sheher: "1531084942241697854",
  hehim: "1531086100867842190",
  theythem: "1531101006451048448"
});

const PRONOUN_ROLE_IDS = Object.values(PRONOUN_ROLES);

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

const CHUPPYS_WELCOME_EMOJI =
  "<:chuppys:1560284517955141653>";

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

const PAYMENT_METHODS_TEXT =
  "**Payment Methods**\n" +
  "> Apple Pay\n" +
  "> Venmo\n" +
  "> Cash App\n" +
  "> Chime";

const EXTRA_PAYMENT_METHODS = [
  5,
  6
].map(n => ({
  name: process.env[`PAYMENT_METHOD_${n}_NAME`] || "",
  details: process.env[`PAYMENT_METHOD_${n}_DETAILS`] || "",
  url: process.env[`PAYMENT_METHOD_${n}_URL`] || ""
}));

// ============================================================
// SLASH COMMANDS
// ============================================================

const QUESTION_COMMAND =
  new SlashCommandBuilder()
    .setName("question")
    .setDescription(
      "Submit a question to the Chuppys team."
    )
    .addStringOption(option =>
      option
        .setName("question")
        .setDescription(
          "Type the question you want to ask."
        )
        .setRequired(true)
        .setMaxLength(2000)
    )
    .addAttachmentOption(option =>
      option
        .setName("picture")
        .setDescription(
          "Optionally attach a picture."
        )
        .setRequired(false)
    );

const REQUEST_COMMAND =
  new SlashCommandBuilder()
    .setName("request")
    .setDescription(
      "Request items for Chuppys to stock up on."
    )
    .addStringOption(option =>
      option
        .setName("category")
        .setDescription(
          "Choose the request category."
        )
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
        .setDescription(
          "What should Chuppys stock up on?"
        )
        .setRequired(true)
        .setMaxLength(1000)
    );

const HELP_COMMAND =
  new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      "View all Chuppys bot commands."
    );

// ============================================================
// RUNTIME
// ============================================================

const afkUsers = new Map();

const locks = {
  seller: new Set(),
  client: new Set(),
  promoter: new Set(),
  role: new Set(),
  roleSelect: new Set(),
  payment: new Set(),
  blacklist: new Set(),
  appeal: new Set()
};

const blacklistRoleJobs = new Map();

let vouchCounterTimer = null;
let vouchCounterUpdateRunning = false;
let vouchCounterRecountRequested = false;

let counterCache = null;
let counterRecountAt = 0;

// ============================================================
// CLIENT
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
// CONNECT MODULES
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

function lock(set, key) {
  if (set.has(key)) {
    return false;
  }

  set.add(key);
  return true;
}

async function interactionError(interaction, error) {
  console.error("[INTERACTION]", error);

  if (!interaction.isRepliable()) {
    return;
  }

  try {
    const content =
      "Something went wrong while processing that interaction.";

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
  } catch (error) {
    console.error(
      "[INTERACTION] Reply failed:",
      error
    );
  }
}

// ============================================================
// BLACKLIST ROLE LOOKUP
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
      reason: "Chuppys blacklist moderation system"
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

  const role =
    await findBlacklistRole(member.guild);

  return Boolean(
    role && member.roles.cache.has(role.id)
  );
}

function canBlacklist(member) {
  if (!member?.guild) {
    return false;
  }

  return (
    member.id === member.guild.ownerId ||
    [
      OWNER_ROLE_ID,
      ADMIN_ROLE_ID,
      MOD_ROLE_ID
    ].some(id =>
      member.roles.cache.has(id)
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
    "Please explain your situation respectfully. " +
    "An appeal does not guarantee removal."
  )
    .setThumbnail(UNBLACKLIST_THUMBNAIL_URL)
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
  ).setThumbnail(UNBLACKLIST_THUMBNAIL_URL);
}

function makeUnblacklistPanelButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(UNBLACKLIST_BUTTON_ID)
        .setLabel("Request Unblacklist Ticket")
        .setEmoji({
          id: VERIFY_BUTTON_EMOJI_ID
        })
        .setStyle(ButtonStyle.Primary)
    )
  ];
}

// ============================================================
// BOT MESSAGE HELPERS
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
  const matching =
    await findBotMessages(
      channel,
      predicate,
      pages
    );

  let result;

  if (matching.length) {
    result =
      await matching[0].edit(payload);

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
              component.customId === UNBLACKLIST_BUTTON_ID
          )
      ),
    {
      content: "",
      embeds: [makeUnblacklistPanelEmbed()],
      components: makeUnblacklistPanelButtons(),
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

  if (!lock(locks.appeal, message.channel.id)) {
    return message.reply(
      "The appeal panel is already being updated."
    );
  }

  try {
    const result =
      await postUnblacklistPanel(message.channel);

    await message.reply({
      content:
        `Unblacklist appeal panel ${result.updated ? "updated" : "posted"} successfully!`,
      allowedMentions: {
        repliedUser: false
      }
    });
  } finally {
    locks.appeal.delete(message.channel.id);
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

  const clean = String(reason || "").trim();

  if (!clean) {
    return message.reply(
      "Usage: `,r @user b reason here`"
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

    const actor =
      await guild.members.fetch({
        user: message.author.id,
        force: true
      });

    const target =
      await guild.members.fetch({
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

    const bot =
      await guild.members.fetchMe();

    if (
      !bot.permissions.has(
        PermissionFlagsBits.ManageRoles
      )
    ) {
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

    if (target.roles.cache.has(blacklisted.id)) {
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
      console.error("[BLACKLIST] Log:", error);
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
      allowedMentions: {
        repliedUser: false,
        parse: []
      }
    });
  } finally {
    locks.blacklist.delete(key);
  }
}

// ============================================================
// ROLE PANELS
// ============================================================

function makeRoleEmbed(type) {
  const config = ROLE_MENU_CONFIG[type];

  const embed = whiteEmbed(
    config.title,
    config.roles
      .map(id => `<@&${id}>`)
      .join("\n\n") +
      "\n\nplease choose your roles below ♡"
  );

  if (config.thumbnail) {
    embed.setThumbnail(config.thumbnail);
  }

  return embed;
}

function makeRoleDropdown(type) {
  const config = ROLE_MENU_CONFIG[type];

  return new ActionRowBuilder()
    .addComponents(
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
      embeds: [makeRoleEmbed(type)],
      components: [makeRoleDropdown(type)],
      allowedMentions: NONE
    },
    10
  );
}

async function handleRolePanelCommand(
  message,
  type
) {
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
    const result =
      await postRolePanel(
        message.guild,
        type
      );

    await message.reply(
      `${type} panel ${result.updated ? "updated" : "posted"} in <#${ROLES_CHANNEL_ID}>!`
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
        await interaction.guild.roles.fetch(
          id
        ).catch(() => null);

      if (
        !role ||
        role.managed ||
        role.position >= bot.roles.highest.position
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
          .filter(role =>
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
    `Select your roles in <#${ROLES_CHANNEL_ID}> ` +
    "before verifying to gain full access to **.gg/chuppys**.\n\n" +
    "Need help verifying? Click **Create Verification Ticket** " +
    "and our team will assist you."
  ).setThumbnail(VERIFY_THUMBNAIL_URL);
}

function makeVerificationButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(VERIFY_BUTTON_ID)
      .setLabel("Verify")
      .setEmoji({
        id: VERIFY_BUTTON_EMOJI_ID
      })
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(VERIFY_TICKET_BUTTON_ID)
      .setLabel("Create Verification Ticket")
      .setEmoji({
        id: VERIFY_BUTTON_EMOJI_ID
      })
      .setStyle(ButtonStyle.Primary)
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
        ),
      {
        embeds: [makeVerificationEmbed()],
        components: [makeVerificationButton()],
        allowedMentions: NONE
      }
    );
  } catch (error) {
    console.error(
      "[VERIFY] Panel:",
      error
    );
  }
}

function checkVerificationRequirements(member) {
  return (
    AGE_ROLE_IDS.some(
      id => member.roles.cache.has(id)
    ) &&
    PRONOUN_ROLE_IDS.some(
      id => member.roles.cache.has(id)
    ) &&
    VERIFICATION_PING_ROLE_IDS.filter(
      id => member.roles.cache.has(id)
    ).length >= 2
  );
}

// ============================================================
// REGISTER SLASH COMMANDS
// ============================================================

async function registerQuestionCommand() {
  if (!TOKEN || !GUILD_ID || !client.user) {
    return;
  }

  const rest =
    new REST({
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
      const body = definition.toJSON();

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
        `[COMMANDS] Registered/updated /${body.name}`
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
    roles?.cache?.has?.(TICKET_SUPPORT_ROLE_ID) ||
    (
      Array.isArray(roles) &&
      roles.includes(TICKET_SUPPORT_ROLE_ID)
    )
  );
}

// ============================================================
// CLIENT ROLE PANEL
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
  return new ActionRowBuilder()
    .addComponents(
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
// VOUCH COUNTER ENGINE
// ============================================================
//
// Every recount scans source channel histories.
//
// Discord forward references are used to avoid
// counting the same original message twice.
//
// Existing market channels retain their previous
// all-message counting behavior.
//
// Giveaway and Invite channels count recognized
// vouch messages and native Discord forwards.
//
// If a forward does not expose an original ID,
// a snapshot signature is used as a fallback.
//
// NOTE:
// Two genuinely different forwards with identical
// snapshots may be treated as duplicates.
//
// ============================================================

function isForward(message) {
  const type =
    message.reference?.type ??
    message.messageReference?.type ??
    -1;

  return Number(type) === 1;
}

function originalVouchKey(message) {
  if (!isForward(message)) {
    return `${message.channel.id}:${message.id}`;
  }

  const reference =
    message.reference ||
    message.messageReference;

  const originalMessageId =
    reference?.messageId ||
    reference?.message_id;

  const originalChannelId =
    reference?.channelId ||
    reference?.channel_id;

  if (
    originalMessageId &&
    originalChannelId
  ) {
    return `${originalChannelId}:${originalMessageId}`;
  }

  // Snapshot fallback for forwards without source IDs.

  const snapshot =
    message.messageSnapshots?.first?.() ||
    [
      ...(
        message.messageSnapshots?.values?.() ||
        []
      )
    ][0];

  const data =
    snapshot || message;

  const signature =
    JSON.stringify({
      content: data.content || "",
      embeds: (data.embeds || []).map(
        embed => ({
          title: embed.title || "",
          description: embed.description || "",
          image: embed.image?.url || "",
          timestamp: embed.timestamp || ""
        })
      ),
      attachments: [
        ...(
          data.attachments?.values?.() ||
          []
        )
      ].map(
        attachment =>
          attachment.url ||
          attachment.name
      )
    });

  if (
    signature ===
    '{"content":"","embeds":[],"attachments":[]}'
  ) {
    return `${message.channel.id}:${message.id}`;
  }

  return (
    "snapshot:" +
    createHash("sha256")
      .update(signature)
      .digest("hex")
  );
}

function looksLikeVouch(message) {
  if (isForward(message)) {
    // A native Discord forward may contain a snapshot
    // rather than a regular embed.
    return Boolean(
      message.reference ||
      message.messageSnapshots?.size
    );
  }

  const embeds =
    message.embeds || [];

  return (
    embeds.some(embed =>
      /vouch/i.test(
        `${embed.title || ""} ${embed.description || ""}`
      )
    ) ||
    /\bvouch\b/i.test(
      message.content || ""
    )
  );
}

// ============================================================
// READ COMPLETE VOUCH CHANNEL HISTORY
// ============================================================

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
      const market =
        [
          PERSONAL_VOUCH_CHANNEL_ID,
          VOUCH_CHANNEL_ID
        ].includes(channelId);

      // Preserve existing market behavior.

      if (message.system) {
        continue;
      }

      if (
        !market &&
        !looksLikeVouch(message)
      ) {
        continue;
      }

      const key =
        originalVouchKey(message);

      if (!key) {
        continue;
      }

      results.push({
        key,
        channelId,
        forwarded: isForward(message),
        created: message.createdTimestamp
      });
    }

    if (messages.size < 100) {
      break;
    }

    before =
      messages.last().id;
  }

  return results;
}

function uniqueVouches(messages) {
  return new Set(
    messages.map(
      message => message.key
    )
  ).size;
}

// ============================================================
// FIND OR CREATE NEW COUNTER CHANNELS
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

    console.warn(
      `[VOUCH COUNTER] Configured channel ${configuredId} not found.`
    );
  }

  await guild.channels.fetch();

  // Find existing counter by exact prefix.

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
      "The original Chuppy counter channel was not found."
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
      "The configured counter category is unavailable."
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
        "Chuppys automatic vouch counter channel"
    });

  console.log(
    `[VOUCH COUNTER] Created ${created.name}: ${created.id}`
  );

  return created;
}

// ============================================================
// RENAME COUNTER
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
// RECOUNT ALL VOUCHES
// ============================================================

async function recountAllVouches() {
  if (vouchCounterUpdateRunning) {
    vouchCounterRecountRequested = true;
    return;
  }

  vouchCounterUpdateRunning = true;

  try {
    const guild =
      await client.guilds.fetch(GUILD_ID);

    const [
      personalMessages,
      marketMessages,
      giveawayMessages,
      inviteMessages
    ] = await Promise.all([
      fetchChannelVouches(PERSONAL_VOUCH_CHANNEL_ID),
      fetchChannelVouches(VOUCH_CHANNEL_ID),
      fetchChannelVouches(GIVEAWAY_VOUCH_CHANNEL_ID),
      fetchChannelVouches(INVITE_VOUCH_CHANNEL_ID)
    ]);

    const personalCount =
      uniqueVouches(personalMessages);

    const marketCount =
      uniqueVouches(marketMessages);

    const giveawayCount =
      uniqueVouches(giveawayMessages);

    const inviteCount =
      uniqueVouches(inviteMessages);

    const total =
      uniqueVouches([
        ...personalMessages,
        ...marketMessages,
        ...giveawayMessages,
        ...inviteMessages
      ]);

    // ========================================================
    // EXISTING COUNTERS
    // ========================================================

    const personalCounter =
      await guild.channels.fetch(
        CHUPPY_COUNT_CHANNEL_ID
      );

    const serverCounter =
      await guild.channels.fetch(
        SERVER_COUNT_CHANNEL_ID
      );

    // ========================================================
    // NEW COUNTERS
    // ========================================================

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

    // ========================================================
    // UPDATE NAMES
    // ========================================================

    const updates =
      await Promise.allSettled([
        renameCounterChannel(
          personalCounter,
          `${COUNT_NAMES.personal}${personalCount}`
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
          serverCounter,
          `${COUNT_NAMES.server}${total}`
        )
      ]);

    for (let i = 0; i < updates.length; i++) {
      if (
        updates[i].status === "rejected"
      ) {
        console.error(
          `[VOUCH COUNTER] Rename ${i + 1} failed:`,
          updates[i].reason
        );
      }
    }

    // ========================================================
    // COUNTER ORDER
    // ========================================================
    //
    // 1. Existing Chuppy counter
    // 2. Invite counter
    // 3. Giveaway counter
    // 4. Existing server counter
    //
    // ========================================================

    try {
      const counters = [
        personalCounter,
        inviteCounter,
        giveawayCounter,
        serverCounter
      ];

      // Only new counters may be moved to the category.
      // Existing counters are not moved automatically.

      for (const channel of counters) {
        if (
          channel.parentId !== COUNT_CATEGORY_ID
        ) {
          if (
            channel.id === inviteCounter.id ||
            channel.id === giveawayCounter.id
          ) {
            await channel.setParent(
              COUNT_CATEGORY_ID,
              {
                lockPermissions: false
              }
            );
          } else {
            console.warn(
              `[VOUCH COUNTER] Existing counter ${channel.name} is outside the category.`
            );
          }
        }
      }

      const positions =
        counters.map(
          channel => channel.position
        );

      const alreadyOrdered =
        positions.every(
          (position, index) =>
            index === 0 ||
            positions[index - 1] < position
        );

      if (!alreadyOrdered) {
        const base =
          personalCounter.position;

        await serverCounter.setPosition(
          base + 3
        );

        await giveawayCounter.setPosition(
          base + 2
        );

        await inviteCounter.setPosition(
          base + 1
        );
      }
    } catch (error) {
      console.error(
        "[VOUCH COUNTER] Ordering failed:",
        error
      );
    }

    counterCache = {
      personal: personalCount,
      market: marketCount,
      invite: inviteCount,
      giveaway: giveawayCount,
      total,
      checkedAt: new Date().toISOString()
    };

    counterRecountAt = Date.now();

    console.log(
      "[VOUCH COUNTER]",
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

// ============================================================
// SCHEDULE COUNTER UPDATE
// ============================================================

function scheduleVouchCounterUpdate() {
  clearTimeout(vouchCounterTimer);

  vouchCounterTimer = setTimeout(() => {
    void recountAllVouches();
  }, 3500);
}

// ============================================================
// VOUCH TUTORIAL
// ============================================================

async function sendVouchTutorial(guild) {
  const channel =
    await guild.channels.fetch(
      VOUCH_TUTORIAL_CHANNEL_ID
    );

  if (!channel?.send) {
    throw new Error(
      "Vouch tutorial channel unavailable."
    );
  }

  const data = [
    [
      "HOW TO VOUCH",
      "Please follow this tutorial to leave a vouch!\n\n" +
      "Stay inside your ticket and use **/vouch**.\n\n" +
      `Choose Market, Giveaway or Invite Challenge. ${VOUCH_TYPE_EMOJI}`
    ],
    [
      "STEP 1 — USE /VOUCH",
      "Run **/vouch** in your ticket. " +
      "Select the seller, rating, and proof.",
      VOUCH_TUTORIAL_IMAGES.command
    ],
    [
      "WHAT TO FILL IN",
      "**Market:** Choose Purchase or Cash Out, " +
      "enter what you purchased or cashed out.\n\n" +
      "**Giveaway:** Select bunnii or twxn, " +
      "rate and attach proof.\n\n" +
      "**Invite Challenge:** Select Invite Challenge, " +
      "rate and attach proof."
    ],
    [
      "EXAMPLE OF A COMPLETED VOUCH",
      "Your completed vouch should look similar to this:",
      VOUCH_TUTORIAL_IMAGES.completed
    ],
    [
      "SUCCESSFULLY SUBMITTED",
      "Once successful, your vouch will appear " +
      "in the correct vouch channel.",
      VOUCH_TUTORIAL_IMAGES.success
    ]
  ];

  for (const [title, description, image] of data) {
    const embed =
      whiteEmbed(
        title,
        description
      );

    if (image) {
      embed.setImage(image);
    }

    await channel.send({
      embeds: [embed],
      allowedMentions: NONE
    });
  }
}

// ============================================================
// HELP EMBED
// ============================================================

function makeHelpEmbed() {
  return new EmbedBuilder()
    .setTitle(".gg/chuppys Bot Commands")
    .setDescription(
      "Here is a list of available commands and what they do."
    )
    .addFields(
      {
        name: "General Commands",
        value:
          "`/help` — Command menu\n" +
          "`/question` — Ask a question\n" +
          "`/request` — Request stock\n" +
          "`/vouch` — Market, Giveaway or Invite Challenge vouch\n" +
          "`,afk [reason]` — Set AFK\n" +
          "`,pay` — Payment methods\n" +
          "`,client` — Client role panel"
      },
      {
        name: "Self Role Commands",
        value:
          "`,roles`, `,pings`, `,age`, `,pronouns` — Update role panels"
      },
      {
        name: "Ticket Commands",
        value:
          "`/ticketpanel`, `,claim`, `,forceclaim`, " +
          "`,close [reason]`, `,reopen`, `,delete`"
      },
      {
        name: "Support Commands",
        value:
          "`,r @user c` — Verify\n" +
          "`,r @user r` — Vouch reminder\n" +
          "`,r @user b reason` — Blacklist\n" +
          "`,appealpanel`, `,unblacklistpanel` — Appeal panel\n" +
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
          "`!vouchtut`, `!ranked`, `!robuxcashout`, " +
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
    "• Keep promotions appropriate and follow platform rules.\n" +
    "• Do not use fake invites, spam or misleading ads.\n\n" +
    "**Promoter Application Questions**\n" +
    "1. Do you have a following base? " +
    "How many followers and on which platform?\n\n" +
    "2. How many invites do you think you will gain monthly?\n\n" +
    "**Payment Information**\n" +
    "Promoters are paid **monthly**. " +
    "Details will be discussed with management.\n\n" +
    "Please send your answers to the Chuppys team."
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
      url: "https://app.chime.com/link/qr?u=chuppysss"
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
    return (
      new URL(value).protocol === "https:"
    );
  } catch {
    return false;
  }
}

function makePaymentEmbed() {
  const embed =
    whiteEmbed(
      "Payment Methods",
      "Choose a payment method below.\n\n" +
      "Please confirm payment details before sending."
    )
      .setThumbnail(PAYMENT_EMOJI_URL);

  for (const method of paymentMethods()) {
    embed.addFields({
      name: method.name.slice(0, 256),
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
        new ActionRowBuilder()
          .addComponents(buttons)
      ]
    : [];
}

// ============================================================
// ,PAY — NEW EMBED EVERY TIME
// ============================================================

async function sendPaymentEmbed(channel) {
  if (!channel?.send) {
    throw new Error(
      "Payment channel unavailable."
    );
  }

  const sent =
    await channel.send({
      content: "",
      embeds: [makePaymentEmbed()],
      components: makePaymentButtons(),
      allowedMentions: NONE
    });

  console.log(
    `[PAY] New payment embed ${sent.id} in ${channel.id}`
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
      message.embeds.some(
        existing => {
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
        }
      ),
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

  const lines = list =>
    list
      .map(
        ([count, price]) =>
          `${BOOST_EMOJI} **${count} • ${price}**`
      )
      .join("\n");

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
    ["1032693136163622993", "seller", "$45"],
    ["1320199904219496530", "seller", "$35"],
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
    .setDescription(lines.join("\n"));
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
    .setDescription(lines.join("\n"));
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
      .setTitle("Cashing Out Robux\n\n")
      .setThumbnail(
        ROBUX_CASHOUT_THUMBNAIL_URL
      )
      .setDescription(
        "RATES\n\n" +
        "**Below 10k**\n" +
        "3/k\n\n" +
        "**Above 10k**\n" +
        "3.5/k\n\n" +
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
  const embed =
    whiteEmbed(
      ".gg/chuppys ranked roles",
      RANKED_ROLE_IDS.map(
        (id, index) =>
          `**${index + 1}.** <@&${id}>`
      ).join("\n\n")
    )
      .setThumbnail(
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
// AFK SYSTEM
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

    afkUsers.set(key, {
      reason,
      since: Date.now()
    });

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
      { type: 3 }
    );

    const tasks = [
      registerQuestionCommand(),
      recountAllVouches(),
      sendOrUpdateVerificationMessage()
    ];

    const results =
      await Promise.allSettled(tasks);

    for (const result of results) {
      if (
        result.status === "rejected"
      ) {
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
      "[READY] Ticket system handled by tickets.js."
    );

    console.log(
      "[READY] Vouch system handled by vouch.js."
    );

    console.log(
      "[READY] Four vouch source channels enabled."
    );

    console.log(
      "[READY] Forward deduplication enabled."
    );

    console.log(
      "[READY] All counter channels configured."
    );
  }
);

// ============================================================
// INTERACTION HANDLER
// ============================================================

client.on(
  Events.InteractionCreate,
  async interaction => {
    // ======================================================
    // TICKET INTERACTIONS
    // ======================================================

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
      // ====================================================
      // SELF ROLES
      // ====================================================

      if (
        interaction.isStringSelectMenu()
      ) {
        const type =
          Object.keys(ROLE_MENU_CONFIG).find(
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

      // ====================================================
      // /HELP
      // ====================================================

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "help"
      ) {
        return interaction.reply({
          embeds: [makeHelpEmbed()],
          flags: EPHEMERAL
        });
      }

      // ====================================================
      // /REQUEST
      // ====================================================

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

        const embed =
          whiteEmbed(
            `${category} Request`,
            `**Requested by:** <@${interaction.user.id}>\n\n` +
            `**Category:** ${category}\n\n` +
            "**What they'd like Chuppys to stock up on:**\n" +
            safeText(items)
          )
            .setThumbnail(REQUEST_THUMBNAIL_URL)
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

      // ====================================================
      // VERIFICATION
      // ====================================================

      if (
        interaction.isButton() &&
        interaction.customId === VERIFY_BUTTON_ID
      ) {
        if (!interaction.inGuild()) {
          return interaction.reply(
            ephemeral(
              "Verification only works in the server."
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
            "You are blacklisted and cannot verify."
          );
        }

        if (
          member.roles.cache.has(
            CHUPPYS_ROLE_ID
          )
        ) {
          return interaction.editReply(
            "You're already verified!"
          );
        }

        if (
          !checkVerificationRequirements(member)
        ) {
          return interaction.editReply(
            `Select your roles in <#${ROLES_CHANNEL_ID}> first.\n\n` +
            "You need an age role, a pronoun role, " +
            "and at least two ping roles."
          );
        }

        await member.roles.add(
          CHUPPYS_ROLE_ID,
          "Successfully completed Chuppys verification."
        );

        return interaction.editReply(
          `${AFK_RETURN_EMOJI} You're verified! ` +
          "You now have full access to **.gg/chuppys**."
        );
      }

      // ====================================================
      // CLIENT ROLE
      // ====================================================

      if (
        interaction.isButton() &&
        interaction.customId === CLIENT_BUTTON_ID
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
          "Member claimed the Chuppys client role."
        );

        return interaction.editReply(
          `${CLIENT_EMOJI} You've received the client role! ` +
          "You can now submit your vouch."
        );
      }

      // ====================================================
      // /QUESTION
      // ====================================================

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
          !picture.contentType?.startsWith("image/")
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

        const embed =
          whiteEmbed(
            `Question from ${interaction.user.username}`,
            `**Question**\n${safeText(questionText)}`
          )
            .setThumbnail(QUESTION_EMOJI_URL)
            .setFooter({
              text:
                `${BRAND} • Question User ID: ${interaction.user.id}`
            })
            .setTimestamp();

        if (picture) {
          embed.setImage(picture.url);
        }

        const buttons =
          new ActionRowBuilder()
            .addComponents(
              new ButtonBuilder()
                .setCustomId("question_ticket")
                .setLabel("Make a Support Ticket")
                .setEmoji({
                  id: VERIFY_BUTTON_EMOJI_ID
                })
                .setStyle(ButtonStyle.Secondary),

              new ButtonBuilder()
                .setCustomId("question_reply")
                .setLabel("Reply to Question")
                .setEmoji({
                  id: VERIFY_BUTTON_EMOJI_ID
                })
                .setStyle(ButtonStyle.Primary)
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

      // ====================================================
      // QUESTION TICKET BUTTON
      // ====================================================

      if (
        interaction.isButton() &&
        interaction.customId.startsWith(
          "question_ticket"
        )
      ) {
        const embed =
          new EmbedBuilder()
            .setColor(WHITE)
            .setThumbnail(QUESTION_EMOJI_URL)
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

      // ====================================================
      // QUESTION REPLY BUTTON
      // ====================================================

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
          interaction.message?.embeds?.[0]?.footer?.text ||
          "";

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
            .setTitle("Reply to Question");

        const input =
          new TextInputBuilder()
            .setCustomId("question_reply_text")
            .setLabel("Your response")
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

        return interaction.showModal(modal);
      }

      // ====================================================
      // QUESTION REPLY MODAL
      // ====================================================

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

        const embed =
          whiteEmbed(
            "Response to Your Question",
            `${QUESTION_EMOJI} **Replied by:** ` +
            `${interaction.user.username}\n\n` +
            `**Response:**\n${safeText(answer)}`
          )
            .setThumbnail(QUESTION_EMOJI_URL)
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
//
// Ticket commands remain inside tickets.js.
//
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

    if (
      /^,(?:claim|forceclaim|close|reopen|delete)(?:\s|$)/i
        .test(raw)
    ) {
      return;
    }

    const reply = content =>
      message.reply({
        content,
        allowedMentions: {
          parse: [],
          repliedUser: false
        }
      });

    try {
      // ====================================================
      // GREETING
      // ====================================================

      if (
        /^(?:hi+|hey+|hello+|heya+)[!.?,\s]*$/i
          .test(raw)
      ) {
        return reply(
          `Hi ! ${AFK_RETURN_EMOJI}`
        );
      }

      // ====================================================
      // AFK
      // ====================================================

      if (await handleAFK(message)) {
        return;
      }

      // ====================================================
      // ROLE COMMANDS
      // ====================================================

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

      // ====================================================
      // APPEAL PANEL
      // ====================================================

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

      // ====================================================
      // ,CLIENT
      // ====================================================

      if (cmd === ",client") {
        if (
          !lock(
            locks.client,
            message.channel.id
          )
        ) {
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
              embeds: [makeClientEmbed()],
              components: [makeClientButton()],
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

      // ====================================================
      // ,PROMOTER
      // ====================================================

      if (cmd === ",promoter") {
        if (
          !lock(
            locks.promoter,
            message.channel.id
          )
        ) {
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
              embeds: [makePromoterEmbed()],
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

      // ====================================================
      // !VOUCHTUT
      // ====================================================

      if (cmd === "!vouchtut") {
        if (!canManageServer(message.member)) {
          return reply(
            "You need Manage Server permission."
          );
        }

        await sendVouchTutorial(
          message.guild
        );

        return reply(
          "The vouch tutorial has been posted!"
        );
      }

      // ====================================================
      // !RANKED
      // ====================================================

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

      // ====================================================
      // ,R @USER C / R / B
      // ====================================================

      if (
        /^,r(?:\s|$)/i.test(raw)
      ) {
        const match =
          raw.match(
            /^,r\s+<@!?(\d{17,20})>\s+([crb])(?:\s+([\s\S]*))?$/i
          );

        if (!match) {
          return reply(
            "Usage:\n" +
            "`,r @user c` — Verify\n" +
            "`,r @user r` — Vouch reminder\n" +
            "`,r @user b reason` — Blacklist"
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

        if (action === "b") {
          await handleBlacklistCommand(
            message,
            targetId,
            reason
          );

          return;
        }

        if (!isTicketSupport(message.member)) {
          return reply(
            "Only Ticket Support can use this command."
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

        // ==================================================
        // VERIFY MEMBER
        // ==================================================

        if (action === "c") {
          if (await isBlacklisted(target)) {
            return reply(
              "This member is blacklisted and cannot be verified."
            );
          }

          if (
            target.roles.cache.has(
              CHUPPYS_ROLE_ID
            )
          ) {
            return reply(
              `${target.user.username} already has the Chuppys role.`
            );
          }

          await target.roles.add(
            CHUPPYS_ROLE_ID,
            `Granted by Ticket Support: ${message.author.tag}`
          );

          await message.channel.send({
            content: `<@${target.id}>`,
            embeds: [
              whiteEmbed(
                "Welcome to .gg/chuppys",
                "Welcome to **.gg/chuppys**! " +
                `Please check <#${ROLES_CHANNEL_ID}> ` +
                `and <#${RULES_CHANNEL_ID}>. ` +
                "Enjoy shopping at Chuppy's Market " +
                CHUPPYS_WELCOME_EMOJI
              )
            ],
            allowedMentions: {
              users: [target.id]
            }
          });

          return;
        }

        // ==================================================
        // VOUCH REMINDER
        // ==================================================

        if (action === "r") {
          const embed =
            whiteEmbed(
              "Reminder to Vouch!",
              "Thank you for shopping at **.gg/chuppys**! " +
              `${CHUPPYS_WELCOME_EMOJI}\n\n` +
              `Please check <#${VOUCH_TUTORIAL_CHANNEL_ID}> ` +
              "to learn how to use **/vouch**.\n\n" +
              `Don't forget <#${QUICK_VOUCH_CHANNEL_ID}> ` +
              "for a quick vouch too!\n\n" +
              "Not vouching sellers within the 2 day grace period " +
              "will result in being blacklisted in this server."
            );

          await message.channel.send({
            content: `<@${target.id}>`,
            embeds: [embed],
            allowedMentions: {
              users: [target.id]
            }
          });

          return;
        }
      }

      // ====================================================
      // ,PARTNER
      // ====================================================

      if (cmd === ",partner") {
        if (!isTicketSupport(message.member)) {
          return reply(
            "Only Ticket Support can use this command."
          );
        }

        const embed =
          whiteEmbed(
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

      // ====================================================
      // ,MOD
      // ====================================================

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
            embeds: [makeModEmbed()],
            components: [],
            allowedMentions: NONE
          }
        );

        return;
      }

      // ====================================================
      // ,SELLER
      // ====================================================

      if (cmd === ",seller") {
        if (
          !lock(
            locks.seller,
            message.channel.id
          )
        ) {
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

      // ====================================================
      // !ROBUXCASHOUT
      // ====================================================

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

      // ====================================================
      // ,PAY
      // ====================================================

      if (cmd === ",pay") {
        if (
          !lock(
            locks.payment,
            message.channel.id
          )
        ) {
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
            "I couldn't send the payment methods. " +
            "Check Send Messages and Embed Links permissions."
          );
        } finally {
          locks.payment.delete(
            message.channel.id
          );
        }

        return;
      }

      // ====================================================
      // ADMIN SERVICE COMMANDS
      // ====================================================

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

      if (
        adminCommands.includes(cmd)
      ) {
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

      // ====================================================
      // TEST WELCOME
      // ====================================================

      if (cmd === "!testwelcome") {
        const channel =
          await client.channels.fetch(
            WELCOME_CHANNEL_ID
          );

        const embed =
          whiteEmbed(
            `Welcome to .gg/chuppys ${AFK_RETURN_EMOJI}`,
            `Welcome <@${message.author.id}>!\n\n` +
            "We're happy to have you here. " +
            "Read the rules and enjoy your time!"
          )
            .setThumbnail(
              message.author.displayAvatarURL()
            )
            .setImage(WELCOME_IMAGE)
            .setFooter({
              text: message.guild.name
            });

        await channel.send({
          content: `<@${message.author.id}>`,
          embeds: [embed],
          allowedMentions: {
            users: [message.author.id]
          }
        });

        return;
      }

      // ====================================================
      // TEST GOODBYE
      // ====================================================

      if (cmd === "!testgoodbye") {
        const channel =
          await client.channels.fetch(
            GOODBYE_CHANNEL_ID
          );

        const embed =
          whiteEmbed(
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
      message.channel.id !==
        INVITE_CHANNEL_ID ||
      message.author.id !==
        INVITE_BOT_ID
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
// VOUCH MESSAGE REACTIONS AND COUNTERS
// ============================================================

client.on(
  Events.MessageCreate,
  async message => {
    if (
      !message.channel ||
      !VOUCH_SOURCE_CHANNEL_IDS.includes(
        message.channel.id
      )
    ) {
      return;
    }

    scheduleVouchCounterUpdate();

    try {
      if (!message.author.bot) {
        await message.react(
          CHUPPY_TY_EMOJI
        );
      }
    } catch (error) {
      console.error(
        `[VOUCH REACTION] ${message.id}:`,
        error.message
      );
    }
  }
);

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
// WELCOME
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

      const embed =
        whiteEmbed(
          `Welcome to .gg/chuppys ${AFK_RETURN_EMOJI}`,
          `Welcome ${member}!\n\n` +
          "We're happy to have you here. " +
          "Make sure to read the rules and enjoy your time!"
        )
          .setThumbnail(
            member.user.displayAvatarURL()
          )
          .setImage(WELCOME_IMAGE)
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

      const embed =
        whiteEmbed(
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

client.on(
  "error",
  error => {
    console.error(
      "[DISCORD CLIENT]",
      error
    );
  }
);

process.on(
  "unhandledRejection",
  error => {
    console.error(
      "[PROCESS] Unhandled rejection:",
      error
    );
  }
);

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
// END OF INDEX.JS
// ============================================================
