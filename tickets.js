"use strict";

// ============================================================
// CHUPPYS TICKET SYSTEM — DISCORD.JS V14 / RENDER
// COMPLETE TICKETS.JS
// ============================================================
//
// TICKET TYPES:
// - Purchase
// - Cash Out
// - Giveaway
// - Partnership
// - Support
// - Verification
// - Unblacklist Appeal
//
// COMMANDS:
// ,claim
// ,forceclaim
// ,close
// ,close reason
// ,reopen
// ,delete
// ,recoverlogs
//
// TRANSCRIPTS:
// - Permanent embedded image data
// - PNG / JPG / JPEG / GIF / WEBP
// - Old transcript recovery
// - Private recovered transcript storage
// - Original transcripts preserved
// - Deletion protection
// - No temporary URLs for successfully saved images
//
// VERIFICATION:
// - Existing verification category
// - Manual approval owned by index.js
// - No automatic verification
// - Private tickets
// - No staff commands in verification embeds
//
// PRESERVED:
// - Seller claiming
// - Trading ticket privacy
// - Blacklist restrictions
// - Unblacklist appeals
// - Global numbering
// - Private V3 metadata
// - Legacy metadata recovery
// - Embed-only storage
// - Duplicate prevention
// - Single handler installation
// - No full-server member fetches
//
// IMPORTANT:
// - Node.js 18 or newer.
// - Run ONE bot instance on Render.
// - Keep logs, transcripts and data channels private.
// - Permanently deleted images cannot be guaranteed recoverable.
//
// ============================================================
// IMPORTS
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

// ============================================================
// CHANNELS AND ROLES
// ============================================================

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

  verify: "1528716328985301052"
});

// ============================================================
// SELLER IDS
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

const EPHEMERAL =
  MessageFlags.Ephemeral;

const PREFIX = ",";

const NONE = {
  parse: []
};

// ============================================================
// TRANSCRIPT SETTINGS
// ============================================================

const TRANSCRIPT_LIMIT =
  7 * 1024 * 1024;

const IMAGE_LIMIT =
  5 * 1024 * 1024;

const DOWNLOAD_TIMEOUT =
  20000;

let recoveryRunning = false;

// ============================================================
// VERIFICATION SETTINGS
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
// BLACKLIST / APPEAL SETTINGS
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
// PRIVATE STORAGE PREFIXES — DO NOT CHANGE
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
  "recoverlogs"
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
    label: "Cash Out",

    env: "CASHOUT_TICKET_CATEGORY_ID",

    categories: [
      "chuppys-cashout",
      "Cashout tickets",
      "Cash Out tickets"
    ],

    description:
      "Please provide your cashout details.",

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

    description:
      "Please explain the giveaway you won."
  },

  partnership: {
    label: "Partnership",

    env: "PARTNERSHIP_TICKET_CATEGORY_ID",

    categories: [
      "chuppys-partnership",
      "Partnership tickets"
    ],

    description:
      "Please provide your partnership details.",

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

    description:
      "Please explain what you need help with."
  },

  verification: {
    label: "Verification",

    env: "VERIFICATION_TICKET_CATEGORY_ID",

    categories:
      VERIFICATION_CATEGORY_ALIASES,

    description:
      "A member of the verification team " +
      "will assist you shortly."
  },

  unblacklist: {
    label: "Unblacklist",

    env: "UNBLACKLIST_TICKET_CATEGORY_ID",

    categories:
      UNBLACKLIST_CATEGORY_ALIASES,

    description:
      "Please explain why your blacklist " +
      "should be reviewed.",

    questions: [
      "Why were you blacklisted?",
      "Why should we remove your blacklist?"
    ]
  }
});

// ============================================================
// /TICKETPANEL
// ============================================================

const command =
  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription(
      "Post or update the Chuppys ticket panel"
    )
    .setDefaultMemberPermissions(
      P.ManageGuild
    );

// ============================================================
// RUNTIME STORAGE
// ============================================================

const tickets = new Map();

let initialization = null;
let initialized = false;

let globalCounter = 0;
let counterMessageId = null;

let creationQueue =
  Promise.resolve();

const ticketQueues = new Map();

const transcriptJobs = new Map();

const categoryJobs = new Map();

// ============================================================
// QUEUES
// ============================================================

function queued(task) {
  const next =
    creationQueue.then(task);

  creationQueue =
    next.catch(() => {});

  return next;
}

function queuedTicket(id, task) {
  const previous =
    ticketQueues.get(id) ||
    Promise.resolve();

  const next =
    previous.then(task);

  const settled =
    next.catch(() => {});

  ticketQueues.set(
    id,
    settled
  );

  void settled.finally(() => {
    if (
      ticketQueues.get(id) === settled
    ) {
      ticketQueues.delete(id);
    }
  });

  return next;
}

function trackTranscriptJob(id, job) {
  const tracked =
    Promise.resolve(job);

  transcriptJobs.set(
    id,
    tracked
  );

  void tracked.finally(() => {
    if (
      transcriptJobs.get(id) === tracked
    ) {
      transcriptJobs.delete(id);
    }
  }).catch(() => {});

  return tracked;
}

// ============================================================
// HELPERS
// ============================================================

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

function numberText(number) {
  return String(number)
    .padStart(4, "0");
}

function ticketName(
  type,
  number,
  closed = false
) {
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
  const match =
    String(name || "").match(
      /^(closed-)?(purchase|purchasing|cashout|cash-out|giveaway|partnership|support|verification|unblacklist)-(\d+)$/i
    );

  if (!match) {
    return null;
  }

  let type =
    match[2].toLowerCase();

  if (type === "purchasing") {
    type = "purchase";
  }

  if (type === "cash-out") {
    type = "cashout";
  }

  const number =
    Number(match[3]);

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
    .setFooter({
      text: BRAND
    });
}

async function textChannel(
  guild,
  id,
  label
) {
  const channel =
    guild.channels.cache.get(id) ||
    await guild.channels.fetch(id);

  if (
    !channel?.isTextBased() ||
    !channel.messages?.fetch ||
    !channel.send
  ) {
    throw new Error(
      `${label} channel unavailable: ${id}`
    );
  }

  return channel;
}

// ============================================================
// FETCH EXACT MEMBER ONLY
// ============================================================

async function getMember(context) {
  const guild =
    context.guild;

  const userId =
    context.user?.id;

  if (!guild || !userId) {
    throw new Error(
      "Could not identify server member."
    );
  }

  return guild.members.fetch({
    user: userId,
    force: true
  });
}

// ============================================================
// BLACKLIST ROLE LOOKUP
// ============================================================

async function findBlacklistRole(guild) {
  if (BLACKLIST_ROLE_ID) {
    const configured =
      guild.roles.cache.get(
        BLACKLIST_ROLE_ID
      ) ||
      await guild.roles.fetch(
        BLACKLIST_ROLE_ID
      ).catch(() => null);

    if (configured) {
      return configured;
    }
  }

  const cached =
    guild.roles.cache.find(role =>
      role.name.toLowerCase() ===
      BLACKLIST_ROLE_NAME.toLowerCase()
    );

  if (cached) {
    return cached;
  }

  await guild.roles.fetch();

  return guild.roles.cache.find(role =>
    role.name.toLowerCase() ===
    BLACKLIST_ROLE_NAME.toLowerCase()
  ) || null;
}

async function isBlacklisted(member) {
  if (!member?.guild) {
    return false;
  }

  const role =
    await findBlacklistRole(
      member.guild
    );

  return Boolean(
    role &&
    member.roles.cache.has(role.id)
  );
}

// ============================================================
// ROLE HELPERS
// ============================================================

function hasRole(member, roleId) {
  return Boolean(
    member?.roles?.cache?.has(roleId)
  );
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
  return Boolean(
    isOwner(member) ||
    isAdmin(member) ||
    isMod(member) ||
    isSupport(member)
  );
}

function isAppealStaff(member) {
  return Boolean(
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
// CLAIM PERMISSIONS
// ============================================================

function canClaim(member, state) {
  if (isAppealTicket(state)) {
    return isAppealStaff(member);
  }

  if (isVerificationTicket(state)) {
    return isVerificationStaff(member);
  }

  if (isOwner(member)) {
    return true;
  }

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

// ============================================================
// MANAGEMENT PERMISSIONS
// ============================================================

function canManage(member, state) {
  if (isAppealTicket(state)) {
    return isAppealStaff(member);
  }

  if (isVerificationTicket(state)) {
    return isVerificationStaff(member);
  }

  if (
    isOwner(member) ||
    isSupport(member)
  ) {
    return true;
  }

  if (
    state.claimedBy &&
    state.claimedBy === member.id
  ) {
    return true;
  }

  if (
    isTradingTicket(state) &&
    state.claimedBy
  ) {
    return false;
  }

  if (
    isMod(member) ||
    isAdmin(member)
  ) {
    return true;
  }

  return canClaim(member, state);
}

function canDelete(member, state) {
  if (state.status !== "closed") {
    return false;
  }

  if (isAppealTicket(state)) {
    return isAppealStaff(member);
  }

  if (isVerificationTicket(state)) {
    return isVerificationStaff(member);
  }

  return (
    isOwner(member) ||
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

// ============================================================
// EMBED-ONLY STATE STORAGE
// ============================================================

function encodeStateMetadata(state) {
  return Buffer.from(
    JSON.stringify(state),
    "utf8"
  ).toString("base64url");
}

function decodeStateMetadata(value) {
  if (!value) {
    return null;
  }

  try {
    const json =
      Buffer.from(
        value,
        "base64url"
      ).toString("utf8");

    return normalizeState(
      JSON.parse(json)
    );
  } catch {
    return null;
  }
}

function metadataUrl(guildId, state) {
  const base =
    `https://discord.com/channels/` +
    `${guildId}/${state.channelId}`;

  const encoded =
    encodeStateMetadata(state);

  const url =
    `${base}?${EMBED_STATE_KEY}=${encoded}`;

  if (url.length > 2048) {
    throw new Error(
      "Ticket metadata exceeds the Discord embed URL limit."
    );
  }

  return url;
}

function counterMetadataUrl(guildId, number) {
  return (
    `https://discord.com/channels/` +
    `${guildId}/${IDS.data}` +
    `?${EMBED_COUNTER_KEY}=${number}`
  );
}

function readEmbedParameter(embed, key) {
  if (!embed?.url) {
    return null;
  }

  try {
    const url =
      new URL(embed.url);

    if (
      url.hostname !== "discord.com" &&
      url.hostname !== "www.discord.com"
    ) {
      return null;
    }

    return url.searchParams.get(key);
  } catch {
    return null;
  }
}

// ============================================================
// NORMALIZE SAVED STATE
// ============================================================

function normalizeState(data) {
  if (
    !data?.channelId ||
    !data?.ownerId ||
    !TYPES[data.type]
  ) {
    return null;
  }

  const number =
    Number(data.number);

  if (
    !Number.isSafeInteger(number) ||
    number < 1
  ) {
    return null;
  }

  return {
    channelId:
      String(data.channelId),

    ownerId:
      String(data.ownerId),

    type:
      data.type,

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

    closeControlMessageId:
      data.closeControlMessageId || null,

    closeReason:
      data.closeReason ||
      "No further action required.",

    transcriptUrl:
      data.transcriptUrl || null,

    createdAt:
      data.createdAt || null
  };
}

// ============================================================
// PARSE SAVED STATE
// ============================================================

function parseState(message) {
  const content =
    message?.content || "";

  const prefix = [
    STATE_PREFIX,
    ...LEGACY_PREFIXES
  ].find(value =>
    content.startsWith(value)
  );

  if (prefix) {
    try {
      const parsed =
        normalizeState(
          JSON.parse(
            content.slice(prefix.length)
          )
        );

      if (parsed) {
        return parsed;
      }
    } catch {
      // Try embedded metadata.
    }
  }

  for (const embed of message?.embeds || []) {
    const encoded =
      readEmbedParameter(
        embed,
        EMBED_STATE_KEY
      );

    if (!encoded) {
      continue;
    }

    const state =
      decodeStateMetadata(encoded);

    if (state) {
      return state;
    }
  }

  return null;
}

// ============================================================
// PARSE GLOBAL COUNTER
// ============================================================

function parseCounter(message) {
  const content =
    message?.content || "";

  if (
    content.startsWith(COUNTER_PREFIX)
  ) {
    const number =
      Number(
        content.slice(
          COUNTER_PREFIX.length
        )
      );

    if (
      Number.isSafeInteger(number) &&
      number >= 0
    ) {
      return number;
    }
  }

  for (const embed of message?.embeds || []) {
    const encoded =
      readEmbedParameter(
        embed,
        EMBED_COUNTER_KEY
      );

    if (encoded !== null) {
      const number =
        Number(encoded);

      if (
        Number.isSafeInteger(number) &&
        number >= 0
      ) {
        return number;
      }
    }

    if (
      embed.title ===
      "Chuppys Global Ticket Counter"
    ) {
      const match =
        String(
          embed.description || ""
        ).match(
          /Total Tickets Created:\*\*\s*`?(\d+)`?/i
        );

      if (match) {
        const number =
          Number(match[1]);

        if (
          Number.isSafeInteger(number) &&
          number >= 0
        ) {
          return number;
        }
      }
    }
  }

  return null;
}

// ============================================================
// STORAGE EMBEDS
// ============================================================

function stateEmbed(state, guildId) {
  const label =
    TYPES[state.type]?.label ||
    state.type;

  const status =
    state.status === "closed"
      ? "Closed"
      : "Open";

  const embed =
    new EmbedBuilder()
      .setColor(WHITE)
      .setTitle(
        `Ticket #${numberText(state.number)} • ${label}`
      )
      .setURL(
        metadataUrl(guildId, state)
      )
      .setDescription(
        `**Status:** ${status}\n\n` +
        `**Ticket:** <#${state.channelId}>\n` +
        `**Creator:** <@${state.ownerId}>\n` +
        `**Claimed By:** ${
          state.claimedBy
            ? `<@${state.claimedBy}>`
            : "Not claimed"
        }`
      )
      .addFields(
        {
          name: "Ticket Information",
          value:
            `**Category:** ${label}\n` +
            `**Number:** ${numberText(state.number)}\n` +
            `**Channel ID:** \`${state.channelId}\``
        },
        {
          name: "Close Information",
          value:
            `**Reason:** ${safe(state.closeReason, 450)}\n\n` +
            `**Status:** ${status}`
        },
        {
          name: "Transcript",
          value:
            state.transcriptUrl
              ? `[View Transcript](${state.transcriptUrl})`
              : "Not available yet."
        },
        {
          name: "Control Messages",
          value:
            "**Opening Message:** " +
            (
              state.controlMessageId
                ? `\`${state.controlMessageId}\``
                : "Not saved"
            ) +
            "\n" +
            "**Closed Message:** " +
            (
              state.closeControlMessageId
                ? `\`${state.closeControlMessageId}\``
                : "Not saved"
            )
        }
      )
      .setFooter({
        text:
          `${BRAND} • Private Ticket Storage`
      });

  if (
    state.createdAt &&
    !Number.isNaN(
      Date.parse(state.createdAt)
    )
  ) {
    embed.setTimestamp(
      new Date(state.createdAt)
    );
  }

  return embed;
}

function counterEmbed(number, guildId) {
  return whiteEmbed(
    "Chuppys Global Ticket Counter",

    "**Total Tickets Created:** " +
    `\`${number}\`\n\n` +

    "**Next Ticket Number:** " +
    `\`${numberText(number + 1)}\`\n\n` +

    "Ticket numbering is preserved across restarts."
  ).setURL(
    counterMetadataUrl(
      guildId,
      number
    )
  );
}

// ============================================================
// STORAGE PAYLOADS
// ============================================================

function storagePayload(state, guildId) {
  return {
    content: "",
    embeds: [
      stateEmbed(state, guildId)
    ],
    allowedMentions: NONE
  };
}

function counterPayload(number, guildId) {
  return {
    content: "",
    embeds: [
      counterEmbed(number, guildId)
    ],
    allowedMentions: NONE
  };
}

// ============================================================
// SCAN CHANNEL MESSAGES
// ============================================================

async function scan(
  channel,
  callback,
  pages = 200
) {
  let before;

  for (
    let page = 0;
    page < pages;
    page++
  ) {
    const batch =
      await channel.messages.fetch({
        limit: 100,
        cache: false,
        ...(before ? { before } : {})
      });

    if (!batch.size) {
      return;
    }

    for (const message of batch.values()) {
      await callback(message);
    }

    if (batch.size < 100) {
      return;
    }

    before =
      batch.last().id;
  }
}

// ============================================================
// SAVE STATE
// ============================================================

async function saveState(channel, entry) {
  const storage =
    await textChannel(
      channel.guild,
      IDS.data,
      "Ticket data"
    );

  const payload =
    storagePayload(
      entry.state,
      channel.guild.id
    );

  let message = null;

  if (entry.storageMessageId) {
    try {
      message =
        await storage.messages.edit(
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
    message =
      await storage.send(payload);

    entry.storageMessageId =
      message.id;
  }

  entry.needsMigration = false;

  tickets.set(
    channel.id,
    entry
  );

  return message;
}

// ============================================================
// INITIALIZE STORAGE
// ============================================================

async function init(guild) {
  if (initialized) {
    return;
  }

  if (initialization) {
    return initialization;
  }

  initialization = (async () => {
    const data =
      await textChannel(
        guild,
        IDS.data,
        "Ticket data"
      );

    const logs =
      await textChannel(
        guild,
        IDS.logs,
        "Ticket logs"
      );

    let highest = 0;
    let counterMessage = null;

    function processMessage(
      message,
      inData
    ) {
      if (
        message.author.id !==
        guild.client.user.id
      ) {
        return;
      }

      const state =
        parseState(message);

      if (state) {
        highest = Math.max(
          highest,
          state.number
        );

        const previous =
          tickets.get(state.channelId);

        if (
          !previous ||
          (
            inData &&
            !previous.storageMessageId
          )
        ) {
          tickets.set(
            state.channelId,
            {
              state,

              storageMessageId:
                inData
                  ? message.id
                  : null,

              recovered: false,

              needsMigration:
                inData &&
                Boolean(message.content)
            }
          );
        }
      }

      const counter =
        parseCounter(message);

      if (counter !== null) {
        highest = Math.max(
          highest,
          counter
        );

        if (
          inData &&
          !counterMessage
        ) {
          counterMessage = message;
        }
      }

      if (
        message.content.startsWith(
          OLD_COUNTER_PREFIX
        )
      ) {
        try {
          const old =
            JSON.parse(
              message.content.slice(
                OLD_COUNTER_PREFIX.length
              )
            );

          const total =
            Object.values(old)
              .map(Number)
              .filter(Number.isSafeInteger)
              .reduce(
                (sum, number) =>
                  sum + number,
                0
              );

          highest = Math.max(
            highest,
            total
          );
        } catch {
          // Ignore damaged legacy counters.
        }
      }
    }

    await scan(
      data,
      message =>
        processMessage(message, true)
    );

    if (logs.id !== data.id) {
      await scan(
        logs,
        message =>
          processMessage(message, false)
      );
    }

    await guild.channels.fetch();
    await guild.roles.fetch();

    for (
      const channel
      of guild.channels.cache.values()
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

      await counterMessage.edit(
        counterPayload(highest, guild.id)
      );
    } else {
      const message =
        await data.send(
          counterPayload(highest, guild.id)
        );

      counterMessageId =
        message.id;
    }

    let migrated = 0;

    for (const [id, entry] of tickets) {
      if (
        entry.storageMessageId &&
        !entry.needsMigration
      ) {
        continue;
      }

      const channel =
        guild.channels.cache.get(id) ||
        await guild.channels.fetch(id)
          .catch(() => null);

      if (
        channel?.type ===
        ChannelType.GuildText
      ) {
        try {
          await saveState(channel, entry);

          migrated++;
        } catch (error) {
          console.error(
            `[TICKETS] Migration ${id}:`,
            error
          );
        }
      } else if (
        entry.storageMessageId &&
        entry.needsMigration
      ) {
        try {
          const oldMessage =
            await data.messages.fetch(
              entry.storageMessageId
            );

          await oldMessage.edit(
            storagePayload(
              entry.state,
              guild.id
            )
          );

          entry.needsMigration = false;

          migrated++;
        } catch (error) {
          console.error(
            `[TICKETS] Archived migration ${id}:`,
            error
          );
        }
      }
    }

    initialized = true;

    console.log(
      `[TICKETS] Loaded ${tickets.size} tickets.`
    );

    console.log(
      `[TICKETS] Global counter: ${globalCounter}`
    );

    console.log(
      `[TICKETS] Migrated ${migrated} records.`
    );
  })();

  try {
    await initialization;
  } finally {
    initialization = null;
  }
}

// ============================================================
// GLOBAL TICKET COUNTER
// ============================================================

async function nextNumber(guild) {
  await init(guild);

  const storage =
    await textChannel(
      guild,
      IDS.data,
      "Ticket data"
    );

  let message =
    counterMessageId
      ? await storage.messages.fetch(
          counterMessageId
        ).catch(() => null)
      : null;

  if (!message) {
    message =
      await storage.send(
        counterPayload(
          globalCounter,
          guild.id
        )
      );

    counterMessageId =
      message.id;
  }

  const stored =
    parseCounter(message);

  if (
    stored !== null &&
    Number.isSafeInteger(stored) &&
    stored >= 0
  ) {
    globalCounter = Math.max(
      globalCounter,
      stored
    );
  }

  globalCounter++;

  await message.edit(
    counterPayload(
      globalCounter,
      guild.id
    )
  );

  return globalCounter;
}

// ============================================================
// LEGACY TOPIC RECOVERY
// ============================================================

function fromTopic(channel) {
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

    return normalizeState({
      ...JSON.parse(raw),
      channelId: channel.id
    });
  } catch {
    return null;
  }
}

// ============================================================
// VALID ORIGINAL WELCOME MESSAGE
// ============================================================

function validWelcome(
  message,
  parsed,
  botId
) {
  if (message.author.id !== botId) {
    return false;
  }

  const hasButtons =
    message.components.some(row =>
      row.components.some(component =>
        Object.values(BUTTONS).includes(
          component.customId
        ) ||
        String(
          component.customId || ""
        ).startsWith(
          "chuppys_ticket:"
        )
      )
    );

  const validTitle =
    message.embeds.some(embed => {
      const title =
        String(embed.title || "")
          .toLowerCase();

      const match =
        title.match(/#\s*0*(\d+)/);

      if (
        !match ||
        Number(match[1]) !== parsed.number
      ) {
        return false;
      }

      return (
        title.includes(
          TYPES[parsed.type]
            .label.toLowerCase()
        ) ||
        (
          parsed.type === "cashout" &&
          title.includes("cashout")
        )
      );
    });

  return validTitle && hasButtons;
}

function extractOwner(message) {
  for (const embed of message.embeds) {
    const description =
      String(embed.description || "");

    const match =
      description.match(
        /(?:welcome|opened by|created by|creator)\s*:?\s*<@!?(\d{17,20})>/i
      );

    if (match) {
      return match[1];
    }
  }

  const match =
    String(message.content || "").match(
      /<@!?(\d{17,20})>/
    );

  return match?.[1] || null;
}

// ============================================================
// RECOVER OLD TICKET
// ============================================================

async function recoverTicket(channel) {
  const parsed =
    parseTicketName(channel.name);

  if (!parsed) {
    return null;
  }

  let before;

  for (
    let page = 0;
    page < 10;
    page++
  ) {
    const batch =
      await channel.messages.fetch({
        limit: 100,
        ...(before ? { before } : {})
      });

    for (const message of batch.values()) {
      if (
        !validWelcome(
          message,
          parsed,
          channel.client.user.id
        )
      ) {
        continue;
      }

      const ownerId =
        extractOwner(message);

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
            message.id,

          closeControlMessageId:
            null,

          closeReason:
            "No further action required.",

          transcriptUrl: null,

          createdAt:
            message.createdAt.toISOString()
        },

        storageMessageId: null,
        recovered: true
      };

      await saveState(channel, entry);

      return entry;
    }

    if (batch.size < 100) {
      break;
    }

    before =
      batch.last().id;
  }

  return null;
}

// ============================================================
// LOAD TICKET STATE
// ============================================================

async function loadState(channel) {
  if (
    channel?.type !==
    ChannelType.GuildText
  ) {
    return null;
  }

  await init(channel.guild);

  if (tickets.has(channel.id)) {
    return tickets.get(channel.id);
  }

  const legacy =
    fromTopic(channel);

  if (legacy) {
    const entry = {
      state: legacy,
      storageMessageId: null,
      recovered: false
    };

    await saveState(channel, entry);

    return entry;
  }

  return recoverTicket(channel);
}

// ============================================================
// DUPLICATE TICKET PREVENTION
// ============================================================

async function existingTicket(
  guild,
  userId,
  type
) {
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
      guild.channels.cache.get(
        state.channelId
      ) ||
      await guild.channels.fetch(
        state.channelId
      ).catch(() => null);

    if (channel) {
      return channel;
    }
  }

  await guild.channels.fetch();

  for (
    const channel
    of guild.channels.cache.values()
  ) {
    if (
      channel.type !==
        ChannelType.GuildText ||
      tickets.has(channel.id)
    ) {
      continue;
    }

    const parsed =
      parseTicketName(channel.name);

    if (
      !parsed ||
      parsed.closed ||
      parsed.type !== type
    ) {
      continue;
    }

    const entry =
      await recoverTicket(channel)
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
// PERMISSIONS
// ============================================================

const FULL = [
  P.ViewChannel,
  P.SendMessages,
  P.ReadMessageHistory,
  P.AttachFiles
];

const READ_ONLY = [
  P.ViewChannel,
  P.ReadMessageHistory
];

const WRITE_PERMISSIONS = [
  P.SendMessages,
  P.AttachFiles
];

const BOT_PERMISSIONS = [
  ...FULL,
  P.EmbedLinks,
  P.ManageChannels,
  P.ManageMessages
];

function permissionEntry(
  id,
  type,
  closed
) {
  return {
    id,
    type,

    allow:
      closed
        ? READ_ONLY
        : FULL,

    deny:
      closed
        ? WRITE_PERMISSIONS
        : []
  };
}

// ============================================================
// PRIVATE CATEGORY LOOKUP / CREATION
// ============================================================

async function ensurePrivateCategory(
  guild,
  type
) {
  const key =
    `${guild.id}:${type}`;

  const running =
    categoryJobs.get(key);

  if (running) {
    return running;
  }

  const job = (async () => {
    await guild.channels.fetch();
    await guild.roles.fetch();

    const config = TYPES[type];

    if (
      type !== "verification" &&
      type !== "unblacklist"
    ) {
      throw new Error(
        "Invalid private category type."
      );
    }

    const configuredId =
      type === "verification"
        ? VERIFICATION_TICKET_CATEGORY_ID
        : process.env.UNBLACKLIST_TICKET_CATEGORY_ID;

    if (configuredId) {
      const configured =
        guild.channels.cache.get(
          configuredId
        ) ||
        await guild.channels.fetch(
          configuredId
        ).catch(() => null);

      if (
        !configured ||
        configured.type !==
          ChannelType.GuildCategory
      ) {
        throw new Error(
          `Configured ${type} category ID is invalid.`
        );
      }

      if (
        configured.children.cache.size >= 50
      ) {
        throw new Error(
          `The configured ${type} category is full.`
        );
      }

      console.log(
        `[TICKETS] Reusing configured ${type} category: ${configured.id}`
      );

      return configured;
    }

    const categories = [
      ...guild.channels.cache.values()
    ].filter(channel =>
      channel.type ===
      ChannelType.GuildCategory
    );

    for (const alias of config.categories) {
      const normalized =
        normalizeCategoryName(alias);

      const found =
        categories.find(channel =>
          normalizeCategoryName(
            channel.name
          ) === normalized &&
          channel.children.cache.size < 50
        );

      if (found) {
        console.log(
          `[TICKETS] Reusing existing ${type} category: ${found.name} (${found.id})`
        );

        return found;
      }
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

    for (const roleId of staffRoles) {
      if (guild.roles.cache.has(roleId)) {
        overwrites.push({
          id: roleId,
          type: OverwriteType.Role,
          allow: FULL
        });
      }
    }

    const categoryName =
      type === "verification"
        ? VERIFICATION_CATEGORY_NAME
        : UNBLACKLIST_CATEGORY_NAME;

    const created =
      await guild.channels.create({
        name: categoryName,

        type:
          ChannelType.GuildCategory,

        permissionOverwrites:
          overwrites,

        reason:
          `Chuppys private ${type} ticket category`
      });

    console.log(
      `[TICKETS] Created ${type} category: ${created.id}`
    );

    return created;
  })();

  categoryJobs.set(key, job);

  try {
    return await job;
  } finally {
    if (
      categoryJobs.get(key) === job
    ) {
      categoryJobs.delete(key);
    }
  }
}

async function ensureVerificationCategory(guild) {
  return ensurePrivateCategory(
    guild,
    "verification"
  );
}

async function ensureUnblacklistCategory(guild) {
  return ensurePrivateCategory(
    guild,
    "unblacklist"
  );
}

// ============================================================
// CATEGORY LOOKUP
// ============================================================

async function category(guild, type) {
  const config = TYPES[type];

  if (!config) {
    throw new Error(
      `Invalid ticket type: ${type}`
    );
  }

  if (type === "verification") {
    return ensureVerificationCategory(guild);
  }

  if (type === "unblacklist") {
    return ensureUnblacklistCategory(guild);
  }

  const configuredId =
    process.env[config.env];

  if (configuredId) {
    const configured =
      guild.channels.cache.get(
        configuredId
      ) ||
      await guild.channels.fetch(
        configuredId
      ).catch(() => null);

    if (
      configured?.type ===
      ChannelType.GuildCategory
    ) {
      return configured;
    }
  }

  await guild.channels.fetch();

  const categories = [
    ...guild.channels.cache.values()
  ].filter(channel =>
    channel.type ===
    ChannelType.GuildCategory
  );

  for (const name of config.categories) {
    const found =
      categories.find(channel =>
        normalizeCategoryName(
          channel.name
        ) ===
        normalizeCategoryName(name)
      );

    if (found) {
      return found;
    }
  }

  if (type === "support") {
    const found =
      categories.find(channel =>
        channel.name
          .toLowerCase()
          .includes("support")
      );

    if (found) {
      return found;
    }
  }

  throw new Error(
    `Could not find the ${config.label} category. ` +
    `Check ${config.env} in Render.`
  );
}

// ============================================================
// TICKET PERMISSION BUILDER
// ============================================================

async function permissions(guild, state) {
  const closed =
    state.status === "closed";

  const claimed =
    Boolean(state.claimedBy);

  const trading =
    isTradingTicket(state);

  const claimedTrading =
    trading && claimed;

  const result = new Map();

  function add(entry) {
    result.set(entry.id, entry);
  }

  function allowRole(id) {
    if (!guild.roles.cache.has(id)) {
      return;
    }

    add(
      permissionEntry(
        id,
        OverwriteType.Role,
        closed
      )
    );
  }

  function allowMember(id) {
    if (!id) {
      return;
    }

    add(
      permissionEntry(
        id,
        OverwriteType.Member,
        closed
      )
    );
  }

  add({
    id: guild.roles.everyone.id,
    type: OverwriteType.Role,
    allow: [],

    deny: [
      P.ViewChannel,
      P.SendMessages,
      P.AttachFiles
    ]
  });

  add({
    id: guild.client.user.id,
    type: OverwriteType.Member,
    allow: BOT_PERMISSIONS,
    deny: []
  });

  // Verification permissions.

  if (isVerificationTicket(state)) {
    for (
      const roleId
      of VERIFICATION_STAFF_ROLES
    ) {
      allowRole(roleId);
    }

    allowMember(guild.ownerId);
    allowMember(state.ownerId);

    if (state.claimedBy) {
      allowMember(state.claimedBy);
    }

    return [...result.values()];
  }

  // Private unblacklist appeals.

  if (isAppealTicket(state)) {
    for (
      const roleId
      of UNBLACKLIST_STAFF_ROLES
    ) {
      allowRole(roleId);
    }

    allowMember(guild.ownerId);
    allowMember(state.ownerId);

    if (state.claimedBy) {
      allowMember(state.claimedBy);
    }

    return [...result.values()];
  }

  // Owner and support access.

  allowRole(IDS.owner);
  allowRole(IDS.support);

  allowMember(guild.ownerId);

  // Admin and mod before trading claim.

  if (!claimedTrading) {
    allowRole(IDS.admin);
    allowRole(IDS.mod);
  }

  // Seller access before claim.

  if (trading && !claimed) {
    allowRole(IDS.seller);
  }

  // Restrict other sellers after claim.

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

  allowMember(state.ownerId);

  if (state.claimedBy) {
    allowMember(state.claimedBy);
  }

  if (result.size > 100) {
    throw new Error(
      "Ticket exceeds Discord's permission overwrite limit."
    );
  }

  return [...result.values()];
}

// ============================================================
// TRADING CLAIM PRIVACY CHECK
// ============================================================

async function checkClaimPrivacy(
  channel,
  state
) {
  if (
    !state.claimedBy ||
    !isTradingTicket(state)
  ) {
    return;
  }

  const fresh =
    await channel.guild.channels.fetch(
      channel.id,
      { force: true }
    );

  if (!fresh) {
    throw new Error(
      "Could not verify ticket channel."
    );
  }

  const overwrites =
    fresh.permissionOverwrites.cache;

  const everyone =
    overwrites.get(
      channel.guild.roles.everyone.id
    );

  if (!everyone?.deny.has(P.ViewChannel)) {
    throw new Error(
      "Ticket privacy error: @everyone is not hidden."
    );
  }

  const sellerOverwrite =
    overwrites.get(IDS.seller);

  if (
    channel.guild.roles.cache.has(
      IDS.seller
    ) &&
    !sellerOverwrite?.deny.has(
      P.ViewChannel
    )
  ) {
    throw new Error(
      "Ticket privacy error: seller role is not restricted."
    );
  }

  const claimerOverwrite =
    overwrites.get(state.claimedBy);

  if (
    !claimerOverwrite ||
    claimerOverwrite.type !==
      OverwriteType.Member ||
    !claimerOverwrite.allow.has(
      P.ViewChannel
    )
  ) {
    throw new Error(
      "Ticket privacy error: claimer lacks access."
    );
  }

  const buyerOverwrite =
    overwrites.get(state.ownerId);

  if (
    !buyerOverwrite ||
    !buyerOverwrite.allow.has(
      P.ViewChannel
    )
  ) {
    throw new Error(
      "Ticket privacy error: creator lacks access."
    );
  }

  for (
    const roleId
    of [IDS.admin, IDS.mod]
  ) {
    if (
      overwrites.get(roleId)
        ?.allow.has(P.ViewChannel)
    ) {
      throw new Error(
        "Ticket privacy error: additional staff role has access."
      );
    }
  }

  const allowedMembers = new Set([
    state.ownerId,
    state.claimedBy,
    channel.guild.ownerId,
    channel.guild.client.user.id
  ]);

  const allowedRoles = new Set([
    IDS.owner,
    IDS.support
  ]);

  for (const overwrite of overwrites.values()) {
    if (!overwrite.allow.has(P.ViewChannel)) {
      continue;
    }

    if (
      overwrite.type ===
      OverwriteType.Member &&
      !allowedMembers.has(overwrite.id)
    ) {
      throw new Error(
        "Unexpected member has ticket access: " +
        overwrite.id
      );
    }

    if (
      overwrite.type ===
      OverwriteType.Role &&
      !allowedRoles.has(overwrite.id)
    ) {
      throw new Error(
        "Unexpected role has ticket access: " +
        overwrite.id
      );
    }
  }
}

// ============================================================
// PRIVATE VERIFICATION / APPEAL CHECK
// ============================================================

async function checkPrivatePrivacy(
  channel,
  state
) {
  if (
    !isVerificationTicket(state) &&
    !isAppealTicket(state)
  ) {
    return;
  }

  const fresh =
    await channel.guild.channels.fetch(
      channel.id,
      { force: true }
    );

  if (!fresh) {
    throw new Error(
      "Could not verify private ticket."
    );
  }

  const allowedRoleIds = new Set(
    isAppealTicket(state)
      ? UNBLACKLIST_STAFF_ROLES
      : VERIFICATION_STAFF_ROLES
  );

  const allowedMemberIds = new Set([
    state.ownerId,
    state.claimedBy,
    channel.guild.ownerId,
    channel.guild.client.user.id
  ].filter(Boolean));

  const everyone =
    fresh.permissionOverwrites.cache.get(
      channel.guild.roles.everyone.id
    );

  if (!everyone?.deny.has(P.ViewChannel)) {
    throw new Error(
      "Private ticket privacy failed: @everyone is not denied."
    );
  }

  const ownerOverwrite =
    fresh.permissionOverwrites.cache.get(
      state.ownerId
    );

  if (!ownerOverwrite?.allow.has(P.ViewChannel)) {
    throw new Error(
      "Private ticket privacy failed: creator cannot view the ticket."
    );
  }

  const unauthorized = [];

  for (
    const overwrite
    of fresh.permissionOverwrites.cache.values()
  ) {
    if (!overwrite.allow.has(P.ViewChannel)) {
      continue;
    }

    if (
      overwrite.type ===
      OverwriteType.Role &&
      !allowedRoleIds.has(overwrite.id)
    ) {
      unauthorized.push(overwrite.id);
    }

    if (
      overwrite.type ===
      OverwriteType.Member &&
      !allowedMemberIds.has(overwrite.id)
    ) {
      unauthorized.push(overwrite.id);
    }
  }

  if (unauthorized.length) {
    throw new Error(
      "Private ticket privacy failed: " +
      unauthorized.join(", ")
    );
  }
}

// ============================================================
// APPLY TICKET PERMISSIONS
// ============================================================

async function applyPermissions(
  channel,
  state
) {
  const overwrites =
    await permissions(
      channel.guild,
      state
    );

  await channel.permissionOverwrites.set(
    overwrites,
    "Chuppys private ticket permissions"
  );

  await checkClaimPrivacy(channel, state);

  await checkPrivatePrivacy(channel, state);

  if (
    channel.topic?.startsWith(
      "chuppys-ticket:"
    )
  ) {
    await channel.setTopic(null)
      .catch(() => {});
  }
}

// ============================================================
// BUTTON BUILDER
// ============================================================

function ticketButton(
  action,
  label,
  style,
  disabled = false
) {
  return new ButtonBuilder()
    .setCustomId(BUTTONS[action])
    .setLabel(label)
    .setEmoji(BUTTON_EMOJI_OBJECT)
    .setStyle(style)
    .setDisabled(disabled);
}

// ============================================================
// OPEN TICKET BUTTONS
// ============================================================

function controls(state) {
  if (state.status === "closed") {
    return [];
  }

  return [
    new ActionRowBuilder()
      .addComponents(
        ticketButton(
          "claim",
          state.claimedBy
            ? "Claimed"
            : "Claim",
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

// ============================================================
// CLOSED TICKET BUTTONS
// ============================================================

function closedControls() {
  return [
    new ActionRowBuilder()
      .addComponents(
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
// MAIN TICKET PANEL
// ============================================================

function panelPayload() {
  const menu =
    new StringSelectMenuBuilder()
      .setCustomId(SELECT_ID)
      .setPlaceholder(
        "Select a ticket category"
      )
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
      new ActionRowBuilder()
        .addComponents(menu)
    ],

    allowedMentions: NONE
  };
}

// ============================================================
// UPDATE OPENING BUTTONS
// ============================================================

async function updateControls(
  channel,
  state
) {
  if (!state.controlMessageId) {
    return;
  }

  try {
    await channel.messages.edit(
      state.controlMessageId,
      {
        components: controls(state)
      }
    );
  } catch (error) {
    console.error(
      "[TICKETS] Opening button update:",
      error
    );
  }
}

// ============================================================
// FIND CLOSED MESSAGE
// ============================================================

async function findClosedMessage(channel) {
  let before;

  for (
    let page = 0;
    page < 5;
    page++
  ) {
    const messages =
      await channel.messages.fetch({
        limit: 100,
        ...(before ? { before } : {})
      });

    for (const message of messages.values()) {
      if (
        message.author.id !==
        channel.client.user.id
      ) {
        continue;
      }

      if (
        message.embeds.some(
          embed =>
            embed.title === "Ticket Closed"
        )
      ) {
        return message;
      }
    }

    if (messages.size < 100) {
      break;
    }

    before = messages.last().id;
  }

  return null;
}

// ============================================================
// UPDATE CLOSED BUTTONS
// ============================================================

async function updateClosedControls(
  channel,
  state
) {
  let message = null;

  if (state.closeControlMessageId) {
    message =
      await channel.messages.fetch(
        state.closeControlMessageId
      ).catch(() => null);
  }

  if (!message) {
    message =
      await findClosedMessage(channel);
  }

  if (!message) {
    return null;
  }

  await message.edit({
    components: closedControls()
  });

  state.closeControlMessageId =
    message.id;

  return message;
}

// ============================================================
// CLEAR CLOSED BUTTONS
// ============================================================

async function clearClosedControls(
  channel,
  state
) {
  if (!state.closeControlMessageId) {
    return;
  }

  await channel.messages.edit(
    state.closeControlMessageId,
    {
      components: []
    }
  ).catch(console.error);
}

// ============================================================
// SYNC BUTTONS
// ============================================================

async function syncTicketButtons(
  channel,
  entry
) {
  const state = entry.state;

  if (state.controlMessageId) {
    await updateControls(channel, state);
  }

  if (state.status === "closed") {
    const message =
      await updateClosedControls(
        channel,
        state
      );

    if (message) {
      await saveState(channel, entry);
    }
  } else if (
    state.closeControlMessageId
  ) {
    await clearClosedControls(
      channel,
      state
    );

    state.closeControlMessageId = null;

    await saveState(channel, entry);
  }
}

// ============================================================
// SYNC EXISTING TICKETS
// ============================================================

async function syncExistingTickets(guild) {
  await init(guild);

  await guild.channels.fetch();

  const destinations = {};

  for (const type of Object.keys(TYPES)) {
    try {
      destinations[type] =
        await category(guild, type);
    } catch (error) {
      console.error(
        `[TICKETS] Category ${type}:`,
        error.message
      );
    }
  }

  let moved = 0;
  let refreshed = 0;
  let buttonsUpdated = 0;

  for (
    const channel
    of guild.channels.cache.values()
  ) {
    if (
      channel.type !==
      ChannelType.GuildText
    ) {
      continue;
    }

    const parsed =
      parseTicketName(channel.name);

    const cached =
      tickets.get(channel.id);

    if (!parsed && !cached) {
      continue;
    }

    const entry =
      cached ||
      await loadState(channel)
        .catch(() => null);

    if (!entry) {
      continue;
    }

    const target =
      destinations[entry.state.type];

    try {
      if (
        target &&
        channel.parentId !== target.id
      ) {
        await channel.setParent(
          target.id,
          {
            lockPermissions: false
          }
        );

        moved++;
      }

      await queuedTicket(
        channel.id,
        async () => {
          await applyPermissions(
            channel,
            entry.state
          );

          refreshed++;

          await syncTicketButtons(
            channel,
            entry
          );

          buttonsUpdated++;
        }
      );
    } catch (error) {
      console.error(
        `[TICKETS] Sync ${channel.name}:`,
        error
      );
    }
  }

  console.log(
    `[TICKETS] ${moved} tickets moved to correct categories.`
  );

  console.log(
    `[TICKETS] ${refreshed} permissions refreshed.`
  );

  console.log(
    `[TICKETS] ${buttonsUpdated} button layouts processed.`
  );
}

// ============================================================
// FETCH ALL TRANSCRIPT MESSAGES
// ============================================================

async function allMessages(channel) {
  const messages = [];

  let before;

  for (;;) {
    const batch =
      await channel.messages.fetch({
        limit: 100,
        cache: false,
        ...(before ? { before } : {})
      });

    if (!batch.size) {
      break;
    }

    messages.push(
      ...batch.values()
    );

    if (batch.size < 100) {
      break;
    }

    before = batch.last().id;
  }

  return messages.sort(
    (a, b) =>
      a.createdTimestamp -
      b.createdTimestamp
  );
}

// ============================================================
// PERMANENT TRANSCRIPT IMAGE SYSTEM
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
      !/^\/attachments\/\d+\/\d+\//.test(
        url.pathname
      )
    ) {
      return null;
    }

    return url;
  } catch {
    return null;
  }
}

// ============================================================
// DOWNLOAD ATTACHMENT
// ============================================================

async function downloadTranscriptFile(
  url,
  limit = IMAGE_LIMIT
) {
  const valid =
    discordAttachmentUrl(url);

  if (!valid) {
    throw new Error(
      "Invalid Discord attachment URL."
    );
  }

  const response =
    await fetch(valid.href, {
      redirect: "error",

      signal:
        AbortSignal.timeout(
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

  const contentLength =
    Number(
      response.headers.get(
        "content-length"
      )
    );

  if (contentLength > limit) {
    await response.body?.cancel()
      .catch(() => {});

    throw new Error(
      "Attachment exceeds size limit."
    );
  }

  if (!response.body) {
    throw new Error(
      "Attachment has no response body."
    );
  }

  const chunks = [];

  let size = 0;

  for await (
    const chunk
    of response.body
  ) {
    size += chunk.length;

    if (size > limit) {
      throw new Error(
        "Attachment exceeds size limit."
      );
    }

    chunks.push(
      Buffer.from(chunk)
    );
  }

  if (!size) {
    throw new Error(
      "Downloaded attachment is empty."
    );
  }

  return Buffer.concat(
    chunks,
    size
  );
}

// ============================================================
// VALIDATE IMAGE FORMAT
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

// ============================================================
// DETECT IMAGE ATTACHMENTS
// ============================================================

function isImageAttachment(file) {
  return (
    /^image\//i.test(
      file.contentType || ""
    ) ||
    /\.(png|jpe?g|gif|webp)$/i.test(
      file.name || ""
    )
  );
}

// ============================================================
// EMBED ACTUAL IMAGE DATA
// ============================================================

function savedImageHtml(buffer, name) {
  const mime =
    imageMime(buffer);

  if (!mime) {
    throw new Error(
      "Unsupported or invalid image format."
    );
  }

  const data =
    `data:${mime};base64,` +
    buffer.toString("base64");

  return (
    `<figure class="saved-attachment">` +

    `<img src="${data}" ` +

    `alt="${escapeHtml(name)}" ` +

    `style="display:block;` +
    `max-width:100%;` +
    `height:auto;` +
    `border-radius:8px;` +
    `margin:10px 0;">` +

    `<figcaption>` +

    `${escapeHtml(name)}` +

    ` — Saved image` +

    `</figcaption>` +

    `</figure>`
  );
}

// ============================================================
// DOWNLOAD ALL TICKET IMAGES
// ============================================================
//
// Actual images are embedded inside the HTML file.
//
// The image data is stored once per attachment in
// the HTML to avoid unnecessarily doubling its size.
//
// If an image cannot be saved, deletion is cancelled.
//
// ============================================================

async function saveTranscriptImages(messages) {
  const saved = new Map();

  let totalBytes = 0;

  for (const message of messages) {
    for (
      const file
      of message.attachments.values()
    ) {
      if (!isImageAttachment(file)) {
        continue;
      }

      if (saved.has(file.id)) {
        continue;
      }

      let buffer;

      try {
        buffer =
          await downloadTranscriptFile(
            file.url,
            IMAGE_LIMIT
          );
      } catch (error) {
        throw new Error(
          `Could not preserve ${file.name || "image"}: ` +
          error.message
        );
      }

      const html =
        savedImageHtml(
          buffer,
          file.name || "Image"
        );

      totalBytes +=
        Buffer.byteLength(
          html,
          "utf8"
        );

      if (totalBytes > TRANSCRIPT_LIMIT) {
        throw new Error(
          "Saved images exceed the transcript limit. " +
          "Ticket retained to prevent image loss."
        );
      }

      saved.set(file.id, html);
    }
  }

  return saved;
}

// ============================================================
// HTML TRANSCRIPT
// ============================================================

function transcriptHtml(
  channel,
  state,
  messages,
  savedImages = new Map()
) {
  const rows =
    messages.map(message => {
      const author =
        escapeHtml(
          message.author?.username ||
          "Unknown"
        );

      const date =
        escapeHtml(
          new Date(
            message.createdTimestamp
          ).toISOString()
        );

      const body =
        escapeHtml(
          message.content || ""
        );

      const attachments = [
        ...message.attachments.values()
      ].map(file => {
        // Permanent saved image.

        if (savedImages.has(file.id)) {
          return savedImages.get(file.id);
        }

        // Preserve existing links for non-image files.

        if (
          !discordAttachmentUrl(
            file.url
          )
        ) {
          return "";
        }

        return (
          `<p><a href="${escapeHtml(file.url)}">` +

          `${escapeHtml(file.name || "Attachment")}` +

          `</a></p>`
        );
      }).join("");

      const embeds =
        message.embeds.map(embed => {
          const fields =
            (embed.fields || [])
              .map(field =>
                `<p><strong>` +

                `${escapeHtml(field.name)}` +

                `</strong>: ` +

                `${escapeHtml(field.value)}` +

                `</p>`
              ).join("");

          return (
            `<blockquote>` +

            `<b>${escapeHtml(embed.title || "Embed")}</b>` +

            `<p>${escapeHtml(embed.description || "")}</p>` +

            fields +

            `</blockquote>`
          );
        }).join("");

      return (
        `<article>` +

        `<b>${author}</b> <small>${date}</small>` +

        `<div>${body}</div>` +

        embeds +

        attachments +

        `</article>`
      );
    }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Chuppys Ticket Transcript</title>
<style>
body {
  background: #15141c;
  color: white;
  max-width: 850px;
  margin: 30px auto;
  padding: 20px;
  font: 15px/1.6 system-ui;
}
article {
  border-bottom: 1px solid #444;
  padding: 15px 0;
}
article div, p, blockquote {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
blockquote {
  border-left: 3px solid white;
  padding: 10px;
  background: #292734;
}
small {
  color: #aaa;
}
a {
  color: #aaccff;
}
img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}
.saved-attachment {
  margin: 12px 0;
  padding: 10px;
  background: #292734;
  border-radius: 8px;
}
.saved-attachment figcaption {
  color: #aaa;
  font-size: 12px;
  overflow-wrap: anywhere;
}
.archive-information {
  color: #aaa;
  font-size: 13px;
  margin-bottom: 20px;
}
</style>
</head>
<body>
<h1>${escapeHtml(BRAND)} Ticket Transcript</h1>
<p>${escapeHtml(channel.name)} — Ticket #${state.number}</p>
<p class="archive-information">Saved images: ${savedImages.size}</p>
${rows}
</body>
</html>`;
}

// ============================================================
// BUILD TRANSCRIPT ATTACHMENT
// ============================================================

async function buildTranscriptAttachment(
  channel,
  state
) {
  const messages =
    await allMessages(channel);

  const savedImages =
    await saveTranscriptImages(messages);

  const buffer =
    Buffer.from(
      transcriptHtml(
        channel,
        state,
        messages,
        savedImages
      ),
      "utf8"
    );

  if (buffer.length > TRANSCRIPT_LIMIT) {
    throw new Error(
      "Transcript exceeds 7 MB. " +
      "Ticket retained to prevent image loss."
    );
  }

  console.log(
    `[TICKETS] Ticket #${state.number}: ` +
    `${savedImages.size} images permanently saved.`
  );

  return new AttachmentBuilder(
    buffer,
    {
      name:
        `transcript-${state.type}-${state.number}.html`
    }
  );
}

// ============================================================
// PRIVATE ARCHIVE VALIDATION
// ============================================================
//
// Recovered images can contain sensitive information.
//
// Do not upload recovered transcripts to channels
// visible to ordinary server members.
//
// The recovery archive is restricted to Owner/Admin
// role overwrites, the server owner and this bot.
//
// Discord Administrator permission bypasses channel
// overwrites, so review your Administrator roles.
//
// ============================================================

async function validateRecoveryArchive(guild, channel) {
  const fresh =
    await guild.channels.fetch(
      channel.id,
      { force: true }
    );

  if (!fresh?.permissionOverwrites) {
    throw new Error(
      "Could not verify recovery archive permissions."
    );
  }

  const overwrites =
    fresh.permissionOverwrites.cache;

  const everyone =
    overwrites.get(
      guild.roles.everyone.id
    );

  if (
    !everyone?.deny.has(P.ViewChannel) ||
    everyone.allow.has(P.ViewChannel)
  ) {
    throw new Error(
      "The recovery archive must deny View Channel to @everyone."
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
    if (
      !overwrite.allow.has(
        P.ViewChannel
      )
    ) {
      continue;
    }

    if (
      overwrite.type ===
        OverwriteType.Role &&
      !allowedRoles.has(overwrite.id)
    ) {
      throw new Error(
        "Recovery archive must be restricted to Owner/Admin roles."
      );
    }

    if (
      overwrite.type ===
        OverwriteType.Member &&
      !allowedMembers.has(overwrite.id)
    ) {
      throw new Error(
        "Unexpected member has recovery archive access."
      );
    }
  }

  return fresh;
}

// ============================================================
// DECODE OLD HTML ATTACHMENT LINKS
// ============================================================

function decodeTranscriptUrl(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&#x26;/gi, "&");
}

function attachmentKey(url) {
  const parsed =
    discordAttachmentUrl(url);

  if (!parsed) {
    return null;
  }

  const parts =
    parsed.pathname.split("/");

  return `${parts[2]}:${parts[3]}`;
}

// ============================================================
// FETCH ORIGINAL ATTACHMENTS
// ============================================================
//
// If a closed ticket still exists, fetching its original
// messages can provide fresh attachment URLs.
//
// If the channel was deleted, recovery falls back to
// attempting the stored URL.
//
// ============================================================

async function originalAttachmentIndex(
  guild,
  channelId,
  indexes
) {
  if (indexes.has(channelId)) {
    return indexes.get(channelId);
  }

  const result = new Map();

  indexes.set(
    channelId,
    result
  );

  const channel =
    await guild.channels.fetch(
      channelId,
      { force: true }
    ).catch(() => null);

  if (
    !channel?.isTextBased() ||
    !channel.messages?.fetch ||
    channel.guild?.id !== guild.id ||
    !parseTicketName(channel.name)
  ) {
    return result;
  }

  try {
    await scan(
      channel,
      message => {
        for (
          const file
          of message.attachments.values()
        ) {
          result.set(file.id, file);
        }
      },
      Infinity
    );
  } catch (error) {
    console.error(
      "[TICKETS] Original attachment lookup:",
      error.message
    );
  }

  return result;
}

async function findOriginalAttachment(
  guild,
  oldUrl,
  indexes
) {
  const url =
    discordAttachmentUrl(oldUrl);

  if (!url) {
    return null;
  }

  const parts =
    url.pathname.split("/");

  const channelId = parts[2];

  const attachmentId = parts[3];

  const index =
    await originalAttachmentIndex(
      guild,
      channelId,
      indexes
    );

  return index.get(attachmentId) || null;
}

// ============================================================
// RECOVER ONE OLD IMAGE
// ============================================================

async function recoverOldImage(
  guild,
  oldUrl,
  indexes
) {
  const candidates = [];

  // First attempt the original saved URL.

  if (discordAttachmentUrl(oldUrl)) {
    candidates.push(oldUrl);
  }

  // If the old URL fails, look for the original message.

  for (const url of candidates) {
    try {
      return await downloadTranscriptFile(
        url,
        IMAGE_LIMIT
      );
    } catch {
      // Try refreshing from the original message.
    }
  }

  const original =
    await findOriginalAttachment(
      guild,
      oldUrl,
      indexes
    );

  if (original?.url) {
    return downloadTranscriptFile(
      original.url,
      IMAGE_LIMIT
    );
  }

  throw new Error(
    "Original image is unavailable."
  );
}

// ============================================================
// REPAIR OLD HTML TRANSCRIPT
// ============================================================

async function repairOldTranscript(
  guild,
  html,
  indexes
) {
  const pattern =
    /<p>\s*<a href="([^"]+)">([^<]*)<\/a>\s*<\/p>/gi;

  const matches =
    [...html.matchAll(pattern)];

  let recovered = 0;
  let unavailable = 0;

  let output = html;

  for (const match of matches) {
    const oldUrl =
      decodeTranscriptUrl(
        match[1]
      );

    const url =
      discordAttachmentUrl(oldUrl);

    if (!url) {
      continue;
    }

    if (
      !/\.(png|jpe?g|gif|webp)$/i.test(
        url.pathname
      )
    ) {
      continue;
    }

    try {
      const buffer =
        await recoverOldImage(
          guild,
          oldUrl,
          indexes
        );

      const filename =
        decodeURIComponent(
          url.pathname.split("/").pop()
        );

      const replacement =
        savedImageHtml(
          buffer,
          filename || "Recovered image"
        );

      const updated =
        output.replace(
          match[0],
          () => replacement
        );

      if (
        Buffer.byteLength(
          updated,
          "utf8"
        ) > TRANSCRIPT_LIMIT
      ) {
        throw new Error(
          "Recovered transcript exceeds size limit."
        );
      }

      output = updated;

      recovered++;
    } catch {
      unavailable++;
    }
  }

  return {
    html: output,
    recovered,
    unavailable
  };
}

// ============================================================
// OLD TICKET RECOVERY COMMAND
// ============================================================
//
// Usage:
// ,recoverlogs
//
// Owner/Admin only.
//
// Checks all original transcript attachments in the
// logs and transcript channels.
//
// Uploads recovered copies into IDS.transcripts.
//
// Original logs are never deleted or overwritten.
//
// ============================================================

async function recoverLogs(message) {
  const context =
    messageContext(message);

  const member =
    await getMember(context);

  if (
    !isOwner(member) &&
    !isAdmin(member)
  ) {
    return reply(
      context,
      "Only owners and admins can recover ticket logs."
    );
  }

  if (
    ![
      IDS.logs,
      IDS.transcripts
    ].includes(message.channel.id)
  ) {
    return reply(
      context,
      "Use this command inside the private ticket logs or transcripts channel."
    );
  }

  if (recoveryRunning) {
    return reply(
      context,
      "Ticket image recovery is already running."
    );
  }

  recoveryRunning = true;

  let status = null;

  let checked = 0;
  let repaired = 0;
  let recovered = 0;
  let unavailable = 0;
  let skipped = 0;
  let errors = 0;

  try {
    const guild =
      message.guild;

    const archiveChannel =
      await textChannel(
        guild,
        IDS.transcripts,
        "Ticket transcripts"
      );

    const archive =
      await validateRecoveryArchive(
        guild,
        archiveChannel
      );

    const logs =
      await textChannel(
        guild,
        IDS.logs,
        "Ticket logs"
      );

    status =
      await message.reply({
        embeds: [
          whiteEmbed(
            "Recovering Ticket Images",

            "Checking existing ticket transcripts.\n\n" +

            "Available images will be saved permanently " +

            "inside recovered transcript files."
          )
        ],

        allowedMentions: NONE
      });

    const processed = new Set();

    const completed = new Set();

    const indexes = new Map();

    // Discover previously completed recoveries.
    // Prevent duplicate repaired transcripts after restarts.

    await scan(
      archive,
      log => {
        if (
          log.author.id !==
          message.client.user.id
        ) {
          return;
        }

        for (
          const embed
          of log.embeds
        ) {
          if (
            embed.title !==
            "Recovered Ticket Transcript"
          ) {
            continue;
          }

          const key =
            embed.footer?.text?.match(
              /Recovery ID: (\d+)/
            );

          const complete =
            /\*\*Unavailable:\*\*\s*0(?:\D|$)/.test(
              embed.description || ""
            );

          if (key && complete) {
            completed.add(key[1]);
          }
        }
      },
      Infinity
    );

    const sources =
      logs.id === archive.id
        ? [logs]
        : [logs, archive];

    async function updateProgress() {
      if (!status) {
        return;
      }

      await status.edit({
        embeds: [
          whiteEmbed(
            "Recovering Ticket Images",

            `**Transcripts Checked:** ${checked}\n` +

            `**Transcripts Repaired:** ${repaired}\n` +

            `**Images Recovered:** ${recovered}\n` +

            `**Images Unavailable:** ${unavailable}\n` +

            `**Already Recovered:** ${skipped}\n` +

            `**Errors:** ${errors}\n\n` +

            "Recovery is in progress."
          )
        ],

        allowedMentions: NONE
      }).catch(() => {});
    }

    for (const source of sources) {
      await scan(
        source,

        async log => {
          if (
            log.author.id !==
            message.client.user.id
          ) {
            return;
          }

          for (
            const file
            of log.attachments.values()
          ) {
            if (
              !/^transcript-.*\.html$/i.test(
                file.name || ""
              )
            ) {
              continue;
            }

            if (processed.has(file.id)) {
              continue;
            }

            processed.add(file.id);

            if (completed.has(file.id)) {
              skipped++;
              continue;
            }

            checked++;

            try {
              // Fetch current attachment URL
              // rather than relying on cached data.

              const freshMessage =
                await source.messages.fetch({
                  message: log.id,
                  force: true,
                  cache: false
                });

              const freshFile =
                freshMessage.attachments.get(
                  file.id
                );

              if (!freshFile) {
                throw new Error(
                  "Transcript attachment missing."
                );
              }

              const buffer =
                await downloadTranscriptFile(
                  freshFile.url,
                  TRANSCRIPT_LIMIT
                );

              const html =
                buffer.toString("utf8");

              if (
                !html.includes(
                  "Chuppys Ticket Transcript"
                )
              ) {
                throw new Error(
                  "Unrecognized transcript format."
                );
              }

              const result =
                await repairOldTranscript(
                  guild,
                  html,
                  indexes
                );

              unavailable +=
                result.unavailable;

              if (result.recovered > 0) {
                const recoveredFile =
                  new AttachmentBuilder(
                    Buffer.from(
                      result.html,
                      "utf8"
                    ),
                    {
                      name:
                        `recovered-${file.name}`
                    }
                  );

                await validateRecoveryArchive(
                  guild,
                  archive
                );

                await archive.send({
                  embeds: [
                    whiteEmbed(
                      "Recovered Ticket Transcript",

                      `**Original:** [View Log](${log.url})\n` +

                      `**Images Recovered:** ${result.recovered}\n` +

                      `**Unavailable:** ${result.unavailable}`
                    ).setFooter({
                      text:
                        `${BRAND} • Recovery ID: ${file.id}`
                    }).setTimestamp()
                  ],

                  files: [
                    recoveredFile
                  ],

                  allowedMentions: NONE
                });

                recovered +=
                  result.recovered;

                repaired++;

                if (
                  result.unavailable === 0
                ) {
                  completed.add(file.id);
                }
              }
            } catch (error) {
              errors++;

              console.error(
                `[TICKETS] Recovery ${file.name}:`,
                error.message
              );
            }

            if (checked % 10 === 0) {
              await updateProgress();
            }
          }
        },

        Infinity
      );
    }

    await status.edit({
      embeds: [
        whiteEmbed(
          "Ticket Recovery Complete",

          `**Transcripts Checked:** ${checked}\n` +

          `**Transcripts Repaired:** ${repaired}\n` +

          `**Images Recovered:** ${recovered}\n` +

          `**Images Unavailable:** ${unavailable}\n` +

          `**Already Recovered:** ${skipped}\n` +

          `**Errors:** ${errors}\n\n` +

          `Recovered transcripts: <#${IDS.transcripts}>\n\n` +

          "Original transcripts have been preserved.\n" +

          "Unavailable images may have expired, been deleted, " +

          "or exceeded the supported size limit."
        ).setTimestamp()
      ],

      allowedMentions: NONE
    });

    console.log(
      `[TICKETS] Recovery complete: ` +

      `${checked} checked, ` +

      `${repaired} repaired, ` +

      `${recovered} images recovered, ` +

      `${unavailable} unavailable.`
    );
  } catch (error) {
    console.error(
      "[TICKETS] Recovery failed:",
      error
    );

    const description =
      safe(error.message, 500) +

      `\n\n**Transcripts Checked:** ${checked}\n` +

      `**Images Recovered:** ${recovered}\n` +

      `**Images Unavailable:** ${unavailable}`;

    if (status) {
      await status.edit({
        embeds: [
          whiteEmbed(
            "Ticket Recovery Stopped",
            description
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
// TICKET LOGGING
// ============================================================

async function logTicket(
  guild,
  state,
  action,
  actorId,
  channel = null
) {
  const titles = {
    opened: "Ticket Opened",
    claimed: "Ticket Claimed",
    closed: "Ticket Closed",
    deleted: "Ticket Deleted"
  };

  if (!titles[action]) {
    return null;
  }

  const logs =
    await textChannel(
      guild,
      IDS.logs,
      "Ticket logs"
    );

  const name =
    ticketName(
      state.type,
      state.number
    );

  const description =
    `**Ticket:** \`${name}\`\n\n` +

    `**Number:** #${numberText(state.number)}\n` +

    `**Type:** ${TYPES[state.type].label}\n` +

    `**Creator:** <@${state.ownerId}>\n` +

    `**Action By:** <@${actorId}>\n` +

    `**Status:** ${state.status}\n` +

    `**Claimed By:** ${
      state.claimedBy
        ? `<@${state.claimedBy}>`
        : "Not claimed"
    }`;

  const payload = {
    content: "",

    embeds: [
      whiteEmbed(
        titles[action],
        description
      ).setTimestamp()
    ],

    allowedMentions: NONE
  };

  if (
    action === "closed" ||
    action === "deleted"
  ) {
    if (!channel) {
      throw new Error(
        "Ticket channel required for transcript."
      );
    }

    // Never save ticket images to a public logs channel.

    const freshLogs =
      await guild.channels.fetch(
        logs.id,
        { force: true }
      );

    const everyone =
      freshLogs?.permissionOverwrites?.cache.get(
        guild.roles.everyone.id
      );

    if (
      !everyone?.deny.has(P.ViewChannel)
    ) {
      throw new Error(
        "Ticket logs must be private before saving transcripts."
      );
    }

    payload.files = [
      await buildTranscriptAttachment(
        channel,
        state
      )
    ];
  }

  const message =
    await logs.send(payload);

  console.log(
    `[TICKETS] ${titles[action]}: ${name} by ${actorId}`
  );

  return message;
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

  const modal =
    new ModalBuilder()
      .setCustomId(FORM_PREFIX + type)
      .setTitle(
        `${config.label} Ticket`
      );

  config.questions.forEach(
    (question, index) => {
      const appeal =
        type === "unblacklist";

      const input =
        new TextInputBuilder()
          .setCustomId(
            `answer_${index}`
          )
          .setLabel(
            question.slice(0, 45)
          )
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

      if (
        appeal &&
        index === 0
      ) {
        input.setPlaceholder(
          "Explain the original blacklist reason."
        );
      }

      if (
        appeal &&
        index === 1
      ) {
        input.setPlaceholder(
          "Explain why staff should reconsider."
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

// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal(channelId) {
  return new ModalBuilder()
    .setCustomId(
      CLOSE_PREFIX + channelId
    )
    .setTitle("Close Ticket")
    .addComponents(
      new ActionRowBuilder()
        .addComponents(
          new TextInputBuilder()
            .setCustomId("close_reason")
            .setLabel("Reason (optional)")
            .setStyle(
              TextInputStyle.Paragraph
            )
            .setRequired(false)
            .setMaxLength(500)
        )
    );
}

// ============================================================
// VERIFICATION WELCOME EMBED
// ============================================================

function verificationWelcomeDescription(userId) {
  return (
    `Welcome <@${userId}>!\n\n` +

    "Thank you for joining **.gg/chuppys**.\n\n" +

    "Your private verification ticket has been created.\n\n" +

    "**HOW VERIFICATION WORKS**\n\n" +

    "**1.** Wait for a member of the verification team.\n\n" +

    "**2.** Answer the verification questions honestly.\n\n" +

    "**3.** Review the server rules and " +

    "follow staff instructions.\n\n" +

    "**4.** Our team will review your information " +

    "and approve your verification when appropriate.\n\n" +

    "**IMPORTANT**\n\n" +

    "Verification is completed manually by staff.\n\n" +

    "Opening a ticket does not automatically " +

    "give you access to the server.\n\n" +

    "Please remain patient while our team " +

    "reviews your ticket.\n\n" +

    "**SAFETY REMINDER**\n\n" +

    "Never share passwords, account tokens, " +

    "or two-factor authentication codes.\n\n" +

    "Thank you for choosing **.gg/chuppys**!"
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
    const guild =
      interaction.guild;

    const config =
      TYPES[type];

    if (!guild) {
      throw new Error(
        "Ticket creation requires a server."
      );
    }

    if (!config) {
      throw new Error(
        "Invalid ticket type."
      );
    }

    const member =
      await guild.members.fetch({
        user: interaction.user.id,
        force: true
      });

    const blacklisted =
      await isBlacklisted(member);

    // Blacklist validation.

    if (
      type === "unblacklist" &&
      !blacklisted
    ) {
      throw new Error(
        "Only blacklisted members can open an unblacklist appeal."
      );
    }

    if (
      type !== "unblacklist" &&
      blacklisted
    ) {
      throw new Error(
        "You are blacklisted and cannot open normal tickets. " +
        "Please use the unblacklist appeal panel."
      );
    }

    // Verification role validation.

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

    // Duplicate prevention.

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

    // Destination category.

    const parent =
      await category(guild, type);

    if (parent.children.cache.size >= 50) {
      throw new Error(
        "This ticket category is full. Please contact staff."
      );
    }

    // Global ticket numbering.

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

      closeControlMessageId: null,

      closeReason:
        "No further action required.",

      transcriptUrl: null,

      createdAt:
        new Date().toISOString()
    };

    const permissionOverwrites =
      await permissions(guild, state);

    // Create ticket channel.

    const channel =
      await guild.channels.create({
        name:
          ticketName(type, number),

        type:
          ChannelType.GuildText,

        parent:
          parent.id,

        topic: null,

        permissionOverwrites,

        reason:
          `${config.label} ticket opened by ${interaction.user.id}`
      });

    state.channelId = channel.id;

    if (
      isVerificationTicket(state) ||
      isAppealTicket(state)
    ) {
      await checkPrivatePrivacy(
        channel,
        state
      );
    }

    const entry = {
      state,

      storageMessageId: null,

      recovered: false
    };

    await saveState(channel, entry);

    // Form answers.

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

    const proofInstruction =
      type === "partnership"
        ? "\n\n**Please show proof of your vouches in this ticket!**"
        : "";

    // Staff pings.

    let pingRoles;

    if (type === "verification") {
      pingRoles =
        VERIFICATION_STAFF_ROLES;
    } else if (type === "unblacklist") {
      pingRoles =
        UNBLACKLIST_STAFF_ROLES;
    } else if (isTradingTicket(state)) {
      pingRoles = [
        IDS.owner,
        IDS.seller,
        IDS.support
      ];
    } else {
      pingRoles = [
        IDS.owner,
        IDS.support
      ];
    }

    pingRoles = [
      ...new Set(pingRoles)
    ].filter(id =>
      guild.roles.cache.has(id)
    );

    // Welcome message.

    let welcomeDescription;

    if (type === "verification") {
      welcomeDescription =
        verificationWelcomeDescription(
          interaction.user.id
        );
    } else if (type === "unblacklist") {
      welcomeDescription =
        `Welcome <@${interaction.user.id}>!\n\n` +

        "**Unblacklist Appeal**\n\n" +

        "Your appeal has been submitted for review.\n\n" +

        `${details}\n\n` +

        "**Appeal Instructions**\n\n" +

        "• Please provide screenshots or proof.\n" +

        "• Be honest about the circumstances.\n" +

        "• Do not spam the moderation team.\n" +

        "• Wait for an Owner, Admin or Moderator.\n\n" +

        "**Important:** Submitting an appeal " +

        "does not guarantee removal of your blacklist.";
    } else {
      welcomeDescription =
        `Welcome <@${interaction.user.id}>!\n\n` +

        `${details}${proofInstruction}\n\n` +

        "Our team will assist you shortly.";
    }

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
            welcomeDescription
          )
        ],

        components:
          controls(state),

        allowedMentions: {
          parse: [],

          users: [
            interaction.user.id
          ],

          roles: pingRoles
        }
      });

    state.controlMessageId =
      welcome.id;

    await saveState(channel, entry);

    void logTicket(
      guild,
      { ...state },
      "opened",
      interaction.user.id
    ).catch(console.error);

    console.log(
      `[TICKETS] Created ${channel.name}`
    );

    console.log(
      `[TICKETS] Type: ${type}`
    );

    console.log(
      `[TICKETS] Category: ${parent.name} (${parent.id})`
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

async function openVerificationTicket(
  interaction
) {
  if (
    !interaction?.guild ||
    !interaction?.user ||
    !interaction.inGuild()
  ) {
    throw new Error(
      "Verification tickets only work inside the server."
    );
  }

  const member =
    await interaction.guild.members.fetch({
      user: interaction.user.id,
      force: true
    });

  if (await isBlacklisted(member)) {
    throw new Error(
      "Blacklisted members cannot open verification tickets. " +
      "Please use the unblacklist appeal panel."
    );
  }

  if (
    member.roles.cache.has(
      VERIFIED_ROLE_ID
    )
  ) {
    throw new Error(
      "You are already verified."
    );
  }

  return createTicket(
    interaction,
    "verification",
    []
  );
}

// ============================================================
// VERIFICATION BUTTON HANDLER
// ============================================================

async function handleVerificationButton(
  interaction
) {
  await interaction.deferReply({
    flags: EPHEMERAL
  });

  try {
    const result =
      await openVerificationTicket(
        interaction
      );

    return reply(
      interaction,

      result.existing
        ? `You already have a verification ticket: ${result.channel}`
        : `Your private verification ticket is ready: ${result.channel}\n\nPlease wait for staff to assist you.`
    );
  } catch (error) {
    console.error(
      "[VERIFY] Ticket creation:",
      error
    );

    return reply(
      interaction,

      "Could not create verification ticket: " +

      safe(error.message, 500)
    );
  }
}

// ============================================================
// UNBLACKLIST BUTTON HANDLER
// ============================================================

async function handleUnblacklistButton(
  interaction
) {
  if (!interaction.guild) {
    return reply(
      interaction,
      "Unblacklist appeals only work in the server."
    );
  }

  const member =
    await getMember(interaction);

  if (!(await isBlacklisted(member))) {
    return reply(
      interaction,

      "You are not blacklisted. " +

      "Only blacklisted members can open an appeal."
    );
  }

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
  const member =
    await getMember(context);

  const state = entry.state;

  if (
    force &&
    !isOwner(member)
  ) {
    return reply(
      context,
      "Only owners can force-claim tickets."
    );
  }

  if (
    !force &&
    !canClaim(member, state)
  ) {
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
    state.claimedBy &&
    !force
  ) {
    if (
      state.claimedBy === member.id
    ) {
      return reply(
        context,
        "You already claimed this ticket."
      );
    }

    return reply(
      context,
      `This ticket is already claimed by <@${state.claimedBy}>.`
    );
  }

  if (
    force &&
    state.claimedBy === member.id
  ) {
    return reply(
      context,
      "You already claimed this ticket."
    );
  }

  const previousClaimer =
    state.claimedBy;

  state.claimedBy = member.id;

  try {
    await applyPermissions(
      channel,
      state
    );

    await saveState(channel, entry);
  } catch (error) {
    state.claimedBy =
      previousClaimer;

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
  }).catch(console.error);

  void logTicket(
    channel.guild,
    { ...state },
    "claimed",
    member.id
  ).catch(console.error);

  console.log(
    `[TICKETS] ${channel.name} claimed by ${member.id}`
  );

  if (context.kind === "prefix") {
    return;
  }

  return reply(
    context,

    force
      ? "Ticket force-claimed successfully."
      : "Ticket claimed successfully."
  );
}

// ============================================================
// CLOSE TICKET
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
    return reply(
      context,
      "This ticket is already closed."
    );
  }

  const previousStatus =
    state.status;

  const previousReason =
    state.closeReason;

  state.status = "closed";

  state.closeReason =
    reason ||
    "No further action required.";

  try {
    await applyPermissions(
      channel,
      state
    );

    await saveState(channel, entry);
  } catch (error) {
    state.status =
      previousStatus;

    state.closeReason =
      previousReason;

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

  await channel.setName(
    ticketName(
      state.type,
      state.number,
      true
    )
  ).catch(console.error);

  const closedMessage =
    await channel.send({
      embeds: [
        whiteEmbed(
          "Ticket Closed",

          `Closed by <@${member.id}>.\n\n` +

          `**Reason:** ${safe(state.closeReason, 450)}\n\n` +

          "This ticket is now closed."
        )
      ],

      components:
        closedControls(),

      allowedMentions: NONE
    });

  state.closeControlMessageId =
    closedMessage.id;

  await saveState(channel, entry);

  // Save the actual image data.

  const transcriptState = {
    ...state
  };

  const transcriptJob = (async () => {
    const logMessage =
      await logTicket(
        channel.guild,
        transcriptState,
        "closed",
        member.id,
        channel
      );

    state.transcriptUrl =
      logMessage.url;

    await saveState(channel, entry);

    return logMessage;
  })();

  trackTranscriptJob(
    channel.id,
    transcriptJob
  );

  void transcriptJob.catch(async error => {
    console.error(
      "[TICKETS] Closed transcript:",
      error
    );

    await channel.send({
      embeds: [
        whiteEmbed(
          "Transcript Not Saved",

          "The ticket was closed, but its transcript " +

          "could not be fully archived.\n\n" +

          "**Reason:** " +

          safe(error.message, 450) +

          "\n\nThe ticket will not be deleted unless " +

          "a complete new transcript can be saved."
        )
      ],

      allowedMentions: NONE
    }).catch(() => {});
  });

  console.log(
    `[TICKETS] Closed ${channel.name}`
  );

  if (context.kind === "prefix") {
    return;
  }

  return reply(
    context,

    "Ticket closed successfully. " +

    "The transcript is being saved."
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

  const pending =
    transcriptJobs.get(channel.id);

  if (pending) {
    await pending.catch(console.error);
  }

  const previousStatus =
    state.status;

  state.status = "open";

  try {
    await applyPermissions(
      channel,
      state
    );

    await saveState(channel, entry);
  } catch (error) {
    state.status =
      previousStatus;

    await applyPermissions(
      channel,
      state
    ).catch(console.error);

    throw error;
  }

  if (state.closeControlMessageId) {
    await clearClosedControls(
      channel,
      state
    );
  }

  state.closeControlMessageId = null;

  await saveState(channel, entry);

  await updateControls(
    channel,
    state
  );

  await channel.setName(
    ticketName(
      state.type,
      state.number
    )
  ).catch(console.error);

  console.log(
    `[TICKETS] Reopened ${channel.name}`
  );

  return reply(
    context,
    "Ticket reopened successfully."
  );
}

// ============================================================
// DELETE TICKET
// ============================================================
//
// The ticket is NEVER deleted until its new transcript,
// including all supported attached images, has uploaded
// successfully and its metadata is saved.
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
    if (
      state.status !== "closed" &&
      canManage(member, state)
    ) {
      return reply(
        context,
        "Close this ticket first."
      );
    }

    return reply(
      context,
      "You cannot delete this ticket."
    );
  }

  await reply(
    context,
    "Deleting ticket and saving transcript with images..."
  );

  const pending =
    transcriptJobs.get(channel.id);

  if (pending) {
    await pending.catch(console.error);
  }

  let logMessage;

  try {
    logMessage =
      await logTicket(
        channel.guild,
        { ...state },
        "deleted",
        member.id,
        channel
      );
  } catch (error) {
    console.error(
      "[TICKETS] Transcript unavailable:",
      error
    );

    return reply(
      context,

      "Deletion cancelled because the transcript " +

      "or its images could not be saved.\n\n" +

      "**Reason:** " +

      safe(error.message, 400)
    );
  }

  state.transcriptUrl =
    logMessage.url;

  try {
    await saveState(channel, entry);
  } catch (error) {
    console.error(
      "[TICKETS] Storage save failed:",
      error
    );

    return reply(
      context,
      "Deletion cancelled because metadata could not be saved."
    );
  }

  try {
    await channel.delete(
      `Ticket deleted by ${member.id}`
    );
  } catch (error) {
    console.error(
      "[TICKETS] Channel deletion failed:",
      error
    );

    return reply(
      context,
      "The ticket channel could not be deleted."
    );
  }

  tickets.delete(channel.id);

  console.log(
    `[TICKETS] Deleted ${channel.name}`
  );
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

  const existing =
    messages.find(message =>
      message.author.id ===
        interaction.client.user.id &&

      message.components.some(row =>
        row.components.some(component =>
          SELECT_IDS.has(
            component.customId
          )
        )
      )
    );

  if (existing) {
    await existing.edit(panelPayload());
  } else {
    await channel.send(panelPayload());
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
  const type =
    String(
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

  const member =
    await getMember(interaction);

  if (await isBlacklisted(member)) {
    return reply(
      interaction,

      "You are blacklisted and cannot create normal tickets. " +

      "Please use the unblacklist appeal panel."
    );
  }

  if (TYPES[type].questions?.length) {
    return interaction.showModal(
      ticketForm(type)
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  try {
    const result =
      await createTicket(
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
  } catch (error) {
    console.error(
      "[TICKETS] Select error:",
      error
    );

    return reply(
      interaction,

      "Could not open ticket: " +

      safe(error.message, 500)
    );
  }
}

// ============================================================
// TICKET FORM SUBMIT
// ============================================================

async function submitForm(interaction) {
  const type =
    interaction.customId.slice(
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

  try {
    const result =
      await createTicket(
        interaction,
        type,
        answers
      );

    const label =
      TYPES[type].label;

    return reply(
      interaction,

      result.existing
        ? `You already have an open ${label} ticket: ${result.channel}`
        : `Your ${label} ticket is ready: ${result.channel}`
    );
  } catch (error) {
    console.error(
      `[TICKETS] ${type} form error:`,
      error
    );

    return reply(
      interaction,

      "Could not create ticket: " +

      safe(error.message, 500)
    );
  }
}

// ============================================================
// DETECT BUTTON ACTION
// ============================================================

function actionFor(customId) {
  for (
    const [action, id]
    of Object.entries(BUTTONS)
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
    const action =
      customId.slice(
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
    channel.type !==
    ChannelType.GuildText
  ) {
    return reply(
      interaction,
      "This button must be used inside a ticket."
    );
  }

  // Close button opens reason modal.

  if (action === "close") {
    const entry =
      await loadState(channel);

    if (!entry) {
      return reply(
        interaction,
        "Ticket data unavailable."
      );
    }

    const member =
      await getMember(interaction);

    if (
      !canManage(
        member,
        entry.state
      )
    ) {
      return reply(
        interaction,
        "You cannot close this ticket."
      );
    }

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

      if (action === "claim") {
        return claim(
          interaction,
          channel,
          entry
        );
      }

      if (action === "reopen") {
        return reopenTicket(
          interaction,
          channel,
          entry
        );
      }

      if (action === "delete") {
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
// CLOSE MODAL HANDLER
// ============================================================

async function handleCloseForm(interaction) {
  const channelId =
    interaction.customId.slice(
      CLOSE_PREFIX.length
    );

  if (
    channelId !==
    interaction.channelId
  ) {
    return reply(
      interaction,
      "This form belongs to another ticket."
    );
  }

  const reason =
    interaction.fields.getTextInputValue(
      "close_reason"
    ).trim();

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return queuedTicket(
    interaction.channel.id,

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
// PREFIX COMMAND HANDLER
// ============================================================

async function handlePrefix(message) {
  if (
    !message.guild ||
    message.author.bot ||
    !message.content.startsWith(PREFIX)
  ) {
    return;
  }

  const raw =
    message.content.slice(
      PREFIX.length
    ).trim();

  const [commandName] =
    raw.split(/\s+/, 1);

  const name =
    String(
      commandName || ""
    ).toLowerCase();

  if (!PREFIX_COMMANDS.has(name)) {
    return;
  }

  if (
    message.channel.type !==
    ChannelType.GuildText
  ) {
    return;
  }

  // Old transcript image recovery.
  // Does not require an active ticket channel.

  if (name === "recoverlogs") {
    return recoverLogs(message);
  }

  const context =
    messageContext(message);

  const reason =
    raw.slice(
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
      }
    }
  );
}

// ============================================================
// SINGLE HANDLER INSTALLATION
// ============================================================

function setupTickets(client) {
  const INSTALL_KEY =
    Symbol.for(
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

  client.__chuppysTicketsInstalled =
    true;

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
    if (readyStarted) {
      return;
    }

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

      await guild.roles.fetch();

      await init(guild);

      // Reuse verification category.

      const verifyCategory =
        await ensureVerificationCategory(
          guild
        );

      console.log(
        `[VERIFY] Using category: ${verifyCategory.name} (${verifyCategory.id})`
      );

      // Reuse unblacklist category.

      const appealCategory =
        await ensureUnblacklistCategory(
          guild
        );

      console.log(
        `[UNBLACKLIST] Using category: ${appealCategory.name} (${appealCategory.id})`
      );

      // Restore existing tickets.

      await syncExistingTickets(guild);

      console.log(
        "[TICKETS] Chuppys ticket system ready."
      );

      console.log(
        `[TICKETS] Next number: ${globalCounter + 1}`
      );

      console.log(
        `[TICKETS] Seller role: ${IDS.seller}`
      );

      console.log(
        `[TICKETS] Support role: ${IDS.support}`
      );

      console.log(
        `[TICKETS] Owner role: ${IDS.owner}`
      );

      console.log(
        `[TICKETS] Admin role: ${IDS.admin}`
      );

      console.log(
        `[TICKETS] Mod role: ${IDS.mod}`
      );

      console.log(
        `[TICKETS] Listed sellers: ${SELLER_USER_IDS.size}`
      );

      console.log(
        `[TICKETS] Button emoji: ${BUTTON_EMOJI}`
      );

      console.log(
        "[TICKETS] All seven ticket categories enabled."
      );

      console.log(
        "[TICKETS] Purchase / Cash Out claim privacy enabled."
      );

      console.log(
        "[VERIFY] Verification ticket creation owned by tickets.js."
      );

      console.log(
        `[VERIFY] Verification button: ${VERIFY_TICKET_BUTTON_ID}`
      );

      console.log(
        "[VERIFY] Existing verification category reused."
      );

      console.log(
        "[VERIFY] Verification tickets use global ticket numbers."
      );

      console.log(
        "[VERIFY] Verification does not grant roles automatically."
      );

      console.log(
        "[VERIFY] Verification ticket embeds contain no commands."
      );

      console.log(
        "[VERIFY] Verification privacy enabled."
      );

      console.log(
        "[UNBLACKLIST] Appeals enabled."
      );

      console.log(
        "[UNBLACKLIST] Owner/Admin/Mod-only appeal staff access."
      );

      console.log(
        "[TICKETS] Blacklisted members restricted from normal tickets."
      );

      console.log(
        "[TICKETS] Global numbering preserved."
      );

      console.log(
        "[TICKETS] Private V3 metadata preserved."
      );

      console.log(
        "[TICKETS] Legacy recovery enabled."
      );

      console.log(
        "[TICKETS] Embed-only storage enabled."
      );

      console.log(
        "[TICKETS] HTML transcripts enabled."
      );

      console.log(
        "[TICKETS] Permanent transcript images enabled."
      );

      console.log(
        "[TICKETS] Old transcript recovery enabled."
      );

      console.log(
        "[TICKETS] Recovery command: ,recoverlogs"
      );

      console.log(
        "[TICKETS] Recovery is Owner/Admin only."
      );

      console.log(
        `[TICKETS] Logs channel: ${IDS.logs}`
      );

      console.log(
        `[TICKETS] Recovered transcripts channel: ${IDS.transcripts}`
      );

      console.log(
        "[TICKETS] Image saving deletion protection enabled."
      );

      console.log(
        "[TICKETS] Claim / Close / Reopen / Delete enabled."
      );

      console.log(
        "[TICKETS] No full-server member fetches."
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
    void onReady().catch(
      console.error
    );
  }

  // ==========================================================
  // PREFIX COMMAND LISTENER
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

      const commandName =
        message.content
          .slice(PREFIX.length)
          .trim()
          .split(/\s+/, 1)[0]
          ?.toLowerCase();

      if (!PREFIX_COMMANDS.has(commandName)) {
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
        await handlePrefix(message);
      } catch (error) {
        console.error(
          "[TICKETS] Prefix error:",
          error
        );

        await message.reply({
          content:
            "Ticket error: " +

            safe(error.message),

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

      // Verification button.

      const isVerification =
        interaction.isButton() &&

        (
          interaction.customId ===
            VERIFY_TICKET_BUTTON_ID ||

          interaction.customId ===
            LEGACY_SECURE_VERIFY_BUTTON_ID
        );

      // Unblacklist button.

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

          safe(error.message)
        ).catch(() => {});
      }
    }
  );

  console.log(
    "[TICKETS] Single ticket handler installed."
  );

  console.log(
    "[TICKETS] Claim and Close buttons connected."
  );

  console.log(
    "[TICKETS] Reopen and Delete buttons connected."
  );

  console.log(
    "[TICKETS] All buttons use uppyty."
  );

  console.log(
    "[VERIFY] Verification button connected."
  );

  console.log(
    "[VERIFY] Existing category reuse enabled."
  );

  console.log(
    "[VERIFY] Verification ticket commands hidden from embeds."
  );

  console.log(
    "[UNBLACKLIST] Appeal button connected."
  );

  console.log(
    "[TICKETS] Storage is embed-only."
  );

  console.log(
    "[TICKETS] No visible metadata JSON above embeds."
  );

  console.log(
    "[TICKETS] Permanent image saving installed."
  );

  console.log(
    "[TICKETS] Old image recovery installed."
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports =
  setupTickets;

module.exports.command =
  command;

module.exports.openVerificationTicket =
  openVerificationTicket;

// ============================================================
// END OF CHUPPYS TICKETS.JS
// ============================================================
