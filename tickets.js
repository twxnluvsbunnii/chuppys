"use strict";

// ============================================================
// CHUPPYS TICKET SYSTEM — DISCORD.JS V14 / RENDER
// COMPLETE TICKETS.JS
// ============================================================
//
// COMMANDS:
// ,claim
// ,forceclaim
// ,close
// ,close reason
// ,reopen
// ,delete
// ,savelog
//
// RECOVERY:
// ,recoverlogs
// ,recoverlogs 693
// ,recoverlogs 779
// ,recoverlogs 11/18/26
// ,recoverlogs 2026-11-18
//
// ARCHIVE SYSTEM:
// - Closing does not download attachments.
// - Final archive is created before deletion.
// - One organized archive thread per ticket.
// - Previously archived attachments are reused.
// - Original images are not duplicated inside HTML.
// - HTML contains links to saved original attachments.
// - Large attachments are split when necessary.
// - Failed downloads are retried.
// - No fixed combined archive size limit.
// - Failed archives do not cause ticket deletion.
// - Original ticket logs are preserved.
//
// Node.js 18+
// Discord.js v14
// No additional npm packages required.
// Run only one bot instance on Render.
//
// ============================================================

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
  PermissionFlagsBits: P,
  AttachmentBuilder,
  Events,
  MessageFlags,
  OverwriteType
} = require("discord.js");

const { createHash } = require("node:crypto");

// ============================================================
// CHANNELS AND ROLES
// ============================================================

const IDS = Object.freeze({
  panel: "1530811385678790716",
  logs: "1570913954333728808",
  transcripts: "1570913954333728808",
  data: "1571112668037644388",

  owner: "1530988662970650865",
  admin: "1531800870444994641",
  mod: "1531800784700706887",
  support: "1563003884656398406",
  seller: "1550322075208646766",
  verify: "1528716328985301052"
});

// ============================================================
// SELLERS
// ============================================================

const SELLER_USER_IDS = new Set([
  "1192248188409749684",
  "1079241163455873074",
  "1032693136163622993",
  "1320199904219496530",
  "952566845939023892",
  "1473335012769267807",
  "1472856287527309313",
  "1269188505935024141",
  "1427118849215692920",
  "1328450205774909441",
  "1475237851414401105"
]);

// ============================================================
// BRANDING
// ============================================================

const BRAND = ".gg/chuppys";

const EMOJI =
  "<:chuppyhi:1561103471325745242>";

const BUTTON_EMOJI =
  "<:uppyty:1561094713153429746>";

const BUTTON_EMOJI_OBJECT = {
  id: "1561094713153429746",
  name: "uppyty"
};

const WHITE = 0xffffff;
const EPHEMERAL = MessageFlags.Ephemeral;
const PREFIX = ",";
const NONE = { parse: [] };

// ============================================================
// ARCHIVE CONFIGURATION
// ============================================================

const HTML_PART_SIZE = 7 * 1024 * 1024;
const FILE_PART_SIZE = 9 * 1024 * 1024;

const DOWNLOAD_TIMEOUT = 120000;
const DOWNLOAD_RETRIES = 5;

const ARCHIVE_ROOT_MARKER =
  "CHUPPYS_ARCHIVE_ROOT_V4";

const ARCHIVE_FILE_MARKER =
  "CHUPPYS_ARCHIVE_FILE_V4";

const ARCHIVE_HTML_MARKER =
  "CHUPPYS_ARCHIVE_HTML_V4";

const ARCHIVE_COMPLETE_MARKER =
  "CHUPPYS_ARCHIVE_COMPLETE_V4";

const ARCHIVE_STATUS_MARKER =
  "CHUPPYS_ARCHIVE_STATUS_V4";

let recoveryRunning = false;

// ============================================================
// VERIFICATION
// ============================================================

const VERIFY_TICKET_BUTTON_ID =
  "chuppys_create_verification_ticket";

const LEGACY_SECURE_VERIFY_BUTTON_ID =
  "chuppys_secure_verification_ticket_v2";

const VERIFIED_ROLE_ID =
  "1550230619127021568";

const VERIFICATION_CATEGORY_NAME =
  "chuppys-verification";

const VERIFICATION_CATEGORY_ALIASES = [
  "chuppys-verification",
  "verification-tickets",
  "Verification tickets",
  "Verification ticket",
  "Verification",
  "Verify tickets",
  "Verify"
];

const VERIFICATION_TICKET_CATEGORY_ID =
  process.env.VERIFICATION_TICKET_CATEGORY_ID || "";

const VERIFICATION_STAFF_ROLES = [
  IDS.owner,
  IDS.admin,
  IDS.mod,
  IDS.support
];

// ============================================================
// BLACKLIST / APPEALS
// ============================================================

const UNBLACKLIST_BUTTON_ID =
  "chuppys_unblacklist_request";

const BLACKLIST_ROLE_ID =
  process.env.BLACKLIST_ROLE_ID || "";

const BLACKLIST_ROLE_NAME =
  "Blacklisted";

const UNBLACKLIST_CATEGORY_NAME =
  "chuppys-unblacklist";

const UNBLACKLIST_CATEGORY_ALIASES = [
  "chuppys-unblacklist",
  "Unblacklist tickets",
  "Unblacklist appeals",
  "Blacklist appeals"
];

const UNBLACKLIST_STAFF_ROLES = [
  IDS.owner,
  IDS.admin,
  IDS.mod
];

// ============================================================
// EXISTING METADATA
// ============================================================

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

const EMBED_STATE_KEY =
  "chuppys_state_v3";

const EMBED_COUNTER_KEY =
  "chuppys_counter_v1";

// ============================================================
// COMPONENT IDS
// ============================================================

const SELECT_ID =
  "chuppys_ticket_select";

const SELECT_IDS = new Set([
  SELECT_ID,
  "chuppys_ticket_category",
  "chuppys_tickets",
  "ticket_select",
  "ticket_category",
  "ticket_open",
  "ticket_create"
]);

const FORM_PREFIX =
  "chuppys_ticket_form:";

const CLOSE_PREFIX =
  "chuppys_ticket_close_modal:";

const BUTTONS = Object.freeze({
  claim: "chuppys_ticket_claim",
  close: "chuppys_ticket_close",
  reopen: "chuppys_ticket_reopen",
  delete: "chuppys_ticket_delete"
});

const PREFIX_COMMANDS = new Set([
  "claim",
  "forceclaim",
  "close",
  "reopen",
  "delete",
  "recoverlogs",
  "savelog"
]);

// ============================================================
// TICKET TYPES
// ============================================================

const TYPES = Object.freeze({
  purchase: {
    label: "Purchase",
    env: "PURCHASE_TICKET_CATEGORY_ID",
    categories: [
      "chuppys-purchase",
      "Purchasing tickets",
      "Purchase tickets"
    ],
    description: "Please provide your purchase details.",
    questions: [
      "What are you purchasing?",
      "Who are you buying from?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  cashout: {
    label: "Cash Out",
    env: "CASHOUT_TICKET_CATEGORY_ID",
    categories: [
      "chuppys-cashout",
      "Cashout tickets",
      "Cash Out tickets"
    ],
    description: "Please provide your cashout details.",
    questions: [
      "What are you cashing out?",
      "How much are you looking for?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  giveaway: {
    label: "Giveaway",
    env: "GIVEAWAY_TICKET_CATEGORY_ID",
    categories: [
      "chuppys-giveaway",
      "Giveaway tickets"
    ],
    description: "Please explain the giveaway you won."
  },

  partnership: {
    label: "Partnership",
    env: "PARTNERSHIP_TICKET_CATEGORY_ID",
    categories: [
      "chuppys-partnership",
      "Partnership tickets"
    ],
    description: "Please provide your partnership details.",
    questions: [
      "How many vouches?",
      "How many server members?"
    ]
  },

  support: {
    label: "Support",
    env: "SUPPORT_TICKET_CATEGORY_ID",
    categories: [
      "chuppys-support",
      "Support tickets",
      "Support ticket",
      "Support",
      "Support-tickets",
      "Help and Support"
    ],
    description: "Please explain what you need help with."
  },

  verification: {
    label: "Verification",
    env: "VERIFICATION_TICKET_CATEGORY_ID",
    categories: VERIFICATION_CATEGORY_ALIASES,
    description:
      "A member of the verification team will assist you shortly."
  },

  unblacklist: {
    label: "Unblacklist",
    env: "UNBLACKLIST_TICKET_CATEGORY_ID",
    categories: UNBLACKLIST_CATEGORY_ALIASES,
    description:
      "Please explain why your blacklist should be reviewed.",
    questions: [
      "Why were you blacklisted?",
      "Why should we remove your blacklist?"
    ]
  }
});

// ============================================================
// SLASH COMMAND
// ============================================================

const command = new SlashCommandBuilder()
  .setName("ticketpanel")
  .setDescription("Post or update the Chuppys ticket panel")
  .setDefaultMemberPermissions(P.ManageGuild);

// ============================================================
// RUNTIME STORAGE
// ============================================================

const tickets = new Map();
const ticketQueues = new Map();
const categoryJobs = new Map();
const archiveJobs = new Map();

let initialization = null;
let initialized = false;

let globalCounter = 0;
let counterMessageId = null;

let creationQueue = Promise.resolve();

// ============================================================
// QUEUES
// ============================================================

function queued(task) {
  const next = creationQueue.then(task);
  creationQueue = next.catch(() => {});
  return next;
}

function queuedTicket(id, task) {
  const previous =
    ticketQueues.get(id) || Promise.resolve();

  const next = previous.then(task);
  const settled = next.catch(() => {});

  ticketQueues.set(id, settled);

  void settled.finally(() => {
    if (ticketQueues.get(id) === settled) {
      ticketQueues.delete(id);
    }
  });

  return next;
}

// ============================================================
// HELPERS
// ============================================================

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function hash(value) {
  return createHash("sha256")
    .update(value)
    .digest("hex");
}

function safe(value, max = 900) {
  return String(value ?? "")
    .replace(/@/g, "＠")
    .replace(/```/g, "'''")
    .slice(0, max);
}

function escapeHtml(value) {
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

function safeFilename(value) {
  return String(value || "attachment")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(0, 120) || "attachment";
}

function numberText(number) {
  return String(number).padStart(4, "0");
}

function ticketName(type, number, closed = false) {
  return (
    `${closed ? "closed-" : ""}` +
    `${type}-${numberText(number)}`
  ).slice(0, 100);
}

function normalizeCategoryName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseTicketName(name) {
  const match = String(name || "").match(
    /^(closed-)?(purchase|purchasing|cashout|cash-out|giveaway|partnership|support|verification|unblacklist)-(\d+)$/i
  );

  if (!match) return null;

  let type = match[2].toLowerCase();

  if (type === "purchasing") type = "purchase";
  if (type === "cash-out") type = "cashout";

  const number = Number(match[3]);

  if (
    !TYPES[type] ||
    !Number.isSafeInteger(number) ||
    number < 1
  ) {
    return null;
  }

  return {
    type,
    number,
    closed: Boolean(match[1])
  };
}

function whiteEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(WHITE)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: BRAND });
}

async function textChannel(guild, id, label) {
  const channel =
    guild.channels.cache.get(id) ||
    await guild.channels.fetch(id);

  if (
    !channel?.isTextBased() ||
    !channel.messages?.fetch ||
    !channel.send ||
    channel.guild?.id !== guild.id
  ) {
    throw new Error(
      `${label} channel unavailable: ${id}`
    );
  }

  return channel;
}

function footerText(message) {
  return message.embeds
    .map(embed => embed.footer?.text || "")
    .join("\n");
}

function messageUrl(guildId, channelId, messageId) {
  return (
    `https://discord.com/channels/` +
    `${guildId}/${channelId}/${messageId}`
  );
}

async function getMember(context) {
  if (!context.guild || !context.user?.id) {
    throw new Error("Could not identify server member.");
  }

  return context.guild.members.fetch({
    user: context.user.id,
    force: true
  });
}

// ============================================================
// BLACKLIST
// ============================================================

async function findBlacklistRole(guild) {
  if (BLACKLIST_ROLE_ID) {
    const configured =
      guild.roles.cache.get(BLACKLIST_ROLE_ID) ||
      await guild.roles.fetch(BLACKLIST_ROLE_ID)
        .catch(() => null);

    if (configured) return configured;
  }

  const cached = guild.roles.cache.find(
    role =>
      role.name.toLowerCase() ===
      BLACKLIST_ROLE_NAME.toLowerCase()
  );

  if (cached) return cached;

  await guild.roles.fetch();

  return guild.roles.cache.find(
    role =>
      role.name.toLowerCase() ===
      BLACKLIST_ROLE_NAME.toLowerCase()
  ) || null;
}

async function isBlacklisted(member) {
  if (!member?.guild) return false;

  const role = await findBlacklistRole(member.guild);

  return Boolean(
    role && member.roles.cache.has(role.id)
  );
}

// ============================================================
// ROLE HELPERS
// ============================================================

function hasRole(member, id) {
  return Boolean(member?.roles?.cache?.has(id));
}

function isOwner(member) {
  return Boolean(
    member &&
    (
      member.id === member.guild.ownerId ||
      hasRole(member, IDS.owner)
    )
  );
}

function isAdmin(member) {
  return hasRole(member, IDS.admin);
}

function isMod(member) {
  return hasRole(member, IDS.mod);
}

function isSupport(member) {
  return hasRole(member, IDS.support);
}

function isSeller(member) {
  return hasRole(member, IDS.seller);
}

function isVerificationStaff(member) {
  return (
    isOwner(member) ||
    isAdmin(member) ||
    isMod(member) ||
    isSupport(member)
  );
}

function isAppealStaff(member) {
  return (
    isOwner(member) ||
    isAdmin(member) ||
    isMod(member)
  );
}

function isTradingTicket(state) {
  return (
    state.type === "purchase" ||
    state.type === "cashout"
  );
}

function isVerificationTicket(state) {
  return state.type === "verification";
}

function isAppealTicket(state) {
  return state.type === "unblacklist";
}

// ============================================================
// MANAGEMENT PERMISSIONS
// ============================================================

function canClaim(member, state) {
  if (isAppealTicket(state)) {
    return isAppealStaff(member);
  }

  if (isVerificationTicket(state)) {
    return isVerificationStaff(member);
  }

  if (isOwner(member)) return true;

  if (isTradingTicket(state)) {
    return (
      isSeller(member) ||
      isSupport(member) ||
      isMod(member) ||
      isAdmin(member)
    );
  }

  return (
    isSupport(member) ||
    isMod(member) ||
    isAdmin(member)
  );
}

function canManage(member, state) {
  if (isAppealTicket(state)) {
    return isAppealStaff(member);
  }

  if (isVerificationTicket(state)) {
    return isVerificationStaff(member);
  }

  if (isOwner(member) || isSupport(member)) {
    return true;
  }

  if (state.claimedBy === member.id) {
    return true;
  }

  if (isTradingTicket(state) && state.claimedBy) {
    return false;
  }

  return canClaim(member, state);
}

function canDelete(member, state) {
  return (
    state.status === "closed" &&
    canManage(member, state)
  );
}

// ============================================================
// RESPONSES
// ============================================================

async function reply(context, content) {
  if (context.kind === "prefix") {
    return context.message.reply({
      content,
      allowedMentions: {
        parse: [],
        repliedUser: false
      }
    });
  }

  if (context.deferred) {
    return context.editReply({
      content,
      allowedMentions: NONE
    });
  }

  if (context.replied) {
    return context.followUp({
      content,
      flags: EPHEMERAL,
      allowedMentions: NONE
    });
  }

  return context.reply({
    content,
    flags: EPHEMERAL,
    allowedMentions: NONE
  });
}

function messageContext(message) {
  return {
    kind: "prefix",
    message,
    guild: message.guild,
    channel: message.channel,
    user: message.author,
    member: message.member
  };
}

async function archiveNotice(context, channel, description) {
  if (context.kind !== "prefix") {
    await reply(context, description).catch(() => {});
  }

  return channel.send({
    embeds: [
      whiteEmbed(
        "Ticket Archive",
        description
      ).setFooter({
        text: `${BRAND} • ${ARCHIVE_STATUS_MARKER}`
      })
    ],
    allowedMentions: NONE
  });
}

async function editArchiveNotice(message, title, description) {
  if (!message) return;

  await message.edit({
    embeds: [
      whiteEmbed(title, description)
        .setFooter({
          text: `${BRAND} • ${ARCHIVE_STATUS_MARKER}`
        })
    ],
    allowedMentions: NONE
  }).catch(console.error);
}

// ============================================================
// METADATA
// ============================================================

function normalizeState(data) {
  if (
    !data?.channelId ||
    !data?.ownerId ||
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
      data.status === "closed" ? "closed" : "open",

    claimedBy:
      data.claimedBy ? String(data.claimedBy) : null,

    controlMessageId:
      data.controlMessageId || null,

    closeControlMessageId:
      data.closeControlMessageId || null,

    closeReason:
      String(
        data.closeReason ||
        "No further action required."
      ).slice(0, 500),

    transcriptUrl:
      data.transcriptUrl || null,

    archiveRootId:
      data.archiveRootId || null,

    archiveThreadId:
      data.archiveThreadId || null,

    createdAt:
      data.createdAt || null
  };
}

function encodeStateMetadata(state) {
  return Buffer.from(
    JSON.stringify(state),
    "utf8"
  ).toString("base64url");
}

function decodeStateMetadata(value) {
  try {
    return normalizeState(
      JSON.parse(
        Buffer.from(value, "base64url")
          .toString("utf8")
      )
    );
  } catch {
    return null;
  }
}

function metadataUrl(guildId, state) {
  const compact = {
    ...state
  };

  let url =
    `https://discord.com/channels/${guildId}/${state.channelId}` +
    `?${EMBED_STATE_KEY}=${encodeStateMetadata(compact)}`;

  // Avoid Discord's embed URL length limit.
  // Full close reason is still saved in an embed field.

  if (url.length > 2048) {
    compact.closeReason = "";

    url =
      `https://discord.com/channels/${guildId}/${state.channelId}` +
      `?${EMBED_STATE_KEY}=${encodeStateMetadata(compact)}`;
  }

  if (url.length > 2048) {
    throw new Error("Ticket metadata is too large.");
  }

  return url;
}

function readEmbedParameter(embed, key) {
  if (!embed?.url) return null;

  try {
    const url = new URL(embed.url);

    if (url.hostname !== "discord.com") {
      return null;
    }

    return url.searchParams.get(key);
  } catch {
    return null;
  }
}

function parseState(message) {
  const content = message.content || "";

  const prefix = [
    STATE_PREFIX,
    ...LEGACY_PREFIXES
  ].find(value => content.startsWith(value));

  if (prefix) {
    try {
      const parsed = normalizeState(
        JSON.parse(content.slice(prefix.length))
      );

      if (parsed) return parsed;
    } catch {
      // Try embedded metadata.
    }
  }

  for (const embed of message.embeds || []) {
    const encoded = readEmbedParameter(
      embed,
      EMBED_STATE_KEY
    );

    if (!encoded) continue;

    const state = decodeStateMetadata(encoded);

    if (!state) continue;

    const reason = embed.fields?.find(
      field => field.name === "Close Reason"
    );

    if (reason?.value) {
      state.closeReason = reason.value;
    }

    return state;
  }

  return null;
}

// ============================================================
// COUNTER
// ============================================================

function parseCounter(message) {
  const content = message.content || "";

  if (content.startsWith(COUNTER_PREFIX)) {
    const number = Number(
      content.slice(COUNTER_PREFIX.length)
    );

    if (Number.isSafeInteger(number) && number >= 0) {
      return number;
    }
  }

  for (const embed of message.embeds || []) {
    const encoded = readEmbedParameter(
      embed,
      EMBED_COUNTER_KEY
    );

    if (encoded !== null) {
      const number = Number(encoded);

      if (Number.isSafeInteger(number) && number >= 0) {
        return number;
      }
    }

    if (embed.title === "Chuppys Global Ticket Counter") {
      const match = String(
        embed.description || ""
      ).match(
        /Total Tickets Created:\*\*\s*`?(\d+)`?/i
      );

      if (match) return Number(match[1]);
    }
  }

  return null;
}

function counterPayload(number, guildId) {
  return {
    content: "",
    embeds: [
      whiteEmbed(
        "Chuppys Global Ticket Counter",

        `**Total Tickets Created:** \`${number}\`\n\n` +
        `**Next Ticket Number:** \`${numberText(number + 1)}\`\n\n` +
        "Ticket numbering is preserved across restarts."
      ).setURL(
        `https://discord.com/channels/${guildId}/${IDS.data}` +
        `?${EMBED_COUNTER_KEY}=${number}`
      )
    ],
    allowedMentions: NONE
  };
}

// ============================================================
// STORAGE EMBED
// ============================================================

function storagePayload(state, guildId) {
  const label = TYPES[state.type].label;

  return {
    content: "",

    embeds: [
      whiteEmbed(
        `Ticket #${numberText(state.number)} • ${label}`,

        `**Status:** ${state.status}\n\n` +
        `**Ticket:** <#${state.channelId}>\n` +
        `**Creator:** <@${state.ownerId}>\n` +
        `**Claimed By:** ${
          state.claimedBy
            ? `<@${state.claimedBy}>`
            : "Not claimed"
        }`
      )
        .setURL(metadataUrl(guildId, state))
        .addFields(
          {
            name: "Ticket Information",
            value:
              `**Category:** ${label}\n` +
              `**Number:** ${numberText(state.number)}\n` +
              `**Channel ID:** \`${state.channelId}\``
          },
          {
            name: "Close Reason",
            value: state.closeReason.slice(0, 500)
          },
          {
            name: "Archive",
            value: state.transcriptUrl
              ? `[View Archive](${state.transcriptUrl})`
              : "Not archived yet."
          },
          {
            name: "Archive Thread",
            value: state.archiveThreadId
              ? `<#${state.archiveThreadId}>`
              : "Not created."
          },
          {
            name: "Control Messages",
            value:
              `Opening: ${state.controlMessageId || "None"}\n` +
              `Closed: ${state.closeControlMessageId || "None"}`
          }
        )
        .setFooter({
          text: `${BRAND} • Private Ticket Storage`
        })
    ],

    allowedMentions: NONE
  };
}

// ============================================================
// UNLIMITED MESSAGE SCANNING
// ============================================================

async function scan(channel, callback, pages = Infinity) {
  let before;

  for (let page = 0; page < pages; page++) {
    const batch = await channel.messages.fetch({
      limit: 100,
      cache: false,
      ...(before ? { before } : {})
    });

    if (!batch.size) return;

    for (const message of batch.values()) {
      await callback(message);
    }

    if (batch.size < 100) return;

    const next = batch.last().id;

    if (next === before) return;

    before = next;
  }
}

async function allMessages(channel) {
  const messages = [];

  await scan(
    channel,
    message => messages.push(message)
  );

  return messages.sort(
    (a, b) =>
      a.createdTimestamp - b.createdTimestamp ||
      (
        BigInt(a.id) < BigInt(b.id) ? -1 : 1
      )
  );
}

// ============================================================
// SAVE TICKET STATE
// ============================================================

async function saveState(channel, entry) {
  const storage = await textChannel(
    channel.guild,
    IDS.data,
    "Ticket data"
  );

  const payload = storagePayload(
    entry.state,
    channel.guild.id
  );

  let message = null;

  if (entry.storageMessageId) {
    try {
      message = await storage.messages.edit(
        entry.storageMessageId,
        payload
      );

    } catch (error) {
      if (
        error.code !== 10008 &&
        error.rawError?.code !== 10008
      ) {
        throw error;
      }
    }
  }

  if (!message) {
    message = await storage.send(payload);
    entry.storageMessageId = message.id;
  }

  tickets.set(channel.id, entry);

  return message;
}

// ============================================================
// INITIALIZATION
// ============================================================

async function init(guild) {
  if (initialized) return;

  if (initialization) return initialization;

  initialization = (async () => {
    const data = await textChannel(
      guild,
      IDS.data,
      "Ticket data"
    );

    let highest = 0;
    let counterMessage = null;

    await scan(data, message => {
      if (message.author.id !== guild.client.user.id) {
        return;
      }

      const state = parseState(message);

      if (state) {
        highest = Math.max(highest, state.number);

        if (!tickets.has(state.channelId)) {
          tickets.set(state.channelId, {
            state,
            storageMessageId: message.id
          });
        }
      }

      const counter = parseCounter(message);

      if (
        counter !== null &&
        Number.isSafeInteger(counter)
      ) {
        highest = Math.max(highest, counter);

        if (!counterMessage) {
          counterMessage = message;
        }
      }

      if (message.content.startsWith(OLD_COUNTER_PREFIX)) {
        try {
          const old = JSON.parse(
            message.content.slice(
              OLD_COUNTER_PREFIX.length
            )
          );

          const total = Object.values(old)
            .map(Number)
            .filter(Number.isSafeInteger)
            .reduce((sum, value) => sum + value, 0);

          highest = Math.max(highest, total);
        } catch {
          // Ignore invalid legacy counters.
        }
      }
    });

    // Scan old logs if no saved counter exists.

    if (!counterMessage) {
      const logs = await textChannel(
        guild,
        IDS.logs,
        "Ticket logs"
      );

      await scan(logs, message => {
        if (message.author.id !== guild.client.user.id) {
          return;
        }

        const state = parseState(message);

        if (state) {
          highest = Math.max(highest, state.number);

          if (!tickets.has(state.channelId)) {
            tickets.set(state.channelId, {
              state,
              storageMessageId: null
            });
          }
        }

        for (const embed of message.embeds) {
          const match = String(
            embed.description || ""
          ).match(
            /\*\*Number:\*\*\s*#?0*(\d+)/i
          );

          if (match) {
            highest = Math.max(
              highest,
              Number(match[1])
            );
          }
        }
      });
    }

    await guild.channels.fetch();
    await guild.roles.fetch();

    for (const channel of guild.channels.cache.values()) {
      const parsed = parseTicketName(channel.name);

      if (parsed) {
        highest = Math.max(highest, parsed.number);
      }
    }

    globalCounter = highest;

    if (counterMessage) {
      counterMessageId = counterMessage.id;

      await counterMessage.edit(
        counterPayload(highest, guild.id)
      );
    } else {
      const message = await data.send(
        counterPayload(highest, guild.id)
      );

      counterMessageId = message.id;
    }

    initialized = true;

    console.log(
      `[TICKETS] Loaded ${tickets.size} records.`
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

// ============================================================
// GLOBAL NUMBERING
// ============================================================

async function nextNumber(guild) {
  await init(guild);

  const data = await textChannel(
    guild,
    IDS.data,
    "Ticket data"
  );

  let message = counterMessageId
    ? await data.messages.fetch(counterMessageId)
        .catch(() => null)
    : null;

  if (!message) {
    message = await data.send(
      counterPayload(globalCounter, guild.id)
    );

    counterMessageId = message.id;
  }

  const stored = parseCounter(message);

  if (stored !== null) {
    globalCounter = Math.max(
      globalCounter,
      stored
    );
  }

  const next = globalCounter + 1;

  await message.edit(
    counterPayload(next, guild.id)
  );

  globalCounter = next;

  return next;
}

// ============================================================
// LEGACY TICKET RECOVERY
// ============================================================

function fromTopic(channel) {
  if (!channel.topic) return null;

  try {
    const raw = channel.topic.startsWith(
      "chuppys-ticket:"
    )
      ? channel.topic.slice(
          "chuppys-ticket:".length
        )
      : channel.topic;

    return normalizeState({
      ...JSON.parse(raw),
      channelId: channel.id
    });

  } catch {
    return null;
  }
}

function validWelcome(message, parsed, botId) {
  if (message.author.id !== botId) {
    return false;
  }

  const validTitle = message.embeds.some(embed => {
    const title = String(
      embed.title || ""
    ).toLowerCase();

    const match = title.match(/#\s*0*(\d+)/);

    if (!match || Number(match[1]) !== parsed.number) {
      return false;
    }

    return (
      title.includes(
        TYPES[parsed.type].label.toLowerCase()
      ) ||
      (
        parsed.type === "cashout" &&
        title.includes("cashout")
      )
    );
  });

  return validTitle;
}

function extractOwner(message) {
  for (const embed of message.embeds) {
    const match = String(
      embed.description || ""
    ).match(
      /(?:welcome|opened by|created by|creator)\s*:?\s*<@!?(\d{17,20})>/i
    );

    if (match) return match[1];
  }

  return String(message.content || "")
    .match(/<@!?(\d{17,20})>/)?.[1] || null;
}

async function recoverTicket(channel) {
  const parsed = parseTicketName(channel.name);

  if (!parsed) return null;

  const messages = await allMessages(channel);

  const opening = messages.find(message =>
    validWelcome(
      message,
      parsed,
      channel.client.user.id
    )
  );

  if (!opening) return null;

  const ownerId = extractOwner(opening);

  if (!ownerId) return null;

  let claimedBy = null;
  let closeControlMessageId = null;
  let closeReason = "No further action required.";

  for (const message of messages) {
    if (message.author.id !== channel.client.user.id) {
      continue;
    }

    for (const embed of message.embeds) {
      if (embed.title === "Ticket Claimed") {
        const match = String(
          embed.description || ""
        ).match(/Claimed by <@!?(\d{17,20})>/i);

        if (match) claimedBy = match[1];
      }

      if (embed.title === "Ticket Closed") {
        closeControlMessageId = message.id;

        const match = String(
          embed.description || ""
        ).match(/\*\*Reason:\*\*\s*([^\n]+)/i);

        if (match) closeReason = match[1];
      }
    }
  }

  const entry = {
    state: normalizeState({
      channelId: channel.id,
      ownerId,
      type: parsed.type,
      number: parsed.number,
      status: parsed.closed ? "closed" : "open",
      claimedBy,
      controlMessageId: opening.id,
      closeControlMessageId,
      closeReason,
      transcriptUrl: null,
      createdAt: opening.createdAt.toISOString()
    }),

    storageMessageId: null
  };

  await saveState(channel, entry);

  return entry;
}

async function loadState(channel) {
  if (channel?.type !== ChannelType.GuildText) {
    return null;
  }

  // Storage initialization is shared by all commands.

  await init(channel.guild);

  if (tickets.has(channel.id)) {
    return tickets.get(channel.id);
  }

  const legacy = fromTopic(channel);

  if (legacy) {
    const entry = {
      state: legacy,
      storageMessageId: null
    };

    await saveState(channel, entry);

    return entry;
  }

  return recoverTicket(channel);
}

// ============================================================
// DUPLICATE TICKET PREVENTION
// ============================================================

async function existingTicket(guild, userId, type) {
  await init(guild);

  for (const entry of tickets.values()) {
    const state = entry.state;

    if (
      state.ownerId !== userId ||
      state.type !== type ||
      state.status !== "open"
    ) {
      continue;
    }

    const channel =
      guild.channels.cache.get(state.channelId) ||
      await guild.channels.fetch(state.channelId)
        .catch(() => null);

    if (channel) return channel;
  }

  for (const channel of guild.channels.cache.values()) {
    if (
      channel.type !== ChannelType.GuildText ||
      tickets.has(channel.id)
    ) {
      continue;
    }

    const parsed = parseTicketName(channel.name);

    if (
      !parsed ||
      parsed.closed ||
      parsed.type !== type
    ) {
      continue;
    }

    const entry = await recoverTicket(channel)
      .catch(() => null);

    if (
      entry?.state.ownerId === userId &&
      entry.state.status === "open"
    ) {
      return channel;
    }
  }

  return null;
}

// ============================================================
// CHANNEL PERMISSIONS
// ============================================================

const FULL = [
  P.ViewChannel,
  P.SendMessages,
  P.ReadMessageHistory,
  P.AttachFiles,
  P.EmbedLinks
];

const READ_ONLY = [
  P.ViewChannel,
  P.ReadMessageHistory
];

const WRITE_PERMISSIONS = [
  P.SendMessages,
  P.AttachFiles,
  P.SendMessagesInThreads,
  P.CreatePublicThreads,
  P.CreatePrivateThreads
];

const BOT_PERMISSIONS = [
  ...FULL,
  P.ManageChannels,
  P.ManageMessages,
  P.ManageRoles
];

// ============================================================
// CATEGORY LOOKUP
// ============================================================

async function category(guild, type) {
  if (!TYPES[type]) {
    throw new Error("Invalid ticket type.");
  }

  const key = `${guild.id}:${type}`;

  if (categoryJobs.has(key)) {
    return categoryJobs.get(key);
  }

  const job = (async () => {
    const config = TYPES[type];

    await guild.channels.fetch();

    const configuredId =
      process.env[config.env];

    if (configuredId) {
      const configured =
        guild.channels.cache.get(configuredId) ||
        await guild.channels.fetch(configuredId)
          .catch(() => null);

      if (
        configured?.type !== ChannelType.GuildCategory
      ) {
        throw new Error(
          `Invalid category configured: ${config.env}`
        );
      }

      return configured;
    }

    const categories = [
      ...guild.channels.cache.values()
    ].filter(
      channel =>
        channel.type === ChannelType.GuildCategory
    );

    for (const alias of config.categories) {
      const found = categories.find(
        channel =>
          normalizeCategoryName(channel.name) ===
          normalizeCategoryName(alias)
      );

      if (found) return found;
    }

    if (type === "support") {
      const found = categories.find(
        channel =>
          channel.name.toLowerCase()
            .includes("support")
      );

      if (found) return found;
    }

    if (
      type !== "verification" &&
      type !== "unblacklist"
    ) {
      throw new Error(
        `Could not find the ${config.label} category. ` +
        `Check ${config.env} in Render.`
      );
    }

    const staffRoles =
      type === "verification"
        ? VERIFICATION_STAFF_ROLES
        : UNBLACKLIST_STAFF_ROLES;

    const overwrites = [
      {
        id: guild.roles.everyone.id,
        type: OverwriteType.Role,
        deny: [P.ViewChannel]
      },
      {
        id: guild.client.user.id,
        type: OverwriteType.Member,
        allow: BOT_PERMISSIONS
      }
    ];

    for (const id of staffRoles) {
      if (!guild.roles.cache.has(id)) continue;

      overwrites.push({
        id,
        type: OverwriteType.Role,
        allow: FULL
      });
    }

    return guild.channels.create({
      name:
        type === "verification"
          ? VERIFICATION_CATEGORY_NAME
          : UNBLACKLIST_CATEGORY_NAME,

      type: ChannelType.GuildCategory,
      permissionOverwrites: overwrites,
      reason: `Chuppys private ${type} category`
    });
  })();

  categoryJobs.set(key, job);

  try {
    return await job;
  } finally {
    categoryJobs.delete(key);
  }
}

// ============================================================
// TICKET PERMISSIONS
// ============================================================
//
// FIX:
// Closed tickets remain writable by authorized staff.
// Ticket creator becomes read-only.
// Staff can still type ,delete, ,savelog and ,reopen.
//
// ============================================================

async function permissions(guild, state) {
  const closed = state.status === "closed";

  const claimedTrading =
    isTradingTicket(state) &&
    Boolean(state.claimedBy);

  const result = new Map();

  function add(entry) {
    result.set(entry.id, entry);
  }

  function allowRole(id) {
    if (!guild.roles.cache.has(id)) return;

    add({
      id,
      type: OverwriteType.Role,
      allow: FULL,
      deny: []
    });
  }

  function allowMember(id, readOnly = false) {
    if (!id) return;

    add({
      id,
      type: OverwriteType.Member,

      allow: readOnly ? READ_ONLY : FULL,

      deny: readOnly ? WRITE_PERMISSIONS : []
    });
  }

  add({
    id: guild.roles.everyone.id,
    type: OverwriteType.Role,

    deny: [
      P.ViewChannel,
      ...WRITE_PERMISSIONS
    ],

    allow: []
  });

  if (isVerificationTicket(state)) {
    for (const id of VERIFICATION_STAFF_ROLES) {
      allowRole(id);
    }

  } else if (isAppealTicket(state)) {
    for (const id of UNBLACKLIST_STAFF_ROLES) {
      allowRole(id);
    }

  } else {
    allowRole(IDS.owner);
    allowRole(IDS.support);

    if (!claimedTrading) {
      allowRole(IDS.admin);
      allowRole(IDS.mod);
    }

    if (isTradingTicket(state) && !state.claimedBy) {
      allowRole(IDS.seller);
    }

    if (
      claimedTrading &&
      guild.roles.cache.has(IDS.seller)
    ) {
      add({
        id: IDS.seller,
        type: OverwriteType.Role,

        allow: [],

        deny: [
          P.ViewChannel,
          P.SendMessages,
          P.ReadMessageHistory,
          P.AttachFiles
        ]
      });
    }
  }

  allowMember(state.ownerId, closed);
  allowMember(state.claimedBy);
  allowMember(guild.ownerId);

  add({
    id: guild.client.user.id,
    type: OverwriteType.Member,
    allow: BOT_PERMISSIONS,
    deny: []
  });

  return [...result.values()];
}

// ============================================================
// VERIFY PRIVATE PERMISSIONS
// ============================================================

async function checkPrivacy(channel, state) {
  const fresh = await channel.guild.channels.fetch(
    channel.id,
    { force: true }
  );

  const overwrites =
    fresh?.permissionOverwrites?.cache;

  if (!overwrites) {
    throw new Error(
      "Could not verify ticket permissions."
    );
  }

  if (
    !overwrites.get(channel.guild.roles.everyone.id)
      ?.deny.has(P.ViewChannel)
  ) {
    throw new Error(
      "Ticket privacy failed: @everyone is not hidden."
    );
  }

  if (
    !overwrites.get(state.ownerId)
      ?.allow.has(P.ViewChannel)
  ) {
    throw new Error(
      "Ticket creator does not have access."
    );
  }

  if (
    state.claimedBy &&
    !overwrites.get(state.claimedBy)
      ?.allow.has(P.ViewChannel)
  ) {
    throw new Error(
      "Ticket claimer does not have access."
    );
  }

  let allowedRoles = null;

  if (isVerificationTicket(state)) {
    allowedRoles = new Set(
      VERIFICATION_STAFF_ROLES
    );
  }

  if (isAppealTicket(state)) {
    allowedRoles = new Set(
      UNBLACKLIST_STAFF_ROLES
    );
  }

  if (
    isTradingTicket(state) &&
    state.claimedBy
  ) {
    allowedRoles = new Set([
      IDS.owner,
      IDS.support
    ]);

    if (
      channel.guild.roles.cache.has(IDS.seller) &&
      !overwrites.get(IDS.seller)
        ?.deny.has(P.ViewChannel)
    ) {
      throw new Error(
        "Claimed ticket seller privacy failed."
      );
    }
  }

  if (!allowedRoles) return;

  const allowedMembers = new Set([
    state.ownerId,
    state.claimedBy,
    channel.guild.ownerId,
    channel.guild.client.user.id
  ].filter(Boolean));

  for (const overwrite of overwrites.values()) {
    if (!overwrite.allow.has(P.ViewChannel)) {
      continue;
    }

    if (
      overwrite.type === OverwriteType.Role &&
      !allowedRoles.has(overwrite.id)
    ) {
      throw new Error(
        `Unexpected ticket role: ${overwrite.id}`
      );
    }

    if (
      overwrite.type === OverwriteType.Member &&
      !allowedMembers.has(overwrite.id)
    ) {
      throw new Error(
        `Unexpected ticket member: ${overwrite.id}`
      );
    }
  }
}

async function applyPermissions(channel, state) {
  await channel.permissionOverwrites.set(
    await permissions(channel.guild, state),
    "Chuppys ticket permissions"
  );

  await checkPrivacy(channel, state);
}

// ============================================================
// BUTTONS
// ============================================================

function ticketButton(action, label, style, disabled = false) {
  return new ButtonBuilder()
    .setCustomId(BUTTONS[action])
    .setLabel(label)
    .setEmoji(BUTTON_EMOJI_OBJECT)
    .setStyle(style)
    .setDisabled(disabled);
}

function controls(state) {
  if (state.status === "closed") {
    return [];
  }

  return [
    new ActionRowBuilder().addComponents(
      ticketButton(
        "claim",
        state.claimedBy ? "Claimed" : "Claim",
        ButtonStyle.Primary,
        Boolean(state.claimedBy)
      ),

      ticketButton(
        "close",
        "Close",
        ButtonStyle.Danger
      )
    )
  ];
}

function closedControls() {
  return [
    new ActionRowBuilder().addComponents(
      ticketButton(
        "reopen",
        "Reopen",
        ButtonStyle.Success
      ),

      ticketButton(
        "delete",
        "Delete",
        ButtonStyle.Danger
      )
    )
  ];
}

// ============================================================
// TICKET PANEL
// ============================================================

function panelPayload() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(SELECT_ID)
    .setPlaceholder("Select a ticket category")
    .addOptions(
      Object.entries(TYPES)
        .filter(
          ([type]) =>
            type !== "verification" &&
            type !== "unblacklist"
        )
        .map(
          ([value, config]) => ({
            label: config.label,
            value,
            description:
              `Open a ${config.label} ticket`
          })
        )
    );

  return {
    embeds: [
      whiteEmbed(
        `${EMOJI} Chuppys Tickets`,

        "Welcome to Chuppys!\n\n" +
        "Select the category you need below.\n\n" +
        "**Purchase** — Purchase assistance\n" +
        "**Cash Out** — Cashout assistance\n" +
        "**Giveaway** — Giveaway claims\n" +
        "**Partnership** — Partnerships\n" +
        "**Support** — General support"
      )
    ],

    components: [
      new ActionRowBuilder().addComponents(menu)
    ],

    allowedMentions: NONE
  };
}

// ============================================================
// UPDATE CONTROLS
// ============================================================

async function updateControls(channel, state) {
  if (!state.controlMessageId) return;

  await channel.messages.edit(
    state.controlMessageId,
    {
      components: controls(state)
    }
  ).catch(error => {
    console.warn(
      "[TICKETS] Opening controls:",
      error.message
    );
  });
}

async function clearClosedControls(channel, state) {
  if (!state.closeControlMessageId) return;

  await channel.messages.edit(
    state.closeControlMessageId,
    { components: [] }
  ).catch(() => {});
}

async function findClosedMessage(channel) {
  let found = null;

  await scan(channel, message => {
    if (
      !found &&
      message.author.id === channel.client.user.id &&
      message.embeds.some(
        embed => embed.title === "Ticket Closed"
      )
    ) {
      found = message;
    }
  });

  return found;
}

async function ensureClosedControls(channel, entry) {
  const state = entry.state;

  let message = state.closeControlMessageId
    ? await channel.messages.fetch(
        state.closeControlMessageId
      ).catch(() => null)
    : null;

  if (!message) {
    message = await findClosedMessage(channel);
  }

  if (!message) {
    message = await channel.send({
      embeds: [
        whiteEmbed(
          "Ticket Closed",

          `**Reason:** ${safe(state.closeReason, 500)}\n\n` +
          "This ticket is closed.\n\n" +
          "The final archive will be saved before deletion."
        )
      ],

      components: closedControls(),
      allowedMentions: NONE
    });

  } else {
    await message.edit({
      components: closedControls()
    });
  }

  if (state.closeControlMessageId !== message.id) {
    state.closeControlMessageId = message.id;
    await saveState(channel, entry);
  }

  return message;
}

// ============================================================
// RESTORE EXISTING TICKETS
// ============================================================

async function syncExistingTickets(guild) {
  await init(guild);
  await guild.channels.fetch();

  for (const channel of guild.channels.cache.values()) {
    if (channel.type !== ChannelType.GuildText) {
      continue;
    }

    if (
      !parseTicketName(channel.name) &&
      !tickets.has(channel.id)
    ) {
      continue;
    }

    try {
      await queuedTicket(channel.id, async () => {
        const entry = await loadState(channel);

        if (!entry) return;

        // Restore stored permissions.
        // Do not automatically archive or move tickets.

        await applyPermissions(
          channel,
          entry.state
        );

        await updateControls(
          channel,
          entry.state
        );

        if (entry.state.status === "closed") {
          await ensureClosedControls(
            channel,
            entry
          );
        }

        const expectedName = ticketName(
          entry.state.type,
          entry.state.number,
          entry.state.status === "closed"
        );

        if (channel.name !== expectedName) {
          await channel.setName(
            expectedName
          ).catch(console.error);
        }
      });

    } catch (error) {
      console.error(
        `[TICKETS] Restore ${channel.name}:`,
        error.message
      );
    }
  }
}

// ============================================================
// PRIVATE LOG CHANNEL VALIDATION
// ============================================================

async function validateArchiveChannel(guild, channel) {
  if (
    channel.id !== IDS.logs ||
    channel.guild?.id !== guild.id ||
    channel.type !== ChannelType.GuildText
  ) {
    throw new Error(
      "Invalid ticket logs destination."
    );
  }

  const fresh = await guild.channels.fetch(
    channel.id,
    { force: true }
  );

  const overwrites =
    fresh?.permissionOverwrites?.cache;

  if (!overwrites) {
    throw new Error(
      "Could not verify ticket logs privacy."
    );
  }

  const everyone = overwrites.get(
    guild.roles.everyone.id
  );

  if (!everyone?.deny.has(P.ViewChannel)) {
    throw new Error(
      "Ticket logs must deny View Channel to @everyone."
    );
  }

  const allowedRoles = new Set([
    IDS.owner,
    IDS.admin
  ]);

  const allowedMembers = new Set([
    guild.ownerId,
    guild.client.user.id
  ]);

  for (const overwrite of overwrites.values()) {
    if (!overwrite.allow.has(P.ViewChannel)) {
      continue;
    }

    if (
      overwrite.type === OverwriteType.Role &&
      !allowedRoles.has(overwrite.id)
    ) {
      throw new Error(
        `Unexpected role has ticket logs access: ${overwrite.id}`
      );
    }

    if (
      overwrite.type === OverwriteType.Member &&
      !allowedMembers.has(overwrite.id)
    ) {
      throw new Error(
        "Unexpected member has ticket logs access."
      );
    }
  }

  const bot = fresh.permissionsFor(
    guild.client.user.id
  );

  if (!bot?.has([
    P.ViewChannel,
    P.SendMessages,
    P.ReadMessageHistory,
    P.AttachFiles,
    P.EmbedLinks,
    P.CreatePublicThreads,
    P.SendMessagesInThreads,
    P.ManageThreads
  ])) {
    throw new Error(
      "Bot needs View Channel, Send Messages, " +
      "Read Message History, Attach Files, Embed Links, " +
      "Create Public Threads, Send Messages in Threads " +
      "and Manage Threads in ticket logs."
    );
  }

  return fresh;
}

// ============================================================
// DISCORD ATTACHMENT URL VALIDATION
// ============================================================

function discordAttachmentUrl(value) {
  try {
    const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      ![
        "cdn.discordapp.com",
        "media.discordapp.net"
      ].includes(url.hostname) ||
      !/^\/attachments\/\d+\/\d+\//.test(url.pathname)
    ) {
      return null;
    }

    return url;

  } catch {
    return null;
  }
}

function originalCdnUrl(value) {
  const url = discordAttachmentUrl(value);

  if (!url) return null;

  url.hostname = "cdn.discordapp.com";

  // Remove image resizing and format conversion parameters.
  // Preserve signed URL parameters.

  for (const key of [
    "width",
    "height",
    "format",
    "quality"
  ]) {
    url.searchParams.delete(key);
  }

  return url.href;
}

// ============================================================
// DOWNLOAD FILE
// ============================================================

async function downloadTranscriptFile(value) {
  const url = discordAttachmentUrl(value);

  if (!url) {
    throw new Error(
      "Invalid Discord attachment URL."
    );
  }

  const response = await fetch(url.href, {
    redirect: "error",

    headers: {
      "Accept": "*/*",
      "Accept-Encoding": "identity"
    },

    signal: AbortSignal.timeout(
      DOWNLOAD_TIMEOUT
    )
  });

  if (!response.ok) {
    await response.body?.cancel()
      .catch(() => {});

    throw new Error(
      `Attachment HTTP ${response.status}`
    );
  }

  if (!response.body) {
    throw new Error(
      "Attachment response was empty."
    );
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of response.body) {
    const part = Buffer.from(chunk);

    chunks.push(part);
    size += part.length;
  }

  const lengthHeader =
    response.headers.get("content-length");

  const encoding =
    response.headers.get("content-encoding");

  if (
    lengthHeader !== null &&
    (!encoding || encoding === "identity")
  ) {
    const expected = Number(lengthHeader);

    if (
      Number.isFinite(expected) &&
      expected !== size
    ) {
      throw new Error(
        `Incomplete HTTP download: expected ${expected}, received ${size}`
      );
    }
  }

  return Buffer.concat(chunks, size);
}

// ============================================================
// IMAGE VALIDATION
// ============================================================

function imageMime(buffer) {
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(
      Buffer.from([
        137, 80, 78, 71,
        13, 10, 26, 10
      ])
    )
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 3 &&
    buffer[0] === 255 &&
    buffer[1] === 216 &&
    buffer[2] === 255
  ) {
    return "image/jpeg";
  }

  const signature =
    buffer.subarray(0, 6).toString();

  if (
    signature === "GIF87a" ||
    signature === "GIF89a"
  ) {
    return "image/gif";
  }

  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString() === "RIFF" &&
    buffer.subarray(8, 12).toString() === "WEBP"
  ) {
    return "image/webp";
  }

  return null;
}

function imageExtension(mime) {
  return ({
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/gif": "gif",
    "image/webp": "webp"
  })[mime] || "bin";
}

// ============================================================
// ORIGINAL ATTACHMENT DOWNLOAD WITH RETRIES
// ============================================================
//
// FIX:
// - Refresh the Discord message.
// - Obtain a fresh signed attachment URL.
// - Prefer original CDN bytes.
// - Retry temporary failures.
// - Keep original file size validation.
// - Never silently archive a truncated image.
//
// ============================================================

async function downloadMessageAttachment(message, file) {
  let lastError = null;

  for (
    let attempt = 1;
    attempt <= DOWNLOAD_RETRIES;
    attempt++
  ) {
    try {
      let current = file;

      if (attempt > 1) {
        const fresh = await message.channel.messages.fetch({
          message: message.id,
          force: true,
          cache: false
        });

        current = fresh.attachments.get(file.id);

        if (!current) {
          throw new Error(
            "Attachment no longer exists on the original message."
          );
        }
      }

      const urls = [
        originalCdnUrl(current.url),
        current.url
      ].filter(Boolean);

      for (const url of [...new Set(urls)]) {
        try {
          const buffer =
            await downloadTranscriptFile(url);

          if (
            Number.isFinite(current.size) &&
            buffer.length !== current.size
          ) {
            throw new Error(
              `Expected ${current.size} bytes, ` +
              `received ${buffer.length} bytes`
            );
          }

          if (
            !buffer.length &&
            current.size !== 0
          ) {
            throw new Error(
              "Downloaded file was empty."
            );
          }

          return buffer;

        } catch (error) {
          lastError = error;
        }
      }

    } catch (error) {
      lastError = error;
    }

    console.warn(
      `[ARCHIVE] ${file.name}: ` +
      `attempt ${attempt}/${DOWNLOAD_RETRIES}: ` +
      `${lastError?.message || "Download failed"}`
    );

    if (attempt < DOWNLOAD_RETRIES) {
      await sleep(
        Math.min(1500 * attempt, 8000)
      );
    }
  }

  throw new Error(
    `Could not preserve ${file.name || file.id}: ` +
    `${lastError?.message || "Download failed"}`
  );
}

// ============================================================
// ARCHIVE ROOT EMBED
// ============================================================

function archiveRootPayload(state, complete = null) {
  let description =
    `**Number:** #${numberText(state.number)}\n` +
    `**Type:** ${TYPES[state.type]?.label || state.type}\n` +
    `**Creator:** ${
      state.ownerId
        ? `<@${state.ownerId}>`
        : "Historical ticket"
    }\n` +
    `**Claimed By:** ${
      state.claimedBy
        ? `<@${state.claimedBy}>`
        : "Not claimed"
    }\n\n` +
    `**Close Reason**\n${safe(state.closeReason, 500)}\n\n`;

  if (complete) {
    description +=
      "**Archive Status:** Complete\n" +
      `**Messages:** ${complete.messages}\n` +
      `**Attachments:** ${complete.attachments}\n` +
      `**Images:** ${complete.images}\n` +
      `**Transcript Parts:** ${complete.parts}\n\n` +
      `[Open Complete Archive](${complete.url})`;

  } else {
    description +=
      "**Archive Status:** Pending / In Progress\n\n" +
      "All saved files are organized in the attached archive thread.";
  }

  return {
    content: "",

    embeds: [
      whiteEmbed(
        `Ticket #${numberText(state.number)} — ` +
        `${TYPES[state.type]?.label || state.type}`,

        description
      )
        .setFooter({
          text:
            `${BRAND} • ${ARCHIVE_ROOT_MARKER}:${state.channelId}`
        })
        .setTimestamp()
    ],

    allowedMentions: NONE
  };
}

// ============================================================
// FIND EXISTING ARCHIVE ROOT
// ============================================================

async function findArchiveRoot(logs, state) {
  if (state.archiveRootId) {
    const existing = await logs.messages.fetch(
      state.archiveRootId
    ).catch(() => null);

    if (
      existing?.author.id === logs.client.user.id &&
      footerText(existing).includes(
        `${ARCHIVE_ROOT_MARKER}:${state.channelId}`
      )
    ) {
      return existing;
    }
  }

  let root = null;

  await scan(logs, message => {
    if (
      !root &&
      message.author.id === logs.client.user.id &&
      footerText(message).includes(
        `${ARCHIVE_ROOT_MARKER}:${state.channelId}`
      )
    ) {
      root = message;
    }
  });

  return root;
}

// ============================================================
// CREATE OR REUSE ARCHIVE THREAD
// ============================================================

async function getArchiveThread(
  logs,
  state,
  persist = null
) {
  let root = await findArchiveRoot(
    logs,
    state
  );

  if (!root) {
    root = await logs.send(
      archiveRootPayload(state)
    );
  }

  state.archiveRootId = root.id;

  if (persist) {
    await persist();
  }

  let thread =
    root.thread ||
    await logs.guild.channels.fetch(
      state.archiveThreadId || root.id
    ).catch(() => null);

  if (thread && !thread.isThread()) {
    thread = null;
  }

  if (!thread) {
    thread = await root.startThread({
      name:
        `ticket-${numberText(state.number)}-${state.type}`,

      autoArchiveDuration: 1440,

      reason:
        `Organized archive for ticket #${state.number}`
    });
  }

  if (
    !thread.isThread() ||
    thread.parentId !== logs.id
  ) {
    throw new Error(
      "Invalid archive thread."
    );
  }

  if (thread.locked) {
    await thread.setLocked(false);
  }

  if (thread.archived) {
    await thread.setArchived(false);
  }

  state.archiveThreadId = thread.id;

  if (persist) {
    await persist();
  }

  return {
    root,
    thread
  };
}

// ============================================================
// DISCOVER EXISTING ARCHIVED FILES
// ============================================================
//
// Supports new archives and ordinary attachments saved
// by your previous tickets.js.
//
// Previously saved original files are reused rather than
// uploaded again.
//
// ============================================================

async function buildArchiveCatalog(logs, thread, state) {
  const catalog = {
    files: new Map(),
    hashes: new Map(),
    parts: new Map(),
    html: new Map(),
    completed: new Map()
  };

  function inspect(message, inThread) {
    if (
      message.author.id !== logs.client.user.id
    ) {
      return;
    }

    const footer = footerText(message);

    const fileMarker = footer.match(
      /CHUPPYS_ARCHIVE_FILE_V4:([^:]+):([a-f0-9]{64}):(\d+):(\d+):(\d+)/
    );

    if (fileMarker && inThread) {
      const [
        ,
        id,
        checksum,
        partText,
        totalText,
        bytesText
      ] = fileMarker;

      const part = Number(partText);
      const total = Number(totalText);
      const originalBytes = Number(bytesText);

      const attachment =
        message.attachments.first();

      if (!attachment) return;

      const expectedSize = Math.min(
        FILE_PART_SIZE,

        Math.max(
          0,
          originalBytes -
          (part - 1) * FILE_PART_SIZE
        )
      );

      if (
        part < 1 ||
        part > total ||
        total < 1 ||
        attachment.size !== expectedSize
      ) {
        return;
      }

      const key =
        `${id}:${checksum}:${total}:${originalBytes}`;

      if (!catalog.parts.has(key)) {
        catalog.parts.set(key, {
          id,
          checksum,
          total,
          size: originalBytes,
          messages: new Map()
        });
      }

      const record = catalog.parts.get(key);

      record.messages.set(
        part,
        message.url
      );

      return;
    }

    const htmlMarker = footer.match(
      /CHUPPYS_ARCHIVE_HTML_V4:([a-f0-9]{64}):(\d+):([a-f0-9]{64})/
    );

    if (
      inThread &&
      htmlMarker &&
      message.attachments.size
    ) {
      const [, snapshot, part, checksum] =
        htmlMarker;

      catalog.html.set(
        `${snapshot}:${part}:${checksum}`,
        message.url
      );
    }

    const completeMarker = footer.match(
      /CHUPPYS_ARCHIVE_COMPLETE_V4:([a-f0-9]{64})/
    );

    if (inThread && completeMarker) {
      const key = completeMarker[1];

      if (!catalog.completed.has(key)) {
        catalog.completed.set(key, message);
      }
    }

    // Reuse original files from previous ticket logs.

    if (!inThread) {
      for (const embed of message.embeds) {
        if (
          embed.title !== "Archived Ticket Attachment" &&
          embed.title !== "Recovered Ticket Image"
        ) {
          continue;
        }

        const ticketMatch = String(
          embed.description || ""
        ).match(
          /\*\*Ticket:\*\*\s*#?0*(\d+)/i
        );

        if (
          !ticketMatch ||
          Number(ticketMatch[1]) !== state.number
        ) {
          continue;
        }

        const idMatch = String(
          embed.footer?.text || ""
        ).match(
          /Attachment ID: ([a-zA-Z0-9_-]+)/
        );

        const attachment =
          message.attachments.first();

        if (!idMatch || !attachment) {
          continue;
        }

        const id = idMatch[1];

        if (!catalog.files.has(id)) {
          catalog.files.set(id, {
            id,
            name: attachment.name,
            size: attachment.size,
            urls: [message.url],
            split: false,
            legacy: true,
            message,
            attachment
          });
        }
      }
    }
  }

  await scan(
    thread,
    message => inspect(message, true)
  );

  await scan(
    logs,
    message => inspect(message, false)
  );

  for (const record of catalog.parts.values()) {
    if (record.messages.size !== record.total) {
      continue;
    }

    const urls = [];

    for (
      let part = 1;
      part <= record.total;
      part++
    ) {
      urls.push(record.messages.get(part));
    }

    const complete = {
      id: record.id,
      checksum: record.checksum,
      size: record.size,
      urls,
      split: record.total > 1
    };

    catalog.files.set(
      record.id,
      complete
    );

    catalog.hashes.set(
      record.checksum,
      complete
    );
  }

  return catalog;
}

// ============================================================
// ARCHIVE ORIGINAL FILE ONCE
// ============================================================

async function archiveOriginalFile(
  thread,
  catalog,
  state,
  buffer,
  originalName,
  originalId
) {
  const id = String(originalId);

  const checksum = hash(buffer);

  const known = catalog.files.get(id);

  if (
    known &&
    known.size === buffer.length &&
    (
      known.checksum === checksum ||
      known.legacy
    )
  ) {
    return {
      ...known,
      name: originalName
    };
  }

  // Deduplicate identical files within the same ticket.

  const sameBytes = catalog.hashes.get(
    checksum
  );

  if (sameBytes) {
    const record = {
      ...sameBytes,
      id,
      name: originalName
    };

    catalog.files.set(id, record);

    return record;
  }

  const mime = imageMime(buffer);

  let filename = safeFilename(
    originalName
  );

  if (
    mime &&
    !/\.(png|jpe?g|gif|webp)$/i.test(filename)
  ) {
    filename += `.${imageExtension(mime)}`;
  }

  const total = Math.max(
    1,
    Math.ceil(
      buffer.length / FILE_PART_SIZE
    )
  );

  const key =
    `${id}:${checksum}:${total}:${buffer.length}`;

  let partial = catalog.parts.get(key);

  if (!partial) {
    partial = {
      id,
      checksum,
      total,
      size: buffer.length,
      messages: new Map()
    };

    catalog.parts.set(key, partial);
  }

  for (
    let part = 1;
    part <= total;
    part++
  ) {
    // Resume a partially completed upload.

    if (partial.messages.has(part)) {
      continue;
    }

    const bytes = buffer.subarray(
      (part - 1) * FILE_PART_SIZE,
      part * FILE_PART_SIZE
    );

    const uploadName =
      total === 1
        ? filename
        : `${filename}.part${String(part).padStart(5, "0")}`;

    const description =
      `**File:** ${safe(originalName, 200)}\n` +
      `**Size:** ${buffer.length.toLocaleString()} bytes\n` +
      "**Quality:** Original" +

      (
        total > 1
          ? `\n**Part:** ${part}/${total}\n\n` +
            "Join all parts in numerical order to restore the file."
          : ""
      );

    const message = await thread.send({
      embeds: [
        whiteEmbed(
          total > 1
            ? "Attachment Part"
            : "Saved Attachment",

          description
        ).setFooter({
          text:
            `${ARCHIVE_FILE_MARKER}:${id}:${checksum}:` +
            `${part}:${total}:${buffer.length}`
        })
      ],

      files: [
        new AttachmentBuilder(bytes, {
          name: uploadName
        })
      ],

      allowedMentions: NONE
    });

    const uploaded =
      message.attachments.first();

    if (
      !uploaded ||
      uploaded.size !== bytes.length
    ) {
      throw new Error(
        `Upload verification failed: ${filename}, part ${part}`
      );
    }

    partial.messages.set(
      part,
      message.url
    );
  }

  const urls = [];

  for (
    let part = 1;
    part <= total;
    part++
  ) {
    const url = partial.messages.get(part);

    if (!url) {
      throw new Error(
        `Missing archived attachment part ${part}`
      );
    }

    urls.push(url);
  }

  const record = {
    id,
    name: originalName,
    mime,
    size: buffer.length,
    checksum,
    urls,
    split: total > 1
  };

  catalog.files.set(id, record);
  catalog.hashes.set(checksum, record);

  console.log(
    `[ARCHIVE] Ticket ${state.number}: ` +
    `${filename} saved once.`
  );

  return record;
}

// ============================================================
// REUSE OR DOWNLOAD ATTACHMENT
// ============================================================

async function preserveAttachment(
  thread,
  catalog,
  state,
  message,
  file
) {
  const existing =
    catalog.files.get(file.id);

  if (
    existing &&
    existing.size === file.size &&
    existing.urls.length
  ) {
    // New-format files were verified when uploaded.
    // Legacy files receive an extra download check.

    if (existing.legacy) {
      try {
        const buffer = await downloadMessageAttachment(
          existing.message,
          existing.attachment
        );

        if (buffer.length !== file.size) {
          throw new Error(
            "Legacy archive size mismatch."
          );
        }

        existing.checksum = hash(buffer);

        catalog.hashes.set(
          existing.checksum,
          existing
        );

      } catch {
        catalog.files.delete(file.id);

        const buffer =
          await downloadMessageAttachment(
            message,
            file
          );

        return archiveOriginalFile(
          thread,
          catalog,
          state,
          buffer,
          file.name || "attachment",
          file.id
        );
      }
    }

    return {
      ...existing,
      name: file.name || "attachment"
    };
  }

  const buffer =
    await downloadMessageAttachment(
      message,
      file
    );

  return archiveOriginalFile(
    thread,
    catalog,
    state,
    buffer,
    file.name || "attachment",
    file.id
  );
}

// ============================================================
// HTML TRANSCRIPT TEMPLATE
// ============================================================
//
// Images exist once as original Discord attachments.
// HTML links to the archived message.
// No duplicate base64 image copies.
//
// ============================================================

function transcriptDocument(title, rows, part) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none';">
<title>Chuppys Ticket Transcript</title>
<style>
* {
  box-sizing: border-box;
}
body {
  background: #17161e;
  color: #eeeeee;
  font: 15px/1.6 system-ui, sans-serif;
  max-width: 900px;
  margin: auto;
  padding: 24px;
}
header {
  border-bottom: 1px solid #45434f;
  margin-bottom: 20px;
  padding-bottom: 18px;
}
h1 {
  font-size: 25px;
  margin: 0;
}
article {
  border-bottom: 1px solid #35333f;
  padding: 18px 0;
}
.author {
  font-weight: 700;
}
small {
  color: #b0adbd;
}
.body {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  margin-top: 8px;
}
blockquote {
  margin: 12px 0;
  border-left: 3px solid #ffffff;
  background: #25232e;
  padding: 12px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.attachment {
  border: 1px solid #45434f;
  border-radius: 8px;
  padding: 12px;
  margin: 10px 0;
  background: #211f2a;
  overflow-wrap: anywhere;
}
a {
  color: #aaccff;
}
</style>
</head>
<body>
<header>
<h1>${escapeHtml(BRAND)}</h1>
<h2>Ticket Transcript</h2>
<p>${escapeHtml(title)}</p>
<p>Part ${part}</p>
<p>All attachments are saved in the ticket archive.</p>
</header>
${rows.join("\n")}
</body>
</html>`;
}

// ============================================================
// MULTIPART HTML WRITER
// ============================================================

function createTranscriptWriter(
  thread,
  catalog,
  state,
  snapshot
) {
  let rows = [];
  let bytes = 0;
  let part = 0;

  const urls = [];

  async function flush() {
    if (!rows.length) return;

    part++;

    const html = transcriptDocument(
      `${state.type}-${numberText(state.number)}`,
      rows,
      part
    );

    const buffer = Buffer.from(
      html,
      "utf8"
    );

    if (buffer.length > HTML_PART_SIZE) {
      throw new Error(
        "Transcript part exceeds its upload limit."
      );
    }

    const checksum = hash(buffer);

    const key =
      `${snapshot}:${part}:${checksum}`;

    let url = catalog.html.get(key);

    if (!url) {
      const message = await thread.send({
        embeds: [
          whiteEmbed(
            "Ticket Transcript",

            `**Ticket:** #${numberText(state.number)}\n` +
            `**Part:** ${part}\n\n` +
            "Download the HTML file to read the ticket."
          ).setFooter({
            text:
              `${ARCHIVE_HTML_MARKER}:${snapshot}:${part}:${checksum}`
          })
        ],

        files: [
          new AttachmentBuilder(buffer, {
            name:
              `transcript-${state.type}-` +
              `${state.number}-part-${part}.html`
          })
        ],

        allowedMentions: NONE
      });

      const uploaded =
        message.attachments.first();

      if (
        !uploaded ||
        uploaded.size !== buffer.length
      ) {
        throw new Error(
          `Transcript part ${part} was not saved correctly.`
        );
      }

      url = message.url;

      catalog.html.set(key, url);
    }

    urls.push(url);

    rows = [];
    bytes = 0;
  }

  async function add(row) {
    const value = String(row);

    const size =
      Buffer.byteLength(value, "utf8");

    const max =
      HTML_PART_SIZE - 65536;

    if (size > max) {
      const characters = Array.from(value);

      for (
        let offset = 0;
        offset < characters.length;
        offset += 100000
      ) {
        await add(
          "<article><div class=\"body\">" +
          escapeHtml(
            characters
              .slice(offset, offset + 100000)
              .join("")
          ) +
          "</div></article>"
        );
      }

      return;
    }

    if (
      rows.length &&
      bytes + size + 1 > max
    ) {
      await flush();
    }

    rows.push(value);
    bytes += size + 1;
  }

  async function finish() {
    if (!rows.length && !part) {
      await add(
        "<article>No messages available.</article>"
      );
    }

    await flush();

    return {
      parts: part,
      urls
    };
  }

  return {
    add,
    finish
  };
}

// ============================================================
// HTML MESSAGE DISPLAY
// ============================================================

function messageHtml(message) {
  const author = escapeHtml(
    message.author?.username || "Unknown"
  );

  const authorId = escapeHtml(
    message.author?.id || ""
  );

  const date = escapeHtml(
    new Date(
      message.createdTimestamp
    ).toISOString()
  );

  const embeds = message.embeds.map(embed => {
    const fields = (embed.fields || [])
      .map(field =>
        `<p><strong>${escapeHtml(field.name)}</strong>: ` +
        `${escapeHtml(field.value)}</p>`
      ).join("");

    return (
      "<blockquote>" +
      `<b>${escapeHtml(embed.title || "Embed")}</b>` +
      `<p>${escapeHtml(embed.description || "")}</p>` +
      fields +
      "</blockquote>"
    );
  }).join("");

  const stickers = [
    ...(message.stickers?.values?.() || [])
  ].map(sticker =>
    `<p>Sticker: ${escapeHtml(sticker.name)}</p>`
  ).join("");

  return (
    "<article>" +

    `<span class="author">${author}</span> ` +

    `<small>${date} • ${authorId}</small>` +

    `<div class="body">${escapeHtml(message.content || "")}</div>` +

    embeds +

    stickers +

    "</article>"
  );
}

function archiveLinkHtml(record) {
  const links = record.urls.map(
    (url, index) =>
      `<p><a href="${escapeHtml(url)}">` +

      (
        record.split
          ? `Open original file part ${index + 1}`
          : "Open original attachment"
      ) +

      "</a></p>"
  ).join("");

  return (
    '<div class="attachment">' +

    `<strong>${escapeHtml(record.name)}</strong>` +

    `<p>Original size: ${record.size.toLocaleString()} bytes</p>` +

    links +

    (
      record.split
        ? "<p>Join all file parts in numerical order.</p>"
        : ""
    ) +

    "</div>"
  );
}

// ============================================================
// EXCLUDE ARCHIVE COMMAND SPAM
// ============================================================

function shouldArchiveMessage(message) {
  // Preserve user conversations and actual ticket content.
  // Exclude archive commands and bot progress notices.

  if (
    !message.author.bot &&
    /^,(?:delete|savelog)(?:\s|$)/i.test(
      message.content.trim()
    ) &&
    !message.attachments.size
  ) {
    return false;
  }

  if (
    message.author.id === message.client.user.id
  ) {
    if (
      footerText(message).includes(
        ARCHIVE_STATUS_MARKER
      )
    ) {
      return false;
    }

    const content =
      String(message.content || "");

    if (
      /^(?:Saving all ticket messages|Saving the ticket messages|Ticket archive could not be completed|Deletion cancelled because|Ticket #\d+ saved successfully)/i
        .test(content) &&
      !message.attachments.size
    ) {
      return false;
    }

    if (
      message.embeds.some(
        embed =>
          embed.title === "Transcript Not Saved"
      ) &&
      !message.attachments.size
    ) {
      return false;
    }
  }

  return true;
}

// ============================================================
// ARCHIVE SNAPSHOT
// ============================================================

function snapshotHash(messages, state) {
  const digest = createHash("sha256");

  digest.update(
    JSON.stringify({
      channelId: state.channelId,
      status: state.status,
      reason: state.closeReason
    })
  );

  for (const message of messages) {
    digest.update(
      JSON.stringify({
        id: message.id,

        content: message.content,

        edited:
          message.editedTimestamp || null,

        embeds:
          message.embeds.map(embed => ({
            title: embed.title || "",
            description: embed.description || "",
            fields: embed.fields || []
          })),

        attachments:
          [...message.attachments.values()]
            .map(file => ({
              id: file.id,
              name: file.name,
              size: file.size
            }))
      })
    );
  }

  return digest.digest("hex");
}

// ============================================================
// PARSE COMPLETED ARCHIVE
// ============================================================

async function completedArchive(message) {
  if (!message) return null;

  const manifest = message.attachments.find(
    file =>
      file.name?.endsWith("-manifest.json")
  );

  if (!manifest) return null;

  try {
    const buffer =
      await downloadMessageAttachment(
        message,
        manifest
      );

    const result = JSON.parse(
      buffer.toString("utf8")
    );

    if (
      !Array.isArray(result.transcriptUrls) ||
      !Array.isArray(result.files)
    ) {
      return null;
    }

    return {
      ...result,
      url: message.url
    };

  } catch {
    return null;
  }
}

// ============================================================
// VERIFY ARCHIVE MESSAGE REFERENCES
// ============================================================

async function archiveReferenceExists(guild, url) {
  try {
    const parsed = new URL(url);

    if (parsed.hostname !== "discord.com") {
      return false;
    }

    const parts = parsed.pathname.split("/");

    const guildId = parts[2];
    const channelId = parts[3];
    const messageId = parts[4];

    if (guildId !== guild.id) {
      return false;
    }

    const channel = await guild.channels.fetch(
      channelId
    );

    if (
      channelId !== IDS.logs &&
      channel?.parentId !== IDS.logs
    ) {
      return false;
    }

    const message = await channel.messages.fetch({
      message: messageId,
      force: true,
      cache: false
    });

    return Boolean(
      message.author.id === guild.client.user.id &&
      message.attachments.size
    );

  } catch {
    return false;
  }
}

async function verifyCompletedArchive(guild, archive) {
  const urls = new Set([
    ...archive.transcriptUrls,

    ...archive.files.flatMap(
      file => file.urls || []
    )
  ]);

  for (const url of urls) {
    if (
      !(await archiveReferenceExists(guild, url))
    ) {
      return false;
    }
  }

  return true;
}

// ============================================================
// SAVE FINAL ARCHIVE MANIFEST
// ============================================================

async function saveArchiveManifest(
  thread,
  state,
  snapshot,
  result
) {
  const manifest = {
    version: 4,
    ticket: state.number,
    channelId: state.channelId,
    type: state.type,
    creator: state.ownerId,
    claimedBy: state.claimedBy,
    closeReason: state.closeReason,
    snapshot,
    savedAt: new Date().toISOString(),

    messages: result.messages,
    attachments: result.attachments,
    images: result.images,
    totalBytes: result.totalBytes,

    parts: result.parts,
    transcriptUrls: result.transcriptUrls,
    files: result.files
  };

  const buffer = Buffer.from(
    JSON.stringify(manifest, null, 2),
    "utf8"
  );

  const links = result.transcriptUrls
    .slice(0, 15)
    .map(
      (url, index) =>
        `[Transcript ${index + 1}](${url})`
    )
    .join(" • ");

  // Normally one manifest contains the complete archive.
  // Exceptionally large manifests are split into binary parts.

  if (buffer.length > FILE_PART_SIZE) {
    const total = Math.ceil(
      buffer.length / FILE_PART_SIZE
    );

    const indexUrls = [];

    for (
      let index = 0;
      index < total;
      index++
    ) {
      const part = buffer.subarray(
        index * FILE_PART_SIZE,
        (index + 1) * FILE_PART_SIZE
      );

      const message = await thread.send({
        files: [
          new AttachmentBuilder(part, {
            name:
              `ticket-${state.number}-manifest.json.part` +
              `${String(index + 1).padStart(5, "0")}`
          })
        ],

        allowedMentions: NONE
      });

      if (
        message.attachments.first()?.size !==
        part.length
      ) {
        throw new Error(
          "Archive manifest part failed."
        );
      }

      indexUrls.push(message.url);
    }

    const summary = await thread.send({
      embeds: [
        whiteEmbed(
          "Ticket Archive Complete",

          `**Ticket:** #${numberText(state.number)}\n` +
          `**Messages:** ${result.messages}\n` +
          `**Attachments:** ${result.attachments}\n` +
          `**Images:** ${result.images}\n\n` +
          "The full manifest is saved in numbered parts above.\n\n" +
          links
        ).setFooter({
          text:
            `${ARCHIVE_COMPLETE_MARKER}:${snapshot}`
        })
      ],

      allowedMentions: NONE
    });

    return {
      ...manifest,
      manifestParts: indexUrls,
      url: summary.url
    };
  }

  const message = await thread.send({
    embeds: [
      whiteEmbed(
        "Ticket Archive Complete",

        `**Ticket:** #${numberText(state.number)}\n` +
        `**Messages:** ${result.messages}\n` +
        `**Attachments:** ${result.attachments}\n` +
        `**Images:** ${result.images}\n` +
        `**Transcript Parts:** ${result.parts}\n\n` +

        "**Transcript**\n" +
        links +

        (
          result.parts > 15
            ? "\n\nAll additional parts are listed in the manifest."
            : ""
        ) +

        "\n\nAll original attachments are saved in this thread."
      )
        .setFooter({
          text:
            `${ARCHIVE_COMPLETE_MARKER}:${snapshot}`
        })
        .setTimestamp()
    ],

    files: [
      new AttachmentBuilder(buffer, {
        name:
          `ticket-${state.number}-manifest.json`
      })
    ],

    allowedMentions: NONE
  });

  if (
    message.attachments.first()?.size !==
    buffer.length
  ) {
    throw new Error(
      "Final archive manifest upload failed."
    );
  }

  return {
    ...manifest,
    url: message.url
  };
}

// ============================================================
// COMPLETE TICKET ARCHIVE
// ============================================================

async function archiveTicket(channel, entry) {
  if (archiveJobs.has(channel.id)) {
    return archiveJobs.get(channel.id);
  }

  const job = (async () => {
    const state = entry.state;

    let logs = await textChannel(
      channel.guild,
      IDS.logs,
      "Ticket logs"
    );

    logs = await validateArchiveChannel(
      channel.guild,
      logs
    );

    const { root, thread } =
      await getArchiveThread(
        logs,
        state,
        () => saveState(channel, entry)
      );

    const messages = (
      await allMessages(channel)
    ).filter(shouldArchiveMessage);

    const snapshot = snapshotHash(
      messages,
      state
    );

    const catalog =
      await buildArchiveCatalog(
        logs,
        thread,
        state
      );

    // Reuse the completed archive if nothing has changed.

    const previous =
      await completedArchive(
        catalog.completed.get(snapshot)
      );

    if (
      previous &&
      await verifyCompletedArchive(
        channel.guild,
        previous
      )
    ) {
      state.transcriptUrl = previous.url;

      await saveState(channel, entry);

      await root.edit(
        archiveRootPayload(
          state,
          previous
        )
      );

      console.log(
        `[ARCHIVE] Reused completed ticket #${state.number}`
      );

      return previous;
    }

    const writer = createTranscriptWriter(
      thread,
      catalog,
      state,
      snapshot
    );

    let images = 0;
    let attachments = 0;
    let totalBytes = 0;

    const files = [];
    const seen = new Set();

    for (const message of messages) {
      await writer.add(
        messageHtml(message)
      );

      for (const file of message.attachments.values()) {
        if (seen.has(file.id)) {
          continue;
        }

        seen.add(file.id);

        const record =
          await preserveAttachment(
            thread,
            catalog,
            state,
            message,
            file
          );

        attachments++;

        totalBytes += record.size;

        if (
          record.mime ||
          /^image\//i.test(
            file.contentType || ""
          ) ||
          /\.(png|jpe?g|gif|webp|avif)$/i.test(
            file.name || ""
          )
        ) {
          images++;
        }

        files.push({
          id: file.id,
          messageId: message.id,
          name: file.name,
          size: record.size,
          checksum: record.checksum || null,
          urls: record.urls,
          split: record.split
        });

        await writer.add(
          archiveLinkHtml(record)
        );
      }
    }

    const transcript =
      await writer.finish();

    const result = {
      messages: messages.length,
      images,
      attachments,
      totalBytes,
      parts: transcript.parts,
      transcriptUrls: transcript.urls,
      files
    };

    await validateArchiveChannel(
      channel.guild,
      logs
    );

    const manifest =
      await saveArchiveManifest(
        thread,
        state,
        snapshot,
        result
      );

    state.transcriptUrl = manifest.url;

    await saveState(
      channel,
      entry
    );

    await root.edit(
      archiveRootPayload(
        state,
        manifest
      )
    );

    console.log(
      `[ARCHIVE] Ticket #${state.number} completed.`
    );

    return manifest;
  })();

  archiveJobs.set(channel.id, job);

  try {
    return await job;
  } finally {
    archiveJobs.delete(channel.id);
  }
}

// ============================================================
// OLD TRANSCRIPT RECOVERY
// ============================================================

function decodeTranscriptUrl(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&#x26;/gi, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractOldAttachments(html) {
  const results = new Map();

  const pattern =
    /(?:href|src)\s*=\s*["']([^"']+)["']/gi;

  for (const match of html.matchAll(pattern)) {
    const value = decodeTranscriptUrl(match[1]);

    const url = discordAttachmentUrl(value);

    if (!url) continue;

    const parts = url.pathname.split("/");

    const channelId = parts[2];
    const attachmentId = parts[3];

    let name;

    try {
      name = decodeURIComponent(
        parts.slice(4).join("/")
      );
    } catch {
      name = "attachment";
    }

    if (!/\.(png|jpe?g|gif|webp)$/i.test(name)) {
      continue;
    }

    results.set(
      attachmentId,
      {
        channelId,
        attachmentId,
        name,
        url: value
      }
    );
  }

  return [...results.values()];
}

function extractEmbeddedImages(html) {
  const results = new Map();

  const pattern =
    /<img\b[^>]*\bsrc=["']data:(image\/(?:png|jpeg|gif|webp));base64,([A-Za-z0-9+/=\s]+)["'][^>]*>/gi;

  for (const match of html.matchAll(pattern)) {
    try {
      const buffer = Buffer.from(
        match[2],
        "base64"
      );

      const mime = imageMime(buffer);

      if (!mime) continue;

      const checksum = hash(buffer);

      const alt = match[0].match(
        /\balt=["']([^"']+)["']/i
      );

      const name = alt
        ? safeFilename(
            decodeTranscriptUrl(alt[1])
          )
        : `image-${checksum.slice(0, 12)}.${imageExtension(mime)}`;

      results.set(
        checksum,
        {
          buffer,
          name,
          checksum
        }
      );

    } catch {
      // Ignore invalid embedded image data.
    }
  }

  return [...results.values()];
}

// ============================================================
// RECOVER ORIGINAL ATTACHMENT
// ============================================================

async function recoverOldImage(guild, old, indexes) {
  // Prefer the original Discord message when it exists.

  if (!indexes.has(old.channelId)) {
    const result = new Map();

    const channel = await guild.channels.fetch(
      old.channelId
    ).catch(() => null);

    if (
      channel?.guild?.id === guild.id &&
      channel?.messages &&
      parseTicketName(channel.name)
    ) {
      await scan(channel, message => {
        for (const attachment of message.attachments.values()) {
          result.set(
            attachment.id,
            {
              message,
              attachment
            }
          );
        }
      });
    }

    indexes.set(
      old.channelId,
      result
    );
  }

  const original =
    indexes.get(old.channelId)
      ?.get(old.attachmentId);

  if (original) {
    return downloadMessageAttachment(
      original.message,
      original.attachment
    );
  }

  // Old signed URLs may still be valid.
  // If both URL and original message are gone,
  // the original image may be unrecoverable.

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= 3;
    attempt++
  ) {
    try {
      const buffer = await downloadTranscriptFile(
        originalCdnUrl(old.url) || old.url
      );

      if (!imageMime(buffer)) {
        throw new Error(
          "Downloaded data is not a supported image."
        );
      }

      return buffer;

    } catch (error) {
      lastError = error;

      if (attempt < 3) {
        await sleep(1500 * attempt);
      }
    }
  }

  throw new Error(
    lastError?.message ||
    "Original image is unavailable."
  );
}

// ============================================================
// EASTERN TIME FILTER
// ============================================================

const easternFormatter = new Intl.DateTimeFormat(
  "en-US",
  {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }
);

function easternDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = Object.fromEntries(
    easternFormatter.formatToParts(date)
      .map(part => [
        part.type,
        part.value
      ])
  );

  return (
    `${parts.year}-${parts.month}-${parts.day}`
  );
}

function parseRecoveryFilter(message) {
  let value = message.content
    .trim()
    .split(/\s+/)
    .slice(1)
    .join(" ")
    .trim();

  if (!value) {
    return {
      type: "all",
      value: null
    };
  }

  if (/^#?\d+$/.test(value)) {
    const number = Number(
      value.replace(/^#/, "")
    );

    if (
      !Number.isSafeInteger(number) ||
      number < 1
    ) {
      return null;
    }

    return {
      type: "ticket",
      value: number
    };
  }

  const short = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/
  );

  if (short) {
    const year = short[3].length === 2
      ? `20${short[3]}`
      : short[3];

    value =
      `${year}-` +
      `${short[1].padStart(2, "0")}-` +
      `${short[2].padStart(2, "0")}`;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(
      `${value}T12:00:00Z`
    );

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      return null;
    }

    return {
      type: "date",
      value
    };
  }

  return null;
}

function transcriptMatchesDate(html, target) {
  const timestamps = html.match(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g
  ) || [];

  return timestamps.some(
    timestamp =>
      easternDate(timestamp) === target
  );
}

// ============================================================
// RECOVERY DEDUPLICATION
// ============================================================

async function loadLegacyHashes(catalog) {
  for (const record of catalog.files.values()) {
    if (
      !record.legacy ||
      record.checksum
    ) {
      continue;
    }

    try {
      const buffer =
        await downloadMessageAttachment(
          record.message,
          record.attachment
        );

      const checksum = hash(buffer);

      record.checksum = checksum;

      catalog.hashes.set(
        checksum,
        record
      );

    } catch (error) {
      console.warn(
        "[RECOVERY] Old archived file:",
        error.message
      );
    }
  }
}

// ============================================================
// RECOVER LOGS COMMAND
// ============================================================

async function recoverLogs(message) {
  const context = messageContext(message);

  const member = await getMember(context);

  if (
    !isOwner(member) &&
    !isAdmin(member)
  ) {
    return reply(
      context,
      "Only owners and admins can recover ticket logs."
    );
  }

  if (message.channel.id !== IDS.logs) {
    return reply(
      context,
      `Use this command in <#${IDS.logs}>.`
    );
  }

  if (recoveryRunning) {
    return reply(
      context,
      "Ticket recovery is already running."
    );
  }

  const filter =
    parseRecoveryFilter(message);

  if (!filter) {
    return reply(
      context,

      "**Recovery Commands**\n\n" +

      "`,recoverlogs`\n" +
      "`,recoverlogs 779`\n" +
      "`,recoverlogs 11/18/26`\n" +
      "`,recoverlogs 2026-11-18`"
    );
  }

  recoveryRunning = true;

  let status = null;

  let checked = 0;
  let matched = 0;
  let recovered = 0;
  let skipped = 0;
  let unavailable = 0;
  let errors = 0;
  let existingTicketsSaved = 0;

  const failed = new Set();

  const guild = message.guild;

  const searchLabel =
    filter.type === "all"
      ? "All tickets"
      : filter.type === "ticket"
        ? `Ticket #${numberText(filter.value)}`
        : `${filter.value} (Eastern Time)`;

  async function progress(finished = false) {
    if (!status) return;

    await status.edit({
      embeds: [
        whiteEmbed(
          finished
            ? "Ticket Recovery Complete"
            : "Recovering Ticket Archives",

          `**Search:** ${searchLabel}\n\n` +

          `**Transcripts Checked:** ${checked}\n` +
          `**Matching Transcripts:** ${matched}\n` +
          `**Recovered Images:** ${recovered}\n` +
          `**Already Saved:** ${skipped}\n` +
          `**Unavailable:** ${unavailable}\n` +
          `**Errors:** ${errors}\n` +
          `**Existing Tickets Saved:** ${existingTicketsSaved}\n\n` +

          (
            finished
              ? "Original logs have been preserved."
              : "Checking available original attachments."
          ) +

          (
            finished && failed.size
              ? "\n\n**Unavailable files include:**\n" +
                [...failed]
                  .slice(0, 8)
                  .map(name => `• ${safe(name, 100)}`)
                  .join("\n")
              : ""
          )
        )
      ],

      allowedMentions: NONE
    }).catch(() => {});
  }

  try {
    const logs =
      await validateArchiveChannel(
        guild,
        message.channel
      );

    await init(guild);

    status = await message.reply({
      embeds: [
        whiteEmbed(
          "Recovering Ticket Archives",

          `**Search:** ${searchLabel}\n\n` +

          "Existing archived attachments will be reused."
        )
      ],

      allowedMentions: NONE
    });

    // First archive matching existing closed tickets.

    await guild.channels.fetch();

    for (const channel of guild.channels.cache.values()) {
      if (channel.type !== ChannelType.GuildText) {
        continue;
      }

      const parsed = parseTicketName(
        channel.name
      );

      if (!parsed || !parsed.closed) {
        continue;
      }

      if (
        filter.type === "ticket" &&
        parsed.number !== filter.value
      ) {
        continue;
      }

      try {
        await queuedTicket(
          channel.id,

          async () => {
            const entry = await loadState(channel);

            if (
              !entry ||
              entry.state.status !== "closed"
            ) {
              return;
            }

            if (filter.type === "date") {
              const messages =
                await allMessages(channel);

              if (
                !messages.some(item =>
                  easternDate(item.createdAt) ===
                  filter.value
                )
              ) {
                return;
              }
            }

            await archiveTicket(
              channel,
              entry
            );

            existingTicketsSaved++;
          }
        );

      } catch (error) {
        errors++;

        console.error(
          `[RECOVERY] ${channel.name}:`,
          error.message
        );
      }

      await progress();
    }

    // Recover old HTML transcripts.
    // Do not rewrite or delete the original HTML.

    const indexes = new Map();
    const historicalArchives = new Map();

    await scan(
      logs,

      async log => {
        if (
          log.author.id !== guild.client.user.id
        ) {
          return;
        }

        for (const file of log.attachments.values()) {
          const filename = file.name || "";

          const ticketMatch = filename.match(
            /^(?:recovered-)*transcript-([a-z-]+)-(\d+)(?:-\d+)?(?:-part-\d+)?\.html$/i
          );

          if (!ticketMatch) continue;

          const number = Number(
            ticketMatch[2]
          );

          if (
            filter.type === "ticket" &&
            number !== filter.value
          ) {
            continue;
          }

          checked++;

          try {
            const buffer =
              await downloadMessageAttachment(
                log,
                file
              );

            const html =
              buffer.toString("utf8");

            if (
              filter.type === "date" &&
              !transcriptMatchesDate(
                html,
                filter.value
              )
            ) {
              continue;
            }

            const linked =
              extractOldAttachments(html);

            const embedded =
              extractEmbeddedImages(html);

            if (
              !linked.length &&
              !embedded.length
            ) {
              continue;
            }

            matched++;

            let archive =
              historicalArchives.get(number);

            if (!archive) {
              const saved = [
                ...tickets.values()
              ].find(
                entry =>
                  entry.state.number === number
              );

              const historicalType =
                TYPES[ticketMatch[1]]
                  ? ticketMatch[1]
                  : "support";

              const state =
                saved?.state || {
                  channelId: `historical-${number}`,
                  number,
                  type: historicalType,
                  ownerId: null,
                  claimedBy: null,
                  status: "closed",
                  closeReason:
                    "Recovered historical transcript.",
                  archiveRootId: null,
                  archiveThreadId: null
                };

              const { root, thread } =
                await getArchiveThread(
                  logs,
                  state
                );

              const catalog =
                await buildArchiveCatalog(
                  logs,
                  thread,
                  state
                );

              await loadLegacyHashes(
                catalog
              );

              archive = {
                state,
                root,
                thread,
                catalog,
                added: 0
              };

              historicalArchives.set(
                number,
                archive
              );
            }

            const {
              state,
              thread,
              catalog
            } = archive;

            for (const old of linked) {
              if (
                catalog.files.has(
                  old.attachmentId
                )
              ) {
                skipped++;
                continue;
              }

              try {
                const image =
                  await recoverOldImage(
                    guild,
                    old,
                    indexes
                  );

                if (!imageMime(image)) {
                  throw new Error(
                    "Invalid image."
                  );
                }

                if (catalog.hashes.has(hash(image))) {
                  skipped++;
                  continue;
                }

                await archiveOriginalFile(
                  thread,
                  catalog,
                  state,
                  image,
                  old.name,
                  old.attachmentId
                );

                recovered++;
                archive.added++;

              } catch (error) {
                unavailable++;
                failed.add(old.name);

                console.warn(
                  `[RECOVERY] ${old.name}:`,
                  error.message
                );
              }
            }

            for (const image of embedded) {
              if (
                catalog.hashes.has(
                  image.checksum
                )
              ) {
                skipped++;
                continue;
              }

              try {
                await archiveOriginalFile(
                  thread,
                  catalog,
                  state,
                  image.buffer,
                  image.name,
                  `hash-${image.checksum}`
                );

                recovered++;
                archive.added++;

              } catch (error) {
                errors++;
                failed.add(image.name);

                console.error(
                  "[RECOVERY] Embedded image:",
                  error.message
                );
              }
            }

          } catch (error) {
            errors++;

            console.error(
              `[RECOVERY] ${filename}:`,
              error.message
            );
          }

          if (
            checked % 10 === 0 ||
            filter.type === "ticket"
          ) {
            await progress();
          }
        }
      }
    );

    // Summarize recovered images inside their own threads.

    for (const archive of historicalArchives.values()) {
      if (!archive.added) continue;

      await archive.thread.send({
        embeds: [
          whiteEmbed(
            "Historical Image Recovery",

            `**Ticket:** #${numberText(archive.state.number)}\n` +
            `**New Images Recovered:** ${archive.added}\n\n` +

            "Recovered original images are saved above.\n" +
            "The original historical transcript was preserved."
          ).setTimestamp()
        ],

        allowedMentions: NONE
      });
    }

    await progress(true);

  } catch (error) {
    console.error(
      "[RECOVERY] Failed:",
      error
    );

    if (status) {
      await status.edit({
        embeds: [
          whiteEmbed(
            "Recovery Stopped",

            safe(error.message, 1000)
          )
        ],

        allowedMentions: NONE
      }).catch(() => {});

    } else {
      await reply(
        context,

        "Recovery could not start: " +
        safe(error.message, 500)
      );
    }

  } finally {
    recoveryRunning = false;
  }
}

// ============================================================
// TICKET FORMS
// ============================================================

function ticketForm(type) {
  const config = TYPES[type];

  if (!config?.questions?.length) {
    throw new Error(
      "Ticket form unavailable."
    );
  }

  const modal = new ModalBuilder()
    .setCustomId(FORM_PREFIX + type)
    .setTitle(`${config.label} Ticket`);

  config.questions.forEach(
    (question, index) => {
      const appeal =
        type === "unblacklist";

      const input = new TextInputBuilder()
        .setCustomId(`answer_${index}`)
        .setLabel(question.slice(0, 45))
        .setStyle(
          appeal
            ? TextInputStyle.Paragraph
            : TextInputStyle.Short
        )
        .setRequired(true)
        .setMaxLength(
          appeal ? 1000 : 250
        );

      if (
        type === "partnership" &&
        index === 0
      ) {
        input.setPlaceholder(
          "Enter amount; upload proof in ticket"
        );
      }

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(input)
      );
    }
  );

  return modal;
}

function closeModal(channelId) {
  return new ModalBuilder()
    .setCustomId(CLOSE_PREFIX + channelId)
    .setTitle("Close Ticket")
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("close_reason")
          .setLabel("Reason (optional)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(false)
          .setMaxLength(500)
      )
    );
}

// ============================================================
// VERIFICATION WELCOME
// ============================================================

function verificationWelcomeDescription(userId) {
  return (
    `Welcome <@${userId}>!\n\n` +

    "Thank you for joining **.gg/chuppys**.\n\n" +

    "Your private verification ticket has been created.\n\n" +

    "**1.** State who invited you.\n\n" +

    "**2.** Provide screenshot proof of your invite.\n\n" +

    "**3.** Complete your server roles.\n\n" +

    "**4.** Wait for a staff member to approve your verification.\n\n" +

    "Verification is completed manually by staff.\n\n" +

    "Never share passwords, account tokens or login codes."
  );
}

// ============================================================
// BASIC LIFECYCLE LOGGING
// ============================================================
//
// Ticket opening and claiming are recorded in data storage.
// No extra attachment archive is created.
//
// ============================================================

function logTicketAction(state, action, actorId) {
  console.log(
    `[TICKETS] ${ticketName(state.type, state.number)} ` +
    `${action} by ${actorId}`
  );
}

// ============================================================
// CREATE TICKET
// ============================================================

async function createTicket(
  interaction,
  type,
  answers = []
) {
  return queued(async () => {
    const guild = interaction.guild;
    const config = TYPES[type];

    if (!guild || !config) {
      throw new Error(
        "Invalid ticket type."
      );
    }

    const member = await guild.members.fetch({
      user: interaction.user.id,
      force: true
    });

    const blacklisted =
      await isBlacklisted(member);

    if (
      type === "unblacklist" &&
      !blacklisted
    ) {
      throw new Error(
        "Only blacklisted members can open an appeal."
      );
    }

    if (
      type !== "unblacklist" &&
      blacklisted
    ) {
      throw new Error(
        "You are blacklisted. Please use the appeal panel."
      );
    }

    if (
      type === "verification" &&
      member.roles.cache.has(
        VERIFIED_ROLE_ID
      )
    ) {
      throw new Error(
        "You are already verified."
      );
    }

    await init(guild);

    const existing =
      await existingTicket(
        guild,
        interaction.user.id,
        type
      );

    if (existing) {
      return {
        channel: existing,
        existing: true
      };
    }

    const parent =
      await category(
        guild,
        type
      );

    if (
      parent.children.cache.size >= 50
    ) {
      throw new Error(
        "This ticket category is full."
      );
    }

    const number =
      await nextNumber(guild);

    const state = {
      channelId: null,
      ownerId: interaction.user.id,
      type,
      number,
      status: "open",
      claimedBy: null,

      controlMessageId: null,
      closeControlMessageId: null,

      closeReason:
        "No further action required.",

      transcriptUrl: null,
      archiveRootId: null,
      archiveThreadId: null,

      createdAt:
        new Date().toISOString()
    };

    const channel =
      await guild.channels.create({
        name: ticketName(type, number),

        type: ChannelType.GuildText,

        parent: parent.id,

        topic: null,

        permissionOverwrites:
          await permissions(
            guild,
            state
          ),

        reason:
          `${config.label} ticket opened by ${interaction.user.id}`
      });

    state.channelId = channel.id;

    const entry = {
      state,
      storageMessageId: null
    };

    await checkPrivacy(channel, state);

    await saveState(channel, entry);

    const details =
      config.questions?.length &&
      answers.length

        ? config.questions.map(
            (question, index) =>
              `**${question}**\n` +
              safe(
                answers[index],
                type === "unblacklist"
                  ? 1000
                  : 250
              )
          ).join("\n\n")

        : config.description;

    let pingRoles = [];
    let description = "";

    if (type === "verification") {
      pingRoles =
        VERIFICATION_STAFF_ROLES;

      description =
        verificationWelcomeDescription(
          interaction.user.id
        );

    } else if (type === "unblacklist") {
      pingRoles =
        UNBLACKLIST_STAFF_ROLES;

      description =
        `Welcome <@${interaction.user.id}>!\n\n` +

        "**Unblacklist Appeal**\n\n" +

        `${details}\n\n` +

        "Please provide relevant screenshots or proof.\n\n" +

        "Wait for an Owner, Admin or Moderator.\n\n" +

        "Submitting an appeal does not guarantee approval.";

    } else {
      pingRoles =
        isTradingTicket(state)
          ? [
              IDS.owner,
              IDS.seller,
              IDS.support
            ]
          : [
              IDS.owner,
              IDS.support
            ];

      const proof =
        type === "partnership"
          ? "\n\n**Please show proof of your vouches!**"
          : "";

      description =
        `Welcome <@${interaction.user.id}>!\n\n` +

        `${details}${proof}\n\n` +

        "Our team will assist you shortly.";
    }

    pingRoles = [
      ...new Set(pingRoles)
    ].filter(
      id => guild.roles.cache.has(id)
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
          whiteEmbed(
            `${EMOJI} ${config.label} Ticket #${numberText(number)}`,

            description
          )
        ],

        components: controls(state),

        allowedMentions: {
          parse: [],
          users: [interaction.user.id],
          roles: pingRoles
        }
      });

    state.controlMessageId =
      welcome.id;

    await saveState(channel, entry);

    logTicketAction(
      state,
      "opened",
      interaction.user.id
    );

    return {
      channel,
      existing: false
    };
  });
}

// ============================================================
// OPEN VERIFICATION TICKET
// ============================================================

async function openVerificationTicket(interaction) {
  if (
    !interaction?.guild ||
    !interaction?.user ||
    !interaction.inGuild()
  ) {
    throw new Error(
      "Verification requires a server."
    );
  }

  return createTicket(
    interaction,
    "verification",
    []
  );
}

async function handleVerificationButton(interaction) {
  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const result =
    await openVerificationTicket(
      interaction
    );

  return reply(
    interaction,

    result.existing
      ? `You already have a verification ticket: ${result.channel}`
      : `Your private verification ticket is ready: ${result.channel}`
  );
}

// ============================================================
// UNBLACKLIST BUTTON
// ============================================================

async function handleUnblacklistButton(interaction) {
  // Show the modal immediately.
  // Blacklist eligibility is checked again on submission.

  return interaction.showModal(
    ticketForm("unblacklist")
  );
}

// ============================================================
// CLAIM TICKET
// ============================================================

async function claim(
  context,
  channel,
  entry,
  force = false
) {
  const member = await getMember(context);

  const state = entry.state;

  if (force && !isOwner(member)) {
    return reply(
      context,
      "Only owners can force-claim tickets."
    );
  }

  if (!force && !canClaim(member, state)) {
    return reply(
      context,
      "You cannot claim this ticket."
    );
  }

  if (state.status !== "open") {
    return reply(
      context,
      "Reopen this ticket first."
    );
  }

  if (
    state.claimedBy === member.id
  ) {
    return reply(
      context,
      "You already claimed this ticket."
    );
  }

  if (state.claimedBy && !force) {
    return reply(
      context,

      `This ticket is already claimed by <@${state.claimedBy}>.`
    );
  }

  const previous = state.claimedBy;

  state.claimedBy = member.id;

  try {
    await applyPermissions(
      channel,
      state
    );

    await saveState(
      channel,
      entry
    );

  } catch (error) {
    state.claimedBy = previous;

    await applyPermissions(
      channel,
      state
    ).catch(console.error);

    throw error;
  }

  await updateControls(
    channel,
    state
  );

  await channel.send({
    embeds: [
      whiteEmbed(
        "Ticket Claimed",

        `Claimed by <@${member.id}>.\n\n` +
        "This ticket is now assigned."
      )
    ],

    allowedMentions: NONE
  });

  logTicketAction(
    state,
    "claimed",
    member.id
  );

  if (context.kind !== "prefix") {
    return reply(
      context,
      "Ticket claimed successfully."
    );
  }
}

// ============================================================
// FAST CLOSE TICKET
// ============================================================
//
// IMPORTANT FIX:
// No transcript downloads.
// No attachment uploads.
// No archive generation.
// No waiting for TikTok, vouches or other bot modules.
//
// ============================================================

async function closeTicket(
  context,
  channel,
  entry,
  reason
) {
  const member =
    await getMember(context);

  const state = entry.state;

  if (!canManage(member, state)) {
    return reply(
      context,
      "You cannot close this ticket."
    );
  }

  if (state.status === "closed") {
    // Repair missing closed buttons.

    await ensureClosedControls(
      channel,
      entry
    );

    return reply(
      context,

      "This ticket is already closed. " +
      "Use `,delete` to save the final archive and delete it."
    );
  }

  const previous = {
    status: state.status,
    closeReason: state.closeReason
  };

  state.status = "closed";

  state.closeReason = String(
    reason || "No further action required."
  ).slice(0, 500);

  try {
    await applyPermissions(
      channel,
      state
    );

    await saveState(
      channel,
      entry
    );

  } catch (error) {
    state.status = previous.status;
    state.closeReason = previous.closeReason;

    await applyPermissions(
      channel,
      state
    ).catch(console.error);

    throw error;
  }

  // Display closed buttons immediately.
  // Renaming is performed afterward.

  const closed = await channel.send({
    embeds: [
      whiteEmbed(
        "Ticket Closed",

        `Closed by <@${member.id}>.\n\n` +

        `**Reason:** ${safe(state.closeReason, 500)}\n\n` +

        "The final transcript and attachments will be saved when this ticket is deleted."
      )
    ],

    components: closedControls(),

    allowedMentions: NONE
  });

  state.closeControlMessageId =
    closed.id;

  await saveState(
    channel,
    entry
  );

  await updateControls(
    channel,
    state
  );

  if (context.kind !== "prefix") {
    await reply(
      context,
      "Ticket closed successfully."
    ).catch(() => {});
  }

  // A channel-name rate limit will not block archiving.
  // The per-ticket queue prevents simultaneous state changes.

  const expectedName = ticketName(
    state.type,
    state.number,
    true
  );

  if (channel.name !== expectedName) {
    await channel.setName(
      expectedName
    ).catch(error => {
      console.warn(
        "[TICKETS] Close rename:",
        error.message
      );
    });
  }

  logTicketAction(
    state,
    "closed",
    member.id
  );
}

// ============================================================
// REOPEN TICKET
// ============================================================

async function reopenTicket(
  context,
  channel,
  entry
) {
  const member =
    await getMember(context);

  const state = entry.state;

  if (!canManage(member, state)) {
    return reply(
      context,
      "You cannot reopen this ticket."
    );
  }

  if (state.status !== "closed") {
    return reply(
      context,
      "This ticket is already open."
    );
  }

  state.status = "open";

  try {
    await applyPermissions(
      channel,
      state
    );

    await saveState(
      channel,
      entry
    );

  } catch (error) {
    state.status = "closed";

    await applyPermissions(
      channel,
      state
    ).catch(console.error);

    throw error;
  }

  await clearClosedControls(
    channel,
    state
  );

  state.closeControlMessageId = null;

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
      whiteEmbed(
        "Ticket Reopened",

        `Reopened by <@${member.id}>.`
      )
    ],

    allowedMentions: NONE
  });

  if (context.kind !== "prefix") {
    await reply(
      context,
      "Ticket reopened successfully."
    ).catch(() => {});
  }

  await channel.setName(
    ticketName(
      state.type,
      state.number
    )
  ).catch(console.error);

  logTicketAction(
    state,
    "reopened",
    member.id
  );
}

// ============================================================
// SAVELOG
// ============================================================
//
// Only closed tickets can be archived manually.
// Repeated commands reuse already saved files.
//
// ============================================================

async function saveLog(
  context,
  channel,
  entry
) {
  const member =
    await getMember(context);

  const state = entry.state;

  if (
    !isOwner(member) &&
    !isAdmin(member) &&
    !canManage(member, state)
  ) {
    return reply(
      context,
      "You cannot save this ticket."
    );
  }

  if (state.status !== "closed") {
    return reply(
      context,

      "Close this ticket before saving its final archive."
    );
  }

  const notice = await archiveNotice(
    context,
    channel,

    "Saving the ticket archive.\n\n" +

    "Already saved attachments will not be uploaded again."
  );

  try {
    const archive =
      await archiveTicket(
        channel,
        entry
      );

    await editArchiveNotice(
      notice,

      "Ticket Archive Saved",

      `**Ticket:** #${numberText(state.number)}\n` +
      `**Messages:** ${archive.messages}\n` +
      `**Attachments:** ${archive.attachments}\n\n` +

      `[View Ticket Archive](${archive.url})\n\n` +

      "You can now use `,delete`."
    );

    if (context.kind !== "prefix") {
      await reply(
        context,

        "Ticket archive saved successfully."
      ).catch(() => {});
    }

  } catch (error) {
    console.error(
      "[SAVELOG]",
      error
    );

    await editArchiveNotice(
      notice,

      "Archive Incomplete",

      `**Reason:** ${safe(error.message, 700)}\n\n` +

      "Successfully saved attachments have been retained.\n\n" +

      "Use `,savelog` to retry the missing files."
    );
  }
}

// ============================================================
// FREEZE TICKET FOR FINAL DELETION
// ============================================================
//
// Prevent ordinary members and staff from adding messages
// while the final archive is being generated.
// Administrators and server owners can bypass overwrites,
// so the message snapshot is checked again before deletion.
//
// ============================================================

async function freezeTicket(channel, state) {
  const overwrites =
    await permissions(
      channel.guild,
      state
    );

  for (const overwrite of overwrites) {
    if (
      overwrite.id === channel.client.user.id
    ) {
      continue;
    }

    if (
      overwrite.id ===
      channel.guild.roles.everyone.id
    ) {
      continue;
    }

    overwrite.allow = (
      overwrite.allow || []
    ).filter(
      permission =>
        !WRITE_PERMISSIONS.includes(permission)
    );

    overwrite.deny = [
      ...new Set([
        ...(overwrite.deny || []),
        ...WRITE_PERMISSIONS
      ])
    ];
  }

  await channel.permissionOverwrites.set(
    overwrites,
    "Freeze ticket during final archive"
  );
}

// ============================================================
// DELETE TICKET
// ============================================================
//
// Only archive once unless ticket content changes.
// Existing attachment uploads are always reused.
// The original ticket remains if archiving fails.
//
// ============================================================

async function deleteTicket(
  context,
  channel,
  entry
) {
  const member =
    await getMember(context);

  const state = entry.state;

  if (!canDelete(member, state)) {
    return reply(
      context,

      state.status !== "closed" &&
      canManage(member, state)

        ? "Close this ticket first."

        : "You cannot delete this ticket."
    );
  }

  const notice = await archiveNotice(
    context,
    channel,

    "Preparing the final ticket archive.\n\n" +

    "Previously saved files will be reused."
  );

  let deleted = false;

  try {
    await freezeTicket(
      channel,
      state
    );

    let archive = null;

    // If an administrator adds messages during archiving,
    // update the transcript before deleting.

    for (
      let attempt = 1;
      attempt <= 3;
      attempt++
    ) {
      archive = await archiveTicket(
        channel,
        entry
      );

      const latest = (
        await allMessages(channel)
      ).filter(
        shouldArchiveMessage
      );

      const currentSnapshot =
        snapshotHash(latest, state);

      if (
        currentSnapshot === archive.snapshot
      ) {
        break;
      }

      archive = null;
    }

    if (!archive) {
      throw new Error(
        "Ticket content changed during archiving. " +
        "Please stop sending messages and retry."
      );
    }

    state.transcriptUrl = archive.url;

    await saveState(
      channel,
      entry
    );

    const logs =
      await textChannel(
        channel.guild,
        IDS.logs,
        "Ticket logs"
      );

    await validateArchiveChannel(
      channel.guild,
      logs
    );

    if (
      !(await verifyCompletedArchive(
        channel.guild,
        archive
      ))
    ) {
      throw new Error(
        "One or more archived files could not be verified."
      );
    }

    // Final message check before deleting.

    const finalMessages = (
      await allMessages(channel)
    ).filter(
      shouldArchiveMessage
    );

    if (
      snapshotHash(
        finalMessages,
        state
      ) !== archive.snapshot
    ) {
      throw new Error(
        "New ticket messages were detected. Retry deletion."
      );
    }

    await editArchiveNotice(
      notice,

      "Archive Complete",

      "All ticket messages and original attachments have been saved."
    );

    await channel.delete(
      `Ticket deleted by ${member.id}; archive complete`
    );

    deleted = true;

    tickets.delete(channel.id);

    console.log(
      `[TICKETS] Deleted #${state.number} after successful archive.`
    );

    // Mark the archive root as finalized.

    if (state.archiveRootId) {
      const root =
        await logs.messages.fetch(
          state.archiveRootId
        ).catch(() => null);

      if (root) {
        const payload =
          archiveRootPayload(
            state,
            archive
          );

        payload.embeds[0].addFields({
          name: "Ticket Status",
          value: "Deleted • Archive preserved"
        });

        await root.edit(payload)
          .catch(console.error);
      }
    }

    // Archive the thread to keep the log channel organized.

    if (state.archiveThreadId) {
      const thread =
        await channel.guild.channels.fetch(
          state.archiveThreadId
        ).catch(() => null);

      if (thread?.isThread()) {
        await thread.setArchived(true)
          .catch(console.error);
      }
    }

  } catch (error) {
    console.error(
      "[DELETE TICKET]",
      error
    );

    if (!deleted) {
      // Restore the closed-ticket permissions if archiving fails.

      await applyPermissions(
        channel,
        state
      ).catch(console.error);

      await editArchiveNotice(
        notice,

        "Deletion Cancelled",

        `**Reason:** ${safe(error.message, 700)}\n\n` +

        "The original ticket has been preserved.\n\n" +

        "Previously saved attachments will not be uploaded again.\n\n" +

        "Use `,delete` or `,savelog` to retry."
      );
    }
  }
}

// ============================================================
// /TICKETPANEL
// ============================================================

async function panelCommand(interaction) {
  if (
    !interaction.memberPermissions?.has(
      P.ManageGuild
    )
  ) {
    return reply(
      interaction,
      "Manage Server permission is required."
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

  const existing = messages.find(
    message =>
      message.author.id === interaction.client.user.id &&

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

    `Ticket panel ${existing ? "updated" : "posted"}.`
  );
}

// ============================================================
// TICKET SELECT MENU
// ============================================================

async function selectTicket(interaction) {
  const type = String(
    interaction.values?.[0] || ""
  ).toLowerCase();

  if (
    !TYPES[type] ||
    type === "verification" ||
    type === "unblacklist"
  ) {
    return reply(
      interaction,
      "Please select a valid ticket category."
    );
  }

  // Show forms immediately.
  // Full permissions are checked upon submission.

  if (TYPES[type].questions?.length) {
    return interaction.showModal(
      ticketForm(type)
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const result = await createTicket(
    interaction,
    type,
    []
  );

  return reply(
    interaction,

    result.existing
      ? `You already have an open ticket: ${result.channel}`
      : `Your ${TYPES[type].label} ticket is ready: ${result.channel}`
  );
}

// ============================================================
// FORM SUBMIT
// ============================================================

async function submitForm(interaction) {
  const type = interaction.customId.slice(
    FORM_PREFIX.length
  );

  if (!TYPES[type]?.questions?.length) {
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
      ? `You already have an open ticket: ${result.channel}`
      : `Your ${TYPES[type].label} ticket is ready: ${result.channel}`
  );
}

// ============================================================
// BUTTON ACTION DETECTION
// ============================================================

function actionFor(customId) {
  for (
    const [action, id] of
    Object.entries(BUTTONS)
  ) {
    if (customId === id) {
      return action;
    }
  }

  if (
    customId.startsWith(
      "chuppys_ticket:"
    )
  ) {
    const action = customId.slice(
      "chuppys_ticket:".length
    );

    if (
      [
        "claim",
        "close",
        "reopen",
        "delete"
      ].includes(action)
    ) {
      return action;
    }
  }

  return null;
}

// ============================================================
// BUTTON HANDLER
// ============================================================

async function handleButton(
  interaction,
  action
) {
  const channel =
    interaction.channel;

  if (
    !channel ||
    channel.type !== ChannelType.GuildText
  ) {
    return reply(
      interaction,
      "This button must be used inside a ticket."
    );
  }

  // FIX:
  // Show the close modal immediately instead of waiting
  // for storage initialization and member API requests.
  // Authorization is checked on form submission.

  if (action === "close") {
    if (
      !parseTicketName(channel.name) &&
      !tickets.has(channel.id)
    ) {
      return reply(
        interaction,
        "This is not a recognized ticket."
      );
    }

    return interaction.showModal(
      closeModal(channel.id)
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return queuedTicket(
    channel.id,

    async () => {
      const entry =
        await loadState(channel);

      if (!entry) {
        return reply(
          interaction,
          "Ticket data unavailable."
        );
      }

      switch (action) {
        case "claim":
          return claim(
            interaction,
            channel,
            entry
          );

        case "reopen":
          return reopenTicket(
            interaction,
            channel,
            entry
          );

        case "delete":
          return deleteTicket(
            interaction,
            channel,
            entry
          );
      }
    }
  );
}

// ============================================================
// CLOSE FORM HANDLER
// ============================================================

async function handleCloseForm(interaction) {
  const channelId =
    interaction.customId.slice(
      CLOSE_PREFIX.length
    );

  if (
    channelId !== interaction.channelId
  ) {
    return reply(
      interaction,
      "This form belongs to another ticket."
    );
  }

  const reason =
    interaction.fields
      .getTextInputValue(
        "close_reason"
      )
      .trim();

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return queuedTicket(
    interaction.channelId,

    async () => {
      const entry =
        await loadState(
          interaction.channel
        );

      if (!entry) {
        return reply(
          interaction,
          "Ticket data unavailable."
        );
      }

      return closeTicket(
        interaction,
        interaction.channel,
        entry,
        reason
      );
    }
  );
}

// ============================================================
// PREFIX COMMANDS
// ============================================================

async function handlePrefix(message) {
  if (
    !message.guild ||
    message.author.bot ||
    !message.content.startsWith(PREFIX)
  ) {
    return;
  }

  const raw = message.content
    .slice(PREFIX.length)
    .trim();

  const commandName =
    raw.split(/\s+/, 1)[0] || "";

  const name =
    commandName.toLowerCase();

  if (!PREFIX_COMMANDS.has(name)) {
    return;
  }

  if (
    message.channel.type !== ChannelType.GuildText
  ) {
    return;
  }

  if (name === "recoverlogs") {
    return recoverLogs(message);
  }

  const context =
    messageContext(message);

  const reason = raw.slice(
    commandName.length
  ).trim().slice(0, 500);

  return queuedTicket(
    message.channel.id,

    async () => {
      const entry =
        await loadState(
          message.channel
        );

      if (!entry) {
        return reply(
          context,
          "This is not a recognized Chuppys ticket."
        );
      }

      switch (name) {
        case "claim":
          return claim(
            context,
            message.channel,
            entry
          );

        case "forceclaim":
          return claim(
            context,
            message.channel,
            entry,
            true
          );

        case "close":
          return closeTicket(
            context,
            message.channel,
            entry,
            reason
          );

        case "reopen":
          return reopenTicket(
            context,
            message.channel,
            entry
          );

        case "delete":
          return deleteTicket(
            context,
            message.channel,
            entry
          );

        case "savelog":
          return saveLog(
            context,
            message.channel,
            entry
          );
      }
    }
  );
}

// ============================================================
// INSTALL TICKET MODULE
// ============================================================

function setupTickets(client) {
  const INSTALL_KEY = Symbol.for(
    "chuppys.tickets.singleHandler"
  );

  if (
    client[INSTALL_KEY] ||
    client.__chuppysTicketsInstalled
  ) {
    console.warn(
      "[TICKETS] Handler already installed."
    );

    return;
  }

  client[INSTALL_KEY] = true;

  client.__chuppysTicketsInstalled = true;

  const seenMessages = new Set();

  const seenInteractions = new Set();

  function firstTime(set, id) {
    if (set.has(id)) {
      return false;
    }

    set.add(id);

    if (set.size > 5000) {
      set.delete(
        set.values().next().value
      );
    }

    return true;
  }

  // ==========================================================
  // READY
  // ==========================================================

  let readyStarted = false;

  async function onReady() {
    if (readyStarted) return;

    readyStarted = true;

    try {
      if (!process.env.DISCORD_GUILD_ID) {
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
        "[TICKETS] Ticket data initialized."
      );

      console.log(
        `[TICKETS] Next ticket: ${globalCounter + 1}`
      );

      // Verify categories without preventing other
      // ticket commands from running.

      for (const type of [
        "verification",
        "unblacklist"
      ]) {
        try {
          const target =
            await category(
              guild,
              type
            );

          console.log(
            `[TICKETS] ${type}: ${target.name}`
          );

        } catch (error) {
          console.error(
            `[TICKETS] ${type} category:`,
            error.message
          );
        }
      }

      // Restore existing tickets in the background.
      // No attachment downloads take place here.

      void syncExistingTickets(guild)
        .catch(error => {
          console.error(
            "[TICKETS] Restore error:",
            error
          );
        });

      console.log(
        "[TICKETS] All seven categories enabled."
      );

      console.log(
        "[TICKETS] Fast closing enabled."
      );

      console.log(
        "[TICKETS] Closed tickets remain writable by authorized staff."
      );

      console.log(
        "[TICKETS] Archive on deletion enabled."
      );

      console.log(
        "[ARCHIVE] No automatic attachment archive on close."
      );

      console.log(
        "[ARCHIVE] One organized thread per ticket."
      );

      console.log(
        "[ARCHIVE] Original attachment deduplication enabled."
      );

      console.log(
        "[ARCHIVE] Previously saved attachment reuse enabled."
      );

      console.log(
        "[ARCHIVE] Partial upload resume enabled."
      );

      console.log(
        "[ARCHIVE] Five download attempts enabled."
      );

      console.log(
        "[ARCHIVE] Original file validation enabled."
      );

      console.log(
        "[ARCHIVE] Multipart files enabled."
      );

      console.log(
        "[ARCHIVE] No fixed combined archive size limit."
      );

      console.log(
        "[ARCHIVE] Deletion protection enabled."
      );

      console.log(
        "[RECOVERY] Historical recovery enabled."
      );

      console.log(
        "[VERIFY] Manual verification preserved."
      );

      console.log(
        `[TICKETS] Logs: ${IDS.logs}`
      );

      console.log(
        `[TICKETS] Data: ${IDS.data}`
      );

      console.log(
        "[TICKETS] Chuppys ticket system ready."
      );

    } catch (error) {
      readyStarted = false;

      console.error(
        "[TICKETS] Startup error:",
        error
      );
    }
  }

  client.once(
    Events.ClientReady,
    onReady
  );

  if (client.isReady()) {
    void onReady();
  }

  // ==========================================================
  // PREFIX LISTENER
  // ==========================================================

  client.on(
    Events.MessageCreate,

    async message => {
      if (
        !message.guild ||
        message.author.bot ||
        !message.content.startsWith(PREFIX)
      ) {
        return;
      }

      const name = message.content
        .slice(PREFIX.length)
        .trim()
        .split(/\s+/, 1)[0]
        ?.toLowerCase();

      if (!PREFIX_COMMANDS.has(name)) {
        return;
      }

      if (
        !firstTime(
          seenMessages,
          message.id
        )
      ) {
        return;
      }

      try {
        await handlePrefix(
          message
        );

      } catch (error) {
        console.error(
          "[TICKETS] Prefix error:",
          error
        );

        await message.reply({
          content:

            "Ticket error: " +

            safe(error.message, 900),

          allowedMentions: {
            parse: [],
            repliedUser: false
          }
        }).catch(() => {});
      }
    }
  );

  // ==========================================================
  // INTERACTION LISTENER
  // ==========================================================

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

      // The current verification button is owned by tickets.js.
      // The legacy secure button remains handled by index.js
      // to prevent duplicate interaction responses.

      const isVerification =
        interaction.isButton() &&

        interaction.customId ===
          VERIFY_TICKET_BUTTON_ID;

      const isUnblacklist =
        interaction.isButton() &&

        interaction.customId ===
          UNBLACKLIST_BUTTON_ID;

      const action =
        interaction.isButton()

          ? actionFor(
              interaction.customId
            )

          : null;

      if (
        !isPanel &&
        !isSelect &&
        !isForm &&
        !isClose &&
        !isVerification &&
        !isUnblacklist &&
        !action
      ) {
        return;
      }

      if (
        !firstTime(
          seenInteractions,
          interaction.id
        )
      ) {
        return;
      }

      try {
        if (!interaction.inGuild()) {
          return reply(
            interaction,

            "Tickets only work inside the server."
          );
        }

        if (isVerification) {
          return await handleVerificationButton(
            interaction
          );
        }

        if (isUnblacklist) {
          return await handleUnblacklistButton(
            interaction
          );
        }

        if (isPanel) {
          return await panelCommand(
            interaction
          );
        }

        if (isSelect) {
          return await selectTicket(
            interaction
          );
        }

        if (isForm) {
          return await submitForm(
            interaction
          );
        }

        if (isClose) {
          return await handleCloseForm(
            interaction
          );
        }

        if (action) {
          return await handleButton(
            interaction,
            action
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

          safe(error.message, 900)
        ).catch(() => {});
      }
    }
  );

  console.log(
    "[TICKETS] Single ticket handler installed."
  );

  console.log(
    "[TICKETS] Verification button connected."
  );

  console.log(
    "[TICKETS] Unblacklist button connected."
  );

  console.log(
    "[TICKETS] Existing metadata supported."
  );

  console.log(
    "[TICKETS] Organized archive system installed."
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = setupTickets;

module.exports.command = command;

module.exports.openVerificationTicket =
  openVerificationTicket;

// ============================================================
// END OF CHUPPYS TICKETS.JS
// ============================================================
