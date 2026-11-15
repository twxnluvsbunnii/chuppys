"use strict";

// ==================================================
// CHUPPYS TICKET SYSTEM
// DISCORD.JS V14 / RENDER
// ==================================================
//
// Usage:
// require("./tickets")(client);
//
// Slash command:
// require("./tickets").command
//
// PREFIX COMMANDS:
// ,claim
// ,close
// ,close reason here
// ,reopen
// ,delete
//
// FEATURES:
// - Purchase tickets
// - Cash Out tickets
// - Giveaway tickets
// - Partnership tickets
// - Support tickets
// - Global ticket counter
// - Existing V3 metadata compatibility
// - Legacy metadata recovery
// - Missing metadata recovery
// - Private seller claims
// - Buyer retains ticket access
// - Claiming seller retains ticket access
// - Ticket Support retains ticket access
// - Owner retains ticket access
// - Other sellers lose access after claim
// - Claim, Close, Reopen, Delete buttons
// - Prefix commands
// - Blank channel descriptions
// - Ticket activity logs
// - Private HTML transcripts
// - Transcript link buttons
//
// IMPORTANT:
// Enable Message Content Intent.
// Enable Guild Members Intent if available.
// Bot needs Manage Channels, Manage Roles,
// View Channels, Send Messages,
// Read Message History and Attach Files.
//
// Run only ONE bot instance.
// ==================================================

const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  AttachmentBuilder,
  Events,
  MessageFlags
} = require("discord.js");

// ==================================================
// IDS
// ==================================================

const IDS = Object.freeze({
  panel: "1530811385678790716",

  logs: "1570913954333728808",

  transcripts: "1571112508922531870",

  data: "1571112668037644388",

  owner: "1530988662970650865",

  admin: "1531800870444994641",

  mod: "1531800784700706887",

  support: "1563003884656398406",

  seller: "1550322075208646766",

  verified: "1550230619127021568"
});

// ==================================================
// SETTINGS
// ==================================================

const BRAND = ".gg/chuppys";

const EMOJI = "<:chuppyhi:1561103471325745242>";

const LOG_COLOR = 0x2489d7;

const EPHEMERAL = MessageFlags.Ephemeral;

const COMMAND_PREFIX = ",";

// ==================================================
// EXISTING STORAGE PREFIXES
// DO NOT CHANGE
// ==================================================

const STATE_PREFIX =
  "CHUPPYS_PRIVATE_TICKET_METADATA_V3:";

const LEGACY_PREFIXES = [
  "CHUPPYS_PRIVATE_TICKET_METADATA_V2:",
  "CHUPPYS_TICKET_STATE_V4:",
  "CHUPPYS_TICKET_STATE_V3:",
  "CHUPPYS_TICKET_STATE_V2:"
];

const COUNTER_PREFIX =
  "CHUPPYS_GLOBAL_TICKET_COUNTER_V1:";

const OLD_COUNTER_PREFIX =
  "CHUPPYS_TICKET_COUNTERS_V1:";

// ==================================================
// COMPONENT IDS
// ==================================================

const SELECT_IDS = new Set([
  "chuppys_ticket_select",
  "chuppys_ticket_category",
  "chuppys_tickets",
  "ticket_select",
  "ticket_category",
  "ticket_open",
  "ticket_create"
]);

const SELECT_ID = "chuppys_ticket_select";

const FORM_PREFIX = "chuppys_ticket_form:";

const CLOSE_PREFIX =
  "chuppys_ticket_close_modal:";

const OLD_TRANSCRIPT_PREFIX =
  "chuppys_transcript:";

const BUTTONS = {
  claim: "chuppys_ticket_claim",
  close: "chuppys_ticket_close",
  reopen: "chuppys_ticket_reopen",
  delete: "chuppys_ticket_delete"
};

// ==================================================
// TICKET TYPES
// ==================================================

const TYPES = {
  purchase: {
    name: "Purchase",

    categoryEnv:
      "PURCHASE_TICKET_CATEGORY_ID",

    description:
      "Please provide your purchase details.",

    questions: [
      "What are you purchasing?",
      "Who are you buying from?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  cashout: {
    name: "Cash Out",

    categoryEnv:
      "CASHOUT_TICKET_CATEGORY_ID",

    description:
      "Please provide your cash out details.",

    questions: [
      "What are you cashing out?",
      "How much are you looking for?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  giveaway: {
    name: "Giveaway",

    categoryEnv:
      "GIVEAWAY_TICKET_CATEGORY_ID",

    description:
      "Please provide details about the giveaway you won."
  },

  partnership: {
    name: "Partnership",

    categoryEnv:
      "PARTNERSHIP_TICKET_CATEGORY_ID",

    description:
      "Please provide your partnership information."
  },

  support: {
    name: "Support",

    categoryEnv:
      "SUPPORT_TICKET_CATEGORY_ID",

    description:
      "Please explain what you need help with."
  }
};

// ==================================================
// ROLE ACCESS
// ==================================================
//
// IMPORTANT:
//
// Owner is a USER ID, not a role ID.
//
// After a ticket is claimed:
// - Buyer gets explicit member access
// - Claimer gets explicit member access
// - Ticket Support role retains access
// - Owner gets explicit member access
// - Seller role loses role-wide access
//
// Administrators bypass Discord permissions.
// ==================================================

const ACCESS = {
  purchase: [
    IDS.seller,
    IDS.support,
    IDS.admin,
    IDS.mod
  ],

  cashout: [
    IDS.seller,
    IDS.support,
    IDS.admin,
    IDS.mod
  ],

  giveaway: [
    IDS.support,
    IDS.admin,
    IDS.mod
  ],

  partnership: [
    IDS.support,
    IDS.admin,
    IDS.mod
  ],

  support: [
    IDS.support,
    IDS.admin,
    IDS.mod
  ]
};

const PINGS = {
  purchase: [
    IDS.seller,
    IDS.support
  ],

  cashout: [
    IDS.seller,
    IDS.support
  ],

  giveaway: [
    IDS.support
  ],

  partnership: [
    IDS.support
  ],

  support: [
    IDS.support
  ]
};

// ==================================================
// SLASH COMMAND
// ==================================================

const command = new SlashCommandBuilder()
  .setName("ticketpanel")
  .setDescription(
    "Post or update the Chuppys ticket panel."
  )
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageGuild
  );

// ==================================================
// RUNTIME STATE
// ==================================================

const cache = new Map();

let queue = Promise.resolve();

let initialization = null;

let initialized = false;

let globalCounter = 0;

let counterMessageId = null;

// ==================================================
// QUEUE
// ==================================================

function queued(task) {
  const result = queue.then(task);

  queue = result.catch(() => {});

  return result;
}

// ==================================================
// HELPERS
// ==================================================

function formatNumber(number) {
  return String(number).padStart(4, "0");
}

function ticketName(type, number, closed = false) {
  return (
    `${closed ? "closed-" : ""}` +
    `${type}-${formatNumber(number)}`
  ).slice(0, 100);
}

function safe(value, max = 1000) {
  return String(value ?? "")
    .replace(/@/g, "＠")
    .replace(/```/g, "''' ")
    .slice(0, max);
}

function html(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]
  );
}

function discordStamp(value) {
  const milliseconds =
    new Date(value).getTime();

  if (!Number.isFinite(milliseconds)) {
    return "Unknown";
  }

  return (
    `<t:${Math.floor(milliseconds / 1000)}:F>`
  );
}

function hasRole(context, id) {
  const roles = context.member?.roles;

  if (roles?.cache) {
    return roles.cache.has(id);
  }

  if (Array.isArray(roles)) {
    return roles.includes(id);
  }

  return false;
}

function isOwner(context) {
  return context.user?.id === IDS.owner;
}

function isAdmin(context) {
  return Boolean(
    context.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  );
}

function isSupport(context) {
  return hasRole(context, IDS.support);
}

function isSeller(context) {
  return hasRole(context, IDS.seller);
}

function isOtherStaff(context) {
  return (
    hasRole(context, IDS.admin) ||
    hasRole(context, IDS.mod)
  );
}

function isManager(context) {
  return (
    isOwner(context) ||
    isAdmin(context) ||
    isSupport(context) ||
    isSeller(context) ||
    isOtherStaff(context)
  );
}

function canClaim(context, state) {
  if (isOwner(context) || isAdmin(context)) {
    return true;
  }

  if (isSupport(context)) {
    return true;
  }

  if (
    state.type === "purchase" ||
    state.type === "cashout"
  ) {
    return isSeller(context);
  }

  return isOtherStaff(context);
}

function canManage(context, state) {
  if (isOwner(context) || isAdmin(context)) {
    return true;
  }

  if (isSupport(context)) {
    return true;
  }

  if (state.claimedBy) {
    return state.claimedBy === context.user.id;
  }

  return canClaim(context, state);
}

function canDelete(context, state) {
  return canManage(context, state);
}

// ==================================================
// INTERACTION REPLIES
// ==================================================

async function reply(context, content) {
  if (context.deferred) {
    return context.editReply({
      content
    });
  }

  if (context.replied) {
    return context.followUp({
      content,
      flags: EPHEMERAL
    });
  }

  return context.reply({
    content,
    flags: EPHEMERAL
  });
}

// ==================================================
// PREFIX MESSAGE ADAPTER
// ==================================================

function messageContext(message) {
  return {
    guild: message.guild,
    channel: message.channel,
    channelId: message.channelId,

    user: message.author,
    member: message.member,

    memberPermissions:
      message.member?.permissions,

    client: message.client,

    deferred: false,
    replied: false,

    async reply(payload) {
      const content =
        typeof payload === "string"
          ? payload
          : payload.content;

      return message.reply({
        content,
        allowedMentions: {
          parse: [],
          repliedUser: false
        }
      });
    }
  };
}

// ==================================================
// EMBED HELPERS
// ==================================================

function ticketEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xffffff)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: BRAND
    });
}

async function textChannel(guild, id, label) {
  const channel =
    await guild.channels.fetch(id);

  if (
    !channel?.isTextBased() ||
    !channel.messages ||
    !channel.send
  ) {
    throw new Error(
      `${label} channel unavailable: ${id}`
    );
  }

  return channel;
}

function channelLink(guildId, channelId) {
  return (
    "https://discord.com/channels/" +
    `${guildId}/${channelId}`
  );
}

function transcriptButton(url) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("View Transcript")
      .setStyle(ButtonStyle.Link)
      .setURL(url)
  );
}

function viewTicketButton(guildId, channelId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("View Ticket")
      .setStyle(ButtonStyle.Link)
      .setURL(
        channelLink(guildId, channelId)
      )
  );
}

// ==================================================
// TICKET BUTTONS
// ==================================================

function controls(closed) {
  const row = new ActionRowBuilder();

  if (closed) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTONS.reopen)
        .setLabel("Reopen")
        .setEmoji("🔓")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(BUTTONS.delete)
        .setLabel("Delete")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTONS.claim)
        .setLabel("Claim")
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(BUTTONS.close)
        .setLabel("Close")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );
  }

  return [row];
}

// ==================================================
// PANEL
// ==================================================

function panelPayload() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(SELECT_ID)
    .setPlaceholder(
      "Select a ticket category"
    )
    .addOptions(
      Object.entries(TYPES).map(
        ([value, settings]) => ({
          label: settings.name,
          value,

          description:
            `Open a ${settings.name} ticket`
        })
      )
    );

  return {
    embeds: [
      ticketEmbed(
        `${EMOJI} .gg/chuppys Tickets`,

        "Welcome to the Chuppys ticket system!\n\n" +

        "Select the category that matches " +
        "what you need assistance with.\n\n" +

        "**Purchase** — Purchase assistance\n" +
        "**Cash Out** — Cashout assistance\n" +
        "**Giveaway** — Giveaway claims\n" +
        "**Partnership** — Partnerships\n" +
        "**Support** — General assistance\n\n" +

        "Our team will assist you as soon as possible."
      )
    ],

    components: [
      new ActionRowBuilder().addComponents(menu)
    ],

    allowedMentions: {
      parse: []
    }
  };
}

// ==================================================
// TICKET NAME RECOGNITION
// ==================================================
//
// Recognizes existing channels:
//
// purchase-0636
// purchasing-0636
// cashout-0637
// cash-out-0637
// giveaway-0638
// partnership-0639
// support-0640
//
// Also recognizes closed- versions.
// ==================================================

function parseTicketName(name) {
  const match = String(name || "").match(
    /^(closed-)?(purchase|purchasing|cashout|cash-out|giveaway|partnership|support)-(\d+)$/i
  );

  if (!match) {
    return null;
  }

  let type = match[2].toLowerCase();

  if (type === "purchasing") {
    type = "purchase";
  }

  if (type === "cash-out") {
    type = "cashout";
  }

  const number = Number(match[3]);

  if (
    !Number.isSafeInteger(number) ||
    number < 1 ||
    !TYPES[type]
  ) {
    return null;
  }

  return {
    type,
    number,
    closed: Boolean(match[1])
  };
}

// ==================================================
// STATE PARSING
// ==================================================

function normalizeState(data) {
  if (
    !data ||
    !data.channelId ||
    !data.ownerId ||
    !TYPES[data.type]
  ) {
    return null;
  }

  const number = Number(data.number);

  if (
    !Number.isSafeInteger(number) ||
    number < 1
  ) {
    return null;
  }

  return {
    channelId: String(data.channelId),

    ownerId: String(data.ownerId),

    type: data.type,

    number,

    status:
      data.status === "closed"
        ? "closed"
        : "open",

    claimedBy:
      data.claimedBy
        ? String(data.claimedBy)
        : null,

    controlMessageId:
      data.controlMessageId || null,

    closeReason:
      data.closeReason || "Done",

    transcriptUrl:
      data.transcriptUrl || null,

    createdAt:
      data.createdAt || null
  };
}

function parseState(message) {
  const content = message?.content || "";

  const prefix = [
    STATE_PREFIX,
    ...LEGACY_PREFIXES
  ].find(
    value => content.startsWith(value)
  );

  if (!prefix) {
    return null;
  }

  try {
    return normalizeState(
      JSON.parse(
        content.slice(prefix.length)
      )
    );
  } catch {
    return null;
  }
}

// ==================================================
// MESSAGE SCANNER
// ==================================================

async function scan(
  channel,
  callback,
  limitPages = 200
) {
  let before;

  for (
    let page = 0;
    page < limitPages;
    page++
  ) {
    const messages =
      await channel.messages.fetch({
        limit: 100,

        ...(before ? { before } : {})
      });

    if (!messages.size) {
      return;
    }

    for (const message of messages.values()) {
      await callback(message);
    }

    if (messages.size < 100) {
      return;
    }

    before = messages.last().id;
  }

  console.warn(
    `[TICKETS] Scan limit reached: ${channel.id}`
  );
}

// ==================================================
// SAVE STATE
// ==================================================

async function saveState(channel, entry) {
  const storage =
    await textChannel(
      channel.guild,
      IDS.data,
      "Ticket data"
    );

  const content =
    STATE_PREFIX +
    JSON.stringify(entry.state);

  let message = entry.storageMessageId
    ? await storage.messages.fetch(
        entry.storageMessageId
      ).catch(() => null)
    : null;

  if (message) {
    await message.edit({
      content,

      allowedMentions: {
        parse: []
      }
    });
  } else {
    message = await storage.send({
      content,

      allowedMentions: {
        parse: []
      }
    });

    entry.storageMessageId = message.id;
  }

  cache.set(channel.id, entry);
}

// ==================================================
// INITIALIZATION
// ==================================================

async function init(guild) {
  if (initialized) {
    return;
  }

  if (initialization) {
    return initialization;
  }

  initialization = (async () => {
    const dataChannel =
      await textChannel(
        guild,
        IDS.data,
        "Ticket data"
      );

    const logChannel =
      await textChannel(
        guild,
        IDS.logs,
        "Ticket logs"
      );

    let highest = 0;

    let counterMessage = null;

    const processMessage = (
      message,
      inData
    ) => {
      if (
        message.author.id !==
        guild.client.user.id
      ) {
        return;
      }

      const state = parseState(message);

      if (state) {
        highest = Math.max(
          highest,
          state.number
        );

        const existing =
          cache.get(state.channelId);

        if (
          !existing ||
          (
            inData &&
            !existing.storageMessageId
          )
        ) {
          cache.set(state.channelId, {
            state,

            storageMessageId:
              inData ? message.id : null
          });
        }
      }

      if (
        message.content.startsWith(
          COUNTER_PREFIX
        )
      ) {
        const value = Number(
          message.content.slice(
            COUNTER_PREFIX.length
          )
        );

        if (
          Number.isSafeInteger(value) &&
          value >= 0
        ) {
          highest = Math.max(
            highest,
            value
          );

          if (inData && !counterMessage) {
            counterMessage = message;
          }
        }
      }

      if (
        !inData &&
        message.content.startsWith(
          OLD_COUNTER_PREFIX
        )
      ) {
        try {
          const old = JSON.parse(
            message.content.slice(
              OLD_COUNTER_PREFIX.length
            )
          );

          const values =
            Object.values(old)
              .map(Number)
              .filter(
                number =>
                  Number.isSafeInteger(number) &&
                  number >= 0
              );

          highest = Math.max(
            highest,
            values.reduce(
              (sum, number) =>
                sum + number,
              0
            )
          );
        } catch {
          // Ignore broken legacy counter.
        }
      }
    };

    await scan(
      dataChannel,
      message =>
        processMessage(message, true)
    );

    if (
      logChannel.id !== dataChannel.id
    ) {
      await scan(
        logChannel,
        message =>
          processMessage(message, false)
      );
    }

    await guild.channels.fetch();

    for (
      const channel of
      guild.channels.cache.values()
    ) {
      const parsed =
        parseTicketName(channel.name);

      if (parsed) {
        highest = Math.max(
          highest,
          parsed.number
        );
      }
    }

    globalCounter = highest;

    if (counterMessage) {
      counterMessageId =
        counterMessage.id;

      const value = Number(
        counterMessage.content.slice(
          COUNTER_PREFIX.length
        )
      );

      if (value < highest) {
        await counterMessage.edit({
          content:
            COUNTER_PREFIX + highest
        });
      }
    } else {
      const message =
        await dataChannel.send({
          content:
            COUNTER_PREFIX + highest,

          allowedMentions: {
            parse: []
          }
        });

      counterMessageId = message.id;
    }

    // Migrate valid old log records
    // into the existing private data channel.

    for (const [id, entry] of cache) {
      if (entry.storageMessageId) {
        continue;
      }

      const channel =
        await guild.channels.fetch(id)
          .catch(() => null);

      if (
        channel?.type ===
        ChannelType.GuildText
      ) {
        await saveState(channel, entry);
      }
    }

    initialized = true;

    console.log(
      `[TICKETS] Loaded ${cache.size} tickets.`
    );

    console.log(
      `[TICKETS] Global counter: ${globalCounter}`
    );
  })();

  try {
    await initialization;
  } finally {
    initialization = null;
  }
}

// ==================================================
// GLOBAL COUNTER
// ==================================================

async function nextNumber(guild) {
  await init(guild);

  const dataChannel =
    await textChannel(
      guild,
      IDS.data,
      "Ticket data"
    );

  const message =
    await dataChannel.messages.fetch(
      counterMessageId
    );

  const value =
    message.content.startsWith(
      COUNTER_PREFIX
    )
      ? Number(
          message.content.slice(
            COUNTER_PREFIX.length
          )
        )
      : NaN;

  globalCounter = Math.max(
    globalCounter,

    Number.isSafeInteger(value) &&
    value >= 0
      ? value
      : 0
  );

  const next = globalCounter + 1;

  await message.edit({
    content:
      COUNTER_PREFIX + next
  });

  globalCounter = next;

  return next;
}

// ==================================================
// RECOVER LEGACY TICKET TOPIC
// ==================================================

function parseLegacyTopic(channel) {
  if (!channel.topic) {
    return null;
  }

  try {
    const raw =
      channel.topic.startsWith(
        "chuppys-ticket:"
      )
        ? channel.topic.slice(
            "chuppys-ticket:".length
          )
        : channel.topic;

    const data = JSON.parse(raw);

    return normalizeState({
      ...data,
      channelId: channel.id
    });
  } catch {
    return null;
  }
}

// ==================================================
// RECOVER EXISTING TICKETS
// ==================================================
//
// FIXES:
//
// "This is not a recognized Chuppys ticket."
//
// Recovery requires an existing ticket channel
// AND a bot-created ticket welcome message.
//
// A channel name by itself is NOT enough.
//
// This prevents normal channels with similar
// names being treated as tickets.
// ==================================================

function ticketComponent(message) {
  for (const row of message.components || []) {
    for (const component of row.components || []) {
      const id = component.customId;

      if (
        id === BUTTONS.claim ||
        id === BUTTONS.close ||
        id === BUTTONS.reopen ||
        id === BUTTONS.delete ||
        (
          typeof id === "string" &&
          id.startsWith("chuppys_ticket:")
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function extractUserId(text) {
  const match = String(text || "").match(
    /<@!?(\d{17,20})>/
  );

  return match ? match[1] : null;
}

function ticketCreator(message) {
  // First check the embed's Opened by field.

  for (const embed of message.embeds || []) {
    for (const field of embed.fields || []) {
      if (
        /opened by|created by|ticket owner|ticket creator/i
          .test(field.name || "")
      ) {
        const id =
          extractUserId(field.value);

        if (id) {
          return id;
        }
      }
    }

    const description =
      embed.description || "";

    const opened = description.match(
      /(?:opened by|created by|welcome|creator)\s*:?\s*<@!?(\d{17,20})>/i
    );

    if (opened) {
      return opened[1];
    }
  }

  // New ticket messages begin with
  // the buyer mention.

  const firstMention =
    extractUserId(message.content);

  if (firstMention) {
    return firstMention;
  }

  // Older messages sometimes place the
  // opener in the embed only.

  for (const embed of message.embeds || []) {
    const id =
      extractUserId(embed.description);

    if (id) {
      return id;
    }
  }

  return null;
}

function validTicketWelcome(message, parsed, botId) {
  if (
    message.author.id !== botId ||
    !ticketComponent(message)
  ) {
    return false;
  }

  const expectedType =
    TYPES[parsed.type].name;

  const embedMatches =
    message.embeds.some(embed => {
      const title =
        String(embed.title || "");

      const footer =
        String(embed.footer?.text || "");

      const normalizedTitle =
        title.toLowerCase();

      const normalizedType =
        expectedType.toLowerCase();

      const typeMatches =
        normalizedTitle.includes(
          normalizedType
        ) ||
        (
          parsed.type === "cashout" &&
          normalizedTitle.includes("cashout")
        );

      const numberMatch =
        title.match(/#\s*0*(\d+)/);

      const numberMatches =
        numberMatch &&
        Number(numberMatch[1]) ===
          parsed.number;

      const brandMatches =
        footer.includes(BRAND) ||
        title.includes("Ticket") ||
        title.includes("ticket");

      return Boolean(
        typeMatches &&
        numberMatches &&
        brandMatches
      );
    });

  return embedMatches;
}

async function recoverExistingTicket(channel) {
  const parsed =
    parseTicketName(channel.name);

  if (!parsed) {
    return null;
  }

  let found = null;

  let before;

  // Search up to 1000 recent messages
  // for the original bot welcome message.

  for (let page = 0; page < 10; page++) {
    const batch =
      await channel.messages.fetch({
        limit: 100,

        ...(before ? { before } : {})
      });

    if (!batch.size) {
      break;
    }

    for (const message of batch.values()) {
      if (
        validTicketWelcome(
          message,
          parsed,
          channel.client.user.id
        )
      ) {
        found = message;
        break;
      }
    }

    if (found || batch.size < 100) {
      break;
    }

    before = batch.last().id;
  }

  if (!found) {
    return null;
  }

  const ownerId =
    ticketCreator(found);

  // Never guess the buyer.
  // We need the real opener to avoid
  // exposing private ticket messages.

  if (!ownerId) {
    return null;
  }

  const entry = {
    state: {
      channelId: channel.id,

      ownerId,

      type: parsed.type,

      number: parsed.number,

      status:
        parsed.closed
          ? "closed"
          : "open",

      claimedBy: null,

      controlMessageId:
        found.id,

      closeReason: "Done",

      transcriptUrl: null,

      createdAt:
        found.createdAt.toISOString()
    },

    storageMessageId: null
  };

  // Save recovered metadata
  // permanently in the existing data channel.

  await saveState(channel, entry);

  if (channel.topic) {
    await channel.setTopic(null)
      .catch(() => {});
  }

  console.log(
    `[TICKETS] Recovered existing ticket ${channel.name}`
  );

  return entry;
}

// ==================================================
// LOAD TICKET STATE
// ==================================================

async function loadState(channel) {
  if (
    !channel ||
    channel.type !==
      ChannelType.GuildText
  ) {
    return null;
  }

  await init(channel.guild);

  const cached =
    cache.get(channel.id);

  if (cached) {
    return cached;
  }

  const legacy =
    parseLegacyTopic(channel);

  if (legacy) {
    const entry = {
      state: legacy,
      storageMessageId: null
    };

    await saveState(channel, entry);

    if (channel.topic) {
      await channel.setTopic(null)
        .catch(() => {});
    }

    return entry;
  }

  return recoverExistingTicket(channel);
}

// ==================================================
// EXISTING OPEN TICKET
// ==================================================

async function existingTicket(
  guild,
  userId,
  type
) {
  await init(guild);

  for (const entry of cache.values()) {
    if (
      entry.state.ownerId !== userId ||
      entry.state.type !== type ||
      entry.state.status === "closed"
    ) {
      continue;
    }

    const channel =
      await guild.channels.fetch(
        entry.state.channelId
      ).catch(() => null);

    if (channel) {
      return channel;
    }
  }

  // Also recognize recoverable existing
  // tickets that were missing metadata.

  await guild.channels.fetch();

  for (
    const channel of
    guild.channels.cache.values()
  ) {
    if (
      channel.type !==
      ChannelType.GuildText
    ) {
      continue;
    }

    const parsed =
      parseTicketName(channel.name);

    if (
      !parsed ||
      parsed.type !== type ||
      parsed.closed
    ) {
      continue;
    }

    if (cache.has(channel.id)) {
      continue;
    }

    const entry =
      await recoverExistingTicket(channel)
        .catch(() => null);

    if (
      entry &&
      entry.state.ownerId === userId &&
      entry.state.status === "open"
    ) {
      return channel;
    }
  }

  return null;
}

// ==================================================
// PRIVATE TICKET PERMISSIONS
// ==================================================

const OPEN_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles
];

const READ_ONLY_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.ReadMessageHistory
];

function permissionEntry(id, closed) {
  return {
    id,

    allow:
      closed
        ? READ_ONLY_PERMISSIONS
        : OPEN_PERMISSIONS,

    ...(closed
      ? {
          deny: [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles
          ]
        }
      : {})
  };
}

function permissions(guild, state) {
  const closed =
    state.status === "closed";

  const overwrites = [
    {
      id: guild.roles.everyone.id,

      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },

    {
      id: guild.client.user.id,

      allow: [
        ...OPEN_PERMISSIONS,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.ManageRoles
      ]
    }
  ];

  // ==================================================
  // UNCLAIMED TICKETS
  // ==================================================

  if (!state.claimedBy) {
    for (
      const id of
      new Set(ACCESS[state.type] || [])
    ) {
      if (
        guild.roles.cache.has(id)
      ) {
        overwrites.push(
          permissionEntry(id, closed)
        );
      }
    }
  }

  // ==================================================
  // CLAIMED TICKETS
  // ==================================================
  //
  // CRITICAL:
  //
  // No seller role-wide access here.
  //
  // Instead:
  // - Ticket Support role remains allowed
  // - Buyer is explicitly allowed
  // - Owner is explicitly allowed
  // - Claimer is explicitly allowed
  //
  // Other sellers have no channel permission.
  //
  // We REMOVE the seller role overwrite,
  // rather than adding an explicit deny.
  //
  // This avoids denying Ticket Support users
  // who might also have the Seller role.
  // ==================================================

  if (state.claimedBy) {
    if (
      guild.roles.cache.has(
        IDS.support
      )
    ) {
      overwrites.push(
        permissionEntry(
          IDS.support,
          closed
        )
      );
    }
  }

  // ==================================================
  // BUYER ALWAYS RETAINS ACCESS
  // ==================================================

  overwrites.push(
    permissionEntry(
      state.ownerId,
      closed
    )
  );

  // ==================================================
  // OWNER ALWAYS RETAINS ACCESS
  // ==================================================

  if (
    IDS.owner !== state.ownerId
  ) {
    overwrites.push(
      permissionEntry(
        IDS.owner,
        closed
      )
    );
  }

  // ==================================================
  // CLAIMING SELLER RETAINS ACCESS
  // ==================================================

  if (
    state.claimedBy &&
    state.claimedBy !== state.ownerId &&
    state.claimedBy !== IDS.owner
  ) {
    overwrites.push(
      permissionEntry(
        state.claimedBy,
        closed
      )
    );
  }

  return overwrites;
}

async function applyPermissions(
  channel,
  state
) {
  await channel.permissionOverwrites.set(
    permissions(
      channel.guild,
      state
    ),

    "Chuppys private ticket permissions"
  );

  if (channel.topic) {
    await channel.setTopic(null)
      .catch(() => {});
  }
}

// ==================================================
// TICKET CATEGORY
// ==================================================

async function category(guild, type) {
  const envName =
    TYPES[type].categoryEnv;

  const configured =
    process.env[envName];

  if (configured) {
    const result =
      await guild.channels.fetch(
        configured
      );

    if (
      result?.type !==
      ChannelType.GuildCategory
    ) {
      throw new Error(
        `${envName} is not a valid category.`
      );
    }

    return result;
  }

  await guild.channels.fetch();

  return (
    guild.channels.cache.find(
      channel =>
        channel.type ===
          ChannelType.GuildCategory &&

        channel.name ===
          `chuppys-${type}`
    ) ||

    guild.channels.create({
      name: `chuppys-${type}`,

      type:
        ChannelType.GuildCategory
    })
  );
}

// ==================================================
// LOG HELPERS
// ==================================================

async function userInfo(guild, id) {
  const user = id
    ? await guild.client.users.fetch(id)
        .catch(() => null)
    : null;

  return {
    id: id || "Unknown",

    mention: id
      ? `<@${id}>`
      : "Unknown",

    username:
      user?.username || "Unknown"
  };
}

function logTicketName(state, action) {
  return ticketName(
    state.type,
    state.number,

    action === "deleted" ||
    (
      state.status === "closed" &&
      action !== "reopened"
    )
  );
}

function personDetails(label, person) {
  return (
    `**${label}:** ${person.mention}\n` +
    `**${label} Username:** ` +
    `@${safe(person.username, 100)}\n` +
    `**${label} ID:** ${person.id}`
  );
}

// ==================================================
// TICKETY-STYLE LOG EMBED
// ==================================================

async function logEmbed(
  guild,
  state,
  executorId,
  action,
  reason
) {
  const [creator, executor] =
    await Promise.all([
      userInfo(guild, state.ownerId),
      userInfo(guild, executorId)
    ]);

  const titles = {
    opened: "Ticket Created",
    claimed: "Ticket Claimed",
    closed: "Ticket Closed",
    reopened: "Ticket Reopened",
    deleted: "Ticket Deleted"
  };

  const verbs = {
    opened: "created",
    claimed: "claimed",
    closed: "closed",
    reopened: "reopened",
    deleted: "deleted"
  };

  const title =
    titles[action] || "Ticket Updated";

  const verb =
    verbs[action] || "updated";

  const name =
    logTicketName(state, action);

  const informationTitle = {
    opened: "Ticket Information",
    claimed: "Claim Information",
    closed: "Close Information",
    reopened: "Reopen Information",
    deleted: "Delete Information"
  }[action] || "Ticket Information";

  const infoLines = [
    `**Ticket Name:** ${safe(name, 100)}`,
    `**Ticket ID:** ${state.channelId}`
  ];

  if (action === "opened") {
    infoLines.push(
      `**Created At:** ${
        discordStamp(
          state.createdAt || Date.now()
        )
      }`
    );
  }

  if (
    action === "closed" ||
    action === "deleted"
  ) {
    infoLines.push(
      `**Reason:** ${
        safe(reason || "Done", 450)
      }`
    );
  }

  if (
    action === "claimed" &&
    state.claimedBy
  ) {
    infoLines.push(
      `**Claimed By:** <@${state.claimedBy}>`
    );
  }

  const embed = new EmbedBuilder()
    .setColor(LOG_COLOR)
    .setTitle(title)
    .setDescription(
      `${executor.mention} ${verb} a ticket.`
    )
    .addFields({
      name: informationTitle,

      value:
        infoLines.join("\n"),

      inline: false
    });

  if (action !== "opened") {
    embed.addFields({
      name: "Creator Information",

      value: personDetails(
        "Creator",
        creator
      ),

      inline: false
    });
  }

  embed.addFields({
    name: "Executor Information",

    value: personDetails(
      "Executor",
      executor
    ),

    inline: false
  });

  return embed
    .setFooter({
      text:
        `${BRAND} | Ticket System`
    })
    .setTimestamp();
}

// ==================================================
// SEND ACTIVITY LOG
// ==================================================

async function sendLog(
  guild,
  state,
  executorId,
  action,
  options = {}
) {
  try {
    const logChannel =
      await textChannel(
        guild,
        IDS.logs,
        "Ticket logs"
      );

    const embed =
      await logEmbed(
        guild,
        state,
        executorId,
        action,
        options.reason
      );

    const components =
      options.transcriptUrl
        ? [
            transcriptButton(
              options.transcriptUrl
            )
          ]
        : action === "deleted"
          ? []
          : [
              viewTicketButton(
                guild.id,
                state.channelId
              )
            ];

    return await logChannel.send({
      content: "",

      embeds: [embed],

      components,

      allowedMentions: {
        parse: []
      }
    });
  } catch (error) {
    console.error(
      `[TICKETS] ${action} log failed:`,
      error
    );

    return null;
  }
}

// ==================================================
// FETCH TRANSCRIPT MESSAGES
// ==================================================

async function allMessages(channel) {
  const result = [];

  let before;

  for (;;) {
    const batch =
      await channel.messages.fetch({
        limit: 100,

        ...(before ? { before } : {})
      });

    if (!batch.size) {
      break;
    }

    result.push(
      ...batch.values()
    );

    if (batch.size < 100) {
      break;
    }

    before = batch.last().id;
  }

  return result.sort(
    (a, b) =>
      a.createdTimestamp -
      b.createdTimestamp
  );
}

// ==================================================
// HTML TRANSCRIPT
// ==================================================

function transcriptHtml(
  channel,
  state,
  messages
) {
  const rows = messages.map(message => {
    const author = html(
      message.author?.username ||
      "Unknown"
    );

    const id = html(
      message.author?.id ||
      "Unknown"
    );

    const date = html(
      new Date(
        message.createdTimestamp
      ).toLocaleString(
        "en-US",
        {
          timeZone: "UTC",
          timeZoneName: "short"
        }
      )
    );

    const body = message.content
      ? (
          `<div class="body">` +
          `${html(message.content)}` +
          `</div>`
        )
      : "";

    const embeds = message.embeds
      .map(embed => {
        const fields = (
          embed.fields || []
        )
          .map(field =>
            `<p>` +
            `<strong>${html(field.name)}</strong>` +
            `<br>` +
            `${html(field.value)}` +
            `</p>`
          )
          .join("");

        return (
          `<div class="embed">` +

          `<strong>` +
          `${html(embed.title || "Embed")}` +
          `</strong>` +

          `<div class="body">` +
          `${html(embed.description || "")}` +
          `</div>` +

          `${fields}` +

          `</div>`
        );
      })
      .join("");

    const attachments = [
      ...message.attachments.values()
    ]
      .map(attachment => {
        const url = String(
          attachment.url || ""
        );

        if (
          !/^https:\/\//i.test(url)
        ) {
          return "";
        }

        return (
          `<div class="attachment">` +
          `📎 ` +

          `<a href="${html(url)}" ` +
          `target="_blank" ` +
          `rel="noopener noreferrer">` +

          `${html(
            attachment.name ||
            "Attachment"
          )}` +

          `</a></div>`
        );
      })
      .join("");

    return (
      `<article>` +

      `<div class="author">` +
      `${author} ` +

      `<small>` +
      `${id} · ${date}` +
      `</small>` +

      `</div>` +

      `${body}` +
      `${embeds}` +
      `${attachments}` +

      `</article>`
    );
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ticket #${state.number} transcript</title>
<style>
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  background: #111018;
  color: #ececf1;
  font: 15px/1.55 system-ui,-apple-system,Segoe UI,sans-serif;
}
header {
  padding: 30px max(20px,calc((100% - 850px)/2));
  background: #201e2c;
  border-bottom: 3px solid #5865f2;
}
h1 {
  margin: 0 0 8px;
  font-size: 25px;
}
.meta {
  color: #b7b5c4;
  font-size: 13px;
}
main {
  max-width: 850px;
  margin: auto;
  padding: 16px 20px 50px;
}
article {
  border-bottom: 1px solid #302d3b;
  padding: 17px 0;
}
.author {
  font-weight: 700;
  color: #fff;
}
.author small {
  font-weight: 400;
  color: #a8a5b7;
  font-size: 12px;
  margin-left: 6px;
}
.body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin-top: 5px;
}
.embed {
  border-left: 4px solid #5865f2;
  background: #23212f;
  padding: 12px 16px;
  margin-top: 9px;
  border-radius: 5px;
}
.embed p {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.attachment {
  margin-top: 7px;
}
a {
  color: #88baff;
}
</style>
</head>
<body>
<header>
<h1>${html(BRAND)} · Ticket Transcript</h1>
<div class="meta">
Ticket: ${html(channel.name)} · #${state.number} ·
${html(TYPES[state.type]?.name || state.type)}
<br>
Channel ID: ${html(channel.id)} ·
Creator ID: ${html(state.ownerId)} ·
Claimed by: ${html(state.claimedBy || "Nobody")}
<br>
Generated: ${html(new Date().toISOString())} ·
Messages: ${messages.length}
</div>
</header>
<main>
${rows || "<p>No messages.</p>"}
</main>
</body>
</html>`;
}

// ==================================================
// SAVE PRIVATE TRANSCRIPT
// ==================================================

async function saveTranscript(
  channel,
  state
) {
  const storage =
    await textChannel(
      channel.guild,
      IDS.transcripts,
      "Ticket transcripts"
    );

  const messages =
    await allMessages(channel);

  const document =
    transcriptHtml(
      channel,
      state,
      messages
    );

  const buffer =
    Buffer.from(
      document,
      "utf8"
    );

  if (
    buffer.length >
    7 * 1024 * 1024
  ) {
    throw new Error(
      "Transcript exceeds 7 MB."
    );
  }

  const filename =
    `transcript-${state.type}-` +
    `${state.number}.html`;

  const attachment =
    new AttachmentBuilder(
      buffer,
      {
        name: filename
      }
    );

  const message =
    await storage.send({
      content:
        `**Ticket Transcript**\n` +
        `Ticket: ${safe(channel.name, 100)}\n` +
        `Ticket Number: #${state.number}\n` +
        `Creator ID: ${state.ownerId}\n` +
        `Claimed By: ${state.claimedBy || "Nobody"}\n` +
        `Messages: ${messages.length}`,

      files: [attachment],

      allowedMentions: {
        parse: []
      }
    });

  return {
    url: message.url,

    messageCount:
      messages.length
  };
}

// ==================================================
// TICKET FORMS
// ==================================================

function ticketForm(type) {
  const settings =
    TYPES[type];

  const modal =
    new ModalBuilder()
      .setCustomId(
        FORM_PREFIX + type
      )
      .setTitle(
        `${settings.name} Ticket`
      );

  settings.questions.forEach(
    (question, index) => {
      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(
            new TextInputBuilder()
              .setCustomId(
                `answer_${index}`
              )
              .setLabel(
                question.slice(0, 45)
              )
              .setStyle(
                TextInputStyle.Short
              )
              .setRequired(true)
              .setMaxLength(250)
          )
      );
    }
  );

  return modal;
}

function closeModal(id) {
  return new ModalBuilder()
    .setCustomId(
      CLOSE_PREFIX + id
    )
    .setTitle("Close Ticket")
    .addComponents(
      new ActionRowBuilder()
        .addComponents(
          new TextInputBuilder()
            .setCustomId(
              "close_reason"
            )
            .setLabel(
              "Reason for closing"
            )
            .setPlaceholder(
              "No further action required."
            )
            .setStyle(
              TextInputStyle.Paragraph
            )
            .setRequired(false)
            .setMaxLength(500)
        )
    );
}

// ==================================================
// CREATE TICKET
// ==================================================

async function createTicket(
  interaction,
  type,
  answers = []
) {
  return queued(async () => {
    const guild =
      interaction.guild;

    const settings =
      TYPES[type];

    if (!settings) {
      throw new Error(
        "Invalid ticket type."
      );
    }

    const already =
      await existingTicket(
        guild,
        interaction.user.id,
        type
      );

    if (already) {
      return {
        channel: already,
        existing: true
      };
    }

    const parent =
      await category(
        guild,
        type
      );

    const number =
      await nextNumber(guild);

    const state = {
      channelId: null,

      ownerId:
        interaction.user.id,

      type,
      number,

      status: "open",

      claimedBy: null,

      controlMessageId: null,

      closeReason: "Done",

      transcriptUrl: null,

      createdAt:
        new Date().toISOString()
    };

    const channel =
      await guild.channels.create({
        name:
          ticketName(
            type,
            number
          ),

        type:
          ChannelType.GuildText,

        parent:
          parent.id,

        topic: null,

        permissionOverwrites:
          permissions(
            guild,
            state
          ),

        reason:
          `Ticket opened by ` +
          interaction.user.id
      });

    state.channelId =
      channel.id;

    const entry = {
      state,

      storageMessageId: null
    };

    await saveState(
      channel,
      entry
    );

    const details =
      settings.questions &&
      answers.length
        ? settings.questions
            .map(
              (question, index) =>
                `**${question}**\n` +
                safe(
                  answers[index],
                  250
                )
            )
            .join("\n\n")
        : settings.description;

    const pingRoles =
      PINGS[type].filter(
        id =>
          guild.roles.cache.has(id)
      );

    const welcome =
      await channel.send({
        content: [
          `<@${interaction.user.id}>`,

          ...pingRoles.map(
            id => `<@&${id}>`
          )
        ].join(" "),

        embeds: [
          ticketEmbed(
            `${EMOJI} ` +
            `${settings.name} ` +
            `Ticket #${formatNumber(number)}`,

            `Welcome <@${interaction.user.id}>!\n\n` +

            `${details}\n\n` +

            "Please wait for our team to assist you."
          )
        ],

        components:
          controls(false),

        allowedMentions: {
          parse: [],

          users: [
            interaction.user.id
          ],

          roles:
            pingRoles
        }
      });

    state.controlMessageId =
      welcome.id;

    await saveState(
      channel,
      entry
    );

    await sendLog(
      guild,
      state,
      interaction.user.id,
      "opened"
    );

    return {
      channel,
      existing: false
    };
  });
}

// ==================================================
// UPDATE BUTTONS
// ==================================================

async function updateControls(
  channel,
  state
) {
  if (!state.controlMessageId) {
    return;
  }

  const message =
    await channel.messages.fetch(
      state.controlMessageId
    ).catch(() => null);

  if (message) {
    await message.edit({
      components:
        controls(
          state.status === "closed"
        )
    });
  }
}

// ==================================================
// CLAIM TICKET
// ==================================================

async function claim(
  context,
  channel,
  entry
) {
  const state =
    entry.state;

  if (
    !canClaim(context, state)
  ) {
    return reply(
      context,
      "You do not have permission to claim this ticket."
    );
  }

  if (
    state.status === "closed"
  ) {
    return reply(
      context,
      "Reopen this ticket before claiming it."
    );
  }

  if (state.claimedBy) {
    return reply(
      context,

      state.claimedBy ===
        context.user.id
        ? "You already claimed this ticket."
        : (
            "This ticket is already claimed by " +
            `<@${state.claimedBy}>.`
          )
    );
  }

  // Save the previous state in memory
  // in case permissions fail.

  const oldClaimer =
    state.claimedBy;

  state.claimedBy =
    context.user.id;

  try {
    // Update Discord permissions FIRST.
    //
    // Other sellers immediately lose
    // role-wide channel access.

    await applyPermissions(
      channel,
      state
    );
  } catch (error) {
    state.claimedBy =
      oldClaimer;

    throw error;
  }

  await saveState(
    channel,
    entry
  );

  await channel.send({
    embeds: [
      ticketEmbed(
        `${EMOJI} Ticket Claimed`,

        `This ticket has been claimed by ` +
        `<@${context.user.id}>.\n\n` +

        "**Private Ticket Access**\n" +

        "• Ticket creator\n" +
        "• Seller who claimed\n" +
        "• Ticket Support\n" +
        "• Server Owner\n\n" +

        "Other sellers can no longer view this ticket."
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  await sendLog(
    channel.guild,
    state,
    context.user.id,
    "claimed"
  );

  return reply(
    context,
    "Ticket claimed successfully! " +
    "Other sellers can no longer view this ticket."
  );
}

// ==================================================
// CLOSE TICKET
// ==================================================

async function close(
  context,
  channel,
  entry,
  reason
) {
  const state =
    entry.state;

  if (
    state.status === "closed"
  ) {
    return reply(
      context,
      "This ticket is already closed."
    );
  }

  if (
    !canManage(context, state)
  ) {
    return reply(
      context,
      "You cannot close this ticket."
    );
  }

  // Save transcript before locking
  // the ticket.

  const transcript =
    await saveTranscript(
      channel,
      state
    );

  state.status =
    "closed";

  state.closeReason =
    reason ||
    "No further action required.";

  state.transcriptUrl =
    transcript.url;

  await applyPermissions(
    channel,
    state
  );

  await channel.setName(
    ticketName(
      state.type,
      state.number,
      true
    )
  );

  await saveState(
    channel,
    entry
  );

  await updateControls(
    channel,
    state
  );

  await channel.send({
    embeds: [
      ticketEmbed(
        `${EMOJI} Ticket Closed`,

        `Closed by <@${context.user.id}>.\n\n` +

        `**Reason:** ` +
        `${safe(state.closeReason, 450)}\n\n` +

        "This ticket is now closed.\n\n" +

        "Authorized staff can reopen or delete it."
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  await sendLog(
    channel.guild,
    state,
    context.user.id,
    "closed",

    {
      reason:
        state.closeReason,

      transcriptUrl:
        transcript.url
    }
  );

  return reply(
    context,
    "Ticket closed successfully. " +
    "HTML transcript saved. " +
    "Use ,delete to delete this ticket."
  );
}

// ==================================================
// REOPEN TICKET
// ==================================================

async function reopen(
  context,
  channel,
  entry
) {
  const state =
    entry.state;

  if (
    !canManage(context, state)
  ) {
    return reply(
      context,
      "You cannot reopen this ticket."
    );
  }

  if (
    state.status !== "closed"
  ) {
    return reply(
      context,
      "This ticket is already open."
    );
  }

  state.status =
    "open";

  // Claimed tickets remain claimed.
  // Their private permissions are preserved.

  await applyPermissions(
    channel,
    state
  );

  await channel.setName(
    ticketName(
      state.type,
      state.number
    )
  );

  await saveState(
    channel,
    entry
  );

  await updateControls(
    channel,
    state
  );

  await channel.send({
    embeds: [
      ticketEmbed(
        `${EMOJI} Ticket Reopened`,

        `Reopened by <@${context.user.id}>.`
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  await sendLog(
    channel.guild,
    state,
    context.user.id,
    "reopened"
  );

  return reply(
    context,
    "Ticket reopened successfully."
  );
}

// ==================================================
// DELETE TICKET
// ==================================================

async function removeTicket(
  context,
  channel,
  entry
) {
  const state =
    entry.state;

  if (
    !canDelete(context, state)
  ) {
    return reply(
      context,
      "You cannot delete this ticket."
    );
  }

  if (
    state.status !== "closed"
  ) {
    return reply(
      context,
      "Close the ticket first using ,close."
    );
  }

  // Save a final transcript.

  const transcript =
    await saveTranscript(
      channel,
      state
    );

  state.transcriptUrl =
    transcript.url;

  await saveState(
    channel,
    entry
  );

  // Log deletion BEFORE deleting channel.

  await sendLog(
    channel.guild,
    state,
    context.user.id,
    "deleted",

    {
      reason:
        state.closeReason,

      transcriptUrl:
        transcript.url
    }
  );

  await reply(
    context,
    "HTML transcript saved. Deleting ticket..."
  );

  await channel.delete(
    `Ticket deleted by ${context.user.id}`
  );

  cache.delete(
    channel.id
  );
}

// ==================================================
// PANEL COMMAND
// ==================================================

async function panel(interaction) {
  if (
    !isAdmin(interaction) &&

    !interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    )
  ) {
    return reply(
      interaction,
      "You need Manage Server permission."
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const channel =
    await textChannel(
      interaction.guild,
      IDS.panel,
      "Ticket panel"
    );

  const messages =
    await channel.messages.fetch({
      limit: 100
    });

  const existing =
    messages.find(
      message =>
        message.author.id ===
          interaction.client.user.id &&

        message.components.some(
          row =>
            row.components.some(
              component =>
                SELECT_IDS.has(
                  component.customId
                )
            )
        )
    );

  if (existing) {
    await existing.edit(
      panelPayload()
    );
  } else {
    await channel.send(
      panelPayload()
    );
  }

  return reply(
    interaction,

    `Ticket panel ` +

    `${
      existing
        ? "updated"
        : "posted"
    }` +

    ` in <#${IDS.panel}>.`
  );
}

// ==================================================
// TICKET SELECTION
// ==================================================

async function select(interaction) {
  const type =
    String(
      interaction.values[0] || ""
    ).toLowerCase();

  if (!TYPES[type]) {
    return reply(
      interaction,
      "Please select a valid category."
    );
  }

  if (
    TYPES[type].questions
  ) {
    return interaction.showModal(
      ticketForm(type)
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const result =
    await createTicket(
      interaction,
      type
    );

  return reply(
    interaction,

    result.existing
      ? (
          "You already have an open ticket: " +
          result.channel
        )
      : (
          `${EMOJI} Your **${TYPES[type].name}** ` +
          `ticket has been created!\n\n` +
          result.channel
        )
  );
}

// ==================================================
// PURCHASE / CASHOUT FORM
// ==================================================

async function form(interaction) {
  const type =
    interaction.customId.slice(
      FORM_PREFIX.length
    );

  if (
    !TYPES[type]?.questions
  ) {
    return reply(
      interaction,
      "Invalid ticket form."
    );
  }

  const answers =
    TYPES[type].questions.map(
      (_, index) =>
        interaction.fields.getTextInputValue(
          `answer_${index}`
        )
    );

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const result =
    await createTicket(
      interaction,
      type,
      answers
    );

  return reply(
    interaction,

    result.existing
      ? (
          "You already have an open ticket: " +
          result.channel
        )
      : (
          `${EMOJI} Your **${TYPES[type].name}** ` +
          `ticket has been created!\n\n` +
          result.channel
        )
  );
}

// ==================================================
// BUTTON ACTION DETECTION
// ==================================================

function actionFor(customId) {
  for (
    const [action, id] of
    Object.entries(BUTTONS)
  ) {
    if (
      customId === id
    ) {
      return action;
    }
  }

  if (
    customId.startsWith(
      "chuppys_ticket:"
    )
  ) {
    const legacy =
      customId.slice(
        "chuppys_ticket:".length
      );

    if (
      [
        "claim",
        "close",
        "reopen",
        "delete"
      ].includes(legacy)
    ) {
      return legacy;
    }
  }

  return null;
}

// ==================================================
// BUTTON ACTION HANDLER
// ==================================================

async function action(
  interaction,
  name
) {
  if (
    !isManager(interaction)
  ) {
    return reply(
      interaction,
      "Only authorized ticket staff can manage tickets."
    );
  }

  const channel =
    interaction.channel;

  const entry =
    await loadState(channel);

  if (!entry) {
    return reply(
      interaction,
      "This is not a recognized Chuppys ticket. " +
      "The original welcome message or ticket data " +
      "could not be verified."
    );
  }

  if (
    name === "claim" &&
    !canClaim(interaction, entry.state)
  ) {
    return reply(
      interaction,
      "You cannot claim this ticket."
    );
  }

  if (
    name !== "claim" &&
    !canManage(interaction, entry.state)
  ) {
    return reply(
      interaction,

      "Only the claimer, Ticket Support, " +
      "or owner can manage this claimed ticket."
    );
  }

  if (
    name === "close"
  ) {
    if (
      entry.state.status === "closed"
    ) {
      return reply(
        interaction,
        "This ticket is already closed."
      );
    }

    return interaction.showModal(
      closeModal(channel.id)
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return queued(async () => {
    const latest =
      await loadState(channel);

    if (!latest) {
      return reply(
        interaction,
        "Ticket data could not be found."
      );
    }

    if (
      name === "claim"
    ) {
      return claim(
        interaction,
        channel,
        latest
      );
    }

    if (
      !canManage(
        interaction,
        latest.state
      )
    ) {
      return reply(
        interaction,
        "You cannot manage this claimed ticket."
      );
    }

    if (
      name === "reopen"
    ) {
      return reopen(
        interaction,
        channel,
        latest
      );
    }

    if (
      name === "delete"
    ) {
      return removeTicket(
        interaction,
        channel,
        latest
      );
    }

    return reply(
      interaction,
      "Unknown ticket action."
    );
  });
}

// ==================================================
// CLOSE MODAL SUBMISSION
// ==================================================

async function closeForm(
  interaction
) {
  const id =
    interaction.customId.slice(
      CLOSE_PREFIX.length
    );

  if (
    id !== interaction.channelId
  ) {
    return reply(
      interaction,
      "This close form belongs to another ticket."
    );
  }

  const reason =
    interaction.fields
      .getTextInputValue(
        "close_reason"
      )
      .trim() ||

    "No further action required.";

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return queued(async () => {
    const entry =
      await loadState(
        interaction.channel
      );

    if (!entry) {
      return reply(
        interaction,
        "Ticket data could not be found."
      );
    }

    if (
      !canManage(
        interaction,
        entry.state
      )
    ) {
      return reply(
        interaction,
        "You cannot close this claimed ticket."
      );
    }

    return close(
      interaction,
      interaction.channel,
      entry,
      reason
    );
  });
}

// ==================================================
// PREFIX COMMANDS
// ==================================================
//
// ,claim
// ,close
// ,close reason here
// ,reopen
// ,delete
// ==================================================

async function handlePrefixCommand(message) {
  if (
    !message.guild ||
    message.author.bot ||
    !message.content.startsWith(
      COMMAND_PREFIX
    )
  ) {
    return;
  }

  const raw =
    message.content.slice(
      COMMAND_PREFIX.length
    ).trim();

  if (!raw) {
    return;
  }

  const space =
    raw.search(/\s/);

  const name = (
    space === -1
      ? raw
      : raw.slice(0, space)
  ).toLowerCase();

  const supported = [
    "claim",
    "close",
    "reopen",
    "delete"
  ];

  if (
    !supported.includes(name)
  ) {
    return;
  }

  const suppliedReason =
    space === -1
      ? ""
      : raw.slice(space).trim();

  const context =
    messageContext(message);

  if (
    !isManager(context)
  ) {
    return context.reply(
      "Only authorized ticket staff can use this command."
    );
  }

  const channel =
    message.channel;

  if (
    channel.type !==
    ChannelType.GuildText
  ) {
    return context.reply(
      "This command only works inside ticket channels."
    );
  }

  return queued(async () => {
    const entry =
      await loadState(channel);

    if (!entry) {
      return context.reply(
        "This is not a recognized Chuppys ticket. " +
        "The original ticket welcome message " +
        "or saved metadata could not be verified."
      );
    }

    const state =
      entry.state;

    // ==============================================
    // ,claim
    // ==============================================

    if (
      name === "claim"
    ) {
      if (
        !canClaim(context, state)
      ) {
        return context.reply(
          "You cannot claim this ticket."
        );
      }

      return claim(
        context,
        channel,
        entry
      );
    }

    // ==============================================
    // CHECK CLAIMED ACCESS
    // ==============================================

    if (
      !canManage(context, state)
    ) {
      return context.reply(
        "Only the seller who claimed this ticket, " +
        "Ticket Support, or the owner can manage it."
      );
    }

    // ==============================================
    // ,close
    // ==============================================

    if (
      name === "close"
    ) {
      if (
        state.status === "closed"
      ) {
        return context.reply(
          "This ticket is already closed. " +
          "Use ,delete to delete it."
        );
      }

      const reason =
        suppliedReason
          ? suppliedReason.slice(0, 500)
          : "No further action required.";

      return close(
        context,
        channel,
        entry,
        reason
      );
    }

    // ==============================================
    // ,reopen
    // ==============================================

    if (
      name === "reopen"
    ) {
      return reopen(
        context,
        channel,
        entry
      );
    }

    // ==============================================
    // ,delete
    // ==============================================

    if (
      name === "delete"
    ) {
      if (
        state.status !== "closed"
      ) {
        return context.reply(
          "You must close this ticket first.\n\n" +
          "Use ,close before using ,delete."
        );
      }

      return removeTicket(
        context,
        channel,
        entry
      );
    }
  });
}

// ==================================================
// LEGACY TRANSCRIPT BUTTON
// ==================================================

async function oldTranscript(
  interaction
) {
  if (
    interaction.channelId !==
    IDS.logs
  ) {
    return reply(
      interaction,
      "Transcript buttons only work in ticket logs."
    );
  }

  const allowed =
    isOwner(interaction) ||
    isAdmin(interaction) ||
    isSupport(interaction);

  if (!allowed) {
    return reply(
      interaction,
      "Only authorized ticket staff can access transcripts."
    );
  }

  const attachment =
    interaction.message.attachments.find(
      item =>
        item.name?.startsWith(
          "transcript-"
        ) &&

        (
          item.name.endsWith(".txt") ||
          item.name.endsWith(".html")
        )
    );

  return reply(
    interaction,

    attachment
      ? (
          "**View Transcript:** " +
          interaction.message.url
        )
      : (
          "This older transcript button has " +
          "no attached transcript. " +
          "Check the original log message."
        )
  );
}

// ==================================================
// INSTALL TICKET SYSTEM
// ==================================================

function setupTickets(client) {
  if (
    client.__chuppysTicketsInstalled
  ) {
    return;
  }

  client.__chuppysTicketsInstalled =
    true;

  // ================================================
  // READY
  // ================================================

  const onReady = async () => {
    try {
      if (
        !process.env.DISCORD_GUILD_ID
      ) {
        throw new Error(
          "DISCORD_GUILD_ID is missing."
        );
      }

      const guild =
        await client.guilds.fetch(
          process.env.DISCORD_GUILD_ID
        );

      await init(guild);

      console.log(
        "[TICKETS] Chuppys ticket system ready."
      );

      console.log(
        `[TICKETS] Next ticket: #${globalCounter + 1}`
      );

      console.log(
        `[TICKETS] Seller role: ${IDS.seller}`
      );

      console.log(
        `[TICKETS] Support role: ${IDS.support}`
      );

      console.log(
        `[TICKETS] Owner: ${IDS.owner}`
      );

      console.log(
        "[TICKETS] Commands: " +
        ",claim, ,close, ,reopen, ,delete"
      );
    } catch (error) {
      console.error(
        "[TICKETS] Initialization failed:",
        error
      );
    }
  };

  client.once(
    Events.ClientReady,
    onReady
  );

  // Support installation after client
  // has already become ready.

  if (client.isReady()) {
    onReady().catch(console.error);
  }

  // ================================================
  // PREFIX COMMAND LISTENER
  // ================================================

  client.on(
    Events.MessageCreate,

    async message => {
      try {
        await handlePrefixCommand(
          message
        );
      } catch (error) {
        console.error(
          "[TICKETS] Prefix command error:",
          error
        );

        if (
          message.guild &&
          message.channel?.send
        ) {
          await message.channel.send({
            content:
              "Ticket error: " +
              safe(
                error.message,
                900
              ),

            allowedMentions: {
              parse: []
            }
          }).catch(console.error);
        }
      }
    }
  );

  // ================================================
  // INTERACTION LISTENER
  // ================================================

  client.on(
    Events.InteractionCreate,

    async interaction => {
      const isPanel =
        interaction.isChatInputCommand() &&

        interaction.commandName ===
          "ticketpanel";

      const isSelect =
        interaction.isStringSelectMenu() &&

        SELECT_IDS.has(
          interaction.customId
        );

      const isForm =
        interaction.isModalSubmit() &&

        interaction.customId.startsWith(
          FORM_PREFIX
        );

      const isClose =
        interaction.isModalSubmit() &&

        interaction.customId.startsWith(
          CLOSE_PREFIX
        );

      const buttonAction =
        interaction.isButton()
          ? actionFor(
              interaction.customId
            )
          : null;

      const isLegacyTranscript =
        interaction.isButton() &&

        interaction.customId.startsWith(
          OLD_TRANSCRIPT_PREFIX
        );

      if (
        !isPanel &&
        !isSelect &&
        !isForm &&
        !isClose &&
        !buttonAction &&
        !isLegacyTranscript
      ) {
        return;
      }

      try {
        if (
          !interaction.inGuild()
        ) {
          return reply(
            interaction,
            "Tickets only work inside the server."
          );
        }

        if (isPanel) {
          return await panel(
            interaction
          );
        }

        if (isSelect) {
          return await select(
            interaction
          );
        }

        if (isForm) {
          return await form(
            interaction
          );
        }

        if (isClose) {
          return await closeForm(
            interaction
          );
        }

        if (
          isLegacyTranscript
        ) {
          return await oldTranscript(
            interaction
          );
        }

        if (buttonAction) {
          return await action(
            interaction,
            buttonAction
          );
        }
      } catch (error) {
        console.error(
          "[TICKETS] Interaction error:",
          error
        );

        await reply(
          interaction,

          "Ticket error: " +
          safe(
            error.message,
            900
          )
        ).catch(console.error);
      }
    }
  );

  console.log(
    "[TICKETS] Chuppys ticket system installed."
  );
}

// ==================================================
// EXPORTS
// ==================================================

module.exports =
  setupTickets;

module.exports.command =
  command;

// ==================================================
// END OF CHUPPYS TICKET SYSTEM
// ==================================================
