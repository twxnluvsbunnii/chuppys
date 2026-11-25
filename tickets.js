"use strict";

// ============================================================
// CHUPPYS TICKET SYSTEM
// DISCORD.JS V14 / NODE.JS 18+ / RENDER
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
// FIXES:
// - Fast ticket closing
// - Automatic archive after closing
// - Independent background archive queue
// - One archive thread per ticket
// - SHA256 attachment deduplication
// - Original quality attachments
// - No duplicate images inside HTML
// - Existing archived attachments reused
// - Partial upload recovery
// - Multipart attachments and transcripts
// - Automatic archive retries
// - Closed tickets restored after restart
// - Private technical errors
// - Deletion protection
// - Manual verification preserved
// - Existing ticket metadata supported
// - Global ticket numbering preserved
//
// Run only ONE bot instance on Render.
// No additional npm packages required.
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
const BUTTON_EMOJI_OBJECT = {
  id: "1561094713153429746",
  name: "uppyty"
};

const WHITE = 0xffffff;
const PREFIX = ",";
const EPHEMERAL = MessageFlags.Ephemeral;
const NONE = { parse: [] };

// ============================================================
// ARCHIVE CONFIGURATION
// ============================================================

const HTML_PART_SIZE = 7 * 1024 * 1024;
const FILE_PART_SIZE = 9 * 1024 * 1024;

const DOWNLOAD_TIMEOUT = 120000;
const DOWNLOAD_RETRIES = 5;
const ARCHIVE_RETRIES = 5;

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

const MANIFEST_PART_MARKER =
 "CHUPPYS_MANIFEST_PART_V5";

const ARCHIVE_ERROR_MARKER =
 "CHUPPYS_PRIVATE_ARCHIVE_ERROR_V5";

// ============================================================
// VERIFICATION
// ============================================================

const VERIFY_TICKET_BUTTON_ID =
 "chuppys_create_verification_ticket";

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

const VERIFICATION_STAFF_ROLES = [
   IDS.owner,
   IDS.admin,
   IDS.mod,
   IDS.support
];

// ============================================================
// BLACKLIST
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
// METADATA COMPATIBILITY
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
  "savelog",
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
    "A staff member will assist you shortly."
},

unblacklist: {
 label: "Unblacklist",
 env: "UNBLACKLIST_TICKET_CATEGORY_ID",
 categories:
   UNBLACKLIST_CATEGORY_ALIASES,
 description:
   "Please explain your appeal.",
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
 .setDescription(
   "Post or update the Chuppys ticket panel"
 )
 .setDefaultMemberPermissions(P.ManageGuild);

// ============================================================
// RUNTIME STORAGE
// ============================================================

const tickets = new Map();
const ticketQueues = new Map();
const archiveQueues = new Map();
const archiveJobs = new Map();
const categoryJobs = new Map();
const renameJobs = new Map();
const archiveTimers = new Map();
const deletingTickets = new Set();

let initialization = null;
let initialized = false;
let recoveryRunning = false;

let globalCounter = 0;
let counterMessageId = null;

let creationQueue = Promise.resolve();
let archiveWorkerQueue = Promise.resolve();

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
    ){
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
   .setTitle(String(title).slice(0, 256))
   .setDescription(
     String(description || " ").slice(0, 4096)
   )
   .setFooter({ text: BRAND });
}

function footerText(message) {
  return (message.embeds || [])
   .map(embed => embed.footer?.text || "")
   .join("\n");
}

function messageUrl(guildId, channelId, messageId) {
  return (
     `https://discord.com/channels/` +
     `${guildId}/${channelId}/${messageId}`
  );
}

function isMissing(error) {
  return [10003, 10008].includes(
     Number(error?.code || error?.rawError?.code)
  );
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
    ){
      throw new Error(
         `${label} channel unavailable: ${id}`
      );
    }

    return channel;
}

async function getMember(context) {
 if (!context.guild || !context.user?.id) {
   throw new Error(
      "Could not identify server member."
   );
 }

    const cached =
     context.guild.members.cache.get(
        context.user.id
     );

    if (cached) return cached;

    return context.guild.members.fetch(
       context.user.id
    );
}

// ============================================================
// QUEUES
// ============================================================

function queued(task) {
 const next = creationQueue.then(task);

    creationQueue = next.catch(() => {});

    return next;
}

function queueByKey(map, key, task) {
 const previous =
  map.get(key) || Promise.resolve();

    const next = previous
     .catch(() => {})
     .then(task);

    const settled = next.catch(() => {});

    map.set(key, settled);

    void settled.finally(() => {
      if (map.get(key) === settled) {
        map.delete(key);
      }
    });

    return next;
}

function queuedTicket(id, task) {
  return queueByKey(
     ticketQueues,
     id,
     task
  );
}

function queuedArchive(id, task) {
  return queueByKey(
     archiveQueues,
     id,
     task
  );
}

function archiveWorker(task) {
 const next = archiveWorkerQueue
  .catch(() => {})
  .then(task);

    archiveWorkerQueue =
     next.catch(() => {});

    return next;
}

// ============================================================
// ROLE HELPERS
// ============================================================

function hasRole(member, id) {
  return Boolean(
     member?.roles?.cache?.has(id)
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

    if (
      isOwner(member) ||
      isSupport(member)
    ){
      return true;
    }

    if (state.claimedBy === member.id) {
      return true;
    }

    if (
      isTradingTicket(state) &&
      state.claimedBy
    ){
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
// BLACKLIST HELPERS
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

        if (configured) return configured;
    }

    let role = guild.roles.cache.find(
       item =>
         item.name.toLowerCase() ===
         BLACKLIST_ROLE_NAME.toLowerCase()
    );

    if (role) return role;

    await guild.roles.fetch();

    role = guild.roles.cache.find(
       item =>
         item.name.toLowerCase() ===
         BLACKLIST_ROLE_NAME.toLowerCase()
    );

    return role || null;
}

async function isBlacklisted(member) {
 const role =
  await findBlacklistRole(member.guild);

    return Boolean(
         role &&
         member.roles.cache.has(role.id)
    );
}

// ============================================================
// PRIVATE ERROR HANDLING
// ============================================================

class TicketUserError extends Error {}

async function reportError(
 guild,
 label,
 error,
 state = null
){
 console.error(
    `[CHUPPYS] ${label}:`,
    error
 );

    if (!guild) return;

    try {
      let logs = await textChannel(
         guild,
         IDS.logs,
         "Ticket logs"
      );

         logs = await validateArchiveChannel(
            guild,
            logs
         );

         await logs.send({
          embeds: [
           whiteEmbed(
            "Private Ticket Report",

               `**Action:** ${safe(label, 150)}\n` +

               (
                state
                 ? `**Ticket:** #${numberText(state.number)}\n` +
                   `**Channel:** ${state.channelId}\n`
                 : ""
               )+

               `\n**Details:**\n${safe(error?.message || error, 1500)}`
           )
               .setFooter({
                 text:
              `${BRAND} • ${ARCHIVE_ERROR_MARKER}`
           })
           .setTimestamp()
      ],

       allowedMentions: NONE
     });

    } catch (reportFailure) {
      console.error(
         "[PRIVATE REPORT]",
         reportFailure.message
      );
    }
}

// ============================================================
// RESPONSES
// ============================================================

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

async function privateReply(context, content) {
 if (context.kind === "prefix") {
   return context.user.send({
     content,
     allowedMentions: NONE
   }).catch(() => null);
 }

    return reply(
      context,
      content
    ).catch(() => null);
}

async function removeInvocation(context) {
 if (context.kind !== "prefix") {
   return;
 }

    const message = context.message;

    if (
      message.attachments.size ||
      message.stickers?.size
    ){
      return;
    }

    await message.delete()
     .catch(() => {});
}

async function handleFailure(context, error) {
 if (error instanceof TicketUserError) {
   return privateReply(
      context,
      error.message
   );
 }

    const state =
     tickets.get(context.channel?.id)?.state;

    void reportError(
      context.guild,
      "Ticket command",
      error,
      state
 );

  await privateReply(
     context,
     "The requested action could not be completed. Staff logs have been notified where available."
  );
}

// ============================================================
// METADATA
// ============================================================

function normalizeState(data) {
 if (
   !data?.channelId ||
   !data?.ownerId ||
   !TYPES[data.type]
 ){
   return null;
 }

 const number = Number(data.number);

 if (
   !Number.isSafeInteger(number) ||
   number < 1
 ){
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

     archiveSnapshot:
      data.archiveSnapshot || null,

     createdAt:
      data.createdAt || null,

     closedAt:
      data.closedAt || null,

     deleted:
      Boolean(data.deleted),

      revision:
       Number(data.revision) || 0
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
        Buffer.from(
          value,
          "base64url"
        ).toString("utf8")
      )
   );
 } catch {
   return null;
    }
}

function metadataUrl(guildId, state) {
 const compact = { ...state };

    const base =
     `https://discord.com/channels/` +
     `${guildId}/${state.channelId}` +
     `?${EMBED_STATE_KEY}=`;

    let url =
      base + encodeStateMetadata(compact);

    if (url.length > 2048) {
      compact.closeReason = "";

        url =
         base + encodeStateMetadata(compact);
    }

    if (url.length > 2048) {
      throw new Error(
         "Ticket metadata exceeds Discord URL limit."
      );
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
    ].find(value =>
         content.startsWith(value)
    );

    if (prefix) {
      try {
        const state = normalizeState(
           JSON.parse(
             content.slice(prefix.length)
           )
        );

          if (state) return state;

         } catch {
           // Continue checking embedded metadata.
         }
    }

    for (const embed of message.embeds || []) {
     const encoded = readEmbedParameter(
        embed,
        EMBED_STATE_KEY
     );

         if (!encoded) continue;

         const state =
          decodeStateMetadata(encoded);

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

function storagePayload(state, guildId) {
 return {
  content: "",

         embeds: [
          whiteEmbed(
           `Ticket #${numberText(state.number)} • ${TYPES[state.type].label}`,

           `**Status:** ${
                state.deleted
                 ? "Deleted"
                 : state.status
              }\n` +

              `**Ticket:** <#${state.channelId}>\n` +
              `**Creator:** <@${state.ownerId}>\n` +

              `**Claimed By:** ${
                 state.claimedBy
                  ? `<@${state.claimedBy}>`
                  : "Not claimed"
              }`
          )
              .setURL(
                metadataUrl(guildId, state)
              )
              .addFields(
                {
                  name: "Close Reason",
                  value:
                    state.closeReason ||
                    "No further action required."
                },
                {
                  name: "Archive",
                  value:
                    state.transcriptUrl
                     ? `[View Archive](${state.transcriptUrl})`
                     : "Pending"
                },
                {
                  name: "Archive Thread",
                  value:
                    state.archiveThreadId
                     ? `<#${state.archiveThreadId}>`
                     : "Not created"
                },
                {
                  name: "Control Messages",
                  value:
                    `Opening: ${state.controlMessageId || "None"}\n` +
                    `Closed: ${state.closeControlMessageId || "None"}`
                }
              )
              .setFooter({
                text:
                  `${BRAND} • Private Ticket Storage`
              })
     ],

      allowedMentions: NONE
    };
}
// ============================================================
// MESSAGE SCANNING
// ============================================================

async function scan(
 channel,
 callback,
 pages = Infinity
){
 let before;

    for (let page = 0; page < pages; page++) {
     const batch =
       await channel.messages.fetch({
         limit: 100,
         cache: false,
         ...(before ? { before } : {})
       });

        if (!batch.size) return;

        const messages = [...batch.values()]
         .sort((a, b) =>
            BigInt(a.id) > BigInt(b.id)
             ? -1
             :1
         );

        for (const message of messages) {
         const result =
           await callback(message);

            if (result === false) {
              return;
            }
        }

        if (batch.size < 100) return;

        const next =
         messages[messages.length - 1].id;

        if (next === before) return;

        before = next;
    }
}

async function allMessages(channel) {
 const messages = [];

    await scan(
     channel,
         message => {
           messages.push(message);
         }
    );

    return messages.sort((a, b) =>
       BigInt(a.id) < BigInt(b.id)
        ? -1
        :1
    );
}

// ============================================================
// PRIVATE DATA STORAGE VALIDATION
// ============================================================

async function validateDataChannel(guild) {
 const channel = await guild.channels.fetch(
    IDS.data,
    { force: true }
 );

    if (
      !channel ||
      channel.type !== ChannelType.GuildText
    ){
      throw new Error(
         "Ticket data channel unavailable."
      );
    }

    if (
      !channel.permissionOverwrites.cache
         .get(guild.roles.everyone.id)
         ?.deny.has(P.ViewChannel)
    ){
      throw new Error(
         "Ticket data channel must be private."
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

    for (
     const overwrite of
     channel.permissionOverwrites.cache.values()
    ){
     if (!overwrite.allow.has(P.ViewChannel)) {
       continue;
     }

        if (
          overwrite.type === OverwriteType.Role &&
          !allowedRoles.has(overwrite.id) &&
          guild.roles.cache.get(overwrite.id)?.tags?.botId !== guild.client.user.id
        ){
          throw new Error(
             "Unexpected role in private ticket storage."
          );
        }

        if (
          overwrite.type === OverwriteType.Member &&
          !allowedMembers.has(overwrite.id)
        ){
          throw new Error(
             "Unexpected member in private ticket storage."
          );
        }
    }

    return channel;
}

// ============================================================
// SAVE STATE
// ============================================================

async function saveState(channel, entry) {
 const storage =
  await validateDataChannel(channel.guild);

    const payload = storagePayload(
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
          if (!isMissing(error)) {
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

    tickets.set(
       channel.id,
       entry
    );

    return message;
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

        if (
          Number.isSafeInteger(number) &&
          number >= 0
        ){
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

            if (
              Number.isSafeInteger(number) &&
              number >= 0
            ){
              return number;
            }
        }

        if (
          embed.title ===
          "Chuppys Global Ticket Counter"
        ){
          const match = String(
             embed.description || ""
          ).match(
             /Total Tickets Created:\*\*\s*`?(\d+)`?/i
          );

             if (match) {
               return Number(match[1]);
             }
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
               `**Next Ticket Number:** \`${numberText(number + 1)}\``
             ).setURL(
               `https://discord.com/channels/${guildId}/${IDS.data}` +
               `?${EMBED_COUNTER_KEY}=${number}`
             )
        ],

      allowedMentions: NONE
    };
}

// ============================================================
// INITIALIZATION
// ============================================================

async function init(guild) {
 if (initialized) return;

    if (initialization) {
      return initialization;
    }

    initialization = (async () => {
      const data =
 await validateDataChannel(guild);

let highest = 0;
let counterMessage = null;

await scan(data, message => {
 if (
   message.author.id !==
   guild.client.user.id
 ){
   return;
 }

 const state = parseState(message);

 if (state) {
   highest = Math.max(
      highest,
      state.number
   );

     if (!tickets.has(state.channelId)) {
       tickets.set(state.channelId, {
         state,
         storageMessageId: message.id
       });
     }
 }

 const counter =
  parseCounter(message);

 if (counter !== null) {
   highest = Math.max(
      highest,
      counter
   );

     if (!counterMessage) {
       counterMessage = message;
     }
 }

 if (
   message.content.startsWith(
      OLD_COUNTER_PREFIX
   )
 ){
   try {
      const old = JSON.parse(
         message.content.slice(
           OLD_COUNTER_PREFIX.length
         )
      );
          const total = Object.values(old)
           .map(Number)
           .filter(Number.isSafeInteger)
           .reduce(
              (sum, value) => sum + value,
              0
           );

          highest = Math.max(
             highest,
             total
          );

      } catch {
        // Ignore malformed legacy counter.
      }
  }
});

if (!counterMessage) {
  const logs = await textChannel(
     guild,
     IDS.logs,
     "Ticket logs"
  );

 await scan(logs, message => {
  if (
    message.author.id !==
    guild.client.user.id
  ){
    return;
  }

      const state = parseState(message);

      if (state) {
        highest = Math.max(
           highest,
           state.number
        );

          if (!tickets.has(state.channelId)) {
            tickets.set(state.channelId, {
              state,
              storageMessageId: null
            });
          }
      }

      for (const embed of message.embeds) {
       const match = String(
         `${embed.title || ""}\n${embed.description || ""}`
          ).match(
             /(?:Ticket\s*#|Number:\*\*\s*#?)0*(\d+)/i
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

for (
 const channel of
 guild.channels.cache.values()
){
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
       counterPayload(
         highest,
         guild.id
       )
    );

} else {
  const message = await data.send(
     counterPayload(
       highest,
       guild.id
     )
  );

    counterMessageId =
            message.id;
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

async function nextNumber(guild) {
 await init(guild);

    const data =
     await validateDataChannel(guild);

    let message = null;

    if (counterMessageId) {
      try {
        message = await data.messages.fetch(
           counterMessageId
        );

        } catch (error) {
          if (!isMissing(error)) {
            throw error;
          }
        }
    }

    if (!message) {
      message = await data.send(
         counterPayload(
           globalCounter,
           guild.id
         )
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

    return message.embeds.some(embed => {
     const title = String(
       embed.title || ""
        ).toLowerCase();

        const match =
         title.match(/#\s*0*(\d+)/);

        if (
          !match ||
          Number(match[1]) !== parsed.number
        ){
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
 const parsed =
  parseTicketName(channel.name);

    if (!parsed) return null;

    const messages =
     await allMessages(channel);

    const opening = messages.find(
     message => validWelcome(
       message,
       parsed,
       channel.client.user.id
     )
);

if (!opening) return null;

const ownerId =
 extractOwner(opening);

if (!ownerId) return null;

let claimedBy = null;
let closeControlMessageId = null;
let closeReason =
  "No further action required.";

let status =
  parsed.closed ? "closed" : "open";

for (const message of messages) {
 if (
   message.author.id !==
   channel.client.user.id
 ){
   continue;
 }

     for (const embed of message.embeds) {
      if (embed.title === "Ticket Claimed") {
        const match = String(
           embed.description || ""
        ).match(
           /Claimed by <@!?(\d{17,20})>/i
        );

          if (match) {
            claimedBy = match[1];
          }
      }

      if (embed.title === "Ticket Closed") {
        status = "closed";

          closeControlMessageId =
           message.id;

          const match = String(
             embed.description || ""
          ).match(
             /\*\*Reason:\*\*\s*([^\n]+)/i
          );

          if (match) {
            closeReason = match[1];
          }
      }
            if (embed.title === "Ticket Reopened") {
              status = "open";
              closeControlMessageId = null;
            }
        }
    }

    const state = normalizeState({
      channelId: channel.id,
      ownerId,
      type: parsed.type,
      number: parsed.number,
      status,
      claimedBy,
      controlMessageId: opening.id,
      closeControlMessageId,
      closeReason,
      createdAt:
        opening.createdAt.toISOString()
    });

    const entry = {
      state,
      storageMessageId: null
    };

    await saveState(channel, entry);

    return entry;
}

async function loadState(channel) {
 if (
   channel?.type !== ChannelType.GuildText
 ){
   return null;
 }

    await init(channel.guild);

    const existing =
     tickets.get(channel.id);

    if (existing) {
      return existing.state.deleted
        ? null
        : existing;
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

async function existingTicket(
 guild,
 userId,
 type
){
 await init(guild);

    for (const entry of tickets.values()) {
     const state = entry.state;

        if (
          state.deleted ||
          state.ownerId !== userId ||
          state.type !== type ||
          state.status !== "open"
        ){
          continue;
        }

        const channel =
         guild.channels.cache.get(
           state.channelId
         ) ||
         await guild.channels.fetch(
           state.channelId
         ).catch(() => null);

        if (channel) return channel;
    }

    for (
     const channel of
     guild.channels.cache.values()
    ){
     if (
       channel.type !== ChannelType.GuildText ||
       tickets.has(channel.id)
     ){
            continue;
        }

        const parsed =
         parseTicketName(channel.name);

        if (
          !parsed ||
          parsed.type !== type
        ){
          continue;
        }

        const entry =
         await recoverTicket(channel);

        if (
          entry?.state.ownerId === userId &&
          entry.state.status === "open"
        ){
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

async function permissions(guild, state) {
 const closed =
  state.status === "closed";

     const claimedTrading =
      isTradingTicket(state) &&
      Boolean(state.claimedBy);

     const result = new Map();

     function add(entry) {
       result.set(entry.id, entry);
     }

     function allowRole(id) {
      if (!guild.roles.cache.has(id)) {
        return;
      }

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
           allow: readOnly
             ? READ_ONLY
             : FULL,
           deny: readOnly
             ? WRITE_PERMISSIONS
             : []
         });
     }

     add({
      id: guild.roles.everyone.id,
      type: OverwriteType.Role,
      allow: [],
      deny: [
        P.ViewChannel,
        ...WRITE_PERMISSIONS
  ]
});

if (isVerificationTicket(state)) {
  for (
    const id of
    VERIFICATION_STAFF_ROLES
  ){
    allowRole(id);
  }

} else if (isAppealTicket(state)) {
  for (
    const id of
    UNBLACKLIST_STAFF_ROLES
  ){
    allowRole(id);
  }

} else {
  allowRole(IDS.owner);
  allowRole(IDS.support);

    if (!claimedTrading) {
      allowRole(IDS.admin);
      allowRole(IDS.mod);
    }

    if (
      isTradingTicket(state) &&
      !state.claimedBy
    ){
      allowRole(IDS.seller);
    }

    if (
      claimedTrading &&
      guild.roles.cache.has(IDS.seller)
    ){
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

allowMember(state.claimedBy);
    allowMember(state.ownerId, closed);
    allowMember(guild.ownerId);

    add({
      id: guild.client.user.id,
      type: OverwriteType.Member,
      allow: BOT_PERMISSIONS,
      deny: []
    });

    return [...result.values()];
}

async function checkPrivacy(channel, state) {
 const fresh =
  await channel.guild.channels.fetch(
     channel.id,
     { force: true }
  );

    const overwrites =
     fresh?.permissionOverwrites?.cache;

    if (!overwrites) {
      throw new Error(
         "Could not verify ticket privacy."
      );
    }

    if (
      !overwrites.get(
         channel.guild.roles.everyone.id
      )?.deny.has(P.ViewChannel)
    ){
      throw new Error(
         "Ticket is not private."
      );
    }

    if (
      !overwrites.get(
         state.ownerId
      )?.allow.has(P.ViewChannel)
    ){
      throw new Error(
         "Ticket creator cannot view ticket."
      );
    }

    if (
      state.claimedBy &&
      !overwrites.get(
         state.claimedBy
      )?.allow.has(P.ViewChannel)
){
  throw new Error(
     "Ticket claimer cannot view ticket."
  );
}

let allowedRoles;

if (isVerificationTicket(state)) {
  allowedRoles =
    new Set(VERIFICATION_STAFF_ROLES);

} else if (isAppealTicket(state)) {
  allowedRoles =
   new Set(UNBLACKLIST_STAFF_ROLES);

} else if (
  isTradingTicket(state) &&
  state.claimedBy
){
  allowedRoles = new Set([
    IDS.owner,
    IDS.support
  ]);

} else {
  allowedRoles = new Set([
   IDS.owner,
   IDS.admin,
   IDS.mod,
   IDS.support,

      ...(
        isTradingTicket(state)
           ? [IDS.seller]
           : []
      )
    ]);
}

const allowedMembers = new Set([
  state.ownerId,
  state.claimedBy,
  channel.guild.ownerId,
  channel.client.user.id
].filter(Boolean));

for (const overwrite of overwrites.values()) {
 if (
   !overwrite.allow.has(P.ViewChannel)
 ){
   continue;
 }
        if (
          overwrite.type === OverwriteType.Role &&
          !allowedRoles.has(overwrite.id)
        ){
          throw new Error(
             "Unexpected role has ticket access."
          );
        }

        if (
          overwrite.type === OverwriteType.Member &&
          !allowedMembers.has(overwrite.id)
        ){
          throw new Error(
             "Unexpected member has ticket access."
          );
        }
    }
}

async function applyPermissions(channel, state) {
 await channel.permissionOverwrites.set(
    await permissions(
       channel.guild,
       state
    ),
    "Chuppys ticket permissions"
 );

    await checkPrivacy(channel, state);
}

// ============================================================
// CATEGORY LOOKUP
// ============================================================

async function category(guild, type) {
 const config = TYPES[type];

    if (!config) {
      throw new Error(
         "Invalid ticket category."
      );
    }

    const key = `${guild.id}:${type}`;

    if (categoryJobs.has(key)) {
      return categoryJobs.get(key);
    }

    const job = (async () => {
     await guild.channels.fetch();
const configuredId =
 process.env[config.env];

if (configuredId) {
  const configured =
    await guild.channels.fetch(
       configuredId
    );

    if (
      configured?.type !==
      ChannelType.GuildCategory
    ){
      throw new Error(
         `Invalid category: ${config.env}`
      );
    }

    return configured;
}

const categories = [
   ...guild.channels.cache.values()
].filter(
   channel =>
     channel.type ===
     ChannelType.GuildCategory
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
){
  throw new Error(
          `Missing ${config.label} category.`
     );
 }

 const roles =
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

 for (const id of roles) {
  if (!guild.roles.cache.has(id)) {
    continue;
  }

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

    reason:
      `Chuppys private ${type} category`
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
// BUTTONS
// ============================================================

function ticketButton(
  action,
  label,
  style,
  disabled = false
){
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

async function updateControls(channel, state) {
 if (!state.controlMessageId) return;

    await channel.messages.edit(
      state.controlMessageId,
      {
         components: controls(state)
      }
    ).catch(error => {
      console.warn(
         "[CONTROLS]",
         error.message
      );
    });
}

async function clearClosedControls(channel, state) {
 if (!state.closeControlMessageId) {
   return;
 }

    await channel.messages.edit(
      state.closeControlMessageId,
      { components: [] }
    ).catch(() => {});
}

async function ensureClosedControls(
 channel,
 entry,
 actorId = null
){
 const state = entry.state;

    let message = null;

    if (state.closeControlMessageId) {
      message = await channel.messages.fetch(
        state.closeControlMessageId
      ).catch(() => null);
    }
if (!message && !actorId) {
  await scan(channel, item => {
    if (
      item.author.id === channel.client.user.id &&
      item.embeds.some(
         embed =>
           embed.title === "Ticket Closed"
      ) &&
      item.createdTimestamp >=
         (
           state.closedAt
            ? Date.parse(state.closedAt)
            :0
         )
    ){
      message = item;
      return false;
    }
  });
}

if (!message) {
  message = await channel.send({
    embeds: [
     whiteEmbed(
      "Ticket Closed",

           (
            actorId
             ? `Closed by <@${actorId}>.\n\n`
             : ""
           )+

           `**Reason:** ${safe(state.closeReason, 500)}\n\n` +

           "Thank you for choosing Chuppys!"
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

if (
  state.closeControlMessageId !==
  message.id
){
  state.closeControlMessageId =
         message.id;

        await saveState(channel, entry);
    }

    return message;
}

// ============================================================
// NONBLOCKING CHANNEL RENAME
// ============================================================

function scheduleRename(channel) {
 if (renameJobs.has(channel.id)) {
   return;
 }

    const job = (async () => {
     for (let attempt = 0; attempt < 4; attempt++) {
      if (deletingTickets.has(channel.id)) {
        return;
      }

         const entry =
          tickets.get(channel.id);

         if (!entry || entry.state.deleted) {
           return;
         }

         const state = entry.state;

         const expected = ticketName(
            state.type,
            state.number,
            state.status === "closed"
         );

         if (channel.name === expected) {
           return;
         }

         try {
           await channel.setName(
              expected,
              "Chuppys ticket status"
           );

         } catch (error) {
           if (isMissing(error)) return;

          console.warn(
           "[RENAME]",
           error.message
            );

            await sleep(3000);
        }
      }
    })();

    renameJobs.set(channel.id, job);

    void job.finally(() => {
      renameJobs.delete(channel.id);
    }).catch(() => {});
}

// ============================================================
// TICKET PANEL
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
             ){
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

function verificationWelcomeDescription(userId) {
 return (
  `Welcome <@${userId}>!\n\n` +

         "**1.** State who invited you.\n" +
         "**2.** Provide screenshot proof.\n" +
         "**3.** Complete your server roles.\n\n" +

         "Once completed, ping staff for assistance.\n\n" +

         "Verification is approved manually by staff.\n\n" +

         "Never share passwords, account tokens or login codes."
    );
}

// ============================================================
// CREATE TICKET
// ============================================================

async function createTicket(
 interaction,
 type,
 answers = []
){
 return queued(async () => {
   const guild = interaction.guild;
   const config = TYPES[type];

    if (!guild || !config) {
      throw new TicketUserError(
         "Invalid ticket category."
      );
    }

    const member =
     await guild.members.fetch({
       user: interaction.user.id,
       force: true
     });

    const blacklisted =
     await isBlacklisted(member);

    if (
      type === "unblacklist" &&
      !blacklisted
    ){
      throw new TicketUserError(
         "Only blacklisted members can open an appeal."
      );
    }

    if (
      type !== "unblacklist" &&
      blacklisted
    ){
      throw new TicketUserError(
         "Please use the blacklist appeal panel."
      );
    }

    if (
      type === "verification" &&
      member.roles.cache.has(
         VERIFIED_ROLE_ID
      )
    ){
    throw new TicketUserError(
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
 await category(guild, type);

if (parent.children.cache.size >= 50) {
  throw new TicketUserError(
     "This ticket category is currently full."
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
    archiveSnapshot: null,

    createdAt:
     new Date().toISOString(),
  closedAt: null,
  deleted: false,
  revision: 0
};

const channel =
 await guild.channels.create({
  name: ticketName(type, number),
  type: ChannelType.GuildText,
  parent: parent.id,
  topic: null,

     permissionOverwrites:
      await permissions(guild, state),

      reason:
        `${config.label} ticket opened by ${interaction.user.id}`
    });

state.channelId = channel.id;

const entry = {
  state,
  storageMessageId: null
};

try {
  await checkPrivacy(channel, state);

    await saveState(channel, entry);

} catch (error) {
  await channel.delete(
    "Ticket initialization failed"
  ).catch(() => {});

    throw error;
}

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

     `${details}\n\n` +

     "Please provide relevant proof and wait for staff.";

} else {
  pingRoles =
   isTradingTicket(state)

         ?[
               IDS.owner,
               IDS.seller,
               IDS.support
          ]

         :[
               IDS.owner,
               IDS.support
          ];

    description =
     `Welcome <@${interaction.user.id}>!\n\n` +

     details +

     (
      type === "partnership"
       ? "\n\n**Please show proof of your vouches!**"
       : ""
     )+

     "\n\nOur team will assist you shortly.";
}
 pingRoles = [
    ...new Set(pingRoles)
 ].filter(
    id => guild.roles.cache.has(id)
 );

 const welcome = await channel.send({
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

 await saveState(channel, entry)
  .catch(error => {
    void reportError(
       guild,
       "Save opening controls",
       error,
       state
    );
  });

 console.log(
    `[TICKETS] Opened #${number} (${type})`
 );

  return {
    channel,
    existing: false
  };
});
}

async function openVerificationTicket(interaction) {
 if (
   !interaction?.guild ||
   !interaction?.user ||
   !interaction.inGuild()
 ){
   throw new TicketUserError(
      "Verification requires a server."
   );
 }

    return createTicket(
       interaction,
       "verification",
       []
    );
}

// ============================================================
// PRIVATE LOG CHANNEL VALIDATION
// ============================================================

async function validateArchiveChannel(
 guild,
 channel
){
 if (
   channel.id !== IDS.logs ||
   channel.guild?.id !== guild.id ||
   channel.type !== ChannelType.GuildText
 ){
   throw new Error(
      "Invalid archive destination."
   );
 }

    const fresh =
     await guild.channels.fetch(
        channel.id,
        { force: true }
     );

    const overwrites =
     fresh?.permissionOverwrites?.cache;

    if (
      !overwrites?.get(
         guild.roles.everyone.id
      )?.deny.has(P.ViewChannel)
    ){
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
 if (
   !overwrite.allow.has(P.ViewChannel)
 ){
   continue;
 }

    if (
      overwrite.type === OverwriteType.Role &&
      !allowedRoles.has(overwrite.id) &&
      guild.roles.cache.get(overwrite.id)?.tags?.botId !== guild.client.user.id
    ){
      throw new Error(
         `Unexpected logs role: ${overwrite.id}`
      );
    }

    if (
      overwrite.type === OverwriteType.Member &&
      !allowedMembers.has(overwrite.id)
    ){
      throw new Error(
         "Unexpected member has logs access."
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
             "Bot is missing required archive permissions."
        );
    }

    return fresh;
}

// ============================================================
// DISCORD ATTACHMENT DOWNLOADS
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
        ){
          return null;
        }

        return url;

    } catch {
      return null;
    }
}

function originalCdnUrl(value) {
 const url =
  discordAttachmentUrl(value);

    if (!url) return null;

    url.hostname =
     "cdn.discordapp.com";

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

async function downloadTranscriptFile(value) {
 const url =
  discordAttachmentUrl(value);

    if (!url) {
      throw new Error(
         "Invalid attachment URL."
      );
    }

    const response = await fetch(
     url.href,
     {
       redirect: "error",

             headers: {
               Accept: "*/*",
               "Accept-Encoding": "identity"
             },

             signal:
              AbortSignal.timeout(
                DOWNLOAD_TIMEOUT
              )
         }
    );

    if (!response.ok) {
      await response.body?.cancel()
        .catch(() => {});

         throw new Error(
            `Attachment HTTP ${response.status}`
         );
    }

    if (!response.body) {
      throw new Error(
         "Empty attachment response."
      );
    }

    const chunks = [];
    let size = 0;

    for await (
     const chunk of response.body
    ){
     const part = Buffer.from(chunk);
        chunks.push(part);
        size += part.length;
    }

    const length =
     response.headers.get("content-length");

    const encoding =
     response.headers.get("content-encoding");

    if (
      length !== null &&
      (!encoding || encoding === "identity") &&
      Number(length) !== size
    ){
      throw new Error(
         "Incomplete attachment download."
      );
    }

    return Buffer.concat(chunks, size);
}

// Only accept a resized fallback if its image container is complete.
const fallbackDownloads = new WeakMap();
function completeImage(b) {
  const mime = imageMime(b);
  if (mime === "image/png") {
    let p = 8, header = false, data = false;
    while (p + 12 <= b.length) {
      const n = b.readUInt32BE(p), type = b.toString("ascii", p+4, p+8);
      if (n > b.length-p-12) return false;
      if (p === 8) header = type === "IHDR" && n === 13;
      if (type === "IDAT") data = true;
      p += n+12;
      if (type === "IEND") return header && data && n === 0 && p === b.length;
    }
  }
  if (mime === "image/jpeg") return b.length > 4 && b.readUInt16BE(b.length-2) === 0xffd9;
  if (mime === "image/gif") return b.length > 14 && b[b.length-1] === 0x3b;
  if (mime === "image/webp") return b.length > 20 && b.readUInt32LE(4)+8 === b.length;
  return false;
}
async function downloadMessageAttachment(message, file) {
  let lastError, fallback;
  const expectedImage = /^image\//i.test(file.contentType || "") || /\.(png|jpe?g|gif|webp|avif)$/i.test(file.name || "");
  for (let attempt=1; attempt<=DOWNLOAD_RETRIES; attempt++) {
    let current = file;
    if (attempt > 1) {
      try {
        const fresh = await message.channel.messages.fetch({message:message.id,force:true,cache:false});
        current = fresh.attachments.get(file.id) || file;
      } catch (e) { lastError=e; }
    }
    const originals = [originalCdnUrl(current.url), current.url].filter(Boolean);
    for (const url of new Set([...originals, current.proxyURL].filter(Boolean))) {
      try {
        const buffer = await downloadTranscriptFile(url);
        if (originals.includes(url) && buffer.length === file.size) return buffer;
        if (expectedImage && completeImage(buffer) && (!fallback || buffer.length > fallback.length)) fallback=buffer;
        lastError = new Error("Original file size mismatch or proxy response");
      } catch (e) { lastError=e; }
    }
    if (fallback && attempt >= 2) break;
    if (attempt < DOWNLOAD_RETRIES) await sleep(Math.min(1500*attempt,8000));
  }
  if (fallback) { fallbackDownloads.set(fallback, file.size); return fallback; }
  throw new Error(`Could not preserve ${file.name || file.id}: ${lastError?.message || "Download failed"}`);
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
    ){
      return "image/png";
    }

    if (
      buffer.length >= 3 &&
      buffer[0] === 255 &&
      buffer[1] === 216 &&
      buffer[2] === 255
    ){
      return "image/jpeg";
    }

    const signature =
     buffer.subarray(0, 6).toString();

    if (
      signature === "GIF87a" ||
      signature === "GIF89a"
    ){
      return "image/gif";
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString() === "RIFF" &&
      buffer.subarray(8, 12).toString() === "WEBP"
    ){
      return "image/webp";
    }

    if (
      buffer.length >= 12 &&
      buffer.subarray(4, 8).toString() === "ftyp" &&
      ["avif", "avis"].includes(
         buffer.subarray(8, 12).toString()
      )
    ){
      return "image/avif";
    }

    return null;
}

function imageExtension(mime) {
 return ({
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
      "image/avif": "avif"
    })[mime] || "bin";
}

// ============================================================
// ARCHIVE ROOT
// ============================================================

function archiveRootPayload(
 state,
 complete = null
){
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

     `**Close Reason:**\n${safe(state.closeReason, 500)}\n\n`;

    if (complete) {
      description +=
        "**Archive Status:** Complete\n" +

      `**Messages:** ${complete.messages}\n` +

      `**Attachments:** ${complete.attachments}\n` +

      `**Unique Files:** ${
        complete.uniqueFiles ??
        complete.attachments
      }\n` +

      `**Images:** ${complete.images}\n` +

      `**Transcript Parts:** ${complete.parts}\n\n` +

      `[Open Archive](${complete.url})`;

    } else {
      description +=
       "**Archive Status:** Saving\n\n" +
         "Original attachments and transcripts are organized in the attached thread.";
    }

    return {
     content: "",

        embeds: [
           whiteEmbed(
             `Ticket #${numberText(state.number)} — ${TYPES[state.type]?.label || state.type}`,
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

async function findArchiveRoot(logs, state) {
 const marker =
  `${ARCHIVE_ROOT_MARKER}:${state.channelId}`;

    if (state.archiveRootId) {
      const existing =
        await logs.messages.fetch(
          state.archiveRootId
        ).catch(() => null);

        if (
          existing?.author.id ===
             logs.client.user.id &&
          footerText(existing).endsWith(marker)
        ){
          return existing;
        }
    }

    let root = null;

    await scan(logs, message => {
      if (
        message.author.id === logs.client.user.id &&
        footerText(message).endsWith(marker)
      ){
        root = message;
        return false;
      }
    });

    return root;
}

async function getArchiveThread(logs, state) {
 let root =
   await findArchiveRoot(logs, state);

    if (!root) {
      root = await logs.send(
         archiveRootPayload(state)
      );
    }

    state.archiveRootId = root.id;

    let thread =
      root.thread ||
      await logs.guild.channels.fetch(
        root.id
      ).catch(() => null);

    if (!thread) {
      try {
        thread = await root.startThread({
          name:
           `ticket-${numberText(state.number)}-${state.type}`,

             autoArchiveDuration: 1440,

              reason:
                `Archive for ticket #${state.number}`
            });

        } catch (error) {
          thread =
           await logs.guild.channels.fetch(
             root.id
           ).catch(() => null);

            if (!thread) throw error;
        }
    }

    if (
      !thread.isThread() ||
      thread.parentId !== logs.id ||
      thread.id !== root.id
    ){
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

    state.archiveThreadId =
     thread.id;

    return {
      root,
      thread
    };
}

// ============================================================
// ARCHIVE CATALOG
// ============================================================

async function buildArchiveCatalog(
 logs,
 thread,
 state
){
 const catalog = {
   files: new Map(),
   hashes: new Map(),
   parts: new Map(),
   html: new Map(),
   completed: new Map(),
   manifestParts: new Map(),
   legacy: []
 };

    await scan(thread, message => {
     if (
       message.author.id !==
       logs.client.user.id
     ){
       return;
     }

        const footer =
         footerText(message);

        const attachment =
         message.attachments.first();

        const fileMarker = footer.match(
           /CHUPPYS_ARCHIVE_FILE_V4:([^:]+):([a-f0-9]{64}):(\d+):(\d+):(\d+)/
        );

        if (fileMarker && attachment) {
          const [
  ,
  id,
  checksum,
  partText,
  totalText,
  sizeText
] = fileMarker;

const part = Number(partText);
const total = Number(totalText);
const size = Number(sizeText);

if (
  !Number.isSafeInteger(size) ||
  size < 0 ||
  total !== Math.max(
     1,
     Math.ceil(size / FILE_PART_SIZE)
  ) ||
  part < 1 ||
  part > total
){
  return;
}

const expected = Math.min(
   FILE_PART_SIZE,
   Math.max(
     0,
     size -
     (part - 1) * FILE_PART_SIZE
   )
);

if (attachment.size !== expected) {
  return;
}

const key =
 `${id}:${checksum}:${total}:${size}`;

if (!catalog.parts.has(key)) {
  catalog.parts.set(key, {
    id,
    checksum,
    total,
    size,
    fallback: /:fallback:\d+$/.test(footer),
    expectedSize: Number(footer.match(/:fallback:(\d+)$/)?.[1] || size),
    messages: new Map()
  });
}

const record =
 catalog.parts.get(key);
    if (!record.messages.has(part)) {
      record.messages.set(
         part,
         message.url
      );
    }

    return;
}

const htmlMarker = footer.match(
   /CHUPPYS_ARCHIVE_HTML_V4:([a-f0-9]{64}):(\d+):([a-f0-9]{64})/
);

if (htmlMarker && attachment) {
  const [, snapshot, part, checksum] =
    htmlMarker;

    const key =
     `${snapshot}:${part}:${checksum}`;

    if (!catalog.html.has(key)) {
      catalog.html.set(
         key,
         message.url
      );
    }
}

const completeMarker = footer.match(
   /CHUPPYS_ARCHIVE_COMPLETE_V4:([a-f0-9]{64})/
);

if (completeMarker) {
  const key = completeMarker[1];

    if (!catalog.completed.has(key)) {
      catalog.completed.set(
         key,
         message
      );
    }
}

const manifestMarker = footer.match(
   /CHUPPYS_MANIFEST_PART_V5:([a-f0-9]{64}):(\d+):(\d+):([a-f0-9]{64})/
);

if (manifestMarker && attachment) {
  const [
    ,
    snapshot,
    part,
    total,
        checksum
      ] = manifestMarker;

      const key =
       `${snapshot}:${part}:${total}:${checksum}`;

      if (!catalog.manifestParts.has(key)) {
        catalog.manifestParts.set(
           key,
           message
        );
      }
  }
});

// Discover old files saved directly in logs.

await scan(logs, message => {
 if (
   message.author.id !==
   logs.client.user.id
 ){
   return;
 }

 for (const embed of message.embeds) {
  if (
    embed.title !==
       "Archived Ticket Attachment" &&
    embed.title !==
       "Recovered Ticket Image"
  ){
    continue;
  }

      const ticketMatch = String(
         embed.description || ""
      ).match(
         /\*\*Ticket:\*\*\s*#?0*(\d+)/i
      );

      if (
        !ticketMatch ||
        Number(ticketMatch[1]) !==
           state.number
      ){
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

      catalog.legacy.push({
        id: idMatch[1],
        name: attachment.name,
        size: attachment.size,
        urls: [message.url],
        split: false,
        legacy: true,
        message,
        attachment
      });
  }
});

for (
 const record of
 catalog.parts.values()
){
 if (
   record.messages.size !==
   record.total
 ){
   continue;
 }

 const urls = [];

 for (
  let part = 1;
  part <= record.total;
  part++
 ){
  const url =
    record.messages.get(part);

      if (url) urls.push(url);
 }

 if (urls.length !== record.total) {
   continue;
 }

 const complete = {
  id: record.id,
  checksum: record.checksum,
  size: record.size,
  fallback: record.fallback, expectedSize: record.expectedSize,
  urls,
          split: record.total > 1
        };

        if (!catalog.files.has(record.id)) {
          catalog.files.set(
             record.id,
             complete
          );
        }

        if (
          !catalog.hashes.has(record.checksum)
        ){
          catalog.hashes.set(
             record.checksum,
             complete
          );
        }
    }

    return catalog;
}

// ============================================================
// LEGACY FILE HASHES
// ============================================================

async function loadLegacyHashes(catalog) {
 for (const record of catalog.legacy) {
  if (record.checksum) continue;

        try {
          const buffer =
           await downloadMessageAttachment(
              record.message,
              record.attachment
           );

         record.checksum =
          hash(buffer);

         record.mime =
          imageMime(buffer);

         if (
           !catalog.hashes.has(record.checksum)
         ){
           catalog.hashes.set(
              record.checksum,
              record
           );
         }

        } catch (error) {
            console.warn(
               "[LEGACY ARCHIVE]",
               error.message
            );
        }
    }
}

// ============================================================
// SAVE ORIGINAL ATTACHMENT ONCE
// ============================================================

async function archiveOriginalFile(
 thread,
 catalog,
 state,
 buffer,
 originalName,
 originalId
){
 const id = String(originalId);
    const fallback = fallbackDownloads.has(buffer);
    const expectedSize = fallbackDownloads.get(buffer) ?? buffer.length;

    const checksum =
     hash(buffer);

    const mime =
     imageMime(buffer);

    // Identical bytes always reuse the existing upload.

    const existing =
     catalog.hashes.get(checksum);

    if (
      existing &&
      existing.size === buffer.length
    ){
      const record = {
         ...existing,
         id,
         mime,
         name: originalName, fallback, expectedSize
      };

        catalog.files.set(id, record);

        return record;
    }

    let filename =
      safeFilename(originalName);

    if (
      mime &&
  !/\.(png|jpe?g|gif|webp|avif)$/i.test(
    filename
  )
){
  filename +=
    `.${imageExtension(mime)}`;
}

if (fallback && mime) filename = filename.replace(/\.[^.]+$/, "") + "." + imageExtension(mime);

const total = Math.max(
   1,
   Math.ceil(
     buffer.length / FILE_PART_SIZE
   )
);

// Resume any matching partial file, even if its
// original Discord attachment ID is different.

let partial = [
   ...catalog.parts.values()
].find(
   record =>
     record.checksum === checksum &&
     record.size === buffer.length &&
     record.total === total
);

if (!partial) {
  partial = {
    id,
    checksum,
    total,
    size: buffer.length,
    messages: new Map()
  };

    catalog.parts.set(
       `${id}:${checksum}:${total}:${buffer.length}`,
       partial
    );
}

for (
 let part = 1;
 part <= total;
 part++
){
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

const message = await thread.send({
 embeds: [
  whiteEmbed(
   mime
    ? "Saved Image"
    : "Saved Attachment",

           `**File:** ${safe(originalName, 200)}\n` +

           `**Size:** ${buffer.length.toLocaleString()} bytes\n` +

           (fallback ? `**Quality:** Fallback image (original unavailable; expected ${expectedSize} bytes)` : "**Quality:** Original-size download") +

           (
               total > 1
                ? `\n**Part:** ${part}/${total}\n\n` +
                  "Join all numbered parts to restore the original file."
                : ""
            )
          ).setFooter({
            text:
              `${ARCHIVE_FILE_MARKER}:${partial.id}:${checksum}:` +
              `${part}:${total}:${buffer.length}${fallback ? ":fallback:"+expectedSize : ""}`
          })
     ],

     files: [
        new AttachmentBuilder(bytes, {
          name: uploadName
        })
     ],

  allowedMentions: NONE
});

if (
  message.attachments.first()?.size !==
  bytes.length
){
  throw new Error(
     `Attachment upload verification failed: ${filename}`
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
    ){
     const url =
       partial.messages.get(part);

        if (!url) {
          throw new Error(
             "Missing attachment part."
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
      split: total > 1, fallback, expectedSize
    };

    catalog.files.set(id, record);
    catalog.hashes.set(checksum, record);

    console.log(
       `[ARCHIVE] #${state.number}: ${filename} saved.`
    );

    return record;
}

async function preserveAttachment(
 thread,
 catalog,
 state,
 message,
 file
){
 const existing =
   catalog.files.get(file.id);

    // Previously verified V4/V5 uploads can be reused
    // without downloading the original picture again.
    if (
      existing &&
      existing.checksum &&
      (existing.size === file.size || existing.fallback) &&
      existing.urls.length &&
      !existing.legacy
    ){
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
// HTML TRANSCRIPTS
// ============================================================

function transcriptDocument(
  state,
  rows,
  part
){
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none';">
<title>Chuppys Ticket Transcript</title>
<style>
*{box-sizing:border-box}
body{
  background:#17161e;
  color:#eeeeee;
  font:15px/1.6 system-ui,sans-serif;
  max-width:900px;
 margin:auto;
 padding:24px
}
header{
  border-bottom:1px solid #45434f;
  padding-bottom:20px;
  margin-bottom:20px
}
h1{font-size:26px;margin:0}
article{
  border-bottom:1px solid #35333f;
  padding:18px 0
}
.author{font-weight:700}
small{color:#b0adbd}
.body{
  white-space:pre-wrap;
  overflow-wrap:anywhere;
  margin-top:8px
}
blockquote{
  margin:12px 0;
  border-left:3px solid white;
  background:#25232e;
  padding:12px;
  white-space:pre-wrap;
  overflow-wrap:anywhere
}
.attachment{
  border:1px solid #45434f;
  border-radius:8px;
  padding:12px;
  margin:10px 0;
  background:#211f2a;
  overflow-wrap:anywhere
}
a{color:#aaccff}
</style>
</head>
<body>
<header>
<h1>${escapeHtml(BRAND)}</h1>
<h2>Ticket #${numberText(state.number)}</h2>
<p>${escapeHtml(TYPES[state.type]?.label || state.type)}</p>
<p>Transcript Part ${part}</p>
<p>Original attachments are stored once in the Discord archive.</p>
</header>
${rows.join("\n")}
</body>
</html>`;
}

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

const embeds = message.embeds.map(
 embed => {
  const fields = (
    embed.fields || []
  ).map(
    field =>
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
  }
).join("");

const stickers = [
  ...(message.stickers?.values?.() || [])
].map(
  sticker =>
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
               ? `Open file part ${index + 1}`
               : "Open saved attachment"
             )+

        "</a></p>"
    ).join("");

    return (
     '<div class="attachment">' +

         `<strong>${escapeHtml(record.name)}</strong>` +

         `<p>Saved size: ${record.size.toLocaleString()} bytes${record.fallback ? " (fallback image; original unavailable)" : ""}</p>` +

         links +

         (
          record.split
           ? "<p>Join numbered parts to restore the original file.</p>"
           : ""
         )+

         "</div>"
    );
}

// ============================================================
// MULTIPART TRANSCRIPT WRITER
// ============================================================

function createTranscriptWriter(
 thread,
 catalog,
 state,
 snapshot
){
 let rows = [];
 let bytes = 0;
 let part = 0;
const urls = [];

async function flush() {
 if (!rows.length) return;

 part++;

 const buffer = Buffer.from(
    transcriptDocument(
       state,
       rows,
       part
    ),
    "utf8"
 );

 if (
   buffer.length > HTML_PART_SIZE
 ){
   throw new Error(
      "Transcript part exceeds upload limit."
   );
 }

 const checksum =
  hash(buffer);

 const key =
  `${snapshot}:${part}:${checksum}`;

 let url =
   catalog.html.get(key);

 if (!url) {
   const message =
     await thread.send({
       embeds: [
        whiteEmbed(
          "Ticket Transcript",

           `**Ticket:** #${numberText(state.number)}\n` +

           `**Part:** ${part}\n\n` +

            "Download the HTML file to read the conversation."
          ).setFooter({
            text:
             `${ARCHIVE_HTML_MARKER}:${snapshot}:${part}:${checksum}`
          })
     ],

     files: [
       new AttachmentBuilder(
         buffer,
                   {
                       name:
                        `transcript-${state.type}-${state.number}-part-${part}.html`
                   }
               )
          ],

           allowedMentions: NONE
         });

        if (
          message.attachments.first()?.size !==
          buffer.length
        ){
          throw new Error(
             "Transcript upload verification failed."
          );
        }

        url = message.url;

        catalog.html.set(
           key,
           url
        );
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
      const characters =
        Array.from(value);

        for (
         let offset = 0;
         offset < characters.length;
         offset += 100000
        ){
         await add(
           '<article><div class="body">' +
                     escapeHtml(
                      characters.slice(
                        offset,
                        offset + 100000
                      ).join("")
                     )+

                     "</div></article>"
                );
            }

            return;
        }

        if (
          rows.length &&
          bytes + size + 1 > max
        ){
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
// EXCLUDE INTERNAL COMMAND SPAM
// ============================================================

function shouldArchiveMessage(message) {
 // Never exclude a message containing attachments.

    if (
      message.attachments.size ||
      message.stickers?.size
    ){
      return true;
    }

    if (
      !message.author.bot &&
      /^,(?:delete|savelog)(?:\s|$)/i.test(
         message.content.trim()
      )
    ){
      return false;
    }

    if (
      message.author.id ===
      message.client.user.id
    ){
      if (
         footerText(message).includes(
           ARCHIVE_STATUS_MARKER
         )
      ){
         return false;
      }

  if (
    /^(?:Ticket error:|Saving all ticket messages|Saving the ticket messages|Ticket archive could not be completed|Deletion cancelled because|Ticket #\d+ saved successfully)/i
       .test(message.content || "")
  ){
    return false;
  }

        if (
          message.embeds.some(
             embed => [
               "Transcript Not Saved",
               "Archive Incomplete",
               "Deletion Cancelled",
               "Ticket Archive Saved",
               "Archive Complete"
             ].includes(embed.title)
          )
        ){
          return false;
        }
    }

    return true;
}

// ============================================================
// STABLE SNAPSHOT HASH
// ============================================================
//
// Button edits and channel renames do not create
// unnecessary new archive versions.
//
// ============================================================

function snapshotHash(messages, state) {
 const digest =
  createHash("sha256");

 digest.update(
    JSON.stringify({
      channelId: state.channelId,
      status: state.status,
      reason: state.closeReason,
      claimedBy: state.claimedBy
    })
 );

 for (const message of messages) {
  digest.update(
    JSON.stringify({
      id: message.id,

    author:
     message.author?.id,

    content:
     message.content || "",

    embeds:
     message.embeds.map(
      embed => ({
       title:
         embed.title || "",

            description:
             embed.description || "",

             fields:
               embed.fields || []
           })
      ),

    stickers: [
       ...(message.stickers?.keys?.() || [])
    ],

    attachments: [
      ...message.attachments.values()
    ].map(
      file => ({
                     id: file.id,
                     name: file.name,
                     size: file.size
                   })
               )
             })
        );
    }

    return digest.digest("hex");
}

// ============================================================
// VERIFY ARCHIVED REFERENCES
// ============================================================

async function fetchArchiveReference(
 guild,
 value
){
 const url = new URL(value);

    if (
      url.protocol !== "https:" ||
      url.hostname !== "discord.com"
    ){
      throw new Error(
         "Invalid archive reference."
      );
    }

    const match = url.pathname.match(
       /^\/channels\/(\d+)\/(\d+)\/(\d+)$/
    );

    if (!match || match[1] !== guild.id) {
      throw new Error(
         "Archive reference belongs to another server."
      );
    }

    const channel =
     await guild.channels.fetch(
        match[2]
     );

    if (
      channel.id !== IDS.logs &&
      channel.parentId !== IDS.logs
    ){
      throw new Error(
         "Archive reference is outside private logs."
      );
    }
    const message =
     await channel.messages.fetch({
       message: match[3],
       force: true,
       cache: false
     });

    if (
      message.author.id !==
         guild.client.user.id ||
      !message.attachments.size
    ){
      throw new Error(
         "Archived file is missing."
      );
    }

    return message;
}

async function verifyCompletedArchive(
 guild,
 archive
){
 if (
   !Array.isArray(archive.transcriptUrls) ||
   !archive.transcriptUrls.length ||
   !Array.isArray(archive.files)
 ){
   return false;
 }

    try {
      const cache = new Map();

     async function fetchOnce(url) {
      if (!cache.has(url)) {
        cache.set(
           url,
           await fetchArchiveReference(
             guild,
             url
           )
        );
      }

         return cache.get(url);
     }

     for (const url of archive.transcriptUrls) {
      const message =
        await fetchOnce(url);
     if (
       !message.attachments.first()
          ?.name?.endsWith(".html")
     ){
       return false;
     }
 }

 for (const file of archive.files) {
  if (
    !Array.isArray(file.urls) ||
    !file.urls.length
  ){
    return false;
  }

     let size = 0;

     for (const url of file.urls) {
      const message =
        await fetchOnce(url);

         const attachment =
          message.attachments.first();

         size += attachment.size;

         const marker = footerText(
            message
         ).match(
            /CHUPPYS_ARCHIVE_FILE_V4:([^:]+):([a-f0-9]{64}):(\d+):(\d+):(\d+)/
         );

         if (
           marker &&
           file.checksum &&
           marker[2] !== file.checksum
         ){
           return false;
         }
     }

     if (size !== file.size) {
       return false;
     }
 }

 return true;

} catch (error) {
  console.warn(
     "[ARCHIVE VERIFY]",
     error.message
  );
        return false;
    }
}

// ============================================================
// READ COMPLETED MANIFEST
// ============================================================

async function completedArchive(
 message,
 catalog,
 snapshot
){
 if (!message) return null;

    try {
      let buffer;

        const manifest =
         message.attachments.find(
            file =>
              file.name?.endsWith(
                "-manifest.json"
              )
         );

        if (manifest) {
          buffer =
            await downloadMessageAttachment(
               message,
               manifest
            );

        } else {
          const description =
           message.embeds[0]?.description || "";

         const match = description.match(
            /Manifest Parts:\*\*\s*(\d+)\s*\n\*\*Manifest SHA256:\*\*\s*([a-f0-9]{64})/
         );

         if (!match) return null;

         const total = Number(match[1]);
         const checksum = match[2];

         const buffers = [];

         for (
          let part = 1;
          part <= total;
          part++
         ){
             const key =
              `${snapshot}:${part}:${total}:${checksum}`;

             const saved =
              catalog.manifestParts.get(key);

             if (!saved) return null;

             buffers.push(
                await downloadMessageAttachment(
                  saved,
                  saved.attachments.first()
                )
             );
         }

         buffer = Buffer.concat(buffers);

         if (hash(buffer) !== checksum) {
           return null;
         }
     }

     const result = JSON.parse(
        buffer.toString("utf8")
     );

     if (
       result.snapshot !== snapshot ||
       !Array.isArray(result.transcriptUrls) ||
       !Array.isArray(result.files)
     ){
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
// SAVE ARCHIVE MANIFEST
// ============================================================

async function saveArchiveManifest(
 thread,
 catalog,
 state,
 snapshot,
 result
){
 const manifest = {
   version: 5,

  ticket: state.number,
  channelId: state.channelId,
  type: state.type,
  creator: state.ownerId,
  claimedBy: state.claimedBy,
  closeReason: state.closeReason,
  snapshot,

  messages: result.messages,
  attachments: result.attachments,
  uniqueFiles: result.uniqueFiles,
  images: result.images,
  totalBytes: result.totalBytes,
  parts: result.parts,

  transcriptUrls:
    result.transcriptUrls,

   files:
     result.files
 };

 const buffer = Buffer.from(
    JSON.stringify(manifest, null, 2),
    "utf8"
 );

 const links = result.transcriptUrls
  .slice(0, 10)
  .map(
    (url, index) =>
      `[Transcript ${index + 1}](${url})`
  )
  .join("\n");

 let description =
   `**Ticket:** #${numberText(state.number)}\n` +

  `**Messages:** ${result.messages}\n` +

  `**Attachments:** ${result.attachments}\n` +

  `**Unique Files:** ${result.uniqueFiles}\n` +

  `**Images:** ${result.images}\n\n` +

  "**Transcript**\n" +

  links +
 "\n\nOriginal files are saved once and reused.";

const files = [];

if (buffer.length <= FILE_PART_SIZE) {
  files.push(
     new AttachmentBuilder(buffer, {
       name:
        `ticket-${state.number}-manifest.json`
     })
  );

} else {
  const checksum =
   hash(buffer);

 const total = Math.ceil(
    buffer.length / FILE_PART_SIZE
 );

 for (
  let part = 1;
  part <= total;
  part++
 ){
  const key =
    `${snapshot}:${part}:${total}:${checksum}`;

  if (
    catalog.manifestParts.has(key)
  ){
    continue;
  }

  const bytes = buffer.subarray(
     (part - 1) * FILE_PART_SIZE,
     part * FILE_PART_SIZE
  );

  const message =
   await thread.send({
    embeds: [
     whiteEmbed(
      "Archive Index",

            `**Part:** ${part}/${total}`
          ).setFooter({
            text:
              `${MANIFEST_PART_MARKER}:${key}`
          })
     ],

     files: [
               new AttachmentBuilder(bytes, {
                 name:
                  `ticket-${state.number}-manifest.json.part` +
                  String(part).padStart(5, "0")
               })
          ],

           allowedMentions: NONE
         });

        if (
          message.attachments.first()?.size !==
          bytes.length
        ){
          throw new Error(
             "Manifest part upload failed."
          );
        }

        catalog.manifestParts.set(
           key,
           message
        );
    }

    description +=
     `\n\n**Manifest Parts:** ${total}\n` +

        `**Manifest SHA256:** ${checksum}`;
}

const message =
 await thread.send({
  embeds: [
     whiteEmbed(
       "Ticket Archive Complete",
       description
     )
       .setFooter({
         text:
          `${ARCHIVE_COMPLETE_MARKER}:${snapshot}`
       })
       .setTimestamp()
  ],

      files,
      allowedMentions: NONE
    });

if (
  files.length &&
  message.attachments.first()?.size !==
     buffer.length
){
        throw new Error(
           "Archive manifest upload failed."
        );
    }

    return {
      ...manifest,
      url: message.url
    };
}

// ============================================================
// ARCHIVE IMPLEMENTATION
// ============================================================

async function buildTicketArchive(
 channel,
 state
){
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
        state
     );

    const messages = (
      await allMessages(channel)
    ).filter(shouldArchiveMessage);

    const snapshot =
     snapshotHash(messages, state);

    const catalog =
     await buildArchiveCatalog(
        logs,
        thread,
        state
     );

    const previous =
     await completedArchive(
      catalog.completed.get(snapshot),
      catalog,
         snapshot
    );

if (
  previous &&
  previous.channelId === state.channelId &&
  await verifyCompletedArchive(
     channel.guild,
     previous
  )
){
  await root.edit(
     archiveRootPayload(
       state,
       previous
     )
  );

    return {
      ...previous,
      archiveRootId: root.id,
      archiveThreadId: thread.id
    };
}

await loadLegacyHashes(catalog);

const writer =
 createTranscriptWriter(
    thread,
    catalog,
    state,
    snapshot
 );

const files = [];
const unique = new Map();
const seen = new Map();
const imageHashes = new Set();
const failures = [];

for (const message of messages) {
 await writer.add(
    messageHtml(message)
 );

    for (
     const file of
     message.attachments.values()
    ){
     let record =
       seen.get(file.id);

         if (!record) {
           try { record =
             await preserveAttachment(
                thread,
                catalog,
                state,
                message,
                file
             ); } catch (error) { failures.push(error.message); continue; }

            seen.set(
               file.id,
               record
            );
        }

        const checksum =
         record.checksum;

        unique.set(
           checksum,
           record.size
        );

        if (
          record.mime ||
          /^image\//i.test(
             file.contentType || ""
          ) ||
          /\.(png|jpe?g|gif|webp|avif|heic|bmp|tiff?)$/i.test(
             file.name || ""
          )
        ){
          imageHashes.add(checksum);
        }

        files.push({
          id: file.id,
          messageId: message.id,
          name: file.name || "attachment",
          size: record.size,
          checksum,
          urls: record.urls,
          split: record.split, fallback: !!record.fallback, expectedSize: record.expectedSize ?? file.size
        });

        await writer.add(
           archiveLinkHtml(record)
        );
    }
}

if (failures.length) {
  const payload = archiveRootPayload(state);
  payload.embeds[0].setDescription(payload.embeds[0].data.description.replace("**Archive Status:** Saving", `**Archive Status:** Incomplete (${failures.length} unavailable attachments)`));
  await root.edit(payload).catch(() => {});
  throw new Error(failures.join("; ").slice(0,1800));
}
const transcript =
 await writer.finish();

const result = {
 messages: messages.length,

 attachments: files.length,

 uniqueFiles: unique.size,

 images: imageHashes.size,

 totalBytes: [
    ...unique.values()
 ].reduce(
    (sum, size) => sum + size,
    0
 ),

 parts: transcript.parts,

 transcriptUrls:
   transcript.urls,

  files
};

await validateArchiveChannel(
   channel.guild,
   logs
);

const archive =
 await saveArchiveManifest(
    thread,
    catalog,
    state,
    snapshot,
    result
 );

if (
  !(await verifyCompletedArchive(
     channel.guild,
     archive
  ))
){
  throw new Error(
     "Archive verification did not complete."
  );
}

await root.edit(
   archiveRootPayload(
     state,
     archive
   )
);
    console.log(
       `[ARCHIVE] #${state.number}: ` +
       `${result.messages} messages, ` +
       `${result.uniqueFiles} unique files saved.`
    );

    return {
      ...archive,
      archiveRootId: root.id,
      archiveThreadId: thread.id
    };
}

// ============================================================
// INDEPENDENT ARCHIVE QUEUE
// ============================================================
//
// Archives never hold the normal ticket lifecycle queue.
// This allows tickets to reopen without waiting for files.
//
// ============================================================

async function archiveTicket(channel, entry) {
 const running =
  archiveJobs.get(channel.id);

    if (running) {
      return running;
    }

    const state = {
      ...entry.state
    };

    const job = queuedArchive(
       channel.id,
       () => archiveWorker(
         () => buildTicketArchive(
           channel,
           state
         )
       )
    );

    archiveJobs.set(
       channel.id,
       job
    );

    try {
      return await job;

    } finally {
        if (
          archiveJobs.get(channel.id) === job
        ){
          archiveJobs.delete(channel.id);
        }
    }
}

async function commitArchive(
 channel,
 entry,
 archive
){
 entry.state.archiveRootId =
   archive.archiveRootId;

    entry.state.archiveThreadId =
     archive.archiveThreadId;

    entry.state.transcriptUrl =
     archive.url;

    entry.state.archiveSnapshot =
     archive.snapshot;

    await saveState(
       channel,
       entry
    );
}

// ============================================================
// AUTOMATIC BACKGROUND ARCHIVING
// ============================================================

function cancelArchiveTimer(id) {
 const timer =
  archiveTimers.get(id);

    if (timer) {
      clearTimeout(timer);
    }

    archiveTimers.delete(id);
}

function scheduleArchive(
 channel,
 attempt = 1,
 delay = 1500
){
 cancelArchiveTimer(channel.id);

    if (
  deletingTickets.has(channel.id)
){
  return;
}

const timer = setTimeout(
 async () => {
  archiveTimers.delete(
     channel.id
  );

  const entry =
   tickets.get(channel.id);

  if (
    !entry ||
    entry.state.deleted ||
    entry.state.status !== "closed" ||
    deletingTickets.has(channel.id)
  ){
    return;
  }

  const revision =
   entry.state.revision;

  try {
    const archive =
     await archiveTicket(
        channel,
        entry
     );

   const latest = (await allMessages(channel)).filter(shouldArchiveMessage);
   await queuedTicket(
    channel.id,

     async () => {
      const current =
       tickets.get(channel.id);

      if (
        !current ||
        current.state.deleted ||
        current.state.status !== "closed" ||
        current.state.revision !== revision ||
        deletingTickets.has(channel.id)
      ){
        return;
      }



           if (
             snapshotHash(
                latest,
                current.state
             ) !== archive.snapshot
           ){
             scheduleArchive(
                channel,
                1,
                1500
             );

                return;
           }

           await commitArchive(
              channel,
              current,
              archive
           );
       }
  );

 } catch (error) {
   if (isMissing(error)) return;

  console.error(
     `[ARCHIVE] Attempt ${attempt}:`,
     error.message
  );

  if (attempt < ARCHIVE_RETRIES) {
    scheduleArchive(
       channel,
       attempt + 1,
       Math.min(
         15000 * attempt,
         120000
       )
    );

  } else {
    await reportError(
       channel.guild,
       "Automatic archive needs attention",
       error,
       entry.state
    );
  }
  }
},
delay
    );

    archiveTimers.set(
       channel.id,
       timer
    );
}

// ============================================================
// CLAIM
// ============================================================

async function claim(
 context,
 channel,
 entry,
 force = false
){
 const member =
   await getMember(context);

    const state =
     entry.state;

    if (force && !isOwner(member)) {
      return privateReply(
         context,
         "Only owners can force-claim tickets."
      );
    }

    if (
      !force &&
      !canClaim(member, state)
    ){
      return privateReply(
         context,
         "You cannot claim this ticket."
      );
    }

    if (state.status !== "open") {
      return privateReply(
         context,
         "Reopen this ticket first."
      );
    }

    if (state.claimedBy === member.id) {
      return privateReply(
         context,
         "You already claimed this ticket."
      );
    }
if (state.claimedBy && !force) {
  return privateReply(
     context,
     "This ticket is already claimed."
  );
}

const previous = {
  ...state
};

state.claimedBy = member.id;
state.revision++;

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
  Object.assign(
     state,
     previous
  );

    await applyPermissions(
      channel,
      state
    ).catch(console.error);

    throw error;
}

await removeInvocation(context);

await updateControls(
   channel,
   state
);

await channel.send({
 embeds: [
  whiteEmbed(
   "Ticket Claimed",

         `Claimed by <@${member.id}>.`
     )
     ],

      allowedMentions: NONE
    }).catch(error => {
      void reportError(
         channel.guild,
         "Claim notification",
         error,
         state
      );
    });

    if (context.kind !== "prefix") {
      await privateReply(
         context,
         "Ticket claimed."
      );
    }
}

// ============================================================
// FAST CLOSE
// ============================================================

async function closeTicket(
 context,
 channel,
 entry,
 reason
){
 const member =
   await getMember(context);

    const state =
     entry.state;

    if (!canManage(member, state)) {
      return privateReply(
         context,
         "You cannot close this ticket."
      );
    }

    if (state.status === "closed") {
      await ensureClosedControls(
        channel,
        entry
      ).catch(error => {
        void reportError(
           channel.guild,
           "Repair closed controls",
           error,
           state
        );
    });

    scheduleArchive(channel);

    await removeInvocation(context);

    return privateReply(
       context,
       "This ticket is already closed."
    );
}

const previous = {
  ...state
};

state.status = "closed";

state.closeReason = String(
  reason ||
  "No further action required."
).slice(0, 500);

state.closedAt =
 new Date().toISOString();

state.closeControlMessageId = null;
state.archiveSnapshot = null;
state.revision++;

// Only permissions and durable metadata are required
// to close the ticket. No file downloads occur here.

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
  Object.assign(
     state,
     previous
  );

    await applyPermissions(
      channel,
      state
    ).catch(console.error);
        throw error;
    }

    scheduleRename(channel);

    await removeInvocation(context);

    if (context.kind !== "prefix") {
      await privateReply(
         context,
         "Ticket closed."
      );
    }

    try {
      await ensureClosedControls(
         channel,
         entry,
         member.id
      );

        await updateControls(
           channel,
           state
        );

    } catch (error) {
      void reportError(
         channel.guild,
         "Closed ticket controls",
         error,
         state
      );
    }

    // Rename and archive independently.

    scheduleRename(channel);

    scheduleArchive(
       channel,
       1,
       1500
    );

    console.log(
       `[TICKETS] Closed #${state.number}.`
    );
}

// ============================================================
// REOPEN
// ============================================================

async function reopenTicket(
 context,
 channel,
 entry
){
 const member =
   await getMember(context);

 const state =
  entry.state;

 if (!canManage(member, state)) {
   return privateReply(
      context,
      "You cannot reopen this ticket."
   );
 }

 if (
   deletingTickets.has(channel.id)
 ){
   return privateReply(
      context,
      "This ticket is being finalized."
   );
 }

 if (state.status !== "closed") {
   return privateReply(
      context,
      "This ticket is already open."
   );
 }

 const previous = {
   ...state
 };

 state.status = "open";
 state.closedAt = null;
 state.archiveSnapshot = null;
 state.revision++;

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
    Object.assign(
       state,
       previous
    );

    await applyPermissions(
      channel,
      state
    ).catch(console.error);

    throw error;
}

cancelArchiveTimer(
   channel.id
);

await removeInvocation(context);

await clearClosedControls(
   channel,
   state
);

state.closeControlMessageId = null;

await saveState(
  channel,
  entry
).catch(error => {
  void reportError(
     channel.guild,
     "Reopened ticket controls",
     error,
     state
  );
});

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
}).catch(console.error);
    scheduleRename(channel);

    if (context.kind !== "prefix") {
      await privateReply(
         context,
         "Ticket reopened."
      );
    }
}

// ============================================================
// MANUAL SAVELOG
// ============================================================

async function saveLog(
 context,
 channel,
 entry
){
 const member =
   await getMember(context);

    if (
      !isOwner(member) &&
      !isAdmin(member) &&
      !canManage(
         member,
         entry.state
      )
    ){
      return privateReply(
         context,
         "You cannot save this ticket."
      );
    }

    if (
      entry.state.status !== "closed"
    ){
      return privateReply(
         context,
         "Close this ticket first."
      );
    }

    await removeInvocation(context);

    scheduleArchive(
       channel,
       1,
       0
    );
    await privateReply(
     context,

         "The ticket archive has been queued. Existing saved files will be reused."
    );
}

// ============================================================
// FREEZE BEFORE DELETION
// ============================================================

async function freezeTicket(
 channel,
 state
){
 const overwrites =
   await permissions(
      channel.guild,
      state
   );

    for (const overwrite of overwrites) {
     if (
       overwrite.id ===
       channel.client.user.id
     ){
       continue;
     }

         overwrite.allow = (
            overwrite.allow || []
         ).filter(
            permission =>
             !WRITE_PERMISSIONS.includes(
               permission
             )
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

         "Finalize private ticket archive"
    );
}

// ============================================================
// DELETE WITH ARCHIVE PROTECTION
// ============================================================

async function deleteTicket(
 context,
 channel,
 entry
){
 const member =
   await getMember(context);

 const state =
  entry.state;

 if (!canDelete(member, state)) {
   return privateReply(
     context,

          state.status !== "closed" &&
          canManage(member, state)

           ? "Close this ticket first."

           : "You cannot delete this ticket."
     );
 }

 if (deletingTickets.has(channel.id)) {
   return privateReply(
      context,
      "This ticket is already being finalized."
   );
 }

 deletingTickets.add(
    channel.id
 );

 cancelArchiveTimer(
    channel.id
 );

 await removeInvocation(context);

 await privateReply(context, "Finalizing the ticket archive.").catch(() => {});

 let deleted = false;

 try {
await freezeTicket(
   channel,
   state
);

let archive = null;

for (
 let attempt = 1;
 attempt <= 3;
 attempt++
){
 archive =
   await archiveTicket(
      channel,
      entry
   );

    const latest = (
       await allMessages(channel)
    ).filter(
       shouldArchiveMessage
    );

    if (
      snapshotHash(
         latest,
         state
      ) === archive.snapshot
    ){
      break;
    }

    archive = null;
}

if (!archive) {
  throw new Error(
     "Ticket changed while archiving."
  );
}

await commitArchive(
   channel,
   entry,
   archive
);

let logs =
  await textChannel(
     channel.guild,
     IDS.logs,
     "Ticket logs"
  );
logs =
  await validateArchiveChannel(
     channel.guild,
     logs
  );

if (
  !(await verifyCompletedArchive(
     channel.guild,
     archive
  ))
){
  throw new Error(
     "Archive verification failed."
  );
}

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
){
  throw new Error(
     "New messages detected before deletion."
  );
}

// Only delete after the final archive is verified.

await channel.delete(
   `Ticket deleted by ${member.id}; archive verified`
);

deleted = true;

state.deleted = true;

await saveState(
  channel,
  entry
).catch(error => {
  void reportError(
   channel.guild,
   "Save deleted ticket metadata",
   error,
   state
   );
 });

 const root =
  await logs.messages.fetch(
    archive.archiveRootId
  ).catch(() => null);

 if (root) {
   const payload =
     archiveRootPayload(
        state,
        archive
     );

     payload.embeds[0].addFields({
       name: "Ticket Status",
       value:
         "Deleted • Archive preserved"
     });

     await root.edit(payload)
      .catch(console.error);
 }

 const thread =
  await channel.guild.channels.fetch(
    archive.archiveThreadId
  ).catch(() => null);

 if (thread?.isThread()) {
   await thread.setArchived(true)
     .catch(console.error);
 }

 console.log(
    `[TICKETS] Deleted #${state.number} after archive verification.`
 );

 await privateReply(
    context,
    `Ticket #${numberText(state.number)} was archived and deleted.`
 );

} catch (error) {
  if (!deleted) {
    await applyPermissions(
      channel,
      state
    ).catch(console.error);

     await privateReply(
      context,
       "Deletion was postponed to protect the ticket archive. The original ticket has been retained."
    );

            await reportError(
               channel.guild,
               "Ticket deletion postponed",
               error,
               state
            );
        }

    } finally {
      deletingTickets.delete(
         channel.id
      );

        if (!deleted) {
          scheduleArchive(
             channel,
             1,
             15000
          );
        }
    }
}

// ============================================================
// HISTORICAL TRANSCRIPT RECOVERY
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
     const value =
       decodeTranscriptUrl(match[1]);

        const url =
         discordAttachmentUrl(value);

        if (!url) continue;
        const parts =
         url.pathname.split("/");

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

        if (
          !/\.(png|jpe?g|gif|webp|avif)$/i.test(name)
        ){
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
   /<img\b[^>]*\bsrc\s*=\s*["']data:(image\/(?:png|jpeg|gif|webp|avif));base64,([A-Za-z0-9+/=\s]+)["'][^>]*>/gi;

    for (const match of html.matchAll(pattern)) {
     try {
       const buffer =
         Buffer.from(
            match[2],
            "base64"
         );

         const mime =
          imageMime(buffer);

         if (!mime) continue;

         const checksum =
          hash(buffer);

         const alt = match[0].match(
            /\balt=["']([^"']+)["']/i
         );

         const name = alt
          ? safeFilename(
              decodeTranscriptUrl(
                alt[1]
              )
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
          // Ignore malformed image data.
        }
    }

    return [...results.values()];
}

async function recoverOldImage(
 guild,
 old,
 indexes
){
 if (!indexes.has(old.channelId)) {
   const result = new Map();

        const channel =
         await guild.channels.fetch(
           old.channelId
         ).catch(() => null);

        if (
          channel?.guild?.id === guild.id &&
          channel?.messages &&
          parseTicketName(channel.name)
        ){
        await scan(channel, message => {
          for (
            const attachment of
            message.attachments.values()
          ){
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

let lastError;

for (
 let attempt = 1;
 attempt <= 3;
 attempt++
){
 try {
   const buffer =
     await downloadTranscriptFile(
        originalCdnUrl(old.url) ||
        old.url
     );

        if (!imageMime(buffer)) {
          throw new Error(
             "Invalid historical image."
          );
        }

        return buffer;
        } catch (error) {
          lastError = error;

            if (attempt < 3) {
              await sleep(
                 1500 * attempt
              );
            }
        }
    }

    throw lastError ||
     new Error(
        "Original image unavailable."
     );
}

// ============================================================
// EASTERN DATE FILTER
// ============================================================

const easternFormatter =
 new Intl.DateTimeFormat(
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

    if (
      Number.isNaN(date.getTime())
    ){
      return null;
    }

    const parts = Object.fromEntries(
       easternFormatter
        .formatToParts(date)
        .map(
          part => [
            part.type,
            part.value
          ]
        )
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
         ){
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
      const year =
        short[3].length === 2
         ? `20${short[3]}`
         : short[3];

         value =
          `${year}-` +
          `${short[1].padStart(2, "0")}-` +
          `${short[2].padStart(2, "0")}`;
    }

    if (
     /^\d{4}-\d{2}-\d{2}$/.test(value)
    ){
     const date = new Date(
        `${value}T12:00:00Z`
     );

        if (
          Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !==
             value
        ){
          return null;
        }

        return {
          type: "date",
          value
        };
    }

    return null;
}

function transcriptMatchesDate(
 html,
 target
){
 const timestamps = html.match(
   /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/g
 ) || [];

    return timestamps.some(
       timestamp =>
         easternDate(timestamp) === target
    );
}

// ============================================================
// RECOVER LOGS
// ============================================================

async function recoverLogs(message) {
 const context =
  messageContext(message);

    const member =
     await getMember(context);

    if (
      !isOwner(member) &&
      !isAdmin(member)
    ){
      return privateReply(
         context,
         "Only owners and admins can recover logs."
    );
}

if (
  message.channel.id !== IDS.logs
){
  return privateReply(
     context,
     `Use this command in <#${IDS.logs}>.`
  );
}

if (recoveryRunning) {
  return privateReply(
     context,
     "Recovery is already running."
  );
}

const filter =
 parseRecoveryFilter(message);

if (!filter) {
  return privateReply(
    context,

         "**Recovery Commands**\n\n" +

         "`,recoverlogs`\n" +
         "`,recoverlogs 779`\n" +
         "`,recoverlogs 11/18/26`\n" +
         "`,recoverlogs 2026-11-18`"
    );
}

recoveryRunning = true;

const guild = message.guild;

const counts = {
  checked: 0,
  matched: 0,
  recovered: 0,
  skipped: 0,
  unavailable: 0,
  errors: 0,
  existing: 0
};

let status = null;

const failed = new Set();
const indexes = new Map();
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
      ? "Ticket Recovery Finished"
      : "Recovering Ticket Archives",

     `**Search:** ${searchLabel}\n\n` +

     `**Transcripts Checked:** ${counts.checked}\n` +

     `**Matching Transcripts:** ${counts.matched}\n` +

     `**Recovered Images:** ${counts.recovered}\n` +

     `**Already Saved:** ${counts.skipped}\n` +

     `**Unavailable:** ${counts.unavailable}\n` +

     `**Errors:** ${counts.errors}\n` +

     `**Existing Tickets Saved:** ${counts.existing}\n\n` +

     (
      finished
        ? "Original logs have been preserved."
        : "Checking available original files."
     )+

     (
         finished && failed.size

          ? "\n\n**Unavailable Files:**\n" +

           [...failed]
             .slice(0, 8)
             .map(
               name =>
                 `• ${safe(name, 100)}`
                     )
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

    status = await logs.send({
     embeds: [
       whiteEmbed(
        "Recovering Ticket Archives",

              `**Search:** ${searchLabel}\n\n` +

              "Previously saved files will be reused."
          )
     ],

      allowedMentions: NONE
    });

    await removeInvocation(context);

    // Recover existing closed tickets first.

    await guild.channels.fetch();

    for (
     const channel of
     guild.channels.cache.values()
    ){
     if (
       channel.type !== ChannelType.GuildText
     ){
       continue;
     }

     if (
       !parseTicketName(channel.name) &&
       !tickets.has(channel.id)
){
  continue;
}

try {
  const entry =
   await queuedTicket(
      channel.id,
      () => loadState(channel)
   );

 if (
   !entry ||
   entry.state.status !== "closed" ||
   deletingTickets.has(channel.id)
 ){
   continue;
 }

 if (
   filter.type === "ticket" &&
   entry.state.number !== filter.value
 ){
   continue;
 }

 if (filter.type === "date") {
   const messages =
     await allMessages(channel);

     if (
       !messages.some(
          item =>
            easternDate(
              item.createdAt
            ) === filter.value
       )
     ){
       continue;
     }
 }

 const revision =
  entry.state.revision;

 const archive =
  await archiveTicket(
     channel,
     entry
  );

 await queuedTicket(
  channel.id,
             async () => {
               if (
                 entry.state.status === "closed" &&
                 entry.state.revision === revision &&
                 !entry.state.deleted &&
                 !deletingTickets.has(channel.id)
               ){
                 await commitArchive(
                    channel,
                    entry,
                    archive
                 );
               }
             }
        );

        counts.existing++;

    } catch (error) {
      counts.errors++;

        console.error(
           "[RECOVERY LIVE TICKET]",
           error.message
        );
    }

    await progress();
}

// Find historical HTML transcripts in the
// original private logs channel.

await scan(logs, async log => {
 if (
   log.author.id !==
   guild.client.user.id
 ){
   return;
 }

    for (
     const file of
     log.attachments.values()
    ){
     const filename =
       file.name || "";

        const match = filename.match(
           /^(?:recovered-)*transcript-([a-z-]+)-(\d+)(?:-\d+)?(?:-part-\d+)?\.html$/i
        );

        if (!match) continue;
const number =
 Number(match[2]);

if (
  filter.type === "ticket" &&
  number !== filter.value
){
  continue;
}

counts.checked++;

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
 ){
   continue;
 }

 const linked =
  extractOldAttachments(html);

 const embedded =
  extractEmbeddedImages(html);

 if (
   !linked.length &&
   !embedded.length
 ){
   continue;
 }

 counts.matched++;

 const saved = [
    ...tickets.values()
 ].find(
    entry =>
      entry.state.number === number
 );
let historicalType =
  match[1].toLowerCase();

if (
  historicalType === "cash-out"
){
  historicalType = "cashout";
}

if (
  historicalType === "purchasing"
){
  historicalType = "purchase";
}

if (!TYPES[historicalType]) {
  historicalType = "support";
}

const state = saved

 ? { ...saved.state }

 :{
      channelId:
       `historical-${number}`,

      number,

      type:
       historicalType,

      ownerId: null,
      claimedBy: null,

      status: "closed",

      closeReason:
       "Recovered historical transcript.",

    archiveRootId: null,
    archiveThreadId: null
  };

await queuedArchive(
 state.channelId,

 () => archiveWorker(
   async () => {
     await validateArchiveChannel(
        guild,
        logs
     );
const { thread } =
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

let added = 0;

// Recover embedded copies first.
// Linked copies with identical bytes
// will then be skipped.

for (const image of embedded) {
 if (
   catalog.hashes.has(
      image.checksum
   )
 ){
   counts.skipped++;
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

  counts.recovered++;
  added++;

 } catch (error) {
   counts.errors++;
   failed.add(image.name);

  console.error(
     "[RECOVERY EMBEDDED]",
     error.message
  );
    }
}

for (const old of linked) {
 if (
   catalog.files.has(
      old.attachmentId
   )
 ){
   counts.skipped++;
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

        if (
          catalog.hashes.has(
             hash(image)
          )
        ){
          counts.skipped++;
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

        counts.recovered++;
        added++;

    } catch (error) {
      counts.unavailable++;
      failed.add(old.name);

        console.warn(
         "[RECOVERY LINKED]",
                                     error.message
                                );
                            }
                        }

                        if (added) {
                          await thread.send({
                            embeds: [
                             whiteEmbed(
                              "Historical Image Recovery",

                                      `**Ticket:** #${numberText(number)}\n` +

                                      `**New Images:** ${added}\n\n` +

                                      `[Original Transcript](${log.url})\n\n` +

                                       "Original logs have been preserved."
                                     ).setTimestamp()
                                ],

                              allowedMentions: NONE
                            });
                        }
                    }
                )
           );

       } catch (error) {
         counts.errors++;

           console.error(
              "[RECOVERY HTML]",
              error.message
           );
       }

       if (
         counts.checked % 10 === 0 ||
         filter.type === "ticket"
       ){
         await progress();
       }
   }
 });

 await progress(true);

} catch (error) {
  await reportError(
     guild,
     "Historical recovery",
     error
  );
     if (status) {
       await status.edit({
         embeds: [
          whiteEmbed(
            "Recovery Paused",

                   "Previously saved files have been retained. Check the private reports before retrying."
               )
          ],

           allowedMentions: NONE
         }).catch(() => {});
     }

    } finally {
      recoveryRunning = false;
    }
}

// ============================================================
// RESTORE EXISTING TICKETS
// ============================================================

async function syncExistingTickets(guild) {
 await init(guild);
 await guild.channels.fetch();

    for (
     const channel of
     guild.channels.cache.values()
    ){
     if (
       channel.type !== ChannelType.GuildText
     ){
       continue;
     }

     if (
       !parseTicketName(channel.name) &&
       !tickets.has(channel.id)
     ){
       continue;
     }

     try {
       await queuedTicket(
        channel.id,

          async () => {
           const entry =
            await loadState(channel);

               if (
                    !entry ||
                    entry.state.deleted
                  ){
                    return;
                  }

                  await applyPermissions(
                     channel,
                     entry.state
                  );

                  await updateControls(
                     channel,
                     entry.state
                  );

                  if (
                    entry.state.status === "closed"
                  ){
                    await ensureClosedControls(
                       channel,
                       entry
                    );

                      // Resume unfinished archives after restart.
                      // Completed archives are reused.

                      scheduleArchive(
                         channel,
                         1,
                         3000
                      );
                  }

                  scheduleRename(channel);
              }
         );

        } catch (error) {
          console.error(
             `[RESTORE] ${channel.name}:`,
             error.message
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
){
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
         `Ticket panel ${existing ? "updated" : "posted"}.`
    );
}

// ============================================================
// SELECT MENU
// ============================================================

async function selectTicket(interaction) {
 const type = String(
   interaction.values?.[0] || ""
 ).toLowerCase();

    if (
      !TYPES[type] ||
      type === "verification" ||
      type === "unblacklist"
    ){
      return reply(
         interaction,
         "Please select a valid category."
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

    const result =
     await createTicket(
        interaction,
        type
     );

    return reply(
     interaction,

         result.existing

          ? `You already have an open ticket: ${result.channel}`

          : `Your ticket is ready: ${result.channel}`
    );
}

// ============================================================
// FORM SUBMISSION
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
}

// ============================================================
// VERIFICATION BUTTON
// ============================================================

async function handleVerificationButton(
 interaction
){
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

           : `Your verification ticket is ready: ${result.channel}`
    );
}

// ============================================================
// BUTTON ACTION DETECTION
// ============================================================

function actionFor(customId) {
 for (
   const [action, id] of
   Object.entries(BUTTONS)
 ){
   if (customId === id) {
     return action;
   }
 }

    if (
      customId.startsWith(
         "chuppys_ticket:"
      )
    ){
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
         ){
           return action;
         }
    }
    return null;
}

// ============================================================
// RUN TICKET ACTION
// ============================================================

async function runTicketAction(
 context,
 channel,
 action,
 reason = ""
){
 if (
   deletingTickets.has(channel.id)
 ){
   return privateReply(
      context,
      "This ticket is being finalized."
   );
 }

    return queuedTicket(
     channel.id,

     async () => {
      const entry =
       await loadState(channel);

      if (!entry) {
        return privateReply(
           context,
           "This is not a recognized ticket."
        );
      }

      switch (action) {
       case "claim":
        return claim(
           context,
           channel,
           entry
        );

        case "forceclaim":
         return claim(
            context,
            channel,
            entry,
            true
         );

        case "close":
         return closeTicket(
                       context,
                       channel,
                       entry,
                       reason
                  );

                 case "reopen":
                  return reopenTicket(
                     context,
                     channel,
                     entry
                  );

                 case "delete":
                  return deleteTicket(
                     context,
                     channel,
                     entry
                  );

                 case "savelog":
                  return saveLog(
                     context,
                     channel,
                     entry
                  );
             }
         }
    );
}

// ============================================================
// BUTTON HANDLER
// ============================================================

async function handleButton(
 interaction,
 action
){
 const channel =
   interaction.channel;

    if (
      !channel ||
      channel.type !== ChannelType.GuildText
    ){
      return reply(
         interaction,
         "Use this button inside a ticket."
      );
    }

    if (action === "close") {
      if (
          !parseTicketName(channel.name) &&
          !tickets.has(channel.id)
        ){
          return reply(
             interaction,
             "This is not a recognized ticket."
          );
        }

        // Show modal immediately to prevent
        // Discord interaction timeout.

        return interaction.showModal(
           closeModal(channel.id)
        );
    }

    await interaction.deferReply({
      flags: EPHEMERAL
    });

    return runTicketAction(
       interaction,
       channel,
       action
    );
}

// ============================================================
// CLOSE FORM
// ============================================================

async function handleCloseForm(interaction) {
 const channelId =
  interaction.customId.slice(
     CLOSE_PREFIX.length
  );

    if (
      channelId !== interaction.channelId
    ){
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

    return runTicketAction(
       interaction,
       interaction.channel,
       "close",
       reason
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
 ){
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
      message.channel.type !==
      ChannelType.GuildText
    ){
      return;
    }

    if (name === "recoverlogs") {
      return recoverLogs(message);
    }

    if (
      !parseTicketName(
         message.channel.name
      ) &&
      !tickets.has(message.channel.id)
    ){
      return;
    }

    const reason = raw.slice(
      commandName.length
    ).trim().slice(0, 500);

    return runTicketAction(
       messageContext(message),
       message.channel,
       name,
       reason
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
    ){
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

function correctGuild(guildId) {
  return (
     !process.env.DISCORD_GUILD_ID ||
     guildId ===
       process.env.DISCORD_GUILD_ID
  );
}

// ==========================================================
// READY
// ==========================================================

let readyStarted = false;

async function onReady() {
 if (readyStarted) return;

    readyStarted = true;

    try {
      const guildId =
       process.env.DISCORD_GUILD_ID;

        if (!guildId) {
          throw new Error(
             "DISCORD_GUILD_ID is missing."
          );
        }

        const guild =
         await client.guilds.fetch(
            guildId
         );

        await init(guild);

        console.log(
           "[TICKETS] Ticket metadata loaded."
        );

        console.log(
           `[TICKETS] Next ticket: ${globalCounter + 1}`
        );

        void syncExistingTickets(
          guild
        ).catch(error => {
  console.error(
     "[RESTORE]",
     error
  );
});

for (
  const type of [
    "verification",
    "unblacklist"
  ]
){
  void category(
    guild,
    type
  ).catch(error => {
    console.error(
       `[CATEGORY] ${type}:`,
       error.message
    );
  });
}

console.log(
   "[TICKETS] All seven ticket types enabled."
);

console.log(
   "[TICKETS] Fast closing enabled."
);

console.log(
   "[ARCHIVE] Automatic archive on close enabled."
);

console.log(
   "[ARCHIVE] Independent background queue enabled."
);

console.log(
   "[ARCHIVE] One organized thread per ticket."
);

console.log(
   "[ARCHIVE] SHA256 deduplication enabled."
);

console.log(
   "[ARCHIVE] Original quality enabled."
);

console.log(
   "[ARCHIVE] Existing attachments reused."
);
        console.log(
           "[ARCHIVE] Automatic retries enabled."
        );

        console.log(
           "[ARCHIVE] Multipart file support enabled."
        );

        console.log(
           "[ARCHIVE] No fixed combined archive size limit."
        );

        console.log(
           "[ARCHIVE] Deletion protection enabled."
        );

        console.log(
           "[RECOVERY] Historical image recovery enabled."
        );

        console.log(
           "[VERIFY] Manual verification preserved."
        );

        console.log(
           "[TICKETS] Private error reporting enabled."
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
           "[TICKETS] Startup:",
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
        !correctGuild(message.guild.id) ||
        !message.content.startsWith(PREFIX)
      ){
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
      ){
        return;
      }

      try {
        await handlePrefix(message);

      } catch (error) {
        // Never send raw technical errors
        // inside customer tickets.

          await handleFailure(
             messageContext(message),
             error
          );
      }
     }
);

// ==========================================================
// INTERACTION LISTENER
// ==========================================================

client.on(
 Events.InteractionCreate,

     async interaction => {
      if (
        interaction.guildId &&
        !correctGuild(interaction.guildId)
      ){
        return;
      }

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

// The legacy secure verification button
// remains owned by index.js.

if (
  !isPanel &&
  !isSelect &&
  !isForm &&
  !isClose &&
  !isVerification &&
  !isUnblacklist &&
  !action
){
  return;
}

if (
  !firstTime(
     seenInteractions,
     interaction.id
  )
){
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
   return await interaction.showModal(
      ticketForm("unblacklist")
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
           await handleFailure(
              interaction,
              error
           );
         }
     }
);

// ==========================================================
// CLOSED TICKET CONTENT CHANGES
// ==========================================================
//
// If staff add another picture to a closed ticket,
// update its archive without uploading old pictures.
//
// ==========================================================

client.on(
 Events.MessageCreate,

     message => {
      if (
        !message.guild ||
        !correctGuild(message.guild.id) ||
        message.author.bot ||
        deletingTickets.has(message.channel.id)
         ){
           return;
         }

         const entry =
          tickets.get(message.channel.id);

         if (
           !entry ||
           entry.state.status !== "closed" ||
           entry.state.deleted ||
           !shouldArchiveMessage(message)
         ){
           return;
         }

         scheduleArchive(
            message.channel,
            1,
            5000
         );
     }
);

client.on(
 Events.MessageUpdate,

     (oldMessage, newMessage) => {
       if (
         !newMessage.guild ||
         !correctGuild(newMessage.guild.id) ||
         newMessage.author?.bot ||
         deletingTickets.has(
            newMessage.channel.id
         )
       ){
         return;
       }

         const entry =
          tickets.get(
             newMessage.channel.id
          );

         if (
           entry?.state.status === "closed" &&
           !entry.state.deleted
         ){
           scheduleArchive(
              newMessage.channel,
              1,
              5000
           );
         }
         }
    );

    // ==========================================================
    // CHANNEL CLEANUP
    // ==========================================================

    client.on(
     Events.ChannelDelete,

         channel => {
          cancelArchiveTimer(
             channel.id
          );

             const entry =
              tickets.get(channel.id);

             if (
               entry &&
               !deletingTickets.has(channel.id)
             ){
               console.warn(
                  `[TICKETS] #${entry.state.number} was deleted outside the ticket system.`
               );
             }
         }
    );

    console.log(
       "[TICKETS] Single handler installed."
    );

    console.log(
       "[TICKETS] Existing metadata supported."
    );

    console.log(
       "[TICKETS] Automatic organized archives installed."
    );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = setupTickets;

module.exports.command =
 command;

module.exports.openVerificationTicket =
 openVerificationTicket;
// ============================================================
// END OF CHUPPYS TICKETS.JS
// ============================================================
