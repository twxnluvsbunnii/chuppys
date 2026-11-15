
"use strict";

// ============================================================
// CHUPPYS TICKET SYSTEM
// DISCORD.JS V14 / RENDER
// ============================================================
//
// INSTALL:
// require("./tickets")(client);
//
// SLASH COMMAND:
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
// - Working seller claim buttons
// - Private claimed tickets
// - Existing ticket counter preserved
// - Existing V3 metadata preserved
// - Legacy ticket recovery
// - Existing category synchronization
// - No duplicate category creation
// - Simple white ticket logs
// - Private HTML transcripts
// - Clean closing confirmation
//
// REQUIRED INTENTS:
// Guilds
// GuildMessages
// MessageContent
//
// REQUIRED BOT PERMISSIONS:
// Manage Channels
// Manage Roles
// View Channel
// Send Messages
// Read Message History
// Attach Files
//
// IMPORTANT:
// Run only ONE bot instance.
//
// Discord Administrators can bypass
// private channel permission restrictions.
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
  MessageFlags
} = require("discord.js");

// ============================================================
// EXISTING CHANNEL AND ROLE IDS
// ============================================================

const IDS = Object.freeze({
  panel: "1530811385678790716",

  logs: "1570913954333728808",

  transcripts: "1571112508922531870",

  data: "1571112668037644388",

  // OWNER ROLE ID
  owner: "1530988662970650865",

  admin: "1531800870444994641",

  mod: "1531800784700706887",

  support: "1563003884656398406",

  seller: "1550322075208646766",

  verified: "1550230619127021568"
});

// ============================================================
// SETTINGS
// ============================================================

const BRAND = ".gg/chuppys";

const EMOJI =
  "<:chuppyhi:1561103471325745242>";

const WHITE = 0xffffff;

const EPHEMERAL =
  MessageFlags.Ephemeral;

const PREFIX = ",";

// ============================================================
// STORAGE PREFIXES
// DO NOT CHANGE THESE
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
// TICKET TYPES AND EXISTING CATEGORIES
// ============================================================
//
// IMPORTANT:
//
// These are your EXISTING category names.
//
// The bot will search for these categories.
//
// It will NOT create additional categories.
//
// Optional Render environment variables
// can specify exact category IDs.
//
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
      "Please provide your cash out details.",

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
      "Please provide details about the giveaway you won."
  },

  partnership: {
    label: "Partnership",

    env: "PARTNERSHIP_TICKET_CATEGORY_ID",

    categories: [
      "Partnership tickets"
    ],

    description:
      "Please provide your partnership information."
  },

  support: {
    label: "Support",

    env: "SUPPORT_TICKET_CATEGORY_ID",

    categories: [
      "Support tickets"
    ],

    description:
      "Please explain what you need help with."
  }
});

// ============================================================
// SLASH COMMAND
// ============================================================

const command =
  new SlashCommandBuilder()
    .setName("ticketpanel")
    .setDescription(
      "Post or update the Chuppys ticket panel."
    )
    .setDefaultMemberPermissions(
      PermissionFlagsBits.ManageGuild
    );

// ============================================================
// RUNTIME STATE
// ============================================================

const stateCache = new Map();

let taskQueue = Promise.resolve();

let initPromise = null;

let initialized = false;

let globalCounter = 0;

let counterMessageId = null;

// ============================================================
// TASK QUEUE
// ============================================================
//
// Prevents simultaneous ticket actions
// from changing the same data.
//
// ============================================================

function queued(task) {
  const next =
    taskQueue.then(task);

  taskQueue =
    next.catch(() => {});

  return next;
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

// ============================================================
// EXISTING TICKET NAME RECOGNITION
// ============================================================

function parseTicketName(name) {
  const match =
    String(name || "").match(
      /^(closed-)?(purchase|purchasing|cashout|cash-out|giveaway|partnership|support)-(\d+)$/i
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

// ============================================================
// ROLE HELPERS
// ============================================================

function memberHasRole(context, id) {
  const roles =
    context.member?.roles;

  if (roles?.cache) {
    return roles.cache.has(id);
  }

  if (Array.isArray(roles)) {
    return roles.includes(id);
  }

  return false;
}

function isOwner(context) {
  return memberHasRole(
    context,
    IDS.owner
  );
}

function isAdmin(context) {
  return Boolean(
    context.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  );
}

function isStaff(context) {
  return (
    isOwner(context) ||
    isAdmin(context) ||
    [
      IDS.seller,
      IDS.support,
      IDS.admin,
      IDS.mod
    ].some(
      id => memberHasRole(context, id)
    )
  );
}

// ============================================================
// CLAIM PERMISSIONS
// ============================================================
//
// PURCHASE AND CASHOUT:
// Sellers can claim.
//
// OTHER TICKETS:
// Support and authorized staff can claim.
//
// Owners can claim any ticket.
//
// ============================================================

function canClaim(context, state) {
  if (
    isOwner(context) ||
    isAdmin(context)
  ) {
    return true;
  }

  if (
    memberHasRole(context, IDS.support) ||
    memberHasRole(context, IDS.mod) ||
    memberHasRole(context, IDS.admin)
  ) {
    return true;
  }

  if (
    state.type === "purchase" ||
    state.type === "cashout"
  ) {
    return memberHasRole(
      context,
      IDS.seller
    );
  }

  return false;
}

// ============================================================
// MANAGEMENT PERMISSIONS
// ============================================================
//
// Once a ticket is claimed:
//
// Only the exact claimer or Owner role
// can manage it through the bot.
//
// The creator can still read and
// respond in their own ticket.
//
// ============================================================

function canManage(context, state) {
  if (isOwner(context)) {
    return true;
  }

  if (state.claimedBy) {
    return (
      state.claimedBy === context.user.id
    );
  }

  return canClaim(context, state);
}

// ============================================================
// REPLY HELPER
// ============================================================

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

// ============================================================
// PREFIX MESSAGE ADAPTER
// ============================================================

function messageContext(message) {
  return {
    guild: message.guild,

    channel: message.channel,

    user: message.author,

    member: message.member,

    memberPermissions:
      message.member?.permissions,

    deferred: false,

    replied: false,

    reply: content =>
      message.reply({
        content:
          typeof content === "string"
            ? content
            : content.content,

        allowedMentions: {
          parse: [],
          repliedUser: false
        }
      })
  };
}

// ============================================================
// WHITE EMBED HELPER
// ============================================================

function embed(title, description) {
  return new EmbedBuilder()
    .setColor(WHITE)
    .setTitle(title)
    .setDescription(description)
    .setFooter({
      text: BRAND
    });
}

// ============================================================
// TEXT CHANNEL HELPER
// ============================================================

async function textChannel(
  guild,
  id,
  name
) {
  const channel =
    await guild.channels.fetch(id);

  if (
    !channel?.isTextBased() ||
    !channel.messages?.fetch ||
    !channel.send
  ) {
    throw new Error(
      `${name} channel unavailable: ${id}`
    );
  }

  return channel;
}

// ============================================================
// TICKET BUTTONS
// ============================================================

function controls(state) {
  const row =
    new ActionRowBuilder();

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
          state.claimedBy
            ? "Claimed"
            : "Claim"
        )
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(
          Boolean(state.claimedBy)
        ),

      new ButtonBuilder()
        .setCustomId(BUTTONS.close)
        .setLabel("Close")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );
  }

  return [row];
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
        Object.entries(TYPES).map(
          ([value, settings]) => ({
            value,

            label:
              settings.label,

            description:
              `Open a ${settings.label} ticket`
          })
        )
      );

  return {
    embeds: [
      embed(
        `${EMOJI} Chuppys Tickets`,

        "Choose the category you need below.\n\n" +

        "**Purchase** — Purchase assistance\n" +
        "**Cash Out** — Cashout assistance\n" +
        "**Giveaway** — Giveaway claims\n" +
        "**Partnership** — Partnerships\n" +
        "**Support** — General assistance"
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
// NORMALIZE SAVED TICKET STATE
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
// PARSE EXISTING METADATA
// ============================================================

function parseState(message) {
  const content =
    message?.content || "";

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

// ============================================================
// MESSAGE SCANNER
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

    before =
      batch.last().id;
  }

  console.warn(
    `[TICKETS] Scan limit reached in ${channel.id}`
  );
}

// ============================================================
// SAVE PRIVATE TICKET STATE
// ============================================================
//
// Metadata goes ONLY into the data channel.
//
// Never post raw JSON in ticket logs.
//
// ============================================================

async function saveState(
  channel,
  entry
) {
  const storage =
    await textChannel(
      channel.guild,
      IDS.data,
      "Ticket data"
    );

  const content =
    STATE_PREFIX +
    JSON.stringify(entry.state);

  let message =
    entry.storageMessageId
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
    message =
      await storage.send({
        content,

        allowedMentions: {
          parse: []
        }
      });

    entry.storageMessageId =
      message.id;
  }

  stateCache.set(
    channel.id,
    entry
  );
}

// ============================================================
// INITIALIZE EXISTING STORAGE
// ============================================================

async function init(guild) {
  if (initialized) {
    return;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
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

      const state =
        parseState(message);

      if (state) {
        highest = Math.max(
          highest,
          state.number
        );

        const existing =
          stateCache.get(
            state.channelId
          );

        if (
          !existing ||
          (
            inData &&
            !existing.storageMessageId
          )
        ) {
          stateCache.set(
            state.channelId,
            {
              state,

              storageMessageId:
                inData
                  ? message.id
                  : null
            }
          );
        }
      }

      if (
        message.content.startsWith(
          COUNTER_PREFIX
        )
      ) {
        const value =
          Number(
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

          if (
            inData &&
            !counterMessage
          ) {
            counterMessage =
              message;
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
          const old =
            JSON.parse(
              message.content.slice(
                OLD_COUNTER_PREFIX.length
              )
            );

          const total =
            Object.values(old)
              .map(Number)
              .filter(
                value =>
                  Number.isSafeInteger(value) &&
                  value >= 0
              )
              .reduce(
                (sum, value) =>
                  sum + value,
                0
              );

          highest = Math.max(
            highest,
            total
          );
        } catch {
          // Ignore invalid legacy counter.
        }
      }
    };

    await scan(
      data,
      message =>
        processMessage(
          message,
          true
        )
    );

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

    await guild.channels.fetch();

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

    if (counterMessage) {
      counterMessageId =
        counterMessage.id;

      const stored =
        Number(
          counterMessage.content.slice(
            COUNTER_PREFIX.length
          )
        );

      if (stored < highest) {
        await counterMessage.edit({
          content:
            COUNTER_PREFIX +
            highest
        });
      }
    } else {
      const message =
        await data.send({
          content:
            COUNTER_PREFIX +
            highest,

          allowedMentions: {
            parse: []
          }
        });

      counterMessageId =
        message.id;
    }

    // Move legacy metadata into
    // the private data channel.

    for (
      const [id, entry] of stateCache
    ) {
      if (entry.storageMessageId) {
        continue;
      }

      const channel =
        await guild.channels.fetch(
          id
        ).catch(() => null);

      if (
        channel?.type ===
        ChannelType.GuildText
      ) {
        await saveState(
          channel,
          entry
        );
      }
    }

    initialized = true;

    console.log(
      `[TICKETS] Loaded ${stateCache.size} tickets.`
    );

    console.log(
      `[TICKETS] Counter preserved at ${globalCounter}.`
    );
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
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

  const message =
    await storage.messages.fetch(
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

  const next =
    globalCounter + 1;

  await message.edit({
    content:
      COUNTER_PREFIX +
      next
  });

  globalCounter =
    next;

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

      channelId:
        channel.id
    });
  } catch {
    return null;
  }
}

// ============================================================
// EXISTING WELCOME MESSAGE RECOVERY
// ============================================================

function originalWelcome(
  message,
  parsed,
  botId
) {
  if (
    message.author.id !== botId
  ) {
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

  if (!hasButtons) {
    return false;
  }

  return message.embeds.some(
    item => {
      const title =
        String(
          item.title || ""
        ).toLowerCase();

      const match =
        title.match(
          /#\s*0*(\d+)/
        );

      return Boolean(
        match &&
        Number(match[1]) ===
          parsed.number &&
        (
          title.includes(
            TYPES[parsed.type].label
              .toLowerCase()
          ) ||
          (
            parsed.type === "cashout" &&
            title.includes("cashout")
          )
        )
      );
    }
  );
}

// ============================================================
// EXTRACT ORIGINAL TICKET CREATOR
// ============================================================

function extractOwner(message) {
  const description =
    message.embeds
      .map(
        item =>
          item.description || ""
      )
      .join("\n");

  const match =
    description.match(
      /(?:welcome|opened by|created by|creator)\s*:?\s*<@!?(\d{17,20})>/i
    );

  if (match) {
    return match[1];
  }

  const mention =
    String(
      message.content || ""
    ).match(
      /<@!?(\d{17,20})>/
    );

  return mention?.[1] || null;
}

// ============================================================
// RECOVER EXISTING TICKET
// ============================================================

async function recoverWelcome(channel) {
  const parsed =
    parseTicketName(
      channel.name
    );

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
      const message of batch.values()
    ) {
      if (
        !originalWelcome(
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

          claimedBy:
            null,

          controlMessageId:
            message.id,

          closeReason:
            "No further action required.",

          transcriptUrl:
            null,

          createdAt:
            message.createdAt.toISOString()
        },

        storageMessageId:
          null
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

  await init(
    channel.guild
  );

  if (
    stateCache.has(
      channel.id
    )
  ) {
    return stateCache.get(
      channel.id
    );
  }

  const legacy =
    fromTopic(channel);

  if (legacy) {
    const entry = {
      state: legacy,

      storageMessageId:
        null
    };

    await saveState(
      channel,
      entry
    );

    await channel.setTopic(null)
      .catch(() => {});

    return entry;
  }

  return recoverWelcome(
    channel
  );
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

  for (
    const entry of
    stateCache.values()
  ) {
    if (
      entry.state.ownerId !== userId ||
      entry.state.type !== type ||
      entry.state.status !== "open"
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

  return null;
}

// ============================================================
// EXISTING CATEGORY LOOKUP
// ============================================================
//
// THIS FIXES DUPLICATE CATEGORIES.
//
// The bot searches for the categories
// already in your server.
//
// It does not create new categories.
//
// ============================================================

function normalizedName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

async function category(
  guild,
  type
) {
  const settings =
    TYPES[type];

  if (!settings) {
    throw new Error(
      `Unknown ticket type: ${type}`
    );
  }

  await guild.channels.fetch();

  const configuredId =
    process.env[settings.env];

  if (configuredId) {
    const configured =
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
      `[TICKETS] Invalid ${settings.env}. Trying category names.`
    );
  }

  const categories = [
    ...guild.channels.cache.values()
  ].filter(
    channel =>
      channel.type ===
      ChannelType.GuildCategory
  );

  for (
    const alias of
    settings.categories
  ) {
    const found =
      categories.find(
        channel =>
          normalizedName(
            channel.name
          ) ===
          normalizedName(alias)
      );

    if (found) {
      return found;
    }
  }

  throw new Error(
    `Cannot find the existing ${settings.label} category. ` +
    `Expected "${settings.categories[0]}" ` +
    `or configure ${settings.env} in Render.`
  );
}

// ============================================================
// SYNC ALL EXISTING TICKETS
// ============================================================
//
// Moves recognized ticket channels
// into the correct existing category.
//
// Purchase -> Purchasing tickets
// Cashout -> Cashout tickets
// Giveaway -> Giveaway tickets
// Partnership -> Partnership tickets
// Support -> Support tickets
//
// Does NOT delete ticket messages.
//
// Does NOT create categories.
//
// Preserves private permissions.
//
// ============================================================

async function syncExistingTickets(guild) {
  await init(guild);

  await guild.channels.fetch();

  const destinations = {};

  for (
    const type of
    Object.keys(TYPES)
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

  let fixed = 0;

  let failed = 0;

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

    const known =
      stateCache.get(
        channel.id
      )?.state;

    const parsed =
      parseTicketName(
        channel.name
      );

    if (
      !known &&
      !parsed
    ) {
      continue;
    }

    const type =
      known?.type ||
      parsed?.type;

    const target =
      destinations[type];

    if (!target) {
      failed++;
      continue;
    }

    try {
      if (
        channel.parentId !==
        target.id
      ) {
        await channel.setParent(
          target.id,
          {
            lockPermissions:
              false
          }
        );

        moved++;
      }

      if (known) {
        await applyPermissions(
          channel,
          known
        );

        fixed++;
      }
    } catch (error) {
      failed++;

      console.error(
        `[TICKETS] Sync failed for ${channel.name}:`,
        error
      );
    }
  }

  console.log(
    `[TICKETS] Category sync complete. ` +
    `${moved} moved, ` +
    `${fixed} permissions refreshed, ` +
    `${failed} skipped/failed.`
  );

  return {
    moved,
    fixed,
    failed
  };
}

// ============================================================
// STRICT TICKET PERMISSIONS
// ============================================================
//
// THIS IS THE SELLER CLAIM FIX.
//
// BEFORE CLAIM:
//
// Purchase and Cashout:
// Sellers and authorized staff can see.
//
// Other ticket types:
// Support and authorized staff can see.
//
// AFTER CLAIM:
//
// ONLY:
// 1. Ticket creator
// 2. Exact seller/staff member who claimed
// 3. Owner role
// 4. Bot
//
// All other normal seller/staff
// channel overwrites are removed.
//
// Seller role receives explicit
// ViewChannel DENY.
//
// Exact claimer receives individual
// member ViewChannel ALLOW.
//
// Member-specific permissions override
// normal role permission overwrites.
//
// Administrators still bypass
// Discord channel restrictions.
//
// ============================================================

const FULL = [
  PermissionFlagsBits.ViewChannel,

  PermissionFlagsBits.SendMessages,

  PermissionFlagsBits.ReadMessageHistory,

  PermissionFlagsBits.AttachFiles
];

const READ_ONLY = [
  PermissionFlagsBits.ViewChannel,

  PermissionFlagsBits.ReadMessageHistory
];

// ============================================================
// PERMISSION ENTRY
// ============================================================

function allow(id, closed) {
  return {
    id,

    allow:
      closed
        ? READ_ONLY
        : FULL,

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
// BUILD CHANNEL PERMISSIONS
// ============================================================

function permissions(
  guild,
  state
) {
  const closed =
    state.status === "closed";

  const result = [
    // Hide from everyone.

    {
      id:
        guild.roles.everyone.id,

      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },

    // Bot always retains access.

    {
      id:
        guild.client.user.id,

      allow: [
        ...FULL,

        PermissionFlagsBits.ManageChannels,

        PermissionFlagsBits.ManageMessages,

        PermissionFlagsBits.ManageRoles
      ]
    }
  ];

  // ========================================================
  // CLAIMED TICKET
  // ========================================================

  if (state.claimedBy) {
    // Explicitly hide from seller role.

    if (
      guild.roles.cache.has(
        IDS.seller
      )
    ) {
      result.push({
        id:
          IDS.seller,

        deny: [
          PermissionFlagsBits.ViewChannel
        ]
      });
    }

    // No support, admin or mod
    // role-wide access is added.
  } else {
    // ======================================================
    // UNCLAIMED TICKET
    // ======================================================

    const staffRoles =
      state.type === "purchase" ||
      state.type === "cashout"
        ? [
            IDS.seller,
            IDS.support,
            IDS.admin,
            IDS.mod
          ]
        : [
            IDS.support,
            IDS.admin,
            IDS.mod
          ];

    for (
      const id of
      new Set(staffRoles)
    ) {
      if (
        guild.roles.cache.has(id)
      ) {
        result.push(
          allow(
            id,
            closed
          )
        );
      }
    }
  }

  // ========================================================
  // OWNER ROLE ACCESS
  // ========================================================

  if (
    guild.roles.cache.has(
      IDS.owner
    )
  ) {
    result.push(
      allow(
        IDS.owner,
        closed
      )
    );
  }

  // ========================================================
  // TICKET CREATOR ACCESS
  // ========================================================

  result.push(
    allow(
      state.ownerId,
      closed
    )
  );

  // ========================================================
  // EXACT CLAIMING SELLER ACCESS
  // ========================================================

  if (
    state.claimedBy &&
    state.claimedBy !== state.ownerId
  ) {
    result.push(
      allow(
        state.claimedBy,
        closed
      )
    );
  }

  return result;
}

// ============================================================
// APPLY STRICT PERMISSIONS
// ============================================================
//
// Replaces all existing overwrites.
//
// This removes access granted to
// other sellers and staff.
//
// ============================================================

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

// ============================================================
// SIMPLE WHITE TICKET LOGS
// ============================================================
//
// ONLY FOUR LOG TYPES:
//
// Ticket Opened
// Ticket Claimed
// Ticket Closed
// Ticket Deleted
//
// NO:
// Raw metadata
// Creator IDs
// Executor IDs
// Usernames
// Transcript buttons
// Long information sections
//
// ============================================================

async function logTicket(
  guild,
  state,
  action,
  actorId
) {
  try {
    const logs =
      await textChannel(
        guild,
        IDS.logs,
        "Ticket logs"
      );

    const title = {
      opened:
        "Ticket Opened",

      claimed:
        "Ticket Claimed",

      closed:
        "Ticket Closed",

      deleted:
        "Ticket Deleted"
    }[action];

    if (!title) {
      return;
    }

    const ticket =
      action === "deleted"
        ? `\`${ticketName(
            state.type,
            state.number,
            true
          )}\``
        : `<#${state.channelId}>`;

    await logs.send({
      embeds: [
        embed(
          title,

          `**Ticket:** ${ticket}\n` +
          `**By:** <@${actorId}>`
        )
      ],

      allowedMentions: {
        parse: []
      }
    });
  } catch (error) {
    console.error(
      `[TICKETS] ${action} log failed:`,
      error
    );
  }
}

// ============================================================
// FETCH ALL TICKET MESSAGES
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

    before =
      batch.last().id;
  }

  return messages.sort(
    (a, b) =>
      a.createdTimestamp -
      b.createdTimestamp
  );
}

// ============================================================
// PRIVATE HTML TRANSCRIPT
// ============================================================
//
// Transcripts are stored privately.
//
// They are NOT announced when closing.
//
// They are NOT linked in public logs.
//
// ============================================================

function transcriptHtml(
  channel,
  state,
  messages
) {
  const items =
    messages.map(
      message => {
        const attachments = [
          ...message.attachments.values()
        ]
          .map(
            attachment => {
              const url =
                String(
                  attachment.url || ""
                );

              if (
                !/^https:\/\//i.test(url)
              ) {
                return "";
              }

              return (
                `<p>Attachment: ` +
                `<a href="${html(url)}">` +
                `${html(
                  attachment.name ||
                  "File"
                )}` +
                `</a></p>`
              );
            }
          )
          .join("");

        const embeds =
          message.embeds
            .map(
              item => {
                const fields =
                  (item.fields || [])
                    .map(
                      field =>
                        `<p>` +
                        `<b>${html(field.name)}</b>: ` +
                        `${html(field.value)}` +
                        `</p>`
                    )
                    .join("");

                return (
                  `<blockquote>` +
                  `<b>${html(
                    item.title ||
                    "Embed"
                  )}</b>` +
                  `<p>${html(
                    item.description ||
                    ""
                  )}</p>` +
                  `${fields}` +
                  `</blockquote>`
                );
              }
            )
            .join("");

        return (
          `<article>` +

          `<b>${html(
            message.author?.username ||
            "Unknown"
          )}</b> ` +

          `<small>${html(
            new Date(
              message.createdTimestamp
            ).toISOString()
          )}</small>` +

          `<div>${html(
            message.content || ""
          )}</div>` +

          `${embeds}` +
          `${attachments}` +

          `</article>`
        );
      }
    )
    .join("\n");

  return (
    `<!doctype html>` +
    `<html lang="en">` +
    `<head>` +
    `<meta charset="utf-8">` +
    `<meta name="viewport" content="width=device-width, initial-scale=1">` +
    `<title>Ticket ${state.number}</title>` +
    `<style>` +

    `body{` +
    `background:#15141c;` +
    `color:#eee;` +
    `font:15px/1.6 system-ui;` +
    `max-width:850px;` +
    `margin:30px auto;` +
    `padding:0 18px` +
    `}` +

    `article{` +
    `border-bottom:1px solid #444;` +
    `padding:14px 0` +
    `}` +

    `article div,blockquote{` +
    `white-space:pre-wrap;` +
    `overflow-wrap:anywhere` +
    `}` +

    `blockquote{` +
    `border-left:3px solid #ddd;` +
    `padding:8px 14px;` +
    `background:#292734` +
    `}` +

    `small{color:#aaa}` +
    `a{color:#aaccff}` +

    `</style>` +
    `</head>` +
    `<body>` +

    `<h1>${html(BRAND)} — Ticket Transcript</h1>` +

    `<p>${html(channel.name)} | ` +
    `Ticket #${state.number} | ` +
    `${messages.length} messages</p>` +

    items +

    `</body>` +
    `</html>`
  );
}

// ============================================================
// SAVE PRIVATE TRANSCRIPT
// ============================================================

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
    await allMessages(
      channel
    );

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
      "Transcript is larger than 7 MB."
    );
  }

  const attachment =
    new AttachmentBuilder(
      buffer,
      {
        name:
          `transcript-${state.type}-${state.number}.html`
      }
    );

  const message =
    await storage.send({
      content:
        `Transcript: ${safe(
          channel.name,
          100
        )}`,

      files: [
        attachment
      ],

      allowedMentions: {
        parse: []
      }
    });

  return message.url;
}

// ============================================================
// TICKET FORM
// ============================================================
//
// Purchase and Cashout use forms.
//
// Support, Giveaway and Partnership
// open directly.
//
// This fixes Support tickets failing
// because they have no form questions.
//
// ============================================================

function ticketForm(type) {
  const settings =
    TYPES[type];

  const modal =
    new ModalBuilder()
      .setCustomId(
        FORM_PREFIX +
        type
      )
      .setTitle(
        `${settings.label} Ticket`
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
                question.slice(
                  0,
                  45
                )
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

// ============================================================
// CLOSE MODAL
// ============================================================

function closeModal(channelId) {
  return new ModalBuilder()
    .setCustomId(
      CLOSE_PREFIX +
      channelId
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

    // Find the existing category first.

    const parent =
      await category(
        guild,
        type
      );

    const number =
      await nextNumber(
        guild
      );

    const state = {
      channelId:
        null,

      ownerId:
        interaction.user.id,

      type,

      number,

      status:
        "open",

      claimedBy:
        null,

      controlMessageId:
        null,

      closeReason:
        "No further action required.",

      transcriptUrl:
        null,

      createdAt:
        new Date().toISOString()
    };

    // Create inside the correct category.

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

        topic:
          null,

        permissionOverwrites:
          permissions(
            guild,
            state
          ),

        reason:
          `Ticket opened by ${interaction.user.id}`
      });

    state.channelId =
      channel.id;

    const entry = {
      state,

      storageMessageId:
        null
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

    // ========================================================
    // TICKET PINGS
    // ========================================================

    const pingRoles =
      type === "purchase" ||
      type === "cashout"
        ? [
            IDS.seller,
            IDS.support
          ]
        : [
            IDS.support
          ];

    const availablePings =
      pingRoles.filter(
        id =>
          guild.roles.cache.has(id)
      );

    const welcome =
      await channel.send({
        content: [
          `<@${interaction.user.id}>`,

          ...availablePings.map(
            id => `<@&${id}>`
          )
        ].join(" "),

        embeds: [
          embed(
            `${EMOJI} ${settings.label} ` +
            `Ticket #${numberText(number)}`,

            `Welcome <@${interaction.user.id}>!\n\n` +

            `${details}\n\n` +

            "Please wait for our team."
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
            availablePings
        }
      });

    state.controlMessageId =
      welcome.id;

    await saveState(
      channel,
      entry
    );

    await logTicket(
      guild,
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
// UPDATE TICKET BUTTONS
// ============================================================

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
        controls(state)
    });
  }
}

// ============================================================
// CLAIM TICKET
// ============================================================
//
// THIS FIXES THE CLAIM BUTTON.
//
// The first authorized seller who
// claims the ticket becomes its claimer.
//
// All previous channel overwrites
// are replaced immediately.
//
// Other sellers lose access.
//
// Only:
// - Ticket creator
// - Exact claimer
// - Owner role
// - Bot
//
// can normally view the channel.
//
// ============================================================

async function claim(
  context,
  channel,
  entry
) {
  const state =
    entry.state;

  if (
    !canClaim(
      context,
      state
    )
  ) {
    return reply(
      context,
      "You cannot claim this ticket."
    );
  }

  if (
    state.status === "closed"
  ) {
    return reply(
      context,
      "Reopen this ticket first."
    );
  }

  // ========================================================
  // ALREADY CLAIMED
  // ========================================================

  if (state.claimedBy) {
    if (
      state.claimedBy ===
        context.user.id ||
      isOwner(context)
    ) {
      await applyPermissions(
        channel,
        state
      );

      return reply(
        context,
        "Ticket privacy refreshed successfully."
      );
    }

    return reply(
      context,
      "This ticket has already been claimed."
    );
  }

  // ========================================================
  // NEW CLAIM
  // ========================================================

  state.claimedBy =
    context.user.id;

  try {
    // Completely replace old permissions.

    await applyPermissions(
      channel,
      state
    );
  } catch (error) {
    state.claimedBy =
      null;

    throw error;
  }

  // Save the exact claiming seller.

  await saveState(
    channel,
    entry
  );

  // Disable the Claim button.

  await updateControls(
    channel,
    state
  );

  // Confirmation inside private ticket.

  await channel.send({
    embeds: [
      embed(
        "Ticket Claimed",

        `Claimed by <@${context.user.id}>.`
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  // Simple white log.

  await logTicket(
    channel.guild,
    state,
    "claimed",
    context.user.id
  );

  return reply(
    context,
    "This ticket has been claimed successfully."
  );
}

// ============================================================
// CLOSE TICKET
// ============================================================
//
// No transcript announcement.
//
// No instructions to use ,delete.
//
// Only the requested confirmation:
//
// This ticket has been closed successfully.
//
// ============================================================

async function closeTicket(
  context,
  channel,
  entry,
  reason
) {
  const state =
    entry.state;

  if (
    !canManage(
      context,
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

  // Save transcript privately.

  const transcriptUrl =
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
    transcriptUrl;

  // Preserve strict claim privacy.

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

  await logTicket(
    channel.guild,
    state,
    "closed",
    context.user.id
  );

  // Only one short closing message.

  return reply(
    context,
    "This ticket has been closed successfully."
  );
}

// ============================================================
// REOPEN TICKET
// ============================================================

async function reopen(
  context,
  channel,
  entry
) {
  const state =
    entry.state;

  if (
    !canManage(
      context,
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

  state.status =
    "open";

  // Keep original claimer private.

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

  // No additional reopen log.
  // Only four log types requested.

  return reply(
    context,
    "This ticket has been reopened successfully."
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
  const state =
    entry.state;

  if (
    !canManage(
      context,
      state
    )
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
      "Close this ticket first."
    );
  }

  // Save final transcript privately.

  state.transcriptUrl =
    await saveTranscript(
      channel,
      state
    );

  await saveState(
    channel,
    entry
  );

  // White delete log.

  await logTicket(
    channel.guild,
    state,
    "deleted",
    context.user.id
  );

  await reply(
    context,
    "This ticket has been deleted successfully."
  );

  await channel.delete(
    `Ticket deleted by ${context.user.id}`
  );

  stateCache.delete(
    channel.id
  );
}

// ============================================================
// POST OR UPDATE TICKET PANEL
// ============================================================

async function postPanel(interaction) {
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
// TICKET SELECT MENU
// ============================================================

async function select(interaction) {
  const type =
    String(
      interaction.values?.[0] || ""
    ).toLowerCase();

  if (!TYPES[type]) {
    return reply(
      interaction,
      "Invalid ticket category."
    );
  }

  // Purchase and Cashout use forms.

  if (
    TYPES[type].questions?.length
  ) {
    return interaction.showModal(
      ticketForm(type)
    );
  }

  // Support, Giveaway and Partnership
  // open directly without a modal.

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
          `Your ${TYPES[type].label} ` +
          `ticket is ready: ${result.channel}`
        )
  );
}

// ============================================================
// PURCHASE / CASHOUT FORM SUBMISSION
// ============================================================

async function submitForm(interaction) {
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
          `Your ${TYPES[type].label} ` +
          `ticket is ready: ${result.channel}`
        )
  );
}

// ============================================================
// BUTTON ACTION DETECTION
// ============================================================

function actionFor(customId) {
  for (
    const [name, id] of
    Object.entries(BUTTONS)
  ) {
    if (id === customId) {
      return name;
    }
  }

  if (
    customId.startsWith(
      "chuppys_ticket:"
    )
  ) {
    const old =
      customId.slice(
        "chuppys_ticket:".length
      );

    if (
      [
        "claim",
        "close",
        "reopen",
        "delete"
      ].includes(old)
    ) {
      return old;
    }
  }

  return null;
}

// ============================================================
// BUTTON ACTION HANDLER
// ============================================================

async function buttonAction(
  interaction,
  name
) {
  if (
    !isStaff(interaction)
  ) {
    return reply(
      interaction,
      "Only ticket staff can do this."
    );
  }

  const channel =
    interaction.channel;

  const entry =
    await loadState(
      channel
    );

  if (!entry) {
    return reply(
      interaction,
      "This is not a recognized Chuppys ticket."
    );
  }

  // Close button opens a modal.

  if (name === "close") {
    if (
      !canManage(
        interaction,
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
      closeModal(
        channel.id
      )
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return queued(async () => {
    const latest =
      await loadState(
        channel
      );

    if (!latest) {
      return reply(
        interaction,
        "Ticket data is unavailable."
      );
    }

    if (name === "claim") {
      return claim(
        interaction,
        channel,
        latest
      );
    }

    if (name === "reopen") {
      return reopen(
        interaction,
        channel,
        latest
      );
    }

    if (name === "delete") {
      return deleteTicket(
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

// ============================================================
// CLOSE MODAL SUBMISSION
// ============================================================

async function closeForm(interaction) {
  if (
    interaction.customId.slice(
      CLOSE_PREFIX.length
    ) !== interaction.channelId
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
      .trim();

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
        "Ticket data is unavailable."
      );
    }

    return closeTicket(
      interaction,
      interaction.channel,
      entry,
      reason
    );
  });
}

// ============================================================
// PREFIX COMMANDS
// ============================================================
//
// ,claim
// ,close
// ,close reason here
// ,reopen
// ,delete
//
// ============================================================

async function prefixCommand(message) {
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
      "close",
      "reopen",
      "delete"
    ].includes(name)
  ) {
    return;
  }

  const context =
    messageContext(
      message
    );

  if (
    !isStaff(context)
  ) {
    return reply(
      context,
      "Only ticket staff can use this command."
    );
  }

  if (
    message.channel.type !==
    ChannelType.GuildText
  ) {
    return reply(
      context,
      "This command only works in tickets."
    );
  }

  const reason =
    raw.slice(
      commandName.length
    )
      .trim()
      .slice(0, 500);

  return queued(async () => {
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

    // ======================================================
    // ,claim
    // ======================================================

    if (name === "claim") {
      return claim(
        context,
        message.channel,
        entry
      );
    }

    // ======================================================
    // ,close
    // ======================================================

    if (name === "close") {
      return closeTicket(
        context,
        message.channel,
        entry,
        reason
      );
    }

    // ======================================================
    // ,reopen
    // ======================================================

    if (name === "reopen") {
      return reopen(
        context,
        message.channel,
        entry
      );
    }

    // ======================================================
    // ,delete
    // ======================================================

    return deleteTicket(
      context,
      message.channel,
      entry
    );
  });
}

// ============================================================
// INSTALL TICKET SYSTEM
// ============================================================

function setupTickets(client) {
  if (
    client.__chuppysTicketsInstalled
  ) {
    return;
  }

  client.__chuppysTicketsInstalled =
    true;

  // ========================================================
  // BOT READY
  // ========================================================

  const onReady =
    async () => {
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

        // Load old ticket information.

        await init(guild);

        // Move recognized tickets into
        // their correct existing categories.

        await syncExistingTickets(
          guild
        );

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
          `[TICKETS] Owner role: ${IDS.owner}`
        );

        console.log(
          "[TICKETS] Claimed tickets are private."
        );

        console.log(
          "[TICKETS] Support tickets enabled."
        );

        console.log(
          "[TICKETS] Existing categories synchronized."
        );

        console.log(
          "[TICKETS] White ticket logs enabled."
        );
      } catch (error) {
        console.error(
          "[TICKETS] Startup/sync error:",
          error
        );
      }
    };

  client.once(
    Events.ClientReady,
    onReady
  );

  if (client.isReady()) {
    onReady()
      .catch(console.error);
  }

  // ========================================================
  // PREFIX COMMAND LISTENER
  // ========================================================

  client.on(
    Events.MessageCreate,

    async message => {
      try {
        await prefixCommand(
          message
        );
      } catch (error) {
        console.error(
          "[TICKETS] Prefix error:",
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
                error.message
              ),

            allowedMentions: {
              parse: []
            }
          }).catch(console.error);
        }
      }
    }
  );

  // ========================================================
  // INTERACTION LISTENER
  // ========================================================

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

      const buttonActionName =
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
        !buttonActionName
      ) {
        return;
      }

      try {
        if (
          !interaction.inGuild()
        ) {
          return reply(
            interaction,
            "Tickets work only in the server."
          );
        }

        // Ticket panel.

        if (isPanel) {
          return await postPanel(
            interaction
          );
        }

        // Ticket category selection.

        if (isSelect) {
          return await select(
            interaction
          );
        }

        // Purchase / Cashout form.

        if (isForm) {
          return await submitForm(
            interaction
          );
        }

        // Close ticket modal.

        if (isClose) {
          return await closeForm(
            interaction
          );
        }

        // Claim / Close / Reopen / Delete.

        if (buttonActionName) {
          return await buttonAction(
            interaction,
            buttonActionName
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
            error.message
          )
        ).catch(console.error);
      }
    }
  );

  console.log(
    "[TICKETS] Chuppys ticket system installed."
  );
}

// ============================================================
// EXPORTS
// ============================================================

module.exports =
  setupTickets;

module.exports.command =
  command;

// ============================================================
// END OF CHUPPYS TICKET SYSTEM
// ============================================================
