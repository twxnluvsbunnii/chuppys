
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
// TICKETS HANDLED BY tickets.js:
// /ticketpanel
// ,claim
// ,forceclaim
// ,close
// ,reopen
// ,delete
// Ticket buttons
// Verification ticket button
//
// INDEX FEATURES:
// Self roles, normal verification, client role,
// questions, stock requests, welcome/goodbye,
// AFK, payments, service embeds, vouch counters,
// tutorials, ranked roles and invite reactions.
//
// PAYMENT METHODS:
// Cash App, PayPal, Venmo, Chime,
// Apple Pay, Zelle and optional extra methods.
//
// PAYMENT DUPLICATE FIX:
// - Search all accessible channel history.
// - Keep the newest payment embed.
// - Update it with all payment methods.
// - Delete older duplicate payment embeds.
// - Prevent concurrent ,pay updates in one channel.
//
// IMPORTANT:
// - Run only one bot instance.
// - Enable Guild Members intent.
// - Enable Message Content intent.
// - Keep DISCORD_BOT_TOKEN in Render.
// - Keep DISCORD_GUILD_ID in Render.
// - tickets.js owns verification tickets.
//
// ============================================================

const http = require("http");

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
  TextInputStyle
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
  console.log(`[WEB] Server running on port ${PORT}`);
});

// ============================================================
// ENVIRONMENT
// ============================================================

const TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;

const EPHEMERAL = MessageFlags.Ephemeral;
const BRAND = ".gg/chuppys";
const WHITE = 0xffffff;

// ============================================================
// CONFIGURATION
// ============================================================

const WELCOME_CHANNEL_ID =
  "1530755165412524042";

const GOODBYE_CHANNEL_ID =
  "1530761366489530480";

const NITRO_CHANNEL_ID =
  "1555760937557041273";

const DECOR_CHANNEL_ID =
  "1555769588229345280";

const BOOSTIES_CHANNEL_ID =
  "1555769708928831489";

const SELLERS_CHANNEL_ID =
  "1551713598181605496";

const STAFF_CHANNEL_ID =
  "1561013244905132122";

const ROBUX_CASHOUT_CHANNEL_ID =
  "1552385740405473513";

const ROBUX_CASHOUT_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561094713153429746.png";

// ============================================================
// STOCK REQUEST
// ============================================================

const REQUEST_CHANNEL_ID =
  "1569732416388726834";

const REQUEST_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561388594625511514.png?size=128&quality=lossless";

// ============================================================
// VERIFICATION
// ============================================================

const VERIFY_CHANNEL_ID =
  "1528716328985301052";

const VERIFY_BUTTON_ID =
  "chuppys_verify";

const VERIFY_TICKET_BUTTON_ID =
  "chuppys_create_verification_ticket";

const VERIFY_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1561103471325745242.png";

const VERIFY_BUTTON_EMOJI_ID =
  "1561103471325745242";

const CHUPPYS_ROLE_ID =
  "1550230619127021568";

const ROLES_CHANNEL_ID =
  "1530808091380285592";

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

const LEGACY_CASHOUT_PING_ROLE_ID =
  "1551276593425685333";

const ADDITIONAL_VERIFICATION_PING_IDS = [
  "1569731217799127210",
  "1569731506706849872"
];

const VERIFICATION_PING_ROLE_IDS = [
  ...new Set([
    ...PING_ROLE_IDS,
    LEGACY_CASHOUT_PING_ROLE_ID,
    ...ADDITIONAL_VERIFICATION_PING_IDS
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

const AGE_ROLE_IDS =
  Object.values(AGE_ROLES);

// ============================================================
// PRONOUN ROLES
// ============================================================

const PRONOUN_ROLES = Object.freeze({
  sheher: "1531084942241697854",
  hehim: "1531086100867842190",
  theythem: "1531101006451048448"
});

const PRONOUN_ROLE_IDS =
  Object.values(PRONOUN_ROLES);

// ============================================================
// ROLE MENU CONFIGURATION
// ============================================================

const ROLE_MENU_IDS = Object.freeze({
  pings: "chuppys_self_roles",
  age: "chuppys_second_roles",
  pronouns: "chuppys_pronoun_roles"
});

const ROLE_MENU_CONFIG = Object.freeze({
  pings: {
    customId: ROLE_MENU_IDS.pings,
    title: "• pings // •",
    placeholder: "♡ choose your roles",
    roles: PING_ROLE_IDS,

    options: [
      {
        label: "Welcome Ping",
        value: PING_ROLES.welcome
      },
      {
        label: "Announcement Ping",
        value: PING_ROLES.announcement
      },
      {
        label: "Services Ping",
        value: PING_ROLES.streaming
      },
      {
        label: "Giveaway Ping",
        value: PING_ROLES.giveaway
      },
      {
        label: "Stock Ping",
        value: PING_ROLES.stock
      },
      {
        label: "Cash Out",
        value: PING_ROLES.cashout
      },
      {
        label: "Flash Sale Ping",
        value: PING_ROLES.flashsale
      },
      {
        label: "Partnership Ping",
        value: PING_ROLES.partnership
      },
      {
        label: "Adopt Me Ping",
        value: PING_ROLES.adoptme
      },
      {
        label: "Robux Ping",
        value: PING_ROLES.robux
      },
      {
        label: "MM2 Ping",
        value: PING_ROLES.mm2
      }
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
      {
        label: "﹕𐔌・- 18 〃・꒱",
        value: AGE_ROLES.under18
      },
      {
        label: "﹕𐔌・18 - 20 〃・꒱",
        value: AGE_ROLES.age18to20
      },
      {
        label: "﹕𐔌・21 + 〃・꒱",
        value: AGE_ROLES.age21plus
      }
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
      {
        label: "﹕𐔌・she / her〃・꒱",
        value: PRONOUN_ROLES.sheher
      },
      {
        label: "﹕𐔌・he / him〃・꒱",
        value: PRONOUN_ROLES.hehim
      },
      {
        label: "﹕𐔌・they / them〃・꒱",
        value: PRONOUN_ROLES.theythem
      }
    ],

    success:
      "﹕𐔌・your pronouns have been updated〃・꒱ 🤍"
  }
});

// ============================================================
// ROLE COMMANDS
// ============================================================

const ROLE_COMMANDS = Object.freeze({
  ",roles": "pings",
  ",pings": "pings",
  ",age": "age",
  ",pronouns": "pronouns",
  ",pronoun": "pronouns"
});

// ============================================================
// CLIENT ROLE
// ============================================================

const CLIENT_ROLE_ID =
  "1550373434301878282";

const CLIENT_BUTTON_ID =
  "chuppys_client";

const CLIENT_EMOJI_ID =
  "1569091548468219985";

const CLIENT_EMOJI =
  "<:unis:1569091548468219985>";

// ============================================================
// RANKED ROLES
// ============================================================

const RANKED_ROLES_CHANNEL_ID =
  "1567178497917718568";

const RANKED_ROLES_THUMBNAIL_URL =
  "https://cdn.discordapp.com/emojis/1568404337154068618.png?size=128&quality=lossless";

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
// QUESTIONS
// ============================================================

const QUESTION_CHANNEL_ID =
  "1566490648549527602";

const QUESTION_EMOJI_ID =
  "1561388594625511514";

const QUESTION_EMOJI =
  "<:chuppypayment:1561388594625511514>";

const QUESTION_TICKET_CHANNEL_ID =
  "1530811385678790716";

// ============================================================
// TICKET SUPPORT
// ============================================================

const TICKET_SUPPORT_ROLE_ID =
  "1563003884656398406";

const RULES_CHANNEL_ID =
  "1551275482857865333";

const VOUCH_TUTORIAL_CHANNEL_ID =
  "1562958688896028802";

const QUICK_VOUCH_CHANNEL_ID =
  "1552903786077360269";

const PARTNER_AD_CHANNEL_ID =
  "1552387259276329110";

const CHUPPYS_WELCOME_EMOJI =
  "<:chuppys:1560284517955141653>";

// ============================================================
// VOUCH COUNTERS
// ============================================================

const PERSONAL_VOUCH_CHANNEL_ID =
  "1562227276051910676";

const VOUCH_CHANNEL_ID =
  "1530811494168657980";

const CHUPPY_COUNT_CHANNEL_ID =
  "1553242286412922960";

const SERVER_COUNT_CHANNEL_ID =
  "1562266346891247688";

const VOUCH_SOURCE_CHANNEL_IDS = [
  PERSONAL_VOUCH_CHANNEL_ID,
  VOUCH_CHANNEL_ID
];

const CHUPPY_COUNT_PREFIX =
  "╭・chuppy total vouches : ";

const SERVER_COUNT_PREFIX =
  "╰・server total vouches : ";

const CHUPPY_TY_EMOJI =
  "<:uppyty:1561094713153429746>";

// ============================================================
// VOUCH TUTORIAL IMAGES
// ============================================================

const VOUCH_TUTORIAL_IMAGES = {
  command:
    "https://raw.githubusercontent.com/twxnluvsbunnii/chuppys/main/IMG_5265.jpeg",

  completed:
    "https://raw.githubusercontent.com/twxnluvsbunnii/chuppys/main/IMG_5267.jpeg",

  success:
    "https://raw.githubusercontent.com/twxnluvsbunnii/chuppys/main/IMG_5266.jpeg"
};

// ============================================================
// OTHER SETTINGS
// ============================================================

const WELCOME_ROLE_ID =
  "1531039846871728248";

const INVITE_CHANNEL_ID =
  "1560249120667734016";

const INVITE_BOT_ID =
  "499595256270946326";

const INVITE_REACTION_EMOJI =
  "<:chuppynewinv:1561398288593330326>";

const AFK_GOING_EMOJI =
  "<:chuppybye:1561103844832846014>";

const AFK_RETURN_EMOJI =
  "<:chuppyhi:1561103471325745242>";

const PAYMENT_EMOJI_ID =
  "1561388594625511514";

const PAYMENT_EMOJI_URL =
  `https://cdn.discordapp.com/emojis/${PAYMENT_EMOJI_ID}.png`;

const QUESTION_EMOJI_URL =
  PAYMENT_EMOJI_URL;

const SERVICE_EMOJI =
  "<a:aBouncyDiscord:1557138733717782599>";

const BOOST_EMOJI =
  "<:white_nitro_boost:1557165507600326756>";

const SELLER_EMOJI =
  "<:chuppyseller:1560284517955141653>";

const WELCOME_IMAGE =
  "https://cdn.discordapp.com/attachments/1531043582348230767/1551448584656916530/BCA71D48-B1AD-46BA-BAAA-CC87D8C81E62.png";

// ============================================================
// PAYMENTS
// ============================================================

// CASH APP

const CASHAPP_USERNAME =
  "$yysluvv";

const CASHAPP_URL =
  "https://cash.app/$yysluvv";

// PAYPAL

const PAYPAL_USERNAME =
  "PayPal.me/twxnsrevenge";

const PAYPAL_URL =
  "https://paypal.me/twxnsrevenge";

// VENMO

const VENMO_USERNAME =
  "@chuppys";

const VENMO_URL =
  "https://venmo.com/u/chuppys";

// CHIME

const CHIME_USERNAME =
  "chuppysss";

const CHIME_URL =
  "https://app.chime.com/link/qr?u=chuppysss";

// APPLE PAY AND ZELLE

const APPLE_PAY =
  "929-554-5969";

const ZELLE =
  "631-401-8951";

// OPTIONAL EXTRA PAYMENT METHODS

const EXTRA_PAYMENT_METHODS = [
  {
    name:
      process.env.PAYMENT_METHOD_5_NAME || "",

    details:
      process.env.PAYMENT_METHOD_5_DETAILS || "",

    url:
      process.env.PAYMENT_METHOD_5_URL || ""
  },

  {
    name:
      process.env.PAYMENT_METHOD_6_NAME || "",

    details:
      process.env.PAYMENT_METHOD_6_DETAILS || "",

    url:
      process.env.PAYMENT_METHOD_6_URL || ""
  }
];

// PAYMENT METHODS SHOWN IN SERVICES

const PAYMENT_METHODS_TEXT =
  "**Payment Methods**\n" +
  "> Apple Pay\n" +
  "> Venmo\n" +
  "> Cash App\n" +
  "> Chime";

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
          {
            name: "Baddies",
            value: "Baddies"
          },
          {
            name: "MM2",
            value: "MM2"
          },
          {
            name: "Adopt Me",
            value: "Adopt Me"
          },
          {
            name: "Blade Ball",
            value: "Blade Ball"
          },
          {
            name: "Robux",
            value: "Robux"
          }
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

let vouchCounterTimer = null;
let vouchCounterUpdateRunning = false;
let vouchCounterRecountRequested = false;

const sellerCommandLocks = new Set();

const clientCommandLocks = new Set();

const promoterCommandLocks = new Set();

const rolePostingLocks = new Set();

const roleSelectionLocks = new Set();

// NEW:
// Prevent two ,pay commands from updating
// the same channel simultaneously.

const paymentCommandLocks = new Set();

// Verification tickets are handled by tickets.js.

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
// CONNECT BOT MODULES
// ============================================================

require("./vouch")(client);

require("./transactions")(client);

const ticketModule =
  require("./tickets");

if (
  typeof ticketModule !== "function" ||
  !ticketModule.command
) {
  throw new Error(
    "tickets.js must export a setup function and command."
  );
}

// Only install tickets.js once.

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

    allowedMentions: {
      parse: []
    }
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

async function interactionError(
  interaction,
  error
) {
  console.error(
    "[INTERACTION] Error:",
    error
  );

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
      "[INTERACTION] Could not respond:",
      replyError
    );
  }
}

// ============================================================
// ROLE EMBED BUILDER
// ============================================================

function makeRoleEmbed(type) {
  const config = ROLE_MENU_CONFIG[type];

  if (!config) {
    throw new Error(
      "Invalid role menu type."
    );
  }

  const description =
    config.roles
      .map(id => `<@&${id}>`)
      .join("\n\n") +
    "\n\nplease choose your roles below ♡";

  const embed = new EmbedBuilder()
    .setTitle(config.title)
    .setDescription(description)
    .setColor(WHITE)
    .setFooter({
      text: BRAND
    });

  if (config.thumbnail) {
    embed.setThumbnail(config.thumbnail);
  }

  return embed;
}

// ============================================================
// ROLE DROPDOWN BUILDER
// ============================================================

function makeRoleDropdown(type) {
  const config = ROLE_MENU_CONFIG[type];

  if (!config) {
    throw new Error(
      "Invalid role dropdown."
    );
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(config.customId)
    .setPlaceholder(config.placeholder)
    .setMinValues(0)
    .setMaxValues(config.options.length)
    .addOptions(
      config.options.map(option => ({
        label: option.label,
        value: option.value
      }))
    );

  return new ActionRowBuilder()
    .addComponents(menu);
}

// ============================================================
// ROLE MESSAGE PAYLOAD
// ============================================================

function rolePanelPayload(type) {
  return {
    embeds: [
      makeRoleEmbed(type)
    ],

    components: [
      makeRoleDropdown(type)
    ],

    allowedMentions: {
      parse: []
    }
  };
}

// ============================================================
// FIND EXISTING ROLE PANELS
// ============================================================

async function findExistingRolePanels(
  channel,
  type
) {
  const config = ROLE_MENU_CONFIG[type];

  const matching = [];

  let before;

  for (let page = 0; page < 10; page++) {
    const messages =
      await channel.messages.fetch({
        limit: 100,

        ...(before ? { before } : {})
      });

    for (const message of messages.values()) {
      if (
        message.author.id !==
        client.user.id
      ) {
        continue;
      }

      const hasMatchingMenu =
        message.components.some(row =>
          row.components.some(component =>
            component.customId ===
            config.customId
          )
        );

      if (hasMatchingMenu) {
        matching.push(message);
      }
    }

    if (messages.size < 100) {
      break;
    }

    before = messages.last().id;
  }

  return matching;
}

// ============================================================
// POST OR UPDATE ROLE PANEL
// ============================================================

async function postRolePanel(
  guild,
  type
) {
  const config = ROLE_MENU_CONFIG[type];

  if (!config) {
    throw new Error(
      "Invalid role panel."
    );
  }

  const channel =
    await guild.channels.fetch(
      ROLES_CHANNEL_ID
    );

  if (
    !channel?.isTextBased() ||
    !channel.messages ||
    !channel.send
  ) {
    throw new Error(
      "The Chuppys roles channel is unavailable."
    );
  }

  const existing =
    await findExistingRolePanels(
      channel,
      type
    );

  const payload =
    rolePanelPayload(type);

  if (existing.length) {
    const original = existing[0];

    await original.edit(payload);

    for (const duplicate of existing.slice(1)) {
      await duplicate.delete().catch(error => {
        console.error(
          `[ROLE PANEL] Duplicate ${type} deletion failed:`,
          error
        );
      });
    }

    console.log(
      `[ROLE PANEL] Updated ${type} menu: ${original.id}`
    );

    return {
      message: original,
      updated: true
    };
  }

  const sent =
    await channel.send(payload);

  console.log(
    `[ROLE PANEL] Created ${type} menu: ${sent.id}`
  );

  return {
    message: sent,
    updated: false
  };
}

// ============================================================
// ROLE COMMAND HANDLER
// ============================================================

async function handleRolePanelCommand(
  message,
  type
) {
  if (!canManageServer(message.member)) {
    return message.reply({
      content:
        "You need Manage Server permission to use this command.",

      allowedMentions: {
        repliedUser: false
      }
    });
  }

  const lockKey =
    `${message.guild.id}:${type}`;

  if (rolePostingLocks.has(lockKey)) {
    return message.reply({
      content:
        "That role panel is already being updated.",

      allowedMentions: {
        repliedUser: false
      }
    });
  }

  rolePostingLocks.add(lockKey);

  try {
    const result =
      await postRolePanel(
        message.guild,
        type
      );

    const label =
      type === "pings"
        ? "Ping roles"
        : type === "age"
          ? "Age roles"
          : "Pronoun roles";

    return message.reply({
      content:
        `${label} panel ${result.updated ? "updated" : "posted"} ` +
        `successfully in <#${ROLES_CHANNEL_ID}>!`,

      allowedMentions: {
        parse: [],
        repliedUser: false
      }
    });
  } finally {
    rolePostingLocks.delete(lockKey);
  }
}

// ============================================================
// ROLE SELECTION
// ============================================================

async function handleRoleSelection(
  interaction,
  type
) {
  const config =
    ROLE_MENU_CONFIG[type];

  if (!config) {
    return interaction.reply(
      ephemeral(
        "Invalid role selection."
      )
    );
  }

  if (!interaction.inGuild()) {
    return interaction.reply(
      ephemeral(
        "Role selection only works inside the server."
      )
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const lockKey =
    `${interaction.guildId}:${interaction.user.id}:${type}`;

  if (roleSelectionLocks.has(lockKey)) {
    return interaction.editReply({
      content:
        "Your previous role selection is still processing."
    });
  }

  roleSelectionLocks.add(lockKey);

  try {
    const selected =
      new Set(interaction.values);

    for (const selectedId of selected) {
      if (
        !config.roles.includes(selectedId)
      ) {
        throw new Error(
          "An invalid role was selected."
        );
      }
    }

    const member =
      await interaction.guild.members.fetch({
        user: interaction.user.id,
        force: true
      });

    const botMember =
      await interaction.guild.members.fetchMe();

    for (const roleId of config.roles) {
      const role =
        interaction.guild.roles.cache.get(roleId) ||
        await interaction.guild.roles.fetch(
          roleId
        ).catch(() => null);

      if (!role) {
        throw new Error(
          `Configured role ${roleId} was not found.`
        );
      }

      if (
        role.managed ||
        role.position >=
        botMember.roles.highest.position
      ) {
        throw new Error(
          `The bot cannot manage the role ${role.name}.`
        );
      }
    }

    const currentSelectedGroupRoles =
      config.roles.filter(id =>
        member.roles.cache.has(id)
      );

    const unchangedRoles =
      member.roles.cache
        .filter(role =>
          !config.roles.includes(role.id)
        )
        .map(role => role.id);

    const desiredRoles = [
      ...unchangedRoles,
      ...selected
    ];

    const changed =
      currentSelectedGroupRoles.length !==
        selected.size ||
      currentSelectedGroupRoles.some(
        id => !selected.has(id)
      );

    if (!changed) {
      return interaction.editReply({
        content: config.success
      });
    }

    await member.roles.set(
      desiredRoles,
      `Chuppys ${type} self-role selection`
    );

    await interaction.editReply({
      content: config.success
    });

    console.log(
      `[SELF ROLES] ${interaction.user.id} updated ${type}`
    );
  } catch (error) {
    console.error(
      `[SELF ROLES] ${type} failed:`,
      error
    );

    await interaction.editReply({
      content:
        "Your roles could not be updated. Please contact staff."
    }).catch(console.error);
  } finally {
    roleSelectionLocks.delete(lockKey);
  }
}

// ============================================================
// VERIFICATION EMBED
// ============================================================

function makeVerificationEmbed() {
  return new EmbedBuilder()
    .setTitle(
      "Verify to Access .gg/chuppys"
    )
    .setDescription(
      `Select your roles in <#${ROLES_CHANNEL_ID}> before verifying ` +
      "to gain full access to **.gg/chuppys**.\n\n" +
      "Need help verifying? Click **Create Verification Ticket** " +
      "and our team will assist you."
    )
    .setColor(WHITE)
    .setThumbnail(
      VERIFY_THUMBNAIL_URL
    )
    .setFooter({
      text: BRAND
    });
}

// ============================================================
// VERIFICATION BUTTONS
// ============================================================

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

// ============================================================
// UPDATE VERIFICATION MESSAGE
// ============================================================

async function sendOrUpdateVerificationMessage() {
  try {
    const channel =
      await client.channels.fetch(
        VERIFY_CHANNEL_ID
      );

    if (
      !channel?.isTextBased() ||
      !channel.messages
    ) {
      throw new Error(
        "Verification channel is unavailable."
      );
    }

    const messages =
      await channel.messages.fetch({
        limit: 100
      });

    const matching =
      messages.filter(message =>
        message.author.id === client.user.id &&
        message.embeds.some(embed =>
          embed.title ===
          "Verify to Access .gg/chuppys"
        )
      );

    const existing =
      matching.first();

    const payload = {
      embeds: [
        makeVerificationEmbed()
      ],

      components: [
        makeVerificationButton()
      ],

      allowedMentions: {
        parse: []
      }
    };

    if (existing) {
      await existing.edit(payload);

      for (const duplicate of matching.values()) {
        if (
          duplicate.id !== existing.id
        ) {
          await duplicate.delete().catch(error => {
            console.error(
              "[VERIFY] Duplicate deletion failed:",
              error
            );
          });
        }
      }

      console.log(
        "[VERIFY] Verification message updated."
      );

      return existing;
    }

    const sent =
      await channel.send(payload);

    console.log(
      "[VERIFY] Verification message created."
    );

    return sent;
  } catch (error) {
    console.error(
      "[VERIFY] Verification message failed:",
      error
    );

    return null;
  }
}

// ============================================================
// VERIFICATION REQUIREMENTS
// ============================================================

function hasAtLeastOneRole(
  member,
  roleIds
) {
  return roleIds.some(id =>
    member.roles.cache.has(id)
  );
}

function countMatchingRoles(
  member,
  roleIds
) {
  return roleIds.filter(id =>
    member.roles.cache.has(id)
  ).length;
}

function checkVerificationRequirements(member) {
  const hasAgeRole =
    hasAtLeastOneRole(
      member,
      AGE_ROLE_IDS
    );

  const hasPronounRole =
    hasAtLeastOneRole(
      member,
      PRONOUN_ROLE_IDS
    );

  const pingRoleCount =
    countMatchingRoles(
      member,
      VERIFICATION_PING_ROLE_IDS
    );

  return {
    hasAgeRole,
    hasPronounRole,
    pingRoleCount,

    passed:
      hasAgeRole &&
      hasPronounRole &&
      pingRoleCount >= 2
  };
}

// ============================================================
// VERIFICATION TICKET HANDOFF
// ============================================================
//
// No verification ticket handler in index.js.
//
// tickets.js handles:
// chuppys_create_verification_ticket
//
// ============================================================

// ============================================================
// SLASH COMMAND REGISTRATION
// ============================================================

async function registerQuestionCommand() {
  if (
    !TOKEN ||
    !GUILD_ID ||
    !client.user
  ) {
    console.error(
      "[COMMANDS] Token, guild ID or client unavailable."
    );

    return;
  }

  const rest =
    new REST({
      version: "10"
    }).setToken(TOKEN);

  const commandsToRegister = [
    QUESTION_COMMAND,
    REQUEST_COMMAND,
    HELP_COMMAND,
    ticketModule.command
  ];

  try {
    const route =
      Routes.applicationGuildCommands(
        client.user.id,
        GUILD_ID
      );

    const existingCommands =
      await rest.get(route);

    for (const command of commandsToRegister) {
      const body =
        command.toJSON();

      const existing =
        existingCommands.find(
          registered =>
            registered.name === body.name
        );

      if (existing) {
        await rest.patch(
          Routes.applicationGuildCommand(
            client.user.id,
            GUILD_ID,
            existing.id
          ),
          {
            body
          }
        );

        console.log(
          `[COMMANDS] Updated /${body.name}`
        );
      } else {
        await rest.post(route, {
          body
        });

        console.log(
          `[COMMANDS] Registered /${body.name}`
        );
      }
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
  if (
    !interaction.guild ||
    !interaction.member
  ) {
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

  const memberRoles =
    interaction.member.roles;

  if (
    memberRoles?.cache?.has(
      TICKET_SUPPORT_ROLE_ID
    )
  ) {
    return true;
  }

  if (Array.isArray(memberRoles)) {
    return memberRoles.includes(
      TICKET_SUPPORT_ROLE_ID
    );
  }

  return false;
}

function isTicketSupport(member) {
  return Boolean(
    member?.roles?.cache?.has(
      TICKET_SUPPORT_ROLE_ID
    )
  );
}

// ============================================================
// CLIENT ROLE EMBED
// ============================================================

function makeClientEmbed() {
  return new EmbedBuilder()
    .setDescription(
      "Thank you for shopping at **.gg/chuppys**!\n\n" +
      "Please click the button below for the client role " +
      "to be able to successfully submit a vouch."
    )
    .setColor(WHITE)
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

async function findClientRoleMessages(channel) {
  const messages =
    await channel.messages.fetch({
      limit: 100
    });

  return messages
    .filter(msg =>
      msg.author.id === client.user.id &&
      msg.embeds.some(embed =>
        (embed.description || "").includes(
          "Please click the button below for the client role"
        )
      )
    )
    .sort(
      (a, b) =>
        b.createdTimestamp -
        a.createdTimestamp
    );
}

// ============================================================
// ROBUX CASHOUT EMBED
// ============================================================

async function sendRobuxCashoutEmbed(channel) {
  if (
    !channel?.isTextBased() ||
    !channel.messages
  ) {
    throw new Error(
      "Robux Cash Out channel unavailable."
    );
  }

  const embed = new EmbedBuilder()
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
      "-# make a cash out ticket now !! make sure u ping me in tickets <:uppyty:1561094713153429746>"
    )
    .setColor(WHITE)
    .setFooter({
      text: BRAND
    });

  const payload = {
    embeds: [embed],

    allowedMentions: {
      parse: []
    }
  };

  const messages =
    await channel.messages.fetch({
      limit: 100
    });

  const matches =
    messages.filter(message =>
      message.author.id === client.user.id &&
      message.embeds.some(existingEmbed => {
        const title =
          existingEmbed.title || "";

        return (
          title.startsWith("Cashing Out Robux") ||
          title.startsWith("Robux Cash out")
        );
      })
    );

  const existing =
    matches.first();

  if (existing) {
    await existing.edit(payload);

    for (const duplicate of matches.values()) {
      if (duplicate.id !== existing.id) {
        await duplicate.delete()
          .catch(() => {});
      }
    }

    return existing;
  }

  return channel.send(payload);
}

// ============================================================
// RANKED ROLES
// ============================================================

function makeRankedRolesEmbed() {
  const roleList =
    RANKED_ROLE_IDS.map(
      (roleId, index) =>
        `**${index + 1}.** <@&${roleId}>`
    ).join("\n\n");

  return new EmbedBuilder()
    .setTitle(".gg/chuppys ranked roles")
    .setDescription(roleList)
    .setColor(WHITE)
    .setThumbnail(
      RANKED_ROLES_THUMBNAIL_URL
    )
    .setFooter({
      text: BRAND
    });
}

async function sendRankedRoles(guild) {
  const channel =
    await guild.channels.fetch(
      RANKED_ROLES_CHANNEL_ID
    );

  if (
    !channel?.isTextBased() ||
    !channel.send
  ) {
    throw new Error(
      "Ranked roles channel unavailable."
    );
  }

  const sent =
    await channel.send({
      embeds: [
        makeRankedRolesEmbed()
      ],

      allowedMentions: {
        parse: []
      }
    });

  console.log(
    `[RANKED ROLES] Sent ${sent.id}`
  );

  return sent;
}

// ============================================================
// VOUCH COUNTERS
// ============================================================

async function countChannelMessages(channel) {
  if (
    !channel?.isTextBased() ||
    !channel.messages
  ) {
    throw new Error(
      "Vouch source channel unavailable."
    );
  }

  let count = 0;
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

    count += messages.size;

    before =
      messages.last().id;

    if (messages.size < 100) {
      break;
    }
  }

  return count;
}

async function renameCounterChannel(
  channelId,
  name
) {
  const channel =
    await client.channels.fetch(
      channelId
    );

  if (
    !channel ||
    typeof channel.setName !== "function"
  ) {
    throw new Error(
      `Counter channel ${channelId} unavailable.`
    );
  }

  if (channel.name !== name) {
    await channel.setName(name);

    console.log(
      `[VOUCH COUNTER] ${name}`
    );
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

      const personalChannel =
        await client.channels.fetch(
          PERSONAL_VOUCH_CHANNEL_ID
        );

      const regularChannel =
        await client.channels.fetch(
          VOUCH_CHANNEL_ID
        );

      const personalCount =
        await countChannelMessages(
          personalChannel
        );

      const regularCount =
        await countChannelMessages(
          regularChannel
        );

      const serverTotal =
        personalCount + regularCount;

      await Promise.all([
        renameCounterChannel(
          CHUPPY_COUNT_CHANNEL_ID,

          `${CHUPPY_COUNT_PREFIX}${personalCount}`
        ),

        renameCounterChannel(
          SERVER_COUNT_CHANNEL_ID,

          `${SERVER_COUNT_PREFIX}${serverTotal}`
        )
      ]);

      console.log(
        `[VOUCH COUNTER] Personal=${personalCount}, ` +
        `Regular=${regularCount}, Total=${serverTotal}`
      );

    } while (vouchCounterRecountRequested);

  } catch (error) {
    console.error(
      "[VOUCH COUNTER] Error:",
      error
    );
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
    void recountAllVouches();
  }, 2000);
}

// ============================================================
// VOUCH TUTORIAL
// ============================================================

async function sendVouchTutorial(guild) {
  const channel =
    await guild.channels.fetch(
      VOUCH_TUTORIAL_CHANNEL_ID
    );

  if (!channel?.isTextBased()) {
    throw new Error(
      "Vouch tutorial channel unavailable."
    );
  }

  const embeds = [
    new EmbedBuilder()
      .setTitle("HOW TO VOUCH")
      .setDescription(
        "Please follow this tutorial to leave a vouch!\n\n" +
        "Stay inside your **purchase or cash-out ticket** " +
        "while completing the process.\n\n" +
        "When you're ready, use the **`/vouch`** command."
      )
      .setColor(WHITE)
      .setFooter({
        text: BRAND
      }),

    new EmbedBuilder()
      .setTitle("STEP 1 — USE /VOUCH")
      .setDescription(
        "Run the **`/vouch`** slash command in your ticket. " +
        "Select the seller you purchased from and complete " +
        "the fields that appear."
      )
      .setImage(
        VOUCH_TUTORIAL_IMAGES.command
      )
      .setColor(WHITE)
      .setFooter({
        text: BRAND
      }),

    new EmbedBuilder()
      .setTitle("WHAT TO FILL IN")
      .setDescription(
        "**Seller:** Select the seller you purchased from.\n\n" +
        "**Rating:** Give your honest rating of the transaction.\n\n" +
        "**Order:** Describe what you purchased or " +
        "the service you received.\n\n" +
        "**Proof:** Provide the requested proof or " +
        "screenshot if prompted.\n\n" +
        "Check your answers before submitting."
      )
      .setColor(WHITE)
      .setFooter({
        text: BRAND
      }),

    new EmbedBuilder()
      .setTitle("EXAMPLE OF A COMPLETED VOUCH")
      .setDescription(
        "If the command was completed correctly, " +
        "your vouch should look similar to this! ↓"
      )
      .setImage(
        VOUCH_TUTORIAL_IMAGES.completed
      )
      .setColor(WHITE)
      .setFooter({
        text: BRAND
      }),

    new EmbedBuilder()
      .setTitle("SUCCESSFULLY SUBMITTED")
      .setDescription(
        "Once you submit the command successfully, " +
        "your vouch should appear in the appropriate " +
        "vouch channel.\n\n" +
        "Make sure your vouch accurately describes " +
        "your actual transaction."
      )
      .setImage(
        VOUCH_TUTORIAL_IMAGES.success
      )
      .setColor(WHITE)
      .setFooter({
        text: BRAND
      })
  ];

  for (const embed of embeds) {
    await channel.send({
      embeds: [embed]
    });
  }

  console.log(
    "[VOUCH TUTORIAL] Posted successfully."
  );
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
      "Here is a list of available commands and what they do.\n\n" +
      "Use the commands below to access the bot's features."
    )
    .addFields(
      {
        name: "General Commands",

        value:
          "`/help` — Displays this command menu.\n" +
          "`/question` — Submit a question.\n" +
          "`/request` — Request stock.\n" +
          "`/vouch` — Submit a transaction vouch.\n" +
          "`,afk [reason]` — Set AFK status.\n" +
          "`,pay` — Display payment methods.\n" +
          "`,client` — Post/update client-role message."
      },

      {
        name: "Self Role Commands",

        value:
          "`,roles` — Post/update ping roles.\n" +
          "`,age` — Post/update age roles.\n" +
          "`,pronouns` — Post/update pronoun roles.\n" +
          "All three menus are posted in the roles channel."
      },

      {
        name: "Ticket Commands",

        value:
          "`/ticketpanel` — Post/update the ticket panel.\n" +
          "`,claim` — Claim a ticket.\n" +
          "`,forceclaim` — Owner-only forced claim.\n" +
          "`,close [reason]` — Close a ticket.\n" +
          "`,reopen` — Reopen a ticket.\n" +
          "`,delete` — Delete a ticket.\n" +
          "Ticket buttons perform the same actions.\n" +
          "Verification tickets use the verification panel."
      },

      {
        name: "Support Commands",

        value:
          "`,r @user c` — Give Chuppys role.\n" +
          "`,r @user r` — Send vouch reminder.\n" +
          "`,partner` — Partnership instructions.\n" +
          "`,mod` — Moderator responsibilities.\n" +
          "`,seller` — Seller application.\n" +
          "`,promoter` — Promoter information."
      },

      {
        name: "Service Commands",

        value:
          "`,nitro` / `!nitro` — Nitro prices.\n" +
          "`,decor` / `!decor` — Decor prices.\n" +
          "`,boosties` / `!boosties` — Boosties prices.\n" +
          "`,sellers` / `!sellers` — Seller list.\n" +
          "`,staff` / `!staff` — Staff list."
      },

      {
        name: "Additional Commands",

        value:
          "`!vouchtut` — Vouch tutorial.\n" +
          "`!ranked` — Ranked roles.\n" +
          "`!robuxcashout` — Robux rates.\n" +
          "`!testwelcome` — Test welcome embed.\n" +
          "`!testgoodbye` — Test goodbye embed."
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
  return new EmbedBuilder()
    .setTitle(
      ".gg/chuppys promoter information"
    )
    .setDescription(
      "**Interested in becoming a .gg/chuppys promoter?**\n\n" +

      "**Promoter Responsibilities**\n\n" +
      "• Actively advertise and promote **.gg/chuppys**.\n" +
      "• Help bring genuine new members into the server.\n" +
      "• Share the server with your audience and on your platforms.\n" +
      "• Help the community grow and attract potential customers.\n" +
      "• Represent Chuppys in a positive and respectful way.\n" +
      "• Keep promotions appropriate and follow platform rules.\n" +
      "• Do not use fake invites, spam, or misleading advertisements.\n\n" +

      "**Promoter Application Questions**\n\n" +

      "**1. Do you have a following base?**\n" +
      "If so, how many followers do you have and what platform are they on?\n\n" +

      "**2. How many invites do you think you will gain monthly?**\n\n" +

      "**Payment Information**\n\n" +
      "Promoters are paid **monthly**. Payment details and arrangements " +
      "will be discussed with management.\n\n" +

      "If you're interested, please answer both application questions " +
      "and send your answers to the Chuppys team."
    )
    .setColor(WHITE)
    .setFooter({
      text: BRAND
    });
}

// ============================================================
// PAYMENT METHODS
// ============================================================
//
// NO QR EMBEDS.
//
// Venmo and Chime use the same link-button
// style as Cash App and PayPal.
//
// DUPLICATE PREVENTION:
// Search all available message history and
// keep only the newest Payment Methods embed.
//
// ============================================================

function validPaymentUrl(value) {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return false;
  }

  try {
    const parsed =
      new URL(value.trim());

    return (
      parsed.protocol === "https:" &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}

// ============================================================
// PAYMENT METHODS LIST
// ============================================================

function paymentMethods() {
  const methods = [
    {
      name: "Cash App",
      details: CASHAPP_USERNAME,
      url: CASHAPP_URL
    },

    {
      name: "PayPal",
      details: PAYPAL_USERNAME,
      url: PAYPAL_URL
    },

    {
      name: "Venmo",
      details: VENMO_USERNAME,
      url: VENMO_URL
    },

    {
      name: "Chime",
      details: CHIME_USERNAME,
      url: CHIME_URL
    },

    {
      name: "Apple Pay",
      details: APPLE_PAY,
      url: ""
    },

    {
      name: "Zelle",
      details: ZELLE,
      url: ""
    }
  ];

  for (const extra of EXTRA_PAYMENT_METHODS) {
    if (!extra.name?.trim()) {
      continue;
    }

    methods.push({
      name: extra.name.trim(),

      details:
        extra.details?.trim() ||
        "Ask staff for payment details.",

      url:
        extra.url?.trim() || ""
    });
  }

  return methods;
}

// ============================================================
// PAYMENT EMBED
// ============================================================

function makePaymentEmbed() {
  const embed =
    new EmbedBuilder()
      .setTitle("Payment Methods")
      .setDescription(
        "Choose a payment method below.\n\n" +
        "Please make sure the payment information " +
        "is correct before sending."
      )
      .setColor(WHITE)
      .setThumbnail(
        PAYMENT_EMOJI_URL
      )
      .setFooter({
        text: BRAND
      });

  for (const method of paymentMethods()) {
    embed.addFields({
      name:
        method.name.slice(0, 256),

      value:
        `\`${method.details
          .replace(/`/g, "")
          .slice(0, 1000)}\``
    });
  }

  return embed;
}

// ============================================================
// PAYMENT BUTTONS
// ============================================================

function makePaymentButtons() {
  const buttons =
    paymentMethods()
      .filter(method =>
        validPaymentUrl(method.url)
      )
      .slice(0, 5)
      .map(method =>
        new ButtonBuilder()
          .setLabel(
            method.name.slice(0, 80)
          )
          .setStyle(ButtonStyle.Link)
          .setURL(method.url)
      );

  if (!buttons.length) {
    return [];
  }

  return [
    new ActionRowBuilder()
      .addComponents(buttons)
  ];
}

// ============================================================
// PAYMENT METHODS — DUPLICATE FIX
// ============================================================
//
// 1. Scan channel history.
// 2. Find Payment Methods embeds from this bot.
// 3. Keep newest message.
// 4. Update newest with all payment methods.
// 5. Delete every older matching message.
// 6. Create a new message only when needed.
//
// Requires View Channel, Read Message History,
// Send Messages, Embed Links, and permission
// to manage/delete the bot's messages.
//
// ============================================================

async function sendPaymentEmbed(channel) {
  if (
    !channel?.isTextBased() ||
    !channel.messages ||
    !channel.send
  ) {
    throw new Error(
      "Payment channel unavailable."
    );
  }

  const payload = {
    embeds: [
      makePaymentEmbed()
    ],

    components:
      makePaymentButtons(),

    allowedMentions: {
      parse: []
    }
  };

  const matches = [];

  let before;

  // Search through all accessible channel history.

  while (true) {
    const messages =
      await channel.messages.fetch({
        limit: 100,

        ...(before ? { before } : {})
      });

    if (!messages.size) {
      break;
    }

    for (const msg of messages.values()) {
      if (
        msg.author.id === client.user.id &&
        msg.embeds.some(embed =>
          embed.title === "Payment Methods"
        )
      ) {
        matches.push(msg);
      }
    }

    if (messages.size < 100) {
      break;
    }

    before = messages.last().id;
  }

  // Newest payment embed comes first.

  matches.sort(
    (a, b) =>
      b.createdTimestamp - a.createdTimestamp
  );

  const existing = matches[0];

  if (existing) {
    // Update the newest embed.

    await existing.edit(payload);

    console.log(
      `[PAY] Updated payment embed: ${existing.id}`
    );

    // Remove older duplicate embeds.

    for (const duplicate of matches.slice(1)) {
      try {
        await duplicate.delete();

        console.log(
          `[PAY] Removed duplicate: ${duplicate.id}`
        );
      } catch (error) {
        console.error(
          `[PAY] Could not remove duplicate ${duplicate.id}:`,
          error
        );
      }
    }

    console.log(
      `[PAY] Duplicate cleanup complete. ` +
      `Found ${matches.length} payment embeds.`
    );

    return existing;
  }

  // No payment embed exists in accessible history.

  const sent =
    await channel.send(payload);

  console.log(
    `[PAY] Created payment embed: ${sent.id}`
  );

  return sent;
}

// ============================================================
// SERVICE MESSAGE UPDATER
// ============================================================

async function updateServiceMessage(
  channel,
  embed,
  serviceName
) {
  if (
    !channel?.isTextBased() ||
    !channel.messages
  ) {
    throw new Error(
      `${serviceName} channel unavailable.`
    );
  }

  const messages =
    await channel.messages.fetch({
      limit: 100
    });

  const matching =
    messages.filter(msg => {
      if (
        msg.author.id !== client.user.id ||
        !msg.embeds.length
      ) {
        return false;
      }

      const description =
        msg.embeds[0].description || "";

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

  const existing =
    matching.first();

  if (existing) {
    await existing.edit({
      content: "",
      embeds: [embed],
      components: []
    });

    for (const duplicate of matching.values()) {
      if (
        duplicate.id !== existing.id
      ) {
        await duplicate.delete()
          .catch(() => {});
      }
    }

    return existing;
  }

  return channel.send({
    embeds: [embed]
  });
}

// ============================================================
// DECOR
// ============================================================

async function sendDecorServices(channel) {
  const embed =
    new EmbedBuilder()
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
      .setColor(WHITE);

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
      .setDescription(
        `# NITRO ${SERVICE_EMOJI}\n\n` +
        "**1 Month + No War — $7.25**\n\n" +
        "**1 Month + War — $9.25**\n\n" +
        `${PAYMENT_METHODS_TEXT}\n\n**.gg/chuppys**`
      )
      .setColor(WHITE);

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

  const embed =
    new EmbedBuilder()
      .setDescription(
        `# 1 MONTH ${BOOST_EMOJI}\n\n` +

        oneMonth.map(
          ([count, price]) =>
            `${BOOST_EMOJI} **${count} • ${price}**`
        ).join("\n") +

        `\n\n# 3 MONTHS ${BOOST_EMOJI}\n\n` +

        threeMonths.map(
          ([count, price]) =>
            `${BOOST_EMOJI} **${count} • ${price}**`
        ).join("\n") +

        `\n\n${PAYMENT_METHODS_TEXT}\n\n**.gg/chuppys**`
      )
      .setColor(WHITE);

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
    [
      "1192248188409749684",
      "services seller",
      "no limit"
    ],
    [
      "1079241163455873074",
      "seller",
      "no limit"
    ],
    [
      "1032693136163622993",
      "seller",
      "$45"
    ],
    [
      "1320199904219496530",
      "seller",
      "$35"
    ],
    [
      "952566845939023892",
      "seller",
      "no limit"
    ],
    [
      "1473335012769267807",
      "seller",
      "$100"
    ],
    [
      "1472856287527309313",
      "seller",
      "$100"
    ],
    [
      "1269188505935024141",
      "seller",
      "$250"
    ],
    [
      "1427118849215692920",
      "seller",
      "$50"
    ],
    [
      "1328450205774909441",
      "seller",
      "$100"
    ],
    [
      "1475237851414401105",
      "seller",
      "$75"
    ]
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
  return new EmbedBuilder()
    .setColor(WHITE)
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
      "Role: Admin | staff",
      "ID: 1381473377696350238",
      "",

      `${SELLER_EMOJI} **<@727673410737668107>**`,
      "Role: Admin | staff",
      "ID: 727673410737668107",
      "",

      `${SELLER_EMOJI} **<@1398772218359451668>**`,
      "Role: Mod | staff",
      "ID: 1398772218359451668",
      "",

      `${SELLER_EMOJI} **<@941559349808091167>**`,
      "Role: Mod | staff",
      "ID: 941559349808091167",
      "",

      `${SELLER_EMOJI} **<@1494112860341670020>**`,
      "Role: Mod | staff",
      "ID: 1494112860341670020",
      "",

      `${SELLER_EMOJI} **<@952566845939023892>**`,
      "Role: Mod | seller",
      "Limit: no limit",
      "ID: 952566845939023892",
      ""
    ].join("\n"));
}

// ============================================================
// MODERATOR RESPONSIBILITIES
// ============================================================

function makeModEmbed() {
  return new EmbedBuilder()
    .setTitle(
      ".gg/chuppys moderator responsibilities"
    )
    .setDescription(
      "**Server Moderation**\n\n" +
      "• Keep the server organized, safe, and welcoming.\n" +
      "• Monitor chats and make sure members follow the server rules.\n" +
      "• Address rule violations fairly and professionally.\n" +
      "• Help prevent spam, harassment, scams, and inappropriate behavior.\n\n" +

      "**Ticket Assistance**\n\n" +
      "• Help members who need assistance with their tickets.\n" +
      "• Respond to questions and concerns in a timely manner.\n" +
      "• Make sure tickets are handled respectfully and correctly.\n" +
      "• Escalate situations to an owner when necessary.\n\n" +

      "**Member Assistance**\n\n" +
      "• Help members understand how the server works.\n" +
      "• Direct members to the correct channels and resources.\n" +
      "• Assist with verification and server access when needed.\n" +
      "• Treat every member with patience and respect.\n\n" +

      "**Seller & Transaction Safety**\n\n" +
      "• Help members understand the vouch process.\n" +
      "• Remind members to use the appropriate support channels.\n" +
      "• Take reports about suspicious behavior seriously.\n" +
      "• Never ignore reports involving potential scams or seller misconduct.\n\n" +

      "**Staff Expectations**\n\n" +
      "• Remain active and professional.\n" +
      "• Do not abuse moderator permissions.\n" +
      "• Do not share private staff discussions or information.\n" +
      "• Avoid unnecessary arguments with members.\n" +
      "• Be fair and consistent when handling situations.\n\n" +

      "**Important Rules**\n\n" +
      "• Do not use your staff position for personal benefits.\n" +
      "• Do not threaten members with staff permissions.\n" +
      "• Contact an owner if you are unsure how to handle a situation.\n" +
      "• Remember that being staff means representing **.gg/chuppys**.\n\n" +

      "-# Thank you for helping keep .gg/chuppys a safe and welcoming community."
    )
    .setColor(WHITE)
    .setFooter({
      text: BRAND
    });
}

// ============================================================
// EMBED SENDER
// ============================================================

async function sendEmbedToChannel(
  guild,
  channelId,
  embed,
  label
) {
  const channel =
    await guild.channels.fetch(
      channelId
    );

  if (
    !channel?.isTextBased() ||
    !channel.send
  ) {
    throw new Error(
      `${label} channel unavailable.`
    );
  }

  return channel.send({
    embeds: [embed],

    allowedMentions: {
      parse: []
    }
  });
}

// ============================================================
// AFK
// ============================================================

async function handleAFK(message) {
  const guildId =
    message.guild.id;

  const userId =
    message.author.id;

  const key =
    `${guildId}:${userId}`;

  const rawContent =
    message.content.trim();

  const match =
    rawContent.match(
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

      since: Date.now(),

      username:
        message.author.username
    });

    await message.reply({
      content:
        `${AFK_GOING_EMOJI} ${message.author}, ` +
        "you're now AFK!\n" +
        `**Reason:** ${reason}`,

      allowedMentions: {
        repliedUser: false
      }
    });

    return true;
  }

  if (afkUsers.has(key)) {
    const previous =
      afkUsers.get(key);

    afkUsers.delete(key);

    await message.channel.send({
      content:
        `${AFK_RETURN_EMOJI} Welcome back, ` +
        `${message.author}! ` +
        "Your AFK status has been removed.",

      allowedMentions: {
        parse: []
      }
    });

    console.log(
      `[AFK] ${message.author.tag} returned. ` +
      `Reason: ${previous.reason}`
    );
  }

  const notified =
    new Set();

  for (
    const [mentionedId, user]
    of message.mentions.users
  ) {
    if (
      mentionedId === userId ||
      user.bot ||
      notified.has(mentionedId)
    ) {
      continue;
    }

    const afkData =
      afkUsers.get(
        `${guildId}:${mentionedId}`
      );

    if (!afkData) {
      continue;
    }

    notified.add(mentionedId);

    await message.channel.send({
      content:
        `${AFK_GOING_EMOJI} ` +
        `**${user.username} is currently AFK.**\n` +
        `**Reason:** ${afkData.reason}`,

      allowedMentions: {
        parse: []
      }
    });
  }

  return false;
}

// ============================================================
// BOT READY
// ============================================================

client.once(
  Events.ClientReady,
  async readyClient => {
    console.log(
      `[READY] Logged in as ${readyClient.user.tag}`
    );

    console.log(
      "[READY] Chuppys bot online."
    );

    readyClient.user.setActivity(
      BRAND,
      {
        type: 3
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
      if (
        result.status === "rejected"
      ) {
        console.error(
          "[READY] Startup task failed:",
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
      "[READY] Verification panel enabled."
    );

    console.log(
      "[READY] Ping-role panel enabled: ,roles"
    );

    console.log(
      "[READY] Age-role panel enabled: ,age"
    );

    console.log(
      "[READY] Pronoun-role panel enabled: ,pronouns"
    );

    console.log(
      "[READY] Self-role dropdowns enabled."
    );

    console.log(
      "[READY] All ticket handling delegated to tickets.js."
    );

    console.log(
      "[READY] Duplicate verification ticket handler removed."
    );

    console.log(
      "[READY] Venmo and Chime payment links enabled."
    );

    console.log(
      "[READY] Payment duplicate prevention enabled."
    );
  }
);

// ============================================================
// MAIN INTERACTION HANDLER
// ============================================================
//
// tickets.js handles:
// /ticketpanel
// Ticket selects/forms
// Claim/Close/Reopen/Delete
// Create Verification Ticket
//
// index.js handles:
// Self roles
// Normal verification
// Client role
// /help, /question, /request
// Question replies
//
// ============================================================

client.on(
  Events.InteractionCreate,
  async interaction => {

    // ========================================================
    // LEAVE ALL TICKET INTERACTIONS TO tickets.js
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
          VERIFY_TICKET_BUTTON_ID
      )
    ) {
      return;
    }

    if (
      interaction.isChatInputCommand() &&
      interaction.commandName === "ticketpanel"
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
      // SELF-ROLE DROPDOWNS
      // ====================================================

      if (interaction.isStringSelectMenu()) {
        const entry =
          Object.entries(
            ROLE_MENU_CONFIG
          ).find(
            ([, config]) =>
              config.customId ===
              interaction.customId
          );

        if (entry) {
          return await handleRoleSelection(
            interaction,
            entry[0]
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
        await interaction.reply({
          embeds: [
            makeHelpEmbed()
          ],

          flags: EPHEMERAL
        });

        return;
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
              `Please use \`/request\` in <#${REQUEST_CHANNEL_ID}>.`
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

        const validCategories = [
          "Baddies",
          "MM2",
          "Adopt Me",
          "Blade Ball",
          "Robux"
        ];

        if (
          !validCategories.includes(category)
        ) {
          return interaction.reply(
            ephemeral(
              "Invalid request category."
            )
          );
        }

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

        const requestEmbed =
          new EmbedBuilder()
            .setTitle(
              `${category} Request`
            )
            .setDescription(
              `**Requested by:** <@${interaction.user.id}>\n\n` +
              `**Category:** ${category}\n\n` +
              "**What they'd like Chuppys to stock up on:**\n" +
              safeText(items)
            )
            .setColor(WHITE)
            .setThumbnail(
              REQUEST_THUMBNAIL_URL
            )
            .setFooter({
              text: BRAND
            })
            .setTimestamp();

        const channel =
          await client.channels.fetch(
            REQUEST_CHANNEL_ID
          );

        if (
          !channel?.isTextBased() ||
          !channel.send
        ) {
          return interaction.editReply({
            content:
              "The stock request channel is unavailable."
          });
        }

        await channel.send({
          embeds: [
            requestEmbed
          ],

          allowedMentions: {
            parse: []
          }
        });

        await interaction.editReply({
          content:
            `Your **${category}** request has been submitted! ` +
            "Thank you for helping Chuppys decide what to stock. ♡"
        });

        return;
      }

      // ====================================================
      // NORMAL VERIFY BUTTON
      // ====================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
        VERIFY_BUTTON_ID
      ) {
        if (!interaction.guild) {
          return interaction.reply(
            ephemeral(
              "Verification only works inside the server."
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
          }).catch(() => null);

        if (!member) {
          return interaction.editReply({
            content:
              "I couldn't find your membership. Please try again."
          });
        }

        if (
          member.roles.cache.has(
            CHUPPYS_ROLE_ID
          )
        ) {
          return interaction.editReply({
            content:
              "You're already verified and have full access to .gg/chuppys!"
          });
        }

        const requirements =
          checkVerificationRequirements(
            member
          );

        if (!requirements.passed) {
          return interaction.editReply({
            content:
              `Please select your roles in <#${ROLES_CHANNEL_ID}> ` +
              "before verifying.\n\n" +
              "You need at least one age role, " +
              "one pronoun role, and two ping roles."
          });
        }

        await member.roles.add(
          CHUPPYS_ROLE_ID,
          "Successfully completed Chuppys verification."
        );

        await interaction.editReply({
          content:
            `${AFK_RETURN_EMOJI} You're verified! ` +
            "You now have full access to **.gg/chuppys**."
        });

        console.log(
          `[VERIFY] ${member.user.tag} verified.`
        );

        return;
      }

      // ====================================================
      // VERIFICATION TICKET BUTTON
      // ====================================================
      //
      // NO HANDLER HERE.
      // tickets.js handles this button exclusively.
      //
      // ====================================================

      // ====================================================
      // CLIENT ROLE BUTTON
      // ====================================================

      if (
        interaction.isButton() &&
        interaction.customId ===
        CLIENT_BUTTON_ID
      ) {
        if (!interaction.guild) {
          return interaction.reply(
            ephemeral(
              "This button only works inside the server."
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
          }).catch(() => null);

        if (!member) {
          return interaction.editReply({
            content:
              "I couldn't find your server membership."
          });
        }

        if (
          member.roles.cache.has(
            CLIENT_ROLE_ID
          )
        ) {
          return interaction.editReply({
            content:
              "You already have the client role!"
          });
        }

        await member.roles.add(
          CLIENT_ROLE_ID,
          "Member claimed the Chuppys client role."
        );

        await interaction.editReply({
          content:
            `${CLIENT_EMOJI} You've received the client role! ` +
            "You can now submit your vouch."
        });

        console.log(
          `[CLIENT] ${member.user.tag} received client role.`
        );

        return;
      }

      // ====================================================
      // /QUESTION
      // ====================================================

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName ===
        "question"
      ) {
        if (
          interaction.channelId !==
          QUESTION_CHANNEL_ID
        ) {
          return interaction.reply(
            ephemeral(
              `Please use \`/question\` in <#${QUESTION_CHANNEL_ID}>.`
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
              "The optional picture must be an image."
            )
          );
        }

        await interaction.deferReply({
          flags: EPHEMERAL
        });

        const questionEmbed =
          new EmbedBuilder()
            .setTitle(
              `Question from ${interaction.user.username}`
            )
            .setDescription(
              `**Question**\n${safeText(questionText)}`
            )
            .setColor(WHITE)
            .setThumbnail(
              QUESTION_EMOJI_URL
            )
            .setFooter({
              text:
                `.gg/chuppys • Question User ID: ` +
                interaction.user.id
            })
            .setTimestamp();

        if (picture) {
          questionEmbed.setImage(
            picture.url
          );
        }

        const buttons =
          new ActionRowBuilder()
            .addComponents(
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
          embeds: [
            questionEmbed
          ],

          components: [
            buttons
          ],

          allowedMentions: {
            parse: []
          }
        });

        await interaction.editReply({
          content:
            "Your question has been submitted!"
        });

        return;
      }

      // ====================================================
      // QUESTION TICKET BUTTON
      // ====================================================

      if (
        interaction.isButton() &&
        (
          interaction.customId ===
            "question_ticket" ||
          interaction.customId.startsWith(
            "question_ticket:"
          )
        )
      ) {
        const ticketEmbed =
          new EmbedBuilder()
            .setDescription(
              "This question requires a support ticket.\n\n" +
              `Please make one in <#${QUESTION_TICKET_CHANNEL_ID}> ` +
              "using the ticket dropdown menu.\n\n" +
              `Our <@&${TICKET_SUPPORT_ROLE_ID}> team ` +
              "will assist you there.\n\n" +
              "Thank you! <:uppyty:1561094713153429746>"
            )
            .setColor(WHITE)
            .setThumbnail(
              QUESTION_EMOJI_URL
            )
            .setFooter({
              text: BRAND
            });

        await interaction.reply({
          embeds: [
            ticketEmbed
          ],

          flags: EPHEMERAL,

          allowedMentions: {
            parse: []
          }
        });

        return;
      }

      // ====================================================
      // QUESTION REPLY BUTTON
      // ====================================================

      if (
        interaction.isButton() &&
        (
          interaction.customId ===
            "question_reply" ||
          interaction.customId.startsWith(
            "question_reply:"
          )
        )
      ) {
        if (
          !canReplyToQuestion(
            interaction
          )
        ) {
          return interaction.reply(
            ephemeral(
              "Only Ticket Support, moderators, " +
              "administrators, or the server owner can reply."
            )
          );
        }

        let questionUserId = null;

        const footer =
          interaction.message.embeds[0]
            ?.footer?.text || "";

        const match =
          footer.match(
            /Question User ID:\s*(\d{17,20})/
          );

        if (match) {
          questionUserId = match[1];
        }

        if (!questionUserId) {
          const legacyMatch =
            interaction.customId.match(
              /^question_reply:(\d{17,20})$/
            );

          questionUserId =
            legacyMatch?.[1] || null;
        }

        const suffix =
          questionUserId
            ? `${questionUserId}:${interaction.message.id}`
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
              "Write your response to the user here..."
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

        await interaction.showModal(
          modal
        );

        return;
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
        if (
          !canReplyToQuestion(
            interaction
          )
        ) {
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

        const fallbackUserId =
          parts.length === 3
            ? parts[1]
            : null;

        const answerText =
          interaction.fields.getTextInputValue(
            "question_reply_text"
          );

        const questionChannel =
          await client.channels.fetch(
            QUESTION_CHANNEL_ID
          );

        if (
          !questionChannel?.isTextBased() ||
          !questionChannel.messages
        ) {
          return interaction.editReply({
            content:
              "The question channel is unavailable."
          });
        }

        const questionMessage =
          await questionChannel.messages.fetch(
            messageId
          ).catch(() => null);

        if (!questionMessage) {
          return interaction.editReply({
            content:
              "The original question was not found."
          });
        }

        const footer =
          questionMessage.embeds[0]
            ?.footer?.text || "";

        const match =
          footer.match(
            /Question User ID:\s*(\d+)/
          );

        const questionUserId =
          match?.[1] ||
          fallbackUserId;

        if (!questionUserId) {
          return interaction.editReply({
            content:
              "Could not identify the question author."
          });
        }

        const questionUser =
          await client.users.fetch(
            questionUserId
          ).catch(() => null);

        if (!questionUser) {
          return interaction.editReply({
            content:
              "Could not find the user's Discord account."
          });
        }

        const responseEmbed =
          new EmbedBuilder()
            .setTitle(
              "Response to Your Question"
            )
            .setDescription(
              `${QUESTION_EMOJI} **Replied by:** ` +
              `${interaction.user.username}\n\n` +
              `**Response:**\n${safeText(answerText)}`
            )
            .setColor(WHITE)
            .setThumbnail(
              QUESTION_EMOJI_URL
            )
            .setFooter({
              text: BRAND
            })
            .setTimestamp();

        try {
          await questionUser.send({
            embeds: [
              responseEmbed
            ],

            allowedMentions: {
              parse: []
            }
          });
        } catch {
          return interaction.editReply({
            content:
              "I couldn't DM that user. Their DMs may be disabled."
          });
        }

        await interaction.editReply({
          content:
            `Your response was sent privately to ` +
            `**${questionUser.username}**.`
        });

        return;
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
// VOUCH REACTIONS AND COUNTERS
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
    const affectsVouchChannel =
      messages.some(message =>
        message.channel &&
        VOUCH_SOURCE_CHANNEL_IDS.includes(
          message.channel.id
        )
      );

    if (affectsVouchChannel) {
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
          "[WELCOME] Role assignment failed:",
          error
        );
      });

      const channel =
        await member.guild.channels.fetch(
          WELCOME_CHANNEL_ID
        );

      if (!channel?.isTextBased()) {
        return;
      }

      const embed =
        new EmbedBuilder()
          .setTitle(
            `Welcome to .gg/chuppys ${AFK_RETURN_EMOJI}`
          )
          .setDescription(
            `Welcome ${member}!\n\n` +
            "We're happy to have you here. " +
            "Make sure to read the rules " +
            "and enjoy your time in the server!"
          )
          .setColor(WHITE)
          .setThumbnail(
            member.user.displayAvatarURL()
          )
          .setImage(
            WELCOME_IMAGE
          )
          .setFooter({
            text:
              member.guild.name
          });

      await channel.send({
        content:
          `${member}`,

        embeds: [
          embed
        ],

        allowedMentions: {
          users: [
            member.id
          ]
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

      if (!channel?.isTextBased()) {
        return;
      }

      const embed =
        new EmbedBuilder()
          .setTitle(
            `Goodbye ${AFK_GOING_EMOJI}`
          )
          .setDescription(
            `**${member.user.username}** has left ` +
            `**${member.guild.name}**.\n\n` +
            "We hope to see you again!"
          )
          .setColor(WHITE)
          .setThumbnail(
            member.user.displayAvatarURL()
          )
          .setFooter({
            text:
              member.guild.name
          });

      await channel.send({
        embeds: [
          embed
        ]
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
// MESSAGE COMMANDS
// ============================================================
//
// tickets.js handles:
// ,claim
// ,forceclaim
// ,close
// ,reopen
// ,delete
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

    const rawContent =
      message.content.trim();

    const content =
      rawContent.toLowerCase();

    // ========================================================
    // LEAVE TICKET COMMANDS TO tickets.js
    // ========================================================

    if (
      /^,(?:claim|forceclaim|close|reopen|delete)(?:\s|$)/i
        .test(rawContent)
    ) {
      return;
    }

    try {

      // ====================================================
      // GREETING
      // ====================================================

      if (
        /^(hi+|hey+|hello+|heya+)[!.?,\s]*$/i
          .test(rawContent)
      ) {
        await message.reply({
          content:
            `Hi ! ${AFK_RETURN_EMOJI}`,

          allowedMentions: {
            repliedUser: false
          }
        });

        return;
      }

      const wasAFKCommand =
        await handleAFK(message);

      if (wasAFKCommand) {
        return;
      }

      // ====================================================
      // ROLE COMMANDS
      // ====================================================

      if (
        Object.prototype.hasOwnProperty.call(
          ROLE_COMMANDS,
          content
        )
      ) {
        const type =
          ROLE_COMMANDS[content];

        await handleRolePanelCommand(
          message,
          type
        );

        return;
      }

      // ====================================================
      // ,CLIENT
      // ====================================================

      if (content === ",client") {
        const channelId =
          message.channel.id;

        if (
          clientCommandLocks.has(
            channelId
          )
        ) {
          return;
        }

        clientCommandLocks.add(
          channelId
        );

        try {
          const matching =
            await findClientRoleMessages(
              message.channel
            );

          const payload = {
            embeds: [
              makeClientEmbed()
            ],

            components: [
              makeClientButton()
            ],

            allowedMentions: {
              parse: []
            }
          };

          if (matching.size) {
            const existing =
              matching.first();

            await existing.edit(
              payload
            );

            for (const duplicate of matching.values()) {
              if (
                duplicate.id !== existing.id
              ) {
                await duplicate.delete()
                  .catch(console.error);
              }
            }
          } else {
            await message.channel.send(
              payload
            );
          }

        } finally {
          clientCommandLocks.delete(
            channelId
          );
        }

        return;
      }

      // ====================================================
      // ,PROMOTER
      // ====================================================

      if (content === ",promoter") {
        const channelId =
          message.channel.id;

        if (
          promoterCommandLocks.has(
            channelId
          )
        ) {
          return;
        }

        promoterCommandLocks.add(
          channelId
        );

        try {
          const messages =
            await message.channel.messages.fetch({
              limit: 100
            });

          const matching =
            messages.filter(msg =>
              msg.author.id === client.user.id &&
              msg.embeds.some(embed =>
                embed.title ===
                ".gg/chuppys promoter information"
              )
            );

          const payload = {
            embeds: [
              makePromoterEmbed()
            ],

            content: "",

            components: [],

            allowedMentions: {
              parse: []
            }
          };

          const existing =
            matching.first();

          if (existing) {
            await existing.edit(
              payload
            );

            for (const duplicate of matching.values()) {
              if (
                duplicate.id !== existing.id
              ) {
                await duplicate.delete()
                  .catch(console.error);
              }
            }
          } else {
            await message.channel.send(
              payload
            );
          }
        } finally {
          promoterCommandLocks.delete(
            channelId
          );
        }

        return;
      }

      // ====================================================
      // !VOUCHTUT
      // ====================================================

      if (content === "!vouchtut") {
        if (
          !canManageServer(
            message.member
          )
        ) {
          return message.reply(
            "You need Manage Server permission."
          );
        }

        await sendVouchTutorial(
          message.guild
        );

        await message.reply(
          "The vouch tutorial has been posted!"
        );

        return;
      }

      // ====================================================
      // !RANKED
      // ====================================================

      if (content === "!ranked") {
        if (
          !canManageServer(
            message.member
          )
        ) {
          return message.reply(
            "You need Manage Server permission."
          );
        }

        await sendRankedRoles(
          message.guild
        );

        await message.reply(
          "The ranked roles embed has been sent!"
        );

        return;
      }

      // ====================================================
      // ,R @USER C / ,R @USER R
      // ====================================================

      if (
        /^,r(?:\s|$)/i.test(
          rawContent
        )
      ) {
        if (
          !isTicketSupport(
            message.member
          )
        ) {
          return message.reply(
            "Only Ticket Support can use this command."
          );
        }

        const match =
          rawContent.match(
            /^,r\s+<@!?(\d+)>\s+([cr])$/i
          );

        if (!match) {
          return message.reply(
            "Usage: `,r @user c` or `,r @user r`"
          );
        }

        const targetId =
          match[1];

        const action =
          match[2].toLowerCase();

        const target =
          await message.guild.members.fetch(
            targetId
          ).catch(() => null);

        if (!target) {
          return message.reply(
            "I couldn't find that member."
          );
        }

        if (action === "c") {
          if (
            target.roles.cache.has(
              CHUPPYS_ROLE_ID
            )
          ) {
            return message.reply(
              `${target.user.username} already has the Chuppys role.`
            );
          }

          await target.roles.add(
            CHUPPYS_ROLE_ID,
            `Granted by Ticket Support: ${message.author.tag}`
          );

          const embed =
            new EmbedBuilder()
              .setDescription(
                "Welcome to **.gg/chuppys**! " +
                `Please check out <#${ROLES_CHANNEL_ID}> ` +
                `and <#${RULES_CHANNEL_ID}>. ` +
                "Enjoy shopping at Chuppy’s Market " +
                CHUPPYS_WELCOME_EMOJI
              )
              .setColor(WHITE)
              .setFooter({
                text: BRAND
              });

          await message.channel.send({
            content:
              `${target}`,

            embeds: [
              embed
            ],

            allowedMentions: {
              parse: [],

              users: [
                target.id
              ]
            }
          });

          return;
        }

        if (action === "r") {
          const embed =
            new EmbedBuilder()
              .setTitle(
                "Reminder to Vouch!"
              )
              .setDescription(
                "Thank you for shopping at **.gg/chuppys**! " +
                `${CHUPPYS_WELCOME_EMOJI}\n\n` +
                `Please check out <#${VOUCH_TUTORIAL_CHANNEL_ID}> ` +
                "to learn how to leave a vouch using " +
                "the **/vouch** command.\n\n" +
                `And don't forget to stop by <#${QUICK_VOUCH_CHANNEL_ID}> ` +
                "for a quick vouch as well!\n\n" +
                "Not vouching sellers within the 2 day " +
                "grace period will result in you being " +
                "black listed in this server."
              )
              .setColor(WHITE)
              .setFooter({
                text: BRAND
              });

          await message.channel.send({
            content:
              `${target}`,

            embeds: [
              embed
            ],

            allowedMentions: {
              parse: [],

              users: [
                target.id
              ]
            }
          });

          return;
        }
      }

      // ====================================================
      // ,PARTNER
      // ====================================================

      if (content === ",partner") {
        if (
          !isTicketSupport(
            message.member
          )
        ) {
          return message.reply(
            "Only Ticket Support can use this command."
          );
        }

        const partnerEmbed =
          new EmbedBuilder()
            .setDescription(
              "**.gg/chuppys partnership**\n\n" +
              "Please make sure all questions from the " +
              ".gg/chuppys ticket bot are answered !! " +
              "If not please answer them now !!\n\n" +
              "1. **How many vouches ? Please show us proof !**\n\n\n" +
              "2. **How many server members ?**\n\n\n" +
              "After these questions are answered, " +
              "please copy and paste your server ad " +
              "in this partnership ticket. Staff will " +
              "post it shortly in <#1552387314049618041>.\n\n" +
              `Go to <#${PARTNER_AD_CHANNEL_ID}> ` +
              "to copy and paste Chuppys' ad. " +
              "Once this is done, send a screenshot for proof.\n\n" +
              "Thank you for partnering with **.gg/chuppys!** " +
              CHUPPYS_WELCOME_EMOJI
            )
            .setColor(WHITE)
            .setFooter({
              text: BRAND
            });

        const messages =
          await message.channel.messages.fetch({
            limit: 100
          });

        const matching =
          messages.filter(msg =>
            msg.author.id === client.user.id &&
            msg.embeds.some(embed =>
              (embed.description || "").includes(
                ".gg/chuppys partnership"
              )
            )
          );

        const payload = {
          embeds: [
            partnerEmbed
          ],

          content: "",

          components: [],

          allowedMentions: {
            parse: []
          }
        };

        const existing =
          matching.first();

        if (existing) {
          await existing.edit(
            payload
          );

          for (const duplicate of matching.values()) {
            if (
              duplicate.id !== existing.id
            ) {
              await duplicate.delete()
                .catch(console.error);
            }
          }
        } else {
          await message.channel.send(
            payload
          );
        }

        return;
      }

      // ====================================================
      // ,MOD
      // ====================================================

      if (content === ",mod") {
        if (
          !isTicketSupport(
            message.member
          )
        ) {
          return message.reply(
            "Only Ticket Support can use this command."
          );
        }

        const messages =
          await message.channel.messages.fetch({
            limit: 100
          });

        const matching =
          messages.filter(msg =>
            msg.author.id === client.user.id &&
            msg.embeds.some(embed =>
              embed.title ===
              ".gg/chuppys moderator responsibilities"
            )
          );

        const payload = {
          embeds: [
            makeModEmbed()
          ],

          content: "",

          components: [],

          allowedMentions: {
            parse: []
          }
        };

        const existing =
          matching.first();

        if (existing) {
          await existing.edit(
            payload
          );

          for (const duplicate of matching.values()) {
            if (
              duplicate.id !== existing.id
            ) {
              await duplicate.delete()
                .catch(console.error);
            }
          }
        } else {
          await message.channel.send(
            payload
          );
        }

        return;
      }

      // ====================================================
      // ,SELLER APPLICATION
      // ====================================================

      if (content === ",seller") {
        const channelId =
          message.channel.id;

        if (
          sellerCommandLocks.has(
            channelId
          )
        ) {
          return;
        }

        sellerCommandLocks.add(
          channelId
        );

        try {
          const sellerEmbed =
            new EmbedBuilder()
              .setDescription(
                "**Interested in selling at .gg/chuppys**\n\n" +
                "**Permanent fees**\n\n" +
                "$10 - permanent fee with no personal commands\n\n" +
                "$15 - permanent fee with personal commands\n\n" +
                "Personal commands are ones we can create " +
                "for you or insert your code that allows " +
                "you to use your personal payment command, " +
                "ps command, etc.\n\n" +
                "Your limit is defined primarily based on " +
                "how many personal vouches you have. " +
                "If you have a server with multiple sellers, " +
                "the vouches they received in your server " +
                "do not increase your limit. However, after " +
                "your limit is determined, every 2 vouches " +
                "gained in .gg/chuppys increases your limit " +
                "by $5.\n\n" +
                "If you agree and understand all of this, " +
                `please ping <@&${TICKET_SUPPORT_ROLE_ID}> ` +
                "to assist you further. Thank you!"
              )
              .setColor(WHITE)
              .setFooter({
                text: BRAND
              });

          const messages =
            await message.channel.messages.fetch({
              limit: 100
            });

          const matching =
            messages.filter(msg =>
              msg.author.id === client.user.id &&
              msg.embeds.some(embed =>
                (embed.description || "").includes(
                  "Interested in selling at .gg/chuppys"
                )
              )
            );

          const payload = {
            embeds: [
              sellerEmbed
            ],

            content: "",

            components: [],

            allowedMentions: {
              parse: [],

              roles: [
                TICKET_SUPPORT_ROLE_ID
              ]
            }
          };

          const existing =
            matching.first();

          if (existing) {
            await existing.edit(
              payload
            );

            for (const duplicate of matching.values()) {
              if (
                duplicate.id !== existing.id
              ) {
                await duplicate.delete()
                  .catch(console.error);
              }
            }
          } else {
            await message.channel.send(
              payload
            );
          }

        } finally {
          sellerCommandLocks.delete(
            channelId
          );
        }

        return;
      }

      // ====================================================
      // !ROBUXCASHOUT
      // ====================================================

      if (content === "!robuxcashout") {
        if (
          !canManageServer(
            message.member
          )
        ) {
          return message.reply(
            "You need Manage Server permission."
          );
        }

        const channel =
          await client.channels.fetch(
            ROBUX_CASHOUT_CHANNEL_ID
          );

        await sendRobuxCashoutEmbed(
          channel
        );

        await message.reply(
          "Robux Cash Out message updated successfully!"
        );

        return;
      }

      // ====================================================
      // ,PAY — DUPLICATE PREVENTION
      // ====================================================
      //
      // Only one payment embed per channel.
      //
      // Other old embeds are removed automatically.
      //
      // ====================================================

      if (content === ",pay") {
        const channelId =
          message.channel.id;

        if (paymentCommandLocks.has(channelId)) {
          return;
        }

        paymentCommandLocks.add(channelId);

        try {
          await sendPaymentEmbed(
            message.channel
          );
        } finally {
          paymentCommandLocks.delete(channelId);
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
        adminCommands.includes(content) &&
        !canManageServer(
          message.member
        )
      ) {
        return message.reply(
          "You need Manage Server permission."
        );
      }

      // ====================================================
      // NITRO
      // ====================================================

      if (
        ["!nitro", ",nitro"].includes(
          content
        )
      ) {
        await sendNitroServices(
          await client.channels.fetch(
            NITRO_CHANNEL_ID
          )
        );

        await message.reply(
          "Nitro message updated successfully."
        );

        return;
      }

      // ====================================================
      // DECOR
      // ====================================================

      if (
        ["!decor", ",decor"].includes(
          content
        )
      ) {
        await sendDecorServices(
          await client.channels.fetch(
            DECOR_CHANNEL_ID
          )
        );

        await message.reply(
          "Decor message updated successfully."
        );

        return;
      }

      // ====================================================
      // BOOSTIES
      // ====================================================

      if (
        ["!boosties", ",boosties"].includes(
          content
        )
      ) {
        await sendBoostiesServices(
          await client.channels.fetch(
            BOOSTIES_CHANNEL_ID
          )
        );

        await message.reply(
          "Boosties message updated successfully."
        );

        return;
      }

      // ====================================================
      // SELLERS LIST
      // ====================================================

      if (
        ["!sellers", ",sellers"].includes(
          content
        )
      ) {
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

      // ====================================================
      // STAFF LIST
      // ====================================================

      if (
        ["!staff", ",staff"].includes(
          content
        )
      ) {
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

      // ====================================================
      // TEST WELCOME
      // ====================================================

      if (content === "!testwelcome") {
        const channel =
          await client.channels.fetch(
            WELCOME_CHANNEL_ID
          );

        if (!channel?.isTextBased()) {
          return message.reply(
            "Welcome channel not found."
          );
        }

        const embed =
          new EmbedBuilder()
            .setTitle(
              `Welcome to .gg/chuppys ${AFK_RETURN_EMOJI}`
            )
            .setDescription(
              `Welcome ${message.author}!\n\n` +
              "We're happy to have you here. " +
              "Make sure to read the rules " +
              "and enjoy your time in the server!"
            )
            .setColor(WHITE)
            .setThumbnail(
              message.author.displayAvatarURL()
            )
            .setImage(
              WELCOME_IMAGE
            )
            .setFooter({
              text:
                message.guild.name
            });

        await channel.send({
          content:
            `${message.author}`,

          embeds: [
            embed
          ]
        });

        return;
      }

      // ====================================================
      // TEST GOODBYE
      // ====================================================

      if (content === "!testgoodbye") {
        const channel =
          await client.channels.fetch(
            GOODBYE_CHANNEL_ID
          );

        if (!channel?.isTextBased()) {
          return message.reply(
            "Goodbye channel not found."
          );
        }

        const embed =
          new EmbedBuilder()
            .setTitle(
              `Goodbye ${AFK_GOING_EMOJI}`
            )
            .setDescription(
              `**${message.author.username}** has left ` +
              `**${message.guild.name}**.\n\n` +
              "We hope to see you again!"
            )
            .setColor(WHITE)
            .setThumbnail(
              message.author.displayAvatarURL()
            )
            .setFooter({
              text:
                message.guild.name
            });

        await channel.send({
          embeds: [
            embed
          ]
        });

        return;
      }

    } catch (error) {
      console.error(
        "[MESSAGE COMMAND] Error:",
        error
      );

      await message.reply({
        content:
          `Something went wrong: ${safeText(error.message)}`,

        allowedMentions: {
          parse: [],
          repliedUser: false
        }
      }).catch(() => {});
    }
  }
);

// ============================================================
// INVITE BOT REACTION
// ============================================================

client.on(
  Events.MessageCreate,
  async message => {
    if (!message.guild) {
      return;
    }

    if (
      message.channel.id !==
      INVITE_CHANNEL_ID
    ) {
      return;
    }

    if (
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
        "[INVITE REACTION] Failed:",
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
    "[DISCORD CLIENT] Error:",
    error
  );
});

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
// END OF CHUPPYS INDEX.JS
// ============================================================
//
// DEPLOYMENT:
//
// 1. Replace your existing index.js.
//
// 2. Keep these files:
//    index.js
//    tickets.js
//    transactions.js
//    vouch.js
//    package.json
//
// 3. Run only one Render bot instance.
//
// 4. Enable Guild Members and Message Content intents.
//
// 5. Ensure tickets.js handles verification tickets.
//
// 6. Restart or redeploy Render.
//
// 7. Type ,pay in your admin commands channel.
//
// 8. The newest Payment Methods embed will be
//    updated with all six payment methods.
//
// 9. Older matching payment embeds from this bot
//    will be deleted if accessible.
//
// 10. Cash App, PayPal, Venmo and Chime
//     keep their clickable link buttons.
//
// 11. No QR embed is sent.
//
// 12. Repeating ,pay updates the same message.
//
// 13. If duplicates continue appearing, check for
//     another running bot instance or another
//     file handling the ,pay command.
//
// ============================================================
