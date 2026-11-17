"use strict";

// ============================================================
// CHUPPYS TICKET SYSTEM — DISCORD.JS V14 / RENDER
// ============================================================
//
// INSTALL:
// require("./tickets")(client);
//
// SLASH COMMAND:
// require("./tickets").command
//
// COMMANDS:
// ,claim
// ,forceclaim      OWNER ONLY
// ,close
// ,close reason
// ,reopen
// ,delete
//
// FAST COMMAND IMPROVEMENTS:
// - No forced member fetch for normal commands
// - No repeated 11-seller lookup during claiming
// - One permission update per claim
// - Direct editing of saved messages by ID
// - Independent command queues per ticket
// - Claim logs do not delay command completion
// - Close transcripts upload after confirmation
// - Delete confirms processing immediately
// - Delete waits for transcript before deleting
//
// FEATURES PRESERVED:
// - Purchase tickets with 4 questions
// - Cashout tickets with 4 questions
// - Giveaway tickets
// - Partnership tickets with 2 questions
// - Support tickets without a modal
// - Existing categories without duplicates
// - Global ticket counter
// - V3 metadata
// - Legacy ticket recovery
// - Private HTML transcripts
// - Single handler installation
// - Duplicate event protection
// - White ticket embeds
//
// CLAIM PRIVACY:
// - Unclaimed Purchase/Cashout:
//   Seller role can view and claim
//
// - Claimed Purchase/Cashout:
//   Creator can view
//   Exact claimer can view
//   Mod role can view
//   Owner role can view
//   Other sellers cannot view
//
// - Administrator bypasses Discord channel restrictions
//
// DELETION:
// - Owner, Admin, Mod: Open or closed tickets
// - Other authorized staff: Closed tickets only
//
// LOGS:
// - Channel 1570913954333728808
// - Small white embeds
// - Transcript attached to close/delete logs
// - No activity logs in the data channel
//
// STORAGE:
// - Channel 1571112668037644388
// - Private metadata and global counter
//
// IMPORTANT:
// - Run one Render bot instance
// - Enable Message Content Intent
// - Enable Guild Members Intent
// - Bot requires Manage Channels
// - Bot requires Attach Files in logs
// - Remove older duplicate ticket handlers
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
  PermissionFlagsBits,
  AttachmentBuilder,
  Events,
  MessageFlags,
  OverwriteType
} = require("discord.js");

// ============================================================
// IDS
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
  seller: "1550322075208646766"
});

// ============================================================
// SELLER USER IDS
// ============================================================
//
// Preserved from your original code.
//
// The Seller role controls who can claim.
//
// The privacy system now denies the
// Seller role directly rather than
// fetching each seller separately.
//
// This avoids 11+ API requests every claim.
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
// SETTINGS
// ============================================================

const BRAND = ".gg/chuppys";

const EMOJI =
  "<:chuppyhi:1561103471325745242>";

const WHITE = 0xffffff;

const EPHEMERAL = MessageFlags.Ephemeral;

const PREFIX = ",";

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

// ============================================================
// COMPONENT IDS
// ============================================================

const SELECT_ID = "chuppys_ticket_select";

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
      "Giveaway tickets"
    ],

    description:
      "Please explain the giveaway you won."
  },

  partnership: {
    label: "Partnership",

    env: "PARTNERSHIP_TICKET_CATEGORY_ID",

    categories: [
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
      "Support tickets",
      "Support ticket",
      "Support",
      "Support-tickets",
      "Help and Support"
    ],

    description:
      "Please explain what you need help with."
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
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageGuild
  );

// ============================================================
// RUNTIME STATE
// ============================================================

const tickets = new Map();

let initialization = null;
let initialized = false;

let globalCounter = 0;
let counterMessageId = null;

// ============================================================
// FAST QUEUE SYSTEM
// ============================================================
//
// OLD BEHAVIOR:
//
// One global queue handled EVERYTHING.
//
// A large ticket being deleted could
// delay claims in unrelated tickets.
//
// NEW BEHAVIOR:
//
// Ticket creation uses its own queue
// to protect the global counter.
//
// Existing ticket actions use independent
// queues based on their channel IDs.
//
// Ticket A no longer waits for Ticket B.
//
// ============================================================

let creationQueue = Promise.resolve();

const ticketQueues = new Map();

function queued(task) {
  const next = creationQueue.then(task);

  creationQueue = next.catch(() => {});

  return next;
}

function queuedTicket(channelId, task) {
  const previous =
    ticketQueues.get(channelId) ||
    Promise.resolve();

  const next = previous.then(task);

  const settled = next.catch(() => {});

  ticketQueues.set(channelId, settled);

  void settled.finally(() => {
    if (ticketQueues.get(channelId) === settled) {
      ticketQueues.delete(channelId);
    }
  });

  return next;
}

// ============================================================
// BACKGROUND LOG TRACKING
// ============================================================
//
// Close transcripts can take time.
//
// Track each transcript job so that
// deletion cannot race ahead of it.
//
// ============================================================

const transcriptJobs = new Map();

function trackTranscriptJob(channelId, job) {
  const tracked = Promise.resolve(job);

  transcriptJobs.set(channelId, tracked);

  void tracked.finally(() => {
    if (transcriptJobs.get(channelId) === tracked) {
      transcriptJobs.delete(channelId);
    }
  }).catch(() => {});

  return tracked;
}

// ============================================================
// GENERAL HELPERS
// ============================================================

function safe(value, max = 900) {
  return String(value ?? "")
    .replace(/@/g, "＠")
    .replace(/```/g, "''' ")
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

// ============================================================
// FAST CHANNEL LOOKUP
// ============================================================
//
// Use cached channels when available.
//
// Only fetch if the channel is missing.
//
// ============================================================

async function textChannel(guild, id, label) {
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
// FAST MEMBER LOOKUP
// ============================================================
//
// OLD:
// Force fetched member on every command.
//
// NEW:
// Use message.member or interaction.member.
//
// These objects already contain the
// member's roles in most guild events.
//
// Fetch only when truly necessary.
//
// ============================================================

async function getMember(context) {
  if (
    !context.guild ||
    !context.user?.id
  ) {
    throw new Error(
      "Could not identify this guild member."
    );
  }

  if (
    context.kind === "prefix" &&
    context.message.member?.roles?.cache
  ) {
    return context.message.member;
  }

  if (
    context.member?.roles?.cache &&
    context.member.id === context.user.id
  ) {
    return context.member;
  }

  const cached =
    context.guild.members.cache.get(
      context.user.id
    );

  if (cached) {
    return cached;
  }

  return context.guild.members.fetch(
    context.user.id
  );
}

// ============================================================
// MEMBER ROLE CHECKS
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
      member.id === IDS.owner ||
      member.id === member.guild.ownerId ||
      hasRole(member, IDS.owner)
    )
  );
}

function isMod(member) {
  return hasRole(member, IDS.mod);
}

function isAdmin(member) {
  return hasRole(member, IDS.admin);
}

function isSeller(member) {
  return hasRole(member, IDS.seller);
}

function isTradingTicket(state) {
  return (
    state.type === "purchase" ||
    state.type === "cashout"
  );
}

// ============================================================
// CLAIM AUTHORIZATION
// ============================================================

function canClaim(member, state) {
  if (
    isOwner(member) ||
    isMod(member)
  ) {
    return true;
  }

  if (isTradingTicket(state)) {
    return isSeller(member);
  }

  return (
    hasRole(member, IDS.support) ||
    isAdmin(member)
  );
}

// ============================================================
// MANAGEMENT AUTHORIZATION
// ============================================================

function canManage(member, state) {
  if (
    isOwner(member) ||
    isMod(member)
  ) {
    return true;
  }

  if (state.claimedBy) {
    return state.claimedBy === member.id;
  }

  return canClaim(member, state);
}

// ============================================================
// DELETE AUTHORIZATION
// ============================================================
//
// Owner, Admin, Mod:
// Open and closed tickets.
//
// Other authorized staff:
// Closed tickets only.
//
// ============================================================

function canDelete(member, state) {
  if (
    isOwner(member) ||
    isMod(member) ||
    isAdmin(member)
  ) {
    return true;
  }

  if (state.status !== "closed") {
    return false;
  }

  return canManage(member, state);
}

// ============================================================
// REPLY HANDLER
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
      flags: EPHEMERAL
    });
  }

  return context.reply({
    content,
    flags: EPHEMERAL
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
// TICKET BUTTONS
// ============================================================

function controls(state) {
  const row = new ActionRowBuilder();

  if (state.status === "closed") {
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
        .setLabel(
          state.claimedBy ? "Claimed" : "Claim"
        )
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(BUTTONS.close)
        .setLabel("Close")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger),

      new ButtonBuilder()
        .setCustomId(BUTTONS.delete)
        .setLabel("Delete")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return [row];
}

// ============================================================
// TICKET PANEL
// ============================================================

function panelPayload() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(SELECT_ID)
    .setPlaceholder(
      "Select a ticket category"
    )
    .addOptions(
      Object.entries(TYPES).map(
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
// NORMALIZE STATE
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

    closeReason:
      data.closeReason ||
      "No further action required.",

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
  ].find(value => content.startsWith(value));

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

// ============================================================
// SCAN PRIVATE STORAGE
// ============================================================

async function scan(
  channel,
  callback,
  pages = 200
) {
  let before;

  for (let page = 0; page < pages; page++) {
    const batch =
      await channel.messages.fetch({
        limit: 100,
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

    before = batch.last().id;
  }
}

// ============================================================
// FAST PRIVATE STATE SAVING
// ============================================================
//
// OLD:
//
// Fetch the metadata message,
// then edit the message.
//
// NEW:
//
// Edit using the saved message ID.
//
// This removes an unnecessary API fetch.
//
// If the saved message was deleted,
// create a replacement.
//
// ============================================================

async function saveState(channel, entry) {
  const storage = await textChannel(
    channel.guild,
    IDS.data,
    "Ticket data"
  );

  const content =
    STATE_PREFIX +
    JSON.stringify(entry.state);

  let message = null;

  if (entry.storageMessageId) {
    try {
      message = await storage.messages.edit(
        entry.storageMessageId,
        {
          content,
          allowedMentions: {
            parse: []
          }
        }
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
    message = await storage.send({
      content,
      allowedMentions: {
        parse: []
      }
    });

    entry.storageMessageId = message.id;
  }

  tickets.set(channel.id, entry);
}

// ============================================================
// INITIALIZATION
// ============================================================

async function init(guild) {
  if (initialized) {
    return;
  }

  if (initialization) {
    return initialization;
  }

  initialization = (async () => {
    const data = await textChannel(
      guild,
      IDS.data,
      "Ticket data"
    );

    const logs = await textChannel(
      guild,
      IDS.logs,
      "Ticket logs"
    );

    let highest = 0;
    let counterMessage = null;

    function processMessage(message, inData) {
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

        const previous =
          tickets.get(state.channelId);

        if (
          !previous ||
          (
            inData &&
            !previous.storageMessageId
          )
        ) {
          tickets.set(state.channelId, {
            state,

            storageMessageId:
              inData ? message.id : null,

            recovered: false
          });
        }
      }

      if (
        message.content.startsWith(
          COUNTER_PREFIX
        )
      ) {
        const number = Number(
          message.content.slice(
            COUNTER_PREFIX.length
          )
        );

        if (
          Number.isSafeInteger(number) &&
          number >= 0
        ) {
          highest = Math.max(
            highest,
            number
          );

          if (inData && !counterMessage) {
            counterMessage = message;
          }
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

          const total = Object.values(old)
            .map(Number)
            .filter(n =>
              Number.isSafeInteger(n) &&
              n >= 0
            )
            .reduce(
              (sum, n) => sum + n,
              0
            );

          highest = Math.max(
            highest,
            total
          );
        } catch {
          // Ignore invalid legacy counters.
        }
      }
    }

    // Load current private storage.
    await scan(
      data,
      message =>
        processMessage(message, true)
    );

    // Read legacy metadata for recovery.
    //
    // Nothing is written to the log
    // channel by this recovery scan.
    if (logs.id !== data.id) {
      await scan(
        logs,
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
      counterMessageId = counterMessage.id;

      const stored = Number(
        counterMessage.content.slice(
          COUNTER_PREFIX.length
        )
      );

      if (stored < highest) {
        await counterMessage.edit({
          content:
            COUNTER_PREFIX + highest
        });
      }
    } else {
      const message =
        await data.send({
          content:
            COUNTER_PREFIX + highest,

          allowedMentions: {
            parse: []
          }
        });

      counterMessageId = message.id;
    }

    for (const [id, entry] of tickets) {
      if (entry.storageMessageId) {
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
        await saveState(channel, entry);
      }
    }

    initialized = true;

    console.log(
      `[TICKETS] Loaded ${tickets.size} tickets.`
    );

    console.log(
      `[TICKETS] Counter: ${globalCounter}`
    );
  })();

  try {
    await initialization;
  } finally {
    initialization = null;
  }
}

// ============================================================
// NEXT GLOBAL TICKET NUMBER
// ============================================================

async function nextNumber(guild) {
  await init(guild);

  const storage = await textChannel(
    guild,
    IDS.data,
    "Ticket data"
  );

  const message =
    await storage.messages.fetch(
      counterMessageId
    );

  const stored =
    message.content.startsWith(
      COUNTER_PREFIX
    )
      ? Number(
          message.content.slice(
            COUNTER_PREFIX.length
          )
        )
      : 0;

  globalCounter = Math.max(
    globalCounter,

    Number.isSafeInteger(stored) &&
    stored >= 0
      ? stored
      : 0
  );

  const next = globalCounter + 1;

  await storage.messages.edit(
    counterMessageId,
    {
      content: COUNTER_PREFIX + next
    }
  );

  globalCounter = next;

  return next;
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
// VALIDATE OLD TICKET WELCOME
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
        ).startsWith("chuppys_ticket:")
      )
    );

  if (!hasButtons) {
    return false;
  }

  return message.embeds.some(embed => {
    const title =
      String(embed.title || "").toLowerCase();

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
        TYPES[parsed.type].label.toLowerCase()
      ) ||
      (
        parsed.type === "cashout" &&
        title.includes("cashout")
      )
    );
  });
}

// ============================================================
// EXTRACT ORIGINAL TICKET CREATOR
// ============================================================

function extractOwner(message) {
  for (const embed of message.embeds) {
    const description =
      String(embed.description || "");

    const match = description.match(
      /(?:welcome|opened by|created by|creator)\s*:?\s*<@!?(\d{17,20})>/i
    );

    if (match) {
      return match[1];
    }
  }

  const match = String(
    message.content || ""
  ).match(/<@!?(\d{17,20})>/);

  return match?.[1] || null;
}

// ============================================================
// RECOVER EXISTING TICKETS
// ============================================================

async function recoverTicket(channel) {
  const parsed =
    parseTicketName(channel.name);

  if (!parsed) {
    return null;
  }

  let before;

  for (let page = 0; page < 10; page++) {
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
            parsed.closed ? "closed" : "open",

          claimedBy: null,

          controlMessageId: message.id,

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

    before = batch.last().id;
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

  // Fast path: no API request.
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
// FIND EXISTING OPEN TICKET
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
// EXISTING CATEGORY LOOKUP
// ============================================================

async function category(guild, type) {
  const config = TYPES[type];

  if (!config) {
    throw new Error(
      `Invalid ticket type: ${type}`
    );
  }

  const configuredId =
    process.env[config.env];

  if (configuredId) {
    const configured =
      guild.channels.cache.get(configuredId) ||
      await guild.channels.fetch(
        configuredId
      ).catch(() => null);

    if (
      configured?.type ===
      ChannelType.GuildCategory
    ) {
      return configured;
    }

    console.warn(
      `[TICKETS] Invalid ${config.env}; trying category names.`
    );
  }

  await guild.channels.fetch();

  const categories = [
    ...guild.channels.cache.values()
  ].filter(
    channel =>
      channel.type ===
      ChannelType.GuildCategory
  );

  const normalize = value =>
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

  for (const name of config.categories) {
    const found =
      categories.find(channel =>
        normalize(channel.name) ===
        normalize(name)
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
    `Could not find an existing ${config.label} ` +
    `category. Set ${config.env} in Render ` +
    "to the correct category ID."
  );
}

// ============================================================
// CHANNEL PERMISSION FLAGS
// ============================================================

const FULL_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles
];

const READ_ONLY_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.ReadMessageHistory
];

const HIDDEN_PERMISSIONS = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles
];

// ============================================================
// PERMISSION ENTRY
// ============================================================

function permissionEntry(id, type, closed) {
  return {
    id,
    type,

    allow:
      closed
        ? READ_ONLY_PERMISSIONS
        : FULL_PERMISSIONS,

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

// ============================================================
// FAST TICKET PERMISSIONS
// ============================================================
//
// No guild.roles.fetch() per command.
//
// No 11-user fetch loop.
//
// No channel fetch after permission update.
//
// Only one permission-overwrite request.
//
// BEFORE CLAIM:
// Seller role allowed on Purchase/Cashout.
//
// AFTER CLAIM:
// Seller role denied.
// Creator individually allowed.
// Claimer individually allowed.
// Mods and Owners allowed.
//
// The channel's old permission overwrites
// are replaced, removing old staff grants.
//
// Discord combines role overwrites:
// Mod + Seller retains Mod role access.
//
// Administrator bypass cannot be overridden.
//
// ============================================================

function permissions(guild, state) {
  const closed =
    state.status === "closed";

  const role = id =>
    permissionEntry(
      id,
      OverwriteType.Role,
      closed
    );

  const member = id =>
    permissionEntry(
      id,
      OverwriteType.Member,
      closed
    );

  const result = new Map();

  function add(entry) {
    result.set(entry.id, entry);
  }

  // ==========================================================
  // EVERYONE DENIED
  // ==========================================================

  add({
    id: guild.roles.everyone.id,
    type: OverwriteType.Role,

    deny: [
      PermissionFlagsBits.ViewChannel
    ]
  });

  // ==========================================================
  // BOT ACCESS
  // ==========================================================

  add({
    id: guild.client.user.id,
    type: OverwriteType.Member,

    allow: [
      ...FULL_PERMISSIONS,
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.EmbedLinks
    ]
  });

  // ==========================================================
  // OWNER ROLE
  // ==========================================================

  if (guild.roles.cache.has(IDS.owner)) {
    add(role(IDS.owner));
  } else {
    add(member(IDS.owner));
  }

  // Actual server owner.
  if (
    guild.ownerId &&
    guild.ownerId !== IDS.owner
  ) {
    add(member(guild.ownerId));
  }

  // ==========================================================
  // MOD ROLE
  // ==========================================================

  if (guild.roles.cache.has(IDS.mod)) {
    add(role(IDS.mod));
  }

  // ==========================================================
  // BEFORE CLAIM
  // ==========================================================

  if (!state.claimedBy) {
    const staffRoles =
      isTradingTicket(state)
        ? [IDS.seller]
        : [IDS.support, IDS.admin];

    for (const id of staffRoles) {
      if (guild.roles.cache.has(id)) {
        add(role(id));
      }
    }
  }

  // ==========================================================
  // AFTER CLAIM
  // ==========================================================

  if (
    state.claimedBy &&
    isTradingTicket(state)
  ) {
    if (guild.roles.cache.has(IDS.seller)) {
      add({
        id: IDS.seller,
        type: OverwriteType.Role,
        deny: HIDDEN_PERMISSIONS
      });
    }
  }

  // ==========================================================
  // TICKET CREATOR
  // ==========================================================

  add(member(state.ownerId));

  // ==========================================================
  // EXACT CLAIMING MEMBER
  // ==========================================================

  if (state.claimedBy) {
    add(member(state.claimedBy));
  }

  // ==========================================================
  // DISCORD LIMIT
  // ==========================================================

  if (result.size > 100) {
    throw new Error(
      "Discord allows a maximum of 100 " +
      "permission overwrites per channel."
    );
  }

  return [...result.values()];
}

// ============================================================
// FAST APPLY PERMISSIONS
// ============================================================

async function applyPermissions(
  channel,
  state
) {
  const overwrites =
    permissions(channel.guild, state);

  // Single API request.
  await channel.permissionOverwrites.set(
    overwrites,
    "Chuppys private ticket permissions"
  );

  // Check locally instead of making
  // repeated REST member-fetch requests.
  if (
    state.claimedBy &&
    isTradingTicket(state)
  ) {
    const sellerOverwrite =
      channel.permissionOverwrites.cache.get(
        IDS.seller
      );

    const claimerOverwrite =
      channel.permissionOverwrites.cache.get(
        state.claimedBy
      );

    const creatorOverwrite =
      channel.permissionOverwrites.cache.get(
        state.ownerId
      );

    if (
      !sellerOverwrite?.deny.has(
        PermissionFlagsBits.ViewChannel
      ) ||
      !claimerOverwrite?.allow.has(
        PermissionFlagsBits.ViewChannel
      ) ||
      !creatorOverwrite?.allow.has(
        PermissionFlagsBits.ViewChannel
      )
    ) {
      throw new Error(
        "Claim permissions could not be verified."
      );
    }
  }

  // Avoid a separate topic update unless
  // it is actually necessary.
  if (channel.topic) {
    void channel.setTopic(null)
      .catch(error => {
        console.error(
          "[TICKETS] Topic cleanup failed:",
          error
        );
      });
  }
}

// ============================================================
// CATEGORY SYNCHRONIZATION
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

    if (!target) {
      continue;
    }

    try {
      if (
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

      if (!entry.recovered) {
        await queuedTicket(
          channel.id,
          () => applyPermissions(
            channel,
            entry.state
          )
        );

        refreshed++;
      }
    } catch (error) {
      console.error(
        `[TICKETS] Sync failed: ${channel.name}`,
        error
      );
    }
  }

  console.log(
    `[TICKETS] Categories: ${moved} moved, ` +
    `${refreshed} permissions refreshed.`
  );
}

// ============================================================
// TRANSCRIPT MESSAGE FETCHING
// ============================================================

async function allMessages(channel) {
  const messages = [];

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

    messages.push(...batch.values());

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
// HTML TRANSCRIPT
// ============================================================

function transcriptHtml(
  channel,
  state,
  messages
) {
  const rows = messages.map(message => {
    const author = escapeHtml(
      message.author?.username || "Unknown"
    );

    const date = escapeHtml(
      new Date(
        message.createdTimestamp
      ).toISOString()
    );

    const body = escapeHtml(
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

    const embeds = message.embeds.map(embed => {
      const fields = (embed.fields || [])
        .map(field =>
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
</style>
</head>
<body>
<h1>${escapeHtml(BRAND)} Ticket Transcript</h1>
<p>${escapeHtml(channel.name)} — Ticket #${state.number}</p>
${rows}
</body>
</html>`;
}

// ============================================================
// BUILD HTML TRANSCRIPT ATTACHMENT
// ============================================================

async function buildTranscriptAttachment(
  channel,
  state
) {
  const messages =
    await allMessages(channel);

  const buffer = Buffer.from(
    transcriptHtml(
      channel,
      state,
      messages
    ),
    "utf8"
  );

  if (
    buffer.length > 7 * 1024 * 1024
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
// SIMPLE WHITE TICKET LOGS
// ============================================================
//
// DESTINATION:
// 1570913954333728808
//
// Opened:
// Ticket Opened
// purchase-0658
//
// Claimed:
// Ticket Claimed
// purchase-0658
//
// Closed:
// Ticket Closed
// purchase-0658
// [HTML transcript]
//
// Deleted:
// Ticket Deleted
// purchase-0658
// [HTML transcript]
//
// No JSON.
// No user IDs.
// No extra plain-text information.
//
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

  const logs = await textChannel(
    guild,
    IDS.logs,
    "Ticket logs"
  );

  const name = ticketName(
    state.type,
    state.number
  );

  const payload = {
    content: "",

    embeds: [
      whiteEmbed(
        titles[action],
        `\`${name}\``
      )
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
        "Ticket channel required for transcript."
      );
    }

    payload.files = [
      await buildTranscriptAttachment(
        channel,
        state
      )
    ];
  }

  const message = await logs.send(payload);

  console.log(
    `[TICKETS] ${titles[action]}: ${name}`
  );

  return message;
}

// ============================================================
// PURCHASE / CASHOUT / PARTNERSHIP FORM
// ============================================================

function ticketForm(type) {
  const config = TYPES[type];

  const modal = new ModalBuilder()
    .setCustomId(FORM_PREFIX + type)
    .setTitle(
      `${config.label} Ticket`
    );

  config.questions.forEach(
    (question, index) => {
      const input = new TextInputBuilder()
        .setCustomId(`answer_${index}`)
        .setLabel(
          question.slice(0, 45)
        )
        .setStyle(TextInputStyle.Short)
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
// CLOSE FORM
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

    if (!config) {
      throw new Error(
        "Invalid ticket type."
      );
    }

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

      closeReason:
        "No further action required.",

      transcriptUrl: null,
      createdAt: new Date().toISOString()
    };

    const overwrites =
      permissions(guild, state);

    const channel =
      await guild.channels.create({
        name:
          ticketName(type, number),

        type:
          ChannelType.GuildText,

        parent:
          parent.id,

        topic: null,

        permissionOverwrites:
          overwrites,

        reason:
          `Ticket opened by ${interaction.user.id}`
      });

    state.channelId = channel.id;

    const entry = {
      state,
      storageMessageId: null,
      recovered: false
    };

    await saveState(channel, entry);

    const details =
      config.questions?.length &&
      answers.length
        ? config.questions.map(
            (question, index) =>
              `**${question}**\n` +
              safe(answers[index], 250)
          ).join("\n\n")
        : config.description;

    const proofInstruction =
      type === "partnership"
        ? (
            "\n\n**Please show us proof " +
            "of your vouches in this ticket!**"
          )
        : "";

    const pingRoles = (
      isTradingTicket(state)
        ? [IDS.seller]
        : [IDS.support]
    ).filter(
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
            `${EMOJI} ${config.label} ` +
            `Ticket #${numberText(number)}`,

            `Welcome <@${interaction.user.id}>!\n\n` +
            `${details}` +
            `${proofInstruction}\n\n` +
            "Our team will assist you as soon as possible."
          )
        ],

        components:
          controls(state),

        allowedMentions: {
          parse: [],
          users: [interaction.user.id],
          roles: pingRoles
        }
      });

    state.controlMessageId = welcome.id;

    await saveState(channel, entry);

    // Logging does not block the
    // ticket creation response.
    void logTicket(
      guild,
      { ...state },
      "opened",
      interaction.user.id
    ).catch(error => {
      console.error(
        "[TICKETS] Open log failed:",
        error
      );
    });

    return {
      channel,
      existing: false
    };
  });
}

// ============================================================
// FAST UPDATE TICKET BUTTONS
// ============================================================
//
// OLD:
// Fetch original message, then edit.
//
// NEW:
// Edit directly using saved message ID.
//
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
      "[TICKETS] Could not update buttons:",
      error
    );
  }
}

// ============================================================
// FAST CLAIM TICKET
// ============================================================
//
// CRITICAL STEPS:
//
// 1. Check Seller/Mod/Owner role.
// 2. Apply new channel permissions.
// 3. Save claimedBy.
// 4. Send claim confirmation.
//
// NONCRITICAL STEPS:
//
// - Update button label.
// - Send claimed embed.
// - Post white activity log.
//
// Those are processed separately.
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

  const state = entry.state;

  // ==========================================================
  // FORCECLAIM — OWNER ONLY
  // ==========================================================

  if (force && !isOwner(member)) {
    return reply(
      context,
      "Only owners can use ,forceclaim."
    );
  }

  // ==========================================================
  // CLAIM PERMISSION
  // ==========================================================

  if (
    !force &&
    !canClaim(member, state)
  ) {
    console.warn(
      `[TICKETS] Claim denied: ${member.id}. ` +
      `Seller role: ${isSeller(member)}. ` +
      `Type: ${state.type}`
    );

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

  // ==========================================================
  // ALREADY CLAIMED
  // ==========================================================

  if (state.claimedBy && !force) {
    if (state.claimedBy === member.id) {
      return reply(
        context,
        "You already claimed this ticket."
      );
    }

    if (isOwner(member) || isMod(member)) {
      return reply(
        context,
        `This ticket is already claimed by <@${state.claimedBy}>.`
      );
    }

    return reply(
      context,
      "This ticket has already been claimed."
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

  // ==========================================================
  // APPLY CLAIM
  // ==========================================================

  const previousClaimer =
    state.claimedBy;

  state.claimedBy = member.id;

  try {
    // Single Discord API request.
    await applyPermissions(
      channel,
      state
    );

    // Direct metadata edit.
    await saveState(
      channel,
      entry
    );
  } catch (error) {
    state.claimedBy = previousClaimer;

    // Restore the previous permission
    // configuration if necessary.
    try {
      await applyPermissions(
        channel,
        state
      );
    } catch (restoreError) {
      console.error(
        "[TICKETS] Claim rollback failed:",
        restoreError
      );
    }

    throw error;
  }

  // ==========================================================
  // CLAIM CONFIRMED
  // ==========================================================

  console.log(
    `[TICKETS] ${channel.name} claimed by ${member.id}`
  );

  // ==========================================================
  // NONBLOCKING CLAIM MESSAGE AND LOG
  // ==========================================================

  void updateControls(
    channel,
    { ...state }
  ).catch(error => {
    console.error(
      "[TICKETS] Claim controls failed:",
      error
    );
  });

  void channel.send({
    embeds: [
      whiteEmbed(
        "Ticket Claimed",
        `Claimed by <@${member.id}>.`
      )
    ],

    allowedMentions: {
      parse: []
    }
  }).catch(error => {
    console.error(
      "[TICKETS] Claim embed failed:",
      error
    );
  });

  void logTicket(
    channel.guild,
    { ...state },
    "claimed",
    member.id
  ).catch(error => {
    console.error(
      "[TICKETS] Claim log failed:",
      error
    );
  });

  // ==========================================================
  // QUICK COMMAND RESPONSE
  // ==========================================================

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
// FAST CLOSE TICKET
// ============================================================
//
// Channel is closed first.
//
// A confirmation appears without waiting
// for the transcript to finish uploading.
//
// The transcript continues in a tracked job.
//
// Deleting the ticket will wait for that
// pending transcript job.
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

  // ==========================================================
  // AUTHORIZATION
  // ==========================================================

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

  // ==========================================================
  // PREPARE NEW STATE
  // ==========================================================

  const previousStatus = state.status;
  const previousReason = state.closeReason;

  state.status = "closed";

  state.closeReason =
    reason ||
    "No further action required.";

  // ==========================================================
  // APPLY CLOSED PERMISSIONS
  // ==========================================================

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
    state.status = previousStatus;
    state.closeReason = previousReason;

    throw error;
  }

  // ==========================================================
  // RENAME CHANNEL
  // ==========================================================

  const closedName = ticketName(
    state.type,
    state.number,
    true
  );

  // Renaming runs independently of
  // the transcript upload.
  const renameJob = channel.setName(
    closedName
  ).catch(error => {
    console.error(
      "[TICKETS] Close rename failed:",
      error
    );
  });

  // ==========================================================
  // WHITE CLOSED EMBED
  // ==========================================================

  const closedEmbed = whiteEmbed(
    "Ticket Closed",

    `Closed by <@${member.id}>.\n\n` +
    `**Reason:** ${safe(
      state.closeReason,
      450
    )}\n\n` +
    "This ticket is now closed."
  );

  // Send the closed embed before
  // generating the transcript.
  await channel.send({
    embeds: [closedEmbed],

    allowedMentions: {
      parse: []
    }
  }).catch(error => {
    console.error(
      "[TICKETS] Closed embed failed:",
      error
    );
  });

  // ==========================================================
  // UPDATE BUTTONS WITHOUT DELAY
  // ==========================================================

  void updateControls(
    channel,
    { ...state }
  ).catch(error => {
    console.error(
      "[TICKETS] Close buttons failed:",
      error
    );
  });

  // ==========================================================
  // TRACK TRANSCRIPT UPLOAD
  // ==========================================================

  const transcriptState = {
    ...state
  };

  const transcriptJob = (async () => {
    // Wait for rename, so the transcript
    // uses the closed ticket name.
    await renameJob;

    const logMessage = await logTicket(
      channel.guild,
      transcriptState,
      "closed",
      member.id,
      channel
    );

    state.transcriptUrl = logMessage.url;

    await saveState(channel, entry);

    console.log(
      `[TICKETS] Closed transcript saved: ${channel.name}`
    );

    return logMessage;
  })();

  trackTranscriptJob(
    channel.id,
    transcriptJob
  );

  // Attach a rejection handler without
  // delaying the command response.
  void transcriptJob.catch(error => {
    console.error(
      "[TICKETS] Closed transcript/log failed:",
      error
    );
  });

  // ==========================================================
  // QUICK CLOSE CONFIRMATION
  // ==========================================================

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

  const previousStatus = state.status;

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
    state.status = previousStatus;
    throw error;
  }

  // Rename and refresh controls.
  // They do not hold up the response.
  void channel.setName(
    ticketName(
      state.type,
      state.number
    )
  ).catch(error => {
    console.error(
      "[TICKETS] Reopen rename failed:",
      error
    );
  });

  void updateControls(
    channel,
    { ...state }
  ).catch(error => {
    console.error(
      "[TICKETS] Reopen controls failed:",
      error
    );
  });

  return reply(
    context,
    "Ticket reopened successfully."
  );
}

// ============================================================
// FAST DELETE TICKET
// ============================================================
//
// IMPORTANT:
//
// A transcript must exist before
// the channel is deleted.
//
// Deleting immediately would risk
// losing all ticket messages.
//
// NEW BEHAVIOR:
//
// 1. Check permission.
// 2. Respond "Deleting ticket...".
// 3. Wait for any pending close transcript.
// 4. Upload the deletion transcript.
// 5. Delete the channel.
//
// Other tickets are not blocked.
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

  // ==========================================================
  // AUTHORIZATION
  // ==========================================================

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
      "You do not have permission to delete this ticket."
    );
  }

  // ==========================================================
  // QUICK PROCESSING CONFIRMATION
  // ==========================================================

  // Tell the user that the operation
  // started; do not claim deletion is
  // complete before it actually happens.
  await reply(
    context,
    "Deleting ticket and saving transcript..."
  );

  // ==========================================================
  // FINISH ANY PENDING CLOSE TRANSCRIPT
  // ==========================================================

  const pendingTranscript =
    transcriptJobs.get(channel.id);

  if (pendingTranscript) {
    try {
      await pendingTranscript;
    } catch (error) {
      console.error(
        "[TICKETS] Pending close transcript failed:",
        error
      );

      // Continue with the deletion
      // transcript attempt below.
    }
  }

  // ==========================================================
  // SAVE DELETION TRANSCRIPT
  // ==========================================================

  let logMessage;

  try {
    logMessage = await logTicket(
      channel.guild,
      { ...state },
      "deleted",
      member.id,
      channel
    );
  } catch (error) {
    console.error(
      "[TICKETS] Delete transcript failed:",
      error
    );

    // Do not delete the channel without
    // its deletion transcript.
    return reply(
      context,
      "Deletion cancelled because the transcript could not be saved."
    );
  }

  // ==========================================================
  // UPDATE STORED STATE
  // ==========================================================

  state.transcriptUrl = logMessage.url;

  try {
    await saveState(
      channel,
      entry
    );
  } catch (error) {
    console.error(
      "[TICKETS] Delete state save failed:",
      error
    );

    return reply(
      context,
      "Deletion cancelled because ticket state could not be saved."
    );
  }

  // ==========================================================
  // DELETE CHANNEL
  // ==========================================================

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
      "The transcript was saved, but Discord could not delete the channel."
    );
  }

  tickets.delete(channel.id);

  console.log(
    `[TICKETS] Deleted ${channel.name} by ${member.id}`
  );

  // No additional prefix response after
  // the channel has been removed.
  //
  // Button interactions already received
  // a processing confirmation.
}

// ============================================================
// PANEL COMMAND
// ============================================================

async function panelCommand(interaction) {
  if (
    !interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
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

  const channel = await textChannel(
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
      existing ? "updated" : "posted"
    }.`
  );
}

// ============================================================
// TICKET SELECT MENU
// ============================================================

async function selectTicket(interaction) {
  const type = String(
    interaction.values?.[0] || ""
  ).toLowerCase();

  if (!TYPES[type]) {
    return reply(
      interaction,
      "Please select a valid ticket category."
    );
  }

  // Questions are shown immediately.
  if (TYPES[type].questions?.length) {
    return interaction.showModal(
      ticketForm(type)
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  try {
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
  } catch (error) {
    console.error(
      `[TICKETS] Failed to create ${type}:`,
      error
    );

    return reply(
      interaction,

      `Could not open your ${TYPES[type].label} ` +
      `ticket: ${safe(error.message, 500)}`
    );
  }
}

// ============================================================
// TICKET FORM SUBMISSION
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
    const result = await createTicket(
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
  } catch (error) {
    console.error(
      "[TICKETS] Form submission failed:",
      error
    );

    return reply(
      interaction,

      `Could not open your ${TYPES[type].label} ` +
      `ticket: ${safe(error.message, 500)}`
    );
  }
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
// FAST BUTTON HANDLER
// ============================================================

async function handleButton(
  interaction,
  action
) {
  const channel = interaction.channel;

  // Opening a modal is already an
  // immediate Discord acknowledgement.
  if (action === "close") {
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
// CLOSE MODAL SUBMISSION
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
// FAST PREFIX COMMAND HANDLER
// ============================================================
//
// ,claim
// ,close
// ,delete
//
// Each ticket gets its own command queue.
//
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

  const name = String(
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
    raw.slice(commandName.length)
      .trim()
      .slice(0, 500);

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

      if (name === "claim") {
        return claim(
          context,
          message.channel,
          entry
        );
      }

      if (name === "forceclaim") {
        return claim(
          context,
          message.channel,
          entry,
          true
        );
      }

      if (name === "close") {
        return closeTicket(
          context,
          message.channel,
          entry,
          reason
        );
      }

      if (name === "reopen") {
        return reopenTicket(
          context,
          message.channel,
          entry
        );
      }

      if (name === "delete") {
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
  const INSTALL_KEY = Symbol.for(
    "chuppys.tickets.singleHandler"
  );

  if (
    client[INSTALL_KEY] ||
    client.__chuppysTicketsInstalled
  ) {
    console.warn(
      "[TICKETS] Handler already installed. " +
      "Skipping duplicate installation."
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
  // BOT READY
  // ==========================================================

  async function onReady() {
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
        `[TICKETS] Mod role: ${IDS.mod}`
      );

      console.log(
        `[TICKETS] Owner role: ${IDS.owner}`
      );

      console.log(
        `[TICKETS] Listed seller IDs: ${SELLER_USER_IDS.size}`
      );

      console.log(
        `[TICKETS] Simple logs: ${IDS.logs}`
      );

      console.log(
        "[TICKETS] Per-ticket fast command queues enabled."
      );

      console.log(
        "[TICKETS] Fast seller claim enabled."
      );

      console.log(
        "[TICKETS] Fast close confirmation enabled."
      );

      console.log(
        "[TICKETS] Safe transcript-first deletion enabled."
      );

      console.log(
        "[TICKETS] Owner/Admin/Mod deletion enabled."
      );

      console.log(
        "[TICKETS] Partnership questions enabled."
      );

      console.log(
        "[TICKETS] Support ticket creation enabled."
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
    onReady().catch(console.error);
  }

  // ==========================================================
  // PREFIX LISTENER
  // ==========================================================

  client.on(
    Events.MessageCreate,
    async message => {
      if (
        !message.guild ||
        message.author.bot
      ) {
        return;
      }

      if (
        !message.content.startsWith(PREFIX)
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

      const action =
        interaction.isButton()
          ? actionFor(interaction.customId)
          : null;

      if (
        !isPanel &&
        !isSelect &&
        !isForm &&
        !isClose &&
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
    "[TICKETS] Single fast ticket handler installed."
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = setupTickets;

module.exports.command = command;

// ============================================================
// END OF CHUPPYS TICKET SYSTEM
// ============================================================
