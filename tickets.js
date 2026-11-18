
"use strict";

// ============================================================
// CHUPPYS TICKET SYSTEM
// DISCORD.JS V14 / RENDER
// ============================================================
//
// FIXED:
//
// - Storage messages send ONLY embeds
// - No visible metadata JSON above embeds
// - V3 metadata recoverable from embed URLs
// - Old V3 and legacy metadata still readable
// - Existing storage messages migrated to embed-only
// - Global counter uses an embed-only message
// - Global numbering preserved across restarts
// - No full-server member fetching when claiming
// - No Gateway opcode 8 member-list requests
// - Sellers can claim Purchase and Cash Out tickets
// - Claim button and ,claim share the same handler
// - Claimed trading tickets hide other sellers
// - Exact claiming member retains access
// - Owner and Ticket Support retain access
// - Ticket creator retains access
// - Forceclaim updates the claiming member
// - Existing ticket permissions can be repaired
//
// PRESERVED:
//
// /ticketpanel
//
// ,claim
// ,forceclaim
// ,close
// ,close <reason>
// ,reopen
// ,delete
//
// Purchase
// Cash Out
// Giveaway
// Partnership
// Support
// Verification
//
// Claim / Close buttons
// Reopen / Delete buttons
// Uppyty button emoji
//
// Private V3 metadata
// Legacy metadata recovery
// Global ticket counter
// HTML transcripts
// Ticket logs
// Duplicate ticket prevention
//
// IMPORTANT:
//
// Metadata is encoded inside the storage embed's
// title URL instead of visible message content.
//
// Keep the private data channel restricted.
//
// Discord administrators and the server owner
// can bypass channel permission overwrites.
//
// Run one Render bot instance.
//
// ============================================================

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
// SELLER USER IDS
// ============================================================
//
// Retained for reference.
//
// These IDs are NOT fetched as a full member list.
//
// Seller claim permission is determined using
// the member's actual Seller role.
//
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

// ============================================================
// VERIFICATION
// ============================================================

const VERIFY_TICKET_BUTTON_ID =
  "chuppys_create_verification_ticket";

const VERIFIED_ROLE_ID =
  "1550230619127021568";

const VERIFICATION_CATEGORY_NAME =
  "chuppys-verification";

const VERIFICATION_STAFF_ROLES = [
  IDS.owner,
  IDS.admin,
  IDS.mod
];

// ============================================================
// PRIVATE DATA PREFIXES
// DO NOT CHANGE
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

// ============================================================
// EMBED-ONLY STORAGE IDENTIFIERS
// ============================================================
//
// These keys hold metadata inside embed URLs.
//
// They do not appear as message content.
//
// Existing prefix constants remain unchanged
// so legacy records can still be recovered.
//
// ============================================================

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

    categories: [
      VERIFICATION_CATEGORY_NAME,
      "Verification tickets",
      "Verification ticket",
      "Verification",
      "Verify tickets",
      "Verify"
    ],

    description:
      "Please explain what you need help with while verifying."
  }
});

// ============================================================
// /TICKETPANEL
// ============================================================

const command = new SlashCommandBuilder()
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

let creationQueue = Promise.resolve();

const ticketQueues = new Map();

const transcriptJobs = new Map();

const categoryJobs = new Map();

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
    ticketQueues.get(id) ||
    Promise.resolve();

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

function trackTranscriptJob(id, job) {
  const tracked = Promise.resolve(job);

  transcriptJobs.set(id, tracked);

  void tracked.finally(() => {
    if (transcriptJobs.get(id) === tracked) {
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
  return String(number).padStart(4, "0");
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
  const match = String(name || "").match(
    /^(closed-)?(purchase|purchasing|cashout|cash-out|giveaway|partnership|support|verification)-(\d+)$/i
  );

  if (!match) return null;

  let type = match[2].toLowerCase();

  if (type === "purchasing") {
    type = "purchase";
  }

  if (type === "cash-out") {
    type = "cashout";
  }

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
// EMBED-ONLY METADATA ENCODING
// ============================================================
//
// IMPORTANT:
//
// Discord does not provide invisible custom
// fields on normal message embeds.
//
// To retain restart-safe metadata without
// placing JSON above the embed, we encode
// the state into the embed title URL.
//
// The visible message contains only an embed.
//
// The title links to the Discord ticket
// channel with an encoded state parameter.
//
// The metadata is still recoverable by the
// bot after a full restart.
//
// The data is encoded, NOT encrypted.
// Keep the data channel private.
//
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
    const json = Buffer.from(
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

function metadataUrl(
  guildId,
  state
) {
  const base =
    `https://discord.com/channels/` +
    `${guildId}/${state.channelId}`;

  const encoded =
    encodeStateMetadata(state);

  const url =
    `${base}?${EMBED_STATE_KEY}=${encoded}`;

  if (url.length > 2048) {
    throw new Error(
      "Ticket metadata URL exceeds Discord's embed URL limit."
    );
  }

  return url;
}

function counterMetadataUrl(
  guildId,
  number
) {
  return (
    `https://discord.com/channels/` +
    `${guildId}/${IDS.data}` +
    `?${EMBED_COUNTER_KEY}=${number}`
  );
}

function readEmbedParameter(
  embed,
  key
) {
  const value = embed?.url;

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

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
// GET A SINGLE MEMBER
// ============================================================
//
// IMPORTANT FIX:
//
// Fetch ONLY the member using the command.
//
// Do not use:
//
// guild.members.fetch()
//
// without specifying a user.
//
// Fetching the entire server's member list
// is what caused the opcode 8 rate limit.
//
// ============================================================

async function getMember(context) {
  const guild = context.guild;

  const userId = context.user?.id;

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

// ============================================================
// CLAIM PERMISSIONS
// ============================================================

function canClaim(member, state) {
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
      isMod(member)
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
  if (isVerificationTicket(state)) {
    return isVerificationStaff(member);
  }

  if (
    isOwner(member) ||
    isSupport(member)
  ) {
    return true;
  }

  if (state.claimedBy) {
    return state.claimedBy === member.id;
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
      content
    });
  }

  if (context.replied) {
    return context.followUp({
      content,
      flags: EPHEMERAL,

      allowedMentions: {
        parse: []
      }
    });
  }

  return context.reply({
    content,
    flags: EPHEMERAL,

    allowedMentions: {
      parse: []
    }
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
// OPEN BUTTONS
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
// CLOSED BUTTONS
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
// PANEL PAYLOAD
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
              type !== "verification"
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

    allowedMentions: {
      parse: []
    }
  };
}

// ============================================================
// NORMALIZE SAVED STATES
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
// PARSE V3, EMBED AND LEGACY METADATA
// ============================================================
//
// Supports BOTH storage formats:
//
// OLD:
// Visible STATE_PREFIX plus JSON content.
//
// NEW:
// Empty message content and encoded embed.
//
// This allows old tickets to survive
// migration without resetting numbering.
//
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
      const parsed = normalizeState(
        JSON.parse(
          content.slice(prefix.length)
        )
      );

      if (parsed) {
        return parsed;
      }
    } catch {
      // Try the embed format below.
    }
  }

  for (
    const embed
    of message?.embeds || []
  ) {
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
//
// Supports:
//
// 1. Original counter content prefix
// 2. New embed-only counter URL
// 3. Existing readable counter embed
//
// ============================================================

function parseCounter(message) {
  const content =
    message?.content || "";

  if (
    content.startsWith(
      COUNTER_PREFIX
    )
  ) {
    const number = Number(
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

  for (
    const embed
    of message?.embeds || []
  ) {
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
      const description =
        String(
          embed.description || ""
        );

      const match =
        description.match(
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
// PRIVATE STORAGE EMBED
// ============================================================
//
// ONLY AN EMBED IS SENT.
//
// NO:
// CHUPPYS_PRIVATE_TICKET_METADATA_V3:
// {"channelId": ... }
//
// The embed URL contains encoded metadata.
//
// Visible embed information stays readable.
//
// ============================================================

function stateEmbed(
  state,
  guildId
) {
  const typeLabel =
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
        `Ticket #${numberText(state.number)} • ${typeLabel}`
      )
      .setURL(
        metadataUrl(
          guildId,
          state
        )
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
            `**Category:** ${typeLabel}\n` +
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

// ============================================================
// GLOBAL COUNTER EMBED
// ============================================================
//
// Global numbering is stored inside
// the embed URL, not message content.
//
// ============================================================

function counterEmbed(
  number,
  guildId
) {
  return whiteEmbed(
    "Chuppys Global Ticket Counter",

    "**Total Tickets Created:** " +
    `\`${number}\`\n\n` +
    "**Next Ticket Number:** " +
    `\`${numberText(number + 1)}\`\n\n` +
    "This counter preserves ticket numbering " +
    "across bot restarts."
  ).setURL(
    counterMetadataUrl(
      guildId,
      number
    )
  );
}

// ============================================================
// EMBED-ONLY STORAGE PAYLOADS
// ============================================================
//
// These functions guarantee that both
// new messages and edited old messages
// contain no visible text above embeds.
//
// ============================================================

function storagePayload(
  state,
  guildId
) {
  return {
    content: "",

    embeds: [
      stateEmbed(
        state,
        guildId
      )
    ],

    allowedMentions: {
      parse: []
    }
  };
}

function counterPayload(
  number,
  guildId
) {
  return {
    content: "",

    embeds: [
      counterEmbed(
        number,
        guildId
      )
    ],

    allowedMentions: {
      parse: []
    }
  };
}

// ============================================================
// SCAN STORAGE MESSAGES
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

        ...(before
          ? { before }
          : {})
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

    before = batch.last().id;
  }
}

// ============================================================
// SAVE V3 STATE
// ============================================================
//
// CHANGED:
//
// Previously:
//
// content: STATE_PREFIX + JSON.stringify(...)
//
// NOW:
//
// content: ""
// embeds: [stateEmbed(...)]
//
// The full metadata is retained inside
// the embed URL.
//
// Existing messages are edited in place.
//
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
// INITIALIZE DATA
// ============================================================
//
// Reads old and new storage messages.
//
// Preserves previous ticket numbers.
//
// Converts old visible metadata messages
// to clean embed-only messages.
//
// Also converts the old counter message
// without resetting global numbering.
//
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
          tickets.get(
            state.channelId
          );

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
          counterMessage =
            message;
        }
      }

      if (
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

    // ========================================================
    // LOAD PRIVATE STORAGE
    // ========================================================

    await scan(
      data,
      message =>
        processMessage(
          message,
          true
        )
    );

    // ========================================================
    // LOAD LEGACY LOG METADATA
    // ========================================================

    if (logs.id !== data.id) {
      await scan(
        logs,
        message =>
          processMessage(
            message,
            false
          )
      );
    }

    // ========================================================
    // RESTORE NUMBER FROM CHANNEL NAMES
    // ========================================================

    await guild.channels.fetch();

    await guild.roles.fetch();

    for (
      const channel of
      guild.channels.cache.values()
    ) {
      const parsed =
        parseTicketName(
          channel.name
        );

      if (parsed) {
        highest = Math.max(
          highest,
          parsed.number
        );
      }
    }

    globalCounter =
      highest;

    // ========================================================
    // MIGRATE GLOBAL COUNTER TO EMBED-ONLY
    // ========================================================

    if (counterMessage) {
      counterMessageId =
        counterMessage.id;

      await counterMessage.edit(
        counterPayload(
          highest,
          guild.id
        )
      );
    } else {
      const message =
        await data.send(
          counterPayload(
            highest,
            guild.id
          )
        );

      counterMessageId =
        message.id;
    }

    // ========================================================
    // MIGRATE EXISTING STORAGE RECORDS
    // ========================================================
    //
    // Existing records with visible JSON
    // are updated to embed-only.
    //
    // The same storage message ID is used.
    //
    // Ticket numbers and metadata remain.
    //
    // ========================================================

    let migrated = 0;

    for (
      const [id, entry]
      of tickets
    ) {
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
          await saveState(
            channel,
            entry
          );

          migrated++;
        } catch (error) {
          console.error(
            `[TICKETS] Storage migration failed for ${id}:`,
            error
          );
        }
      } else if (
        entry.storageMessageId &&
        entry.needsMigration
      ) {
        // Preserve records for deleted
        // channels without recreating them.

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

          entry.needsMigration =
            false;

          migrated++;
        } catch (error) {
          console.error(
            `[TICKETS] Archived storage migration failed for ${id}:`,
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
      `[TICKETS] ${migrated} storage records migrated or restored.`
    );

    console.log(
      "[TICKETS] Embed-only storage enabled."
    );
  })();

  try {
    await initialization;
  } finally {
    initialization = null;
  }
}

// ============================================================
// GLOBAL COUNTER
// ============================================================
//
// Stores the counter in an embed-only
// Discord message.
//
// Previous numbering is preserved.
//
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
// IDENTIFY ORIGINAL WELCOME MESSAGE
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
    message.components.some(
      row =>
        row.components.some(
          component =>
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
        String(
          embed.title || ""
        ).toLowerCase();

      const match =
        title.match(
          /#\s*0*(\d+)/
        );

      if (
        !match ||
        Number(match[1]) !==
        parsed.number
      ) {
        return false;
      }

      return (
        title.includes(
          TYPES[parsed.type]
            .label
            .toLowerCase()
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
      String(
        embed.description || ""
      );

    const match =
      description.match(
        /(?:welcome|opened by|created by|creator)\s*:?\s*<@!?(\d{17,20})>/i
      );

    if (match) {
      return match[1];
    }
  }

  const match =
    String(
      message.content || ""
    ).match(
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

        ...(before
          ? { before }
          : {})
      });

    for (
      const message
      of batch.values()
    ) {
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
          channelId:
            channel.id,

          ownerId,

          type:
            parsed.type,

          number:
            parsed.number,

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

      await saveState(
        channel,
        entry
      );

      return entry;
    }

    if (batch.size < 100) {
      break;
    }

    before = batch.last().id;
  }

  return null;
}

// ============================================================
// LOAD TICKET
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

    await saveState(
      channel,
      entry
    );

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
    const channel of
    guild.channels.cache.values()
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
      await recoverTicket(
        channel
      ).catch(() => null);

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
// PERMISSION FLAGS
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

// ============================================================
// PERMISSION ENTRY
// ============================================================

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
// VERIFICATION CATEGORY
// ============================================================

async function ensureVerificationCategory(
  guild
) {
  const running =
    categoryJobs.get(guild.id);

  if (running) {
    return running;
  }

  const job = (async () => {
    await guild.channels.fetch();

    await guild.roles.fetch();

    const categories = [
      ...guild.channels.cache.values()
    ].filter(
      channel =>
        channel.type ===
        ChannelType.GuildCategory
    );

    let existing =
      categories.find(
        channel =>
          normalizeCategoryName(
            channel.name
          ) ===
          normalizeCategoryName(
            VERIFICATION_CATEGORY_NAME
          )
      );

    if (!existing) {
      const names =
        TYPES.verification.categories
          .map(normalizeCategoryName);

      existing =
        categories.find(
          channel =>
            names.includes(
              normalizeCategoryName(
                channel.name
              )
            )
        );
    }

    const overwrites = [
      {
        id:
          guild.roles.everyone.id,

        type:
          OverwriteType.Role,

        deny: [
          P.ViewChannel
        ]
      },

      {
        id:
          guild.client.user.id,

        type:
          OverwriteType.Member,

        allow: [
          P.ViewChannel,
          P.SendMessages,
          P.ReadMessageHistory,
          P.ManageChannels
        ]
      }
    ];

    for (
      const id of
      VERIFICATION_STAFF_ROLES
    ) {
      if (
        guild.roles.cache.has(id)
      ) {
        overwrites.push({
          id,

          type:
            OverwriteType.Role,

          allow: [
            P.ViewChannel,
            P.SendMessages,
            P.ReadMessageHistory
          ]
        });
      }
    }

    if (
      guild.ownerId !==
      guild.client.user.id
    ) {
      overwrites.push({
        id:
          guild.ownerId,

        type:
          OverwriteType.Member,

        allow: [
          P.ViewChannel,
          P.SendMessages,
          P.ReadMessageHistory
        ]
      });
    }

    if (existing) {
      await existing.permissionOverwrites.set(
        overwrites,

        "Chuppys verification category permissions"
      );

      return existing;
    }

    return guild.channels.create({
      name:
        VERIFICATION_CATEGORY_NAME,

      type:
        ChannelType.GuildCategory,

      permissionOverwrites:
        overwrites,

      reason:
        "Chuppys private verification ticket category"
    });
  })();

  categoryJobs.set(guild.id, job);

  try {
    return await job;
  } finally {
    if (
      categoryJobs.get(guild.id) === job
    ) {
      categoryJobs.delete(guild.id);
    }
  }
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
  ].filter(
    channel =>
      channel.type ===
      ChannelType.GuildCategory
  );

  for (
    const name of
    config.categories
  ) {
    const found =
      categories.find(
        channel =>
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
      categories.find(
        channel =>
          channel.name
            .toLowerCase()
            .includes("support")
      );

    if (found) {
      return found;
    }
  }

  throw new Error(
    `Could not find ${config.label} category. ` +
    `Check ${config.env} in Render.`
  );
}

// ============================================================
// FIXED TICKET PERMISSIONS
// ============================================================
//
// NO:
//
// guild.members.fetch()
//
// NO:
//
// getSellerMembers()
//
// NO:
//
// Looping over every seller account.
//
// The bot only uses:
//
// 1. @everyone deny
// 2. Specific authorized role allows
// 3. Seller-role deny after claim
// 4. Exact claiming-member allow
// 5. Exact ticket-creator allow
//
// Discord evaluates channel overwrites
// using role and member permissions.
//
// A specific member allow takes priority
// over the Seller role's deny.
//
// Owner and Support role allows remain.
//
// Discord Administrator permission always
// bypasses channel permission restrictions.
//
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

  // ==========================================================
  // HIDE FROM EVERYONE
  // ==========================================================

  add({
    id:
      guild.roles.everyone.id,

    type:
      OverwriteType.Role,

    allow: [],

    deny: [
      P.ViewChannel,
      P.SendMessages,
      P.AttachFiles
    ]
  });

  // ==========================================================
  // BOT ACCESS
  // ==========================================================

  add({
    id:
      guild.client.user.id,

    type:
      OverwriteType.Member,

    allow: [
      ...FULL,
      P.ManageChannels,
      P.ManageMessages,
      P.EmbedLinks
    ],

    deny: []
  });

  // ==========================================================
  // VERIFICATION TICKETS
  // ==========================================================

  if (isVerificationTicket(state)) {
    for (
      const roleId
      of VERIFICATION_STAFF_ROLES
    ) {
      allowRole(roleId);
    }

    allowMember(
      guild.ownerId
    );

    allowMember(
      state.ownerId
    );

    return [
      ...result.values()
    ];
  }

  // ==========================================================
  // OWNER AND SUPPORT
  // ==========================================================

  allowRole(
    IDS.owner
  );

  allowRole(
    IDS.support
  );

  allowMember(
    guild.ownerId
  );

  // ==========================================================
  // ADMIN AND MOD
  // ==========================================================
  //
  // Before claim:
  // Admin and Mod may see the ticket.
  //
  // After a Purchase/Cash Out claim:
  // Their normal ticket-role access is
  // removed.
  //
  // Administrator permission still bypasses.
  //
  // ==========================================================

  if (!claimedTrading) {
    allowRole(
      IDS.admin
    );

    allowRole(
      IDS.mod
    );
  }

  // ==========================================================
  // SELLER ACCESS BEFORE CLAIM
  // ==========================================================

  if (
    trading &&
    !claimed
  ) {
    allowRole(
      IDS.seller
    );
  }

  // ==========================================================
  // SELLER ACCESS AFTER CLAIM
  // ==========================================================

  if (claimedTrading) {
    if (
      guild.roles.cache.has(
        IDS.seller
      )
    ) {
      add({
        id:
          IDS.seller,

        type:
          OverwriteType.Role,

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

  // ==========================================================
  // TICKET CREATOR
  // ==========================================================

  allowMember(
    state.ownerId
  );

  // ==========================================================
  // EXACT CLAIMING SELLER / STAFF MEMBER
  // ==========================================================

  if (state.claimedBy) {
    allowMember(
      state.claimedBy
    );
  }

  // ==========================================================
  // DISCORD OVERWRITE LIMIT
  // ==========================================================

  if (result.size > 100) {
    throw new Error(
      "Ticket exceeds Discord's 100 permission-overwrite limit."
    );
  }

  return [
    ...result.values()
  ];
}

// ============================================================
// FIXED CLAIM PRIVACY CHECK
// ============================================================
//
// Checks channel overwrites without
// downloading the full member list.
//
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
      {
        force: true
      }
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

  if (
    !everyone?.deny.has(
      P.ViewChannel
    )
  ) {
    throw new Error(
      "Ticket privacy error: @everyone is not hidden."
    );
  }

  const sellerOverwrite =
    overwrites.get(
      IDS.seller
    );

  if (
    channel.guild.roles.cache.has(
      IDS.seller
    ) &&
    !sellerOverwrite?.deny.has(
      P.ViewChannel
    )
  ) {
    throw new Error(
      "Ticket privacy error: Seller role is not restricted."
    );
  }

  const claimerOverwrite =
    overwrites.get(
      state.claimedBy
    );

  if (
    !claimerOverwrite ||
    claimerOverwrite.type !==
      OverwriteType.Member ||
    !claimerOverwrite.allow.has(
      P.ViewChannel
    )
  ) {
    throw new Error(
      "Ticket privacy error: Claiming member does not have channel access."
    );
  }

  const buyerOverwrite =
    overwrites.get(
      state.ownerId
    );

  if (
    !buyerOverwrite ||
    !buyerOverwrite.allow.has(
      P.ViewChannel
    )
  ) {
    throw new Error(
      "Ticket privacy error: Buyer does not have channel access."
    );
  }

  // Verify Admin and Mod roles aren't
  // explicitly allowed after the claim.

  for (
    const roleId
    of [
      IDS.admin,
      IDS.mod
    ]
  ) {
    if (
      overwrites.get(roleId)
        ?.allow.has(
          P.ViewChannel
        )
    ) {
      throw new Error(
        "Ticket privacy error: Unclaimed staff role still has access."
      );
    }
  }

  // Verify there aren't unexpected
  // individual member allow overwrites.

  const allowedMembers =
    new Set([
      state.ownerId,
      state.claimedBy,
      channel.guild.ownerId,
      channel.guild.client.user.id
    ]);

  const allowedRoles =
    new Set([
      IDS.owner,
      IDS.support
    ]);

  for (
    const overwrite
    of overwrites.values()
  ) {
    if (
      !overwrite.allow.has(
        P.ViewChannel
      )
    ) {
      continue;
    }

    if (
      overwrite.type ===
      OverwriteType.Member &&
      !allowedMembers.has(
        overwrite.id
      )
    ) {
      throw new Error(
        "Unexpected member has access to claimed ticket: " +
        overwrite.id
      );
    }

    if (
      overwrite.type ===
      OverwriteType.Role &&
      !allowedRoles.has(
        overwrite.id
      )
    ) {
      throw new Error(
        "Unexpected role has access to claimed ticket: " +
        overwrite.id
      );
    }
  }

  console.log(
    `[TICKETS] Claim overwrites verified: ${channel.id}`
  );
}

// ============================================================
// VERIFICATION PRIVACY CHECK
// ============================================================

async function checkVerificationPrivacy(
  channel,
  state
) {
  if (!isVerificationTicket(state)) {
    return;
  }

  const fresh =
    await channel.guild.channels.fetch(
      channel.id,
      {
        force: true
      }
    );

  if (!fresh) {
    throw new Error(
      "Could not verify verification ticket."
    );
  }

  const allowedRoleIds =
    new Set(
      VERIFICATION_STAFF_ROLES
    );

  const allowedMemberIds =
    new Set([
      state.ownerId,
      channel.guild.ownerId,
      channel.guild.client.user.id
    ]);

  const unauthorized = [];

  for (
    const overwrite
    of fresh.permissionOverwrites.cache.values()
  ) {
    if (
      !overwrite.allow.has(
        P.ViewChannel
      )
    ) {
      continue;
    }

    if (
      overwrite.type ===
      OverwriteType.Role
    ) {
      if (
        !allowedRoleIds.has(
          overwrite.id
        )
      ) {
        unauthorized.push(
          overwrite.id
        );
      }
    } else if (
      overwrite.type ===
      OverwriteType.Member
    ) {
      if (
        !allowedMemberIds.has(
          overwrite.id
        )
      ) {
        unauthorized.push(
          overwrite.id
        );
      }
    }
  }

  if (unauthorized.length) {
    throw new Error(
      "Verification privacy failed: " +
      unauthorized.join(", ")
    );
  }

  console.log(
    `[VERIFY] Private permissions checked: ${channel.id}`
  );
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

    isVerificationTicket(state)
      ? "Chuppys restricted verification permissions"
      : "Chuppys private ticket permissions"
  );

  await checkClaimPrivacy(
    channel,
    state
  );

  await checkVerificationPrivacy(
    channel,
    state
  );

  if (
    channel.topic?.startsWith(
      "chuppys-ticket:"
    )
  ) {
    await channel.setTopic(
      null
    ).catch(() => {});
  }
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
        components:
          controls(state)
      }
    );
  } catch (error) {
    console.error(
      "[TICKETS] Opening button update failed:",
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

        ...(before
          ? { before }
          : {})
      });

    for (
      const message
      of messages.values()
    ) {
      if (
        message.author.id !==
        channel.client.user.id
      ) {
        continue;
      }

      if (
        message.embeds.some(
          embed =>
            embed.title ===
            "Ticket Closed"
        )
      ) {
        return message;
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
    components:
      closedControls()
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
  );
}

// ============================================================
// SYNCHRONIZE EXISTING BUTTONS
// ============================================================

async function syncTicketButtons(
  channel,
  entry
) {
  const state =
    entry.state;

  if (state.controlMessageId) {
    await updateControls(
      channel,
      state
    );
  }

  if (state.status === "closed") {
    const message =
      await updateClosedControls(
        channel,
        state
      );

    if (message) {
      await saveState(
        channel,
        entry
      );
    }
  } else if (
    state.closeControlMessageId
  ) {
    await clearClosedControls(
      channel,
      state
    );

    state.closeControlMessageId =
      null;

    await saveState(
      channel,
      entry
    );
  }
}

// ============================================================
// SYNCHRONIZE EXISTING TICKETS
// ============================================================
//
// Existing claimed tickets are repaired
// with the new member-free permissions.
//
// No full-server member fetching occurs.
//
// ============================================================

async function syncExistingTickets(guild) {
  await init(guild);

  await guild.channels.fetch();

  const destinations = {};

  for (
    const type
    of Object.keys(TYPES)
  ) {
    try {
      destinations[type] =
        await category(
          guild,
          type
        );
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
      parseTicketName(
        channel.name
      );

    const cached =
      tickets.get(channel.id);

    if (
      !parsed &&
      !cached
    ) {
      continue;
    }

    const entry =
      cached ||
      await loadState(
        channel
      ).catch(() => null);

    if (!entry) {
      continue;
    }

    const target =
      destinations[
        entry.state.type
      ];

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
        `[TICKETS] Sync failed: ${channel.name}`,
        error
      );
    }
  }

  console.log(
    `[TICKETS] ${moved} categories moved.`
  );

  console.log(
    `[TICKETS] ${refreshed} permissions refreshed.`
  );

  console.log(
    `[TICKETS] ${buttonsUpdated} ticket button layouts processed.`
  );
}

// ============================================================
// FETCH TRANSCRIPT MESSAGES
// ============================================================

async function allMessages(channel) {
  const messages = [];

  let before;

  for (;;) {
    const batch =
      await channel.messages.fetch({
        limit: 100,

        ...(before
          ? { before }
          : {})
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
// HTML TRANSCRIPTS
// ============================================================

function transcriptHtml(
  channel,
  state,
  messages
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
        if (
          !/^https:\/\//i.test(
            file.url || ""
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
        message.embeds.map(
          embed => {
            const fields =
              (embed.fields || [])
                .map(
                  field =>
                    `<p><strong>${escapeHtml(field.name)}</strong>: ` +
                    `${escapeHtml(field.value)}</p>`
                )
                .join("");

            return (
              `<blockquote>` +
              `<b>${escapeHtml(embed.title || "Embed")}</b>` +
              `<p>${escapeHtml(embed.description || "")}</p>` +
              fields +
              `</blockquote>`
            );
          }
        ).join("");

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
small { color: #aaa; }
a { color: #aaccff; }
</style>
</head>
<body>
<h1>${escapeHtml(BRAND)} Ticket Transcript</h1>
<p>${escapeHtml(channel.name)} — Ticket #${state.number}</p>
${rows}
</body>
</html>`;
}

async function buildTranscriptAttachment(
  channel,
  state
) {
  const messages =
    await allMessages(channel);

  const buffer =
    Buffer.from(
      transcriptHtml(
        channel,
        state,
        messages
      ),
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

  return new AttachmentBuilder(
    buffer,
    {
      name:
        `transcript-${state.type}-${state.number}.html`
    }
  );
}

// ============================================================
// TICKET LOGS
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

    allowedMentions: {
      parse: []
    }
  };

  if (
    action === "closed" ||
    action === "deleted"
  ) {
    if (!channel) {
      throw new Error(
        "Ticket channel required."
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
// TICKET FORM
// ============================================================

function ticketForm(type) {
  const config =
    TYPES[type];

  if (
    !config?.questions?.length
  ) {
    throw new Error(
      "Ticket form is unavailable."
    );
  }

  const modal =
    new ModalBuilder()
      .setCustomId(
        FORM_PREFIX + type
      )
      .setTitle(
        `${config.label} Ticket`
      );

  config.questions.forEach(
    (question, index) => {
      const input =
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
          .setMaxLength(250);

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

// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal(channelId) {
  return new ModalBuilder()
    .setCustomId(
      CLOSE_PREFIX + channelId
    )
    .setTitle(
      "Close Ticket"
    )
    .addComponents(
      new ActionRowBuilder()
        .addComponents(
          new TextInputBuilder()
            .setCustomId(
              "close_reason"
            )
            .setLabel(
              "Reason (optional)"
            )
            .setStyle(
              TextInputStyle.Paragraph
            )
            .setRequired(false)
            .setMaxLength(500)
        )
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

    // No guild.members.fetch() call.
    // Permissions are based on roles.

    const permissionOverwrites =
      await permissions(
        guild,
        state
      );

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

        permissionOverwrites,

        reason:
          `Ticket opened by ${interaction.user.id}`
      });

    state.channelId =
      channel.id;

    if (
      isVerificationTicket(state)
    ) {
      await checkVerificationPrivacy(
        channel,
        state
      );
    }

    const entry = {
      state,

      storageMessageId: null,

      recovered: false
    };

    // Store as a clean embed only.

    await saveState(
      channel,
      entry
    );

    const details =
      config.questions?.length &&
      answers.length
        ? config.questions.map(
            (question, index) =>
              `**${question}**\n` +
              safe(
                answers[index],
                250
              )
          ).join("\n\n")
        : config.description;

    const proofInstruction =
      type === "partnership"
        ? "\n\n**Please show proof of your vouches in this ticket!**"
        : "";

    const pingRoles = (
      type === "verification"
        ? [
            IDS.owner,
            IDS.admin,
            IDS.mod
          ]
        : isTradingTicket(state)
          ? [
              IDS.seller,
              IDS.support
            ]
          : [
              IDS.support
            ]
    ).filter(
      id =>
        guild.roles.cache.has(id)
    );

    const welcomeDescription =
      type === "verification"
        ? (
            `Welcome <@${interaction.user.id}>!\n\n` +
            "**Verification Assistance**\n\n" +
            "Please explain what you need help with " +
            "while verifying for **.gg/chuppys**.\n\n" +
            "An Owner, Admin or Moderator will assist you.\n\n" +
            "Please follow staff instructions."
          )
        : (
            `Welcome <@${interaction.user.id}>!\n\n` +
            `${details}${proofInstruction}\n\n` +
            "Our team will assist you shortly."
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

    void logTicket(
      guild,
      { ...state },
      "opened",
      interaction.user.id
    ).catch(console.error);

    console.log(
      `[TICKETS] Created ${channel.name} for ${interaction.user.id}`
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
//
// PRESERVED IN ORIGINAL LOCATION.
//
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
      "Verification tickets only work in a server."
    );
  }

  const member =
    await interaction.guild.members.fetch({
      user: interaction.user.id,
      force: true
    });

  if (
    member.roles.cache.has(
      VERIFIED_ROLE_ID
    )
  ) {
    throw new Error(
      "You are already verified."
    );
  }

  const result =
    await createTicket(
      interaction,
      "verification",
      []
    );

  console.log(
    `[VERIFY] ${interaction.user.id}: ${result.channel.name}`
  );

  return result;
}

// ============================================================
// VERIFICATION BUTTON
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
        : `Your verification ticket is ready: ${result.channel}`
    );
  } catch (error) {
    console.error(
      "[VERIFY] Verification button error:",
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
// CLAIM TICKET
// ============================================================
//
// BOTH:
//
// ,claim
// Claim button
//
// ALSO:
//
// ,forceclaim
//
// ALL USE THIS SAME FUNCTION.
//
// ============================================================

async function claim(
  context,
  channel,
  entry,
  force = false
) {
  const member =
    await getMember(context);

  const state =
    entry.state;

  if (
    force &&
    !isOwner(member)
  ) {
    return reply(
      context,
      "Only owners can use ,forceclaim."
    );
  }

  if (
    !force &&
    !canClaim(
      member,
      state
    )
  ) {
    return reply(
      context,
      "You do not have permission to claim this ticket."
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

  state.claimedBy =
    member.id;

  // ==========================================================
  // APPLY CLAIM PERMISSIONS
  // ==========================================================

  try {
    await applyPermissions(
      channel,
      state
    );

    // Updates storage embed only.
    // No JSON text above the embed.

    await saveState(
      channel,
      entry
    );
  } catch (error) {
    state.claimedBy =
      previousClaimer;

    await applyPermissions(
      channel,
      state
    ).catch(console.error);

    throw error;
  }

  // ==========================================================
  // UPDATE CLAIM BUTTON
  // ==========================================================

  await updateControls(
    channel,
    state
  );

  // ==========================================================
  // POST CLAIM MESSAGE
  // ==========================================================

  await channel.send({
    embeds: [
      whiteEmbed(
        "Ticket Claimed",

        `Claimed by <@${member.id}>.\n\n` +
        "This ticket is now assigned."
      )
    ],

    allowedMentions: {
      parse: []
    }
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

  const state =
    entry.state;

  if (
    !canManage(
      member,
      state
    )
  ) {
    return reply(
      context,
      "You cannot close this ticket."
    );
  }

  if (
    state.status === "closed"
  ) {
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

    await saveState(
      channel,
      entry
    );
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

  // Remove opening buttons.

  await updateControls(
    channel,
    state
  );

  const renameJob =
    channel.setName(
      ticketName(
        state.type,
        state.number,
        true
      )
    ).catch(console.error);

  // Closed ticket buttons.

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

      allowedMentions: {
        parse: []
      }
    });

  state.closeControlMessageId =
    closedMessage.id;

  await saveState(
    channel,
    entry
  );

  // Generate closed transcript.

  const transcriptState = {
    ...state
  };

  const transcriptJob = (async () => {
    await renameJob;

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

    await saveState(
      channel,
      entry
    );

    return logMessage;
  })();

  trackTranscriptJob(
    channel.id,
    transcriptJob
  );

  void transcriptJob.catch(error => {
    console.error(
      "[TICKETS] Closed transcript error:",
      error
    );
  });

  console.log(
    `[TICKETS] Closed ${channel.name} by ${member.id}`
  );

  if (context.kind === "prefix") {
    return;
  }

  return reply(
    context,
    "Ticket closed successfully."
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

  const state =
    entry.state;

  if (
    !canManage(
      member,
      state
    )
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

  const previousStatus =
    state.status;

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

  state.closeControlMessageId =
    null;

  await saveState(
    channel,
    entry
  );

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

async function deleteTicket(
  context,
  channel,
  entry
) {
  const member =
    await getMember(context);

  const state =
    entry.state;

  if (
    !canDelete(
      member,
      state
    )
  ) {
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
      "You do not have permission to delete this ticket."
    );
  }

  await reply(
    context,
    "Deleting ticket and saving transcript..."
  );

  const pending =
    transcriptJobs.get(
      channel.id
    );

  if (pending) {
    await pending.catch(
      console.error
    );
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
      "[TICKETS] Deletion cancelled: transcript unavailable.",
      error
    );

    return;
  }

  state.transcriptUrl =
    logMessage.url;

  try {
    await saveState(
      channel,
      entry
    );
  } catch (error) {
    console.error(
      "[TICKETS] Deletion cancelled: data storage failed.",
      error
    );

    return;
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

    return;
  }

  tickets.delete(
    channel.id
  );

  console.log(
    `[TICKETS] Deleted ${channel.name}`
  );
}

// ============================================================
// /TICKETPANEL HANDLER
// ============================================================

async function panelCommand(
  interaction
) {
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

    `Ticket panel ${
      existing
        ? "updated"
        : "posted"
    }.`
  );
}

// ============================================================
// TICKET SELECT
// ============================================================

async function selectTicket(
  interaction
) {
  const type =
    String(
      interaction.values?.[0] || ""
    ).toLowerCase();

  if (
    !TYPES[type] ||
    type === "verification"
  ) {
    return reply(
      interaction,
      "Please select a valid ticket category."
    );
  }

  if (
    TYPES[type].questions?.length
  ) {
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
    console.error(error);

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

async function submitForm(
  interaction
) {
  const type =
    interaction.customId.slice(
      FORM_PREFIX.length
    );

  if (
    !TYPES[type]?.questions?.length
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

  try {
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
        : `Your ticket is ready: ${result.channel}`
    );
  } catch (error) {
    console.error(error);

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
// TICKET BUTTON HANDLER
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

  // ==========================================================
  // CLOSE BUTTON OPENS MODAL
  // ==========================================================

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

  // ==========================================================
  // ACKNOWLEDGE CLAIM / REOPEN / DELETE
  // ==========================================================

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

async function handleCloseForm(
  interaction
) {
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
// PREFIX COMMANDS
// ============================================================

async function handlePrefix(message) {
  if (
    !message.guild ||
    message.author.bot ||
    !message.content.startsWith(
      PREFIX
    )
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

  if (
    ![
      "claim",
      "forceclaim",
      "close",
      "reopen",
      "delete"
    ].includes(name)
  ) {
    return;
  }

  if (
    message.channel.type !==
    ChannelType.GuildText
  ) {
    return;
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

  const seenMessages =
    new Set();

  const seenInteractions =
    new Set();

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

  async function onReady() {
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

      await guild.roles.fetch();

      await init(guild);

      await ensureVerificationCategory(
        guild
      );

      await syncExistingTickets(
        guild
      );

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
        "[TICKETS] All six ticket categories enabled."
      );

      console.log(
        "[TICKETS] Open buttons: Claim and Close."
      );

      console.log(
        "[TICKETS] Closed buttons: Reopen and Delete."
      );

      console.log(
        "[TICKETS] Prefix commands and buttons share action handlers."
      );

      console.log(
        "[TICKETS] Seller claim privacy enabled."
      );

      console.log(
        "[TICKETS] NO FULL-SERVER MEMBER REQUESTS."
      );

      console.log(
        "[TICKETS] Opcode 8 seller-scan issue removed."
      );

      console.log(
        "[TICKETS] Verification tickets enabled."
      );

      console.log(
        `[TICKETS] Verification button ID: ${VERIFY_TICKET_BUTTON_ID}`
      );

      console.log(
        "[VERIFY] Owner, Admin and Mod access enabled."
      );

      console.log(
        "[VERIFY] Creator verification access enabled."
      );

      console.log(
        "[VERIFY] Support role verification access disabled."
      );

      console.log(
        "[VERIFY] Seller role verification access disabled."
      );

      console.log(
        "[TICKETS] Global numbering preserved."
      );

      console.log(
        "[TICKETS] Private V3 metadata preserved."
      );

      console.log(
        "[TICKETS] Legacy storage recovery enabled."
      );

      console.log(
        "[TICKETS] Embed-only storage enabled."
      );

      console.log(
        "[TICKETS] Raw JSON storage text disabled."
      );

      console.log(
        "[TICKETS] Existing storage migration enabled."
      );

      console.log(
        "[TICKETS] Embed-only global counter enabled."
      );

      console.log(
        "[TICKETS] HTML transcripts enabled."
      );

      console.log(
        "[TICKETS] All handlers installed."
      );
    } catch (error) {
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
        !message.content.startsWith(
          PREFIX
        )
      ) {
        return;
      }

      const commandName =
        message.content
          .slice(PREFIX.length)
          .trim()
          .split(/\s+/, 1)[0]
          ?.toLowerCase();

      if (
        ![
          "claim",
          "forceclaim",
          "close",
          "reopen",
          "delete"
        ].includes(commandName)
      ) {
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

      const isVerification =
        interaction.isButton() &&
        interaction.customId ===
          VERIFY_TICKET_BUTTON_ID;

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
    "[TICKETS] Seller member-list scan REMOVED."
  );

  console.log(
    "[VERIFY] Private verification permissions installed."
  );

  console.log(
    "[TICKETS] Storage messages are EMBED-ONLY."
  );

  console.log(
    "[TICKETS] No visible metadata text above storage embeds."
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
