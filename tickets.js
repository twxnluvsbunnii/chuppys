"use strict";

// ==================================================
// CHUPPYS TICKET SYSTEM
// RENDER ONLY — DISCORD.JS V14
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
// CHANNEL CONFIGURATION
// ==================================================

const TICKET_PANEL_CHANNEL_ID =
  "1530811385678790716";

const TICKET_LOG_CHANNEL_ID =
  "1570913954333728808";

// Optional Render environment variables:
//
// TICKET_TRANSCRIPT_CHANNEL_ID
// TICKET_DATA_CHANNEL_ID
//
// If TICKET_TRANSCRIPT_CHANNEL_ID is configured,
// transcript files go there instead of appearing
// between styled embeds in the ticket log.
//
// If TICKET_DATA_CHANNEL_ID is configured,
// private ticket metadata and the counter go there.
//
// Both channels should be staff-only.

const TRANSCRIPT_CHANNEL_ID =
  process.env.TICKET_TRANSCRIPT_CHANNEL_ID ||
  TICKET_LOG_CHANNEL_ID;

const DATA_CHANNEL_ID =
  process.env.TICKET_DATA_CHANNEL_ID ||
  TICKET_LOG_CHANNEL_ID;

// ==================================================
// ROLE CONFIGURATION
// ==================================================

const OWNER_ROLE_ID =
  "1530988662970650865";

const ADMIN_ROLE_ID =
  "1531800870444994641";

const MOD_ROLE_ID =
  "1531800784700706887";

const TICKET_SUPPORT_ROLE_ID =
  "1563003884656398406";

const SELLER_ROLE_ID =
  "1550322075208646766";

const VERIFIED_ROLE_ID =
  "1550230619127021568";

// Middleman and Converter roles are not included.

const TICKET_MANAGER_ROLES = [
  OWNER_ROLE_ID,
  ADMIN_ROLE_ID,
  MOD_ROLE_ID,
  TICKET_SUPPORT_ROLE_ID
];

// ==================================================
// TICKET ACCESS
// ==================================================

const TICKET_ACCESS = {
  purchase: [
    OWNER_ROLE_ID,
    ADMIN_ROLE_ID,
    MOD_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID,
    SELLER_ROLE_ID
  ],

  cashout: [
    OWNER_ROLE_ID,
    ADMIN_ROLE_ID,
    MOD_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID,
    SELLER_ROLE_ID
  ],

  giveaway: [
    OWNER_ROLE_ID,
    ADMIN_ROLE_ID,
    MOD_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ],

  partnership: [
    OWNER_ROLE_ID,
    ADMIN_ROLE_ID,
    MOD_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ],

  support: [
    OWNER_ROLE_ID,
    ADMIN_ROLE_ID,
    MOD_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ]
};

// ==================================================
// TICKET PINGS
// ==================================================

const TICKET_PINGS = {
  purchase: [
    OWNER_ROLE_ID,
    VERIFIED_ROLE_ID,
    SELLER_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ],

  cashout: [
    OWNER_ROLE_ID,
    VERIFIED_ROLE_ID,
    SELLER_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ],

  giveaway: [],

  partnership: [],

  support: [
    OWNER_ROLE_ID,
    ADMIN_ROLE_ID,
    MOD_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ]
};

// ==================================================
// TICKET CATEGORIES
// ==================================================

const TICKET_TYPES = {
  purchase: {
    name: "Purchase",
    description:
      "Please provide your purchase information.",

    categoryEnv:
      "PURCHASE_TICKET_CATEGORY_ID",

    questions: [
      "What are you purchasing?",
      "Who are you buying from?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  cashout: {
    name: "Cash Out",
    description:
      "Please provide your cashout information.",

    categoryEnv:
      "CASHOUT_TICKET_CATEGORY_ID",

    questions: [
      "What are you cashing out?",
      "How much are you looking for?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  giveaway: {
    name: "Giveaway",
    description:
      "Please provide details about your giveaway.",

    categoryEnv:
      "GIVEAWAY_TICKET_CATEGORY_ID"
  },

  partnership: {
    name: "Partnership",
    description:
      "Please provide your partnership information.",

    categoryEnv:
      "PARTNERSHIP_TICKET_CATEGORY_ID"
  },

  support: {
    name: "Support",
    description:
      "Please explain what you need assistance with.",

    categoryEnv:
      "SUPPORT_TICKET_CATEGORY_ID"
  }
};

// ==================================================
// APPEARANCE
// ==================================================

const BRAND = ".gg/chuppys";

const TICKET_EMOJI =
  "<:chuppyhi:1561103471325745242>";

const LOG_COLOR = 0x3498db;

const TICKET_COLOR = 0xffffff;

const EPHEMERAL =
  MessageFlags.Ephemeral;

// ==================================================
// CUSTOM IDS
// ==================================================

const TICKET_SELECT_ID =
  "chuppys_ticket_select";

const TICKET_SELECT_IDS = new Set([
  "chuppys_ticket_select",
  "chuppys_ticket_category",
  "chuppys_tickets",
  "ticket_select",
  "ticket_category",
  "ticket_open",
  "ticket_create"
]);

const TICKET_FORM_PREFIX =
  "chuppys_ticket_form:";

const TICKET_CLOSE_MODAL_PREFIX =
  "chuppys_ticket_close_modal:";

const TICKET_BUTTON_IDS = {
  claim: "chuppys_ticket_claim",
  close: "chuppys_ticket_close",
  reopen: "chuppys_ticket_reopen",
  delete: "chuppys_ticket_delete"
};

const LEGACY_BUTTON_PREFIX =
  "chuppys_ticket:";

const LEGACY_TRANSCRIPT_PREFIX =
  "chuppys_transcript:";

// ==================================================
// PERSISTENT STORAGE IDENTIFIERS
// ==================================================

const STATE_PREFIX =
  "CHUPPYS_TICKET_STATE_V4:";

const OLD_STATE_PREFIXES = [
  "CHUPPYS_TICKET_STATE_V3:",
  "CHUPPYS_TICKET_STATE_V2:",
  "CHUPPYS_PRIVATE_TICKET_METADATA_V2:"
];

const GLOBAL_COUNTER_PREFIX =
  "CHUPPYS_GLOBAL_TICKET_COUNTER_V1:";

const OLD_COUNTER_PREFIX =
  "CHUPPYS_TICKET_COUNTERS_V1:";

const LEGACY_TOPIC_PREFIX =
  "chuppys-ticket:";

// ==================================================
// RUNTIME STORAGE
// ==================================================

const ticketCache = new Map();

let ticketQueue = Promise.resolve();

let storageLoaded = false;

let storageLoadPromise = null;

let globalCounterMessageId = null;

let globalCounterValue = null;

// ==================================================
// /TICKETPANEL COMMAND
// REQUIRED BY INDEX.JS
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
// GENERAL HELPERS
// ==================================================

function formatNumber(number) {
  return String(number).padStart(4, "0");
}

function makeTicketName(
  type,
  number,
  closed = false
) {
  return (
    `${closed ? "closed-" : ""}` +
    `${type}-${formatNumber(number)}`
  ).slice(0, 100);
}

function sanitize(text, maxLength = 1000) {
  return String(text ?? "")
    .replace(/@/g, "＠")
    .replace(/```/g, "'''")
    .slice(0, maxLength);
}

function makeTicketEmbed(
  title,
  description
) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(TICKET_COLOR)
    .setFooter({
      text: BRAND
    });
}

function makeLogEmbed(title) {
  return new EmbedBuilder()
    .setTitle(title)
    .setColor(LOG_COLOR)
    .setFooter({
      text: `${BRAND} | Ticket System`
    })
    .setTimestamp();
}

function runTicketQueue(callback) {
  const next = ticketQueue.then(callback);

  ticketQueue = next.catch(() => {});

  return next;
}

function roleCollectionHas(
  roles,
  roleId
) {
  if (roles?.cache) {
    return roles.cache.has(roleId);
  }

  if (Array.isArray(roles)) {
    return roles.includes(roleId);
  }

  return false;
}

function isTicketManager(interaction) {
  if (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    ) ||
    interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    )
  ) {
    return true;
  }

  return TICKET_MANAGER_ROLES.some(
    roleId =>
      roleCollectionHas(
        interaction.member?.roles,
        roleId
      )
  );
}

function canViewTranscript(interaction) {
  if (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return true;
  }

  return [
    OWNER_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ].some(
    roleId =>
      roleCollectionHas(
        interaction.member?.roles,
        roleId
      )
  );
}

async function respond(
  interaction,
  content
) {
  if (interaction.deferred) {
    return interaction.editReply({
      content
    });
  }

  if (interaction.replied) {
    return interaction.followUp({
      content,
      flags: EPHEMERAL
    });
  }

  return interaction.reply({
    content,
    flags: EPHEMERAL
  });
}

// ==================================================
// DISCORD USER INFORMATION
// ==================================================

async function getUserInformation(
  guild,
  userId
) {
  if (!userId) {
    return {
      id: "Unknown",
      username: "Unknown",
      displayName: "Unknown",
      mention: "Unknown"
    };
  }

  const member = await guild.members
    .fetch(userId)
    .catch(() => null);

  const user = member?.user ||
    await guild.client.users
      .fetch(userId)
      .catch(() => null);

  return {
    id: userId,

    username:
      user?.username || "Unknown",

    displayName:
      member?.displayName ||
      user?.globalName ||
      user?.username ||
      "Unknown",

    mention: `<@${userId}>`
  };
}

// ==================================================
// TICKETY-STYLE INFORMATION SECTIONS
// ==================================================

function creatorInformation(user) {
  return (
    `**Creator:** ${user.mention}\n` +
    `**Creator Username:** @${sanitize(user.username, 100)}\n` +
    `**Creator ID:** ${user.id}`
  );
}

function executorInformation(user) {
  return (
    `**Executor:** ${user.mention}\n` +
    `**Executor Username:** @${sanitize(user.username, 100)}\n` +
    `**Executor ID:** ${user.id}`
  );
}

// ==================================================
// TICKETY-STYLE LOG EMBEDS
// ==================================================

async function makeTicketEventLog(
  guild,
  state,
  executorId,
  event,
  reason = "Done"
) {
  const creator = await getUserInformation(
    guild,
    state.ownerId
  );

  const executor = await getUserInformation(
    guild,
    executorId
  );

  const eventTitles = {
    opened: "Ticket Opened",
    claimed: "Ticket Claimed",
    closed: "Ticket Closed",
    reopened: "Ticket Reopened",
    deleted: "Ticket Deleted"
  };

  const eventMessages = {
    opened: "opened a ticket.",
    claimed: "claimed a ticket.",
    closed: "closed a ticket.",
    reopened: "reopened a ticket.",
    deleted: "deleted a ticket."
  };

  const title =
    eventTitles[event] || "Ticket Updated";

  const action =
    eventMessages[event] || "updated a ticket.";

  const embed = makeLogEmbed(title);

  embed.setDescription(
    `${executor.mention} ${action}`
  );

  const ticketName =
    makeTicketName(
      state.type,
      state.number,
      event === "deleted"
    );

  const heading =
    event === "closed"
      ? "Close Information"
      : event === "deleted"
        ? "Delete Information"
        : event === "opened"
          ? "Open Information"
          : event === "claimed"
            ? "Claim Information"
            : "Reopen Information";

  const information = [
    `**Ticket Name:** ${ticketName}`,
    `**Ticket ID:** ${state.channelId}`,
    `**Ticket Number:** #${state.number}`,
    `**Category:** ${state.type}`
  ];

  if (
    event === "closed" ||
    event === "deleted"
  ) {
    information.push(
      `**Reason:** ${sanitize(reason, 500)}`
    );
  }

  embed.addFields(
    {
      name: heading,
      value: information.join("\n"),
      inline: false
    },

    {
      name: "Creator Information",
      value: creatorInformation(creator),
      inline: false
    },

    {
      name: "Executor Information",
      value: executorInformation(executor),
      inline: false
    }
  );

  return embed;
}

// ==================================================
// TRANSCRIPT LINK BUTTON
// ==================================================

function transcriptLinkButton(url) {
  return [
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel("View Transcript")
          .setStyle(ButtonStyle.Link)
          .setURL(url)
      )
  ];
}

// ==================================================
// TICKET CONTROL BUTTONS
// ==================================================

function ticketControlButtons(
  closed = false
) {
  const row = new ActionRowBuilder();

  if (closed) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(
          TICKET_BUTTON_IDS.reopen
        )
        .setLabel("Reopen")
        .setEmoji("🔓")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(
          TICKET_BUTTON_IDS.delete
        )
        .setLabel("Delete")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(
          TICKET_BUTTON_IDS.claim
        )
        .setLabel("Claim")
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(
          TICKET_BUTTON_IDS.close
        )
        .setLabel("Close")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );
  }

  return [row];
}

// ==================================================
// TICKET PANEL
// ==================================================

function ticketPanelPayload() {
  const dropdown =
    new StringSelectMenuBuilder()
      .setCustomId(TICKET_SELECT_ID)
      .setPlaceholder(
        "Select a ticket category"
      )
      .addOptions(
        Object.entries(TICKET_TYPES).map(
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
      makeTicketEmbed(
        `${TICKET_EMOJI} .gg/chuppys Tickets`,

        "Welcome to the Chuppys ticket system!\n\n" +
        "Please select the category that matches " +
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
      new ActionRowBuilder()
        .addComponents(dropdown)
    ],

    allowedMentions: {
      parse: []
    }
  };
}

// ==================================================
// CHANNEL FETCHING
// ==================================================

async function getTextChannel(
  guild,
  channelId,
  label
) {
  const channel =
    await guild.channels.fetch(channelId);

  if (
    !channel ||
    !channel.isTextBased() ||
    !channel.messages ||
    !channel.send
  ) {
    throw new Error(
      `${label} channel was not found ` +
      "or is not a text channel."
    );
  }

  return channel;
}

async function getLogChannel(guild) {
  return getTextChannel(
    guild,
    TICKET_LOG_CHANNEL_ID,
    "Ticket log"
  );
}

async function getTranscriptChannel(guild) {
  return getTextChannel(
    guild,
    TRANSCRIPT_CHANNEL_ID,
    "Ticket transcript"
  );
}

async function getDataChannel(guild) {
  return getTextChannel(
    guild,
    DATA_CHANNEL_ID,
    "Ticket data"
  );
}

// ==================================================
// MESSAGE SEARCH
// ==================================================

async function findMessage(
  channel,
  predicate,
  maxPages = 100
) {
  let before;

  for (
    let page = 0;
    page < maxPages;
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
      if (predicate(message)) {
        return message;
      }
    }

    if (batch.size < 100) {
      break;
    }

    before = batch.last().id;
  }

  return null;
}

// ==================================================
// METADATA PARSING
// ==================================================

function parseTicketState(message) {
  if (!message?.content) {
    return null;
  }

  const prefixes = [
    STATE_PREFIX,
    ...OLD_STATE_PREFIXES
  ];

  const prefix = prefixes.find(
    value =>
      message.content.startsWith(value)
  );

  if (!prefix) {
    return null;
  }

  try {
    return JSON.parse(
      message.content.slice(
        prefix.length
      )
    );
  } catch {
    return null;
  }
}

// ==================================================
// LOAD STORED TICKET DATA
// ==================================================

async function initializeTicketStorage(guild) {
  if (storageLoaded) {
    return;
  }

  if (storageLoadPromise) {
    return storageLoadPromise;
  }

  storageLoadPromise = (async () => {
    const dataChannel =
      await getDataChannel(guild);

    let before;

    for (
      let page = 0;
      page < 100;
      page++
    ) {
      const batch =
        await dataChannel.messages.fetch({
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
          message.author.id !==
          guild.client.user.id
        ) {
          continue;
        }

        if (
          message.content.startsWith(
            GLOBAL_COUNTER_PREFIX
          ) &&
          !globalCounterMessageId
        ) {
          const value = Number(
            message.content.slice(
              GLOBAL_COUNTER_PREFIX.length
            )
          );

          if (
            Number.isSafeInteger(value) &&
            value >= 0
          ) {
            globalCounterMessageId =
              message.id;

            globalCounterValue = value;
          }
        }

        const state =
          parseTicketState(message);

        if (
          state?.channelId &&
          !ticketCache.has(
            state.channelId
          )
        ) {
          ticketCache.set(
            state.channelId,
            {
              state,
              logMessageId: message.id
            }
          );
        }
      }

      if (batch.size < 100) {
        break;
      }

      before = batch.last().id;
    }

    storageLoaded = true;

    console.log(
      `[TICKETS] Loaded ${ticketCache.size} stored tickets.`
    );
  })();

  try {
    await storageLoadPromise;
  } finally {
    storageLoadPromise = null;
  }
}

// ==================================================
// GLOBAL TICKET COUNTER
// ==================================================

async function getGlobalTicketCounter(guild) {
  await initializeTicketStorage(guild);

  const dataChannel =
    await getDataChannel(guild);

  if (
    globalCounterMessageId !== null &&
    globalCounterValue !== null
  ) {
    const message =
      await dataChannel.messages
        .fetch(globalCounterMessageId)
        .catch(() => null);

    if (message) {
      return {
        message,
        number: globalCounterValue
      };
    }

    globalCounterMessageId = null;
    globalCounterValue = null;
  }

  let startingNumber = 0;

  // Preserve numbers from already stored tickets.

  for (
    const entry
    of ticketCache.values()
  ) {
    const number =
      Number(entry.state.number);

    if (
      Number.isSafeInteger(number) &&
      number >= 0
    ) {
      startingNumber = Math.max(
        startingNumber,
        number
      );
    }
  }

  // Migrate previous per-category counters.

  const oldCounter =
    await findMessage(
      dataChannel,
      message =>
        message.author.id ===
          guild.client.user.id &&
        message.content.startsWith(
          OLD_COUNTER_PREFIX
        )
    );

  if (oldCounter) {
    try {
      const oldValues =
        JSON.parse(
          oldCounter.content.slice(
            OLD_COUNTER_PREFIX.length
          )
        );

      const values = Object.values(
        oldValues
      )
        .map(Number)
        .filter(value =>
          Number.isSafeInteger(value) &&
          value >= 0
        );

      const previousTotal =
        values.reduce(
          (total, value) =>
            total + value,
          0
        );

      startingNumber = Math.max(
        startingNumber,
        previousTotal
      );

    } catch (error) {
      console.warn(
        "[TICKETS] Old counter migration failed:",
        error.message
      );
    }
  }

  // Preserve numbers from existing channels.

  await guild.channels.fetch();

  for (
    const channel
    of guild.channels.cache.values()
  ) {
    const match =
      channel.name?.match(
        /^(?:closed-)?(?:purchase|cashout|giveaway|partnership|support)-(\d+)$/
      );

    if (match) {
      startingNumber = Math.max(
        startingNumber,
        Number(match[1])
      );
    }
  }

  const message =
    await dataChannel.send({
      content:
        GLOBAL_COUNTER_PREFIX +
        startingNumber,

      allowedMentions: {
        parse: []
      }
    });

  globalCounterMessageId =
    message.id;

  globalCounterValue =
    startingNumber;

  return {
    message,
    number: startingNumber
  };
}

async function nextTicketNumber(guild) {
  const counter =
    await getGlobalTicketCounter(guild);

  const next =
    counter.number + 1;

  await counter.message.edit({
    content:
      GLOBAL_COUNTER_PREFIX + next
  });

  globalCounterValue = next;

  return next;
}

// ==================================================
// SAVE TICKET METADATA
// CHANNEL DESCRIPTIONS STAY BLANK
// ==================================================

async function saveTicketState(
  channel,
  entry
) {
  const dataChannel =
    await getDataChannel(
      channel.guild
    );

  const content =
    STATE_PREFIX +
    JSON.stringify(entry.state);

  let message = null;

  if (entry.logMessageId) {
    message =
      await dataChannel.messages
        .fetch(entry.logMessageId)
        .catch(() => null);
  }

  if (message) {
    await message.edit({
      content
    });
  } else {
    message =
      await dataChannel.send({
        content,

        allowedMentions: {
          parse: []
        }
      });

    entry.logMessageId =
      message.id;
  }

  ticketCache.set(
    channel.id,
    entry
  );

  return entry;
}

// ==================================================
// LOAD TICKET METADATA
// ==================================================

async function loadTicketState(channel) {
  await initializeTicketStorage(
    channel.guild
  );

  const cached =
    ticketCache.get(channel.id);

  if (cached) {
    if (channel.topic) {
      await channel
        .setTopic(null)
        .catch(() => {});
    }

    return cached;
  }

  // Search persistent storage in case this
  // ticket was not loaded in the initial scan.

  const dataChannel =
    await getDataChannel(
      channel.guild
    );

  const message =
    await findMessage(
      dataChannel,
      msg => {
        if (
          msg.author.id !==
          channel.client.user.id
        ) {
          return false;
        }

        const state =
          parseTicketState(msg);

        return (
          state?.channelId ===
          channel.id
        );
      }
    );

  const state =
    parseTicketState(message);

  if (state) {
    const entry = {
      state,
      logMessageId: message.id
    };

    ticketCache.set(
      channel.id,
      entry
    );

    if (channel.topic) {
      await channel
        .setTopic(null)
        .catch(() => {});
    }

    return entry;
  }

  // Older ticket implementations may
  // have stored metadata in the topic.

  if (channel.topic) {
    let oldState = null;

    try {
      if (
        channel.topic.startsWith(
          LEGACY_TOPIC_PREFIX
        )
      ) {
        oldState = JSON.parse(
          channel.topic.slice(
            LEGACY_TOPIC_PREFIX.length
          )
        );
      } else if (
        channel.topic.trim().startsWith("{")
      ) {
        oldState = JSON.parse(
          channel.topic
        );
      }
    } catch (_) {}

    if (
      oldState?.ownerId &&
      TICKET_TYPES[oldState.type]
    ) {
      const entry = {
        state: {
          channelId: channel.id,
          ownerId: oldState.ownerId,
          type: oldState.type,
          number: Number(
            oldState.number
          ),
          status:
            oldState.status || "open",
          claimedBy:
            oldState.claimedBy || null,
          controlMessageId:
            oldState.controlMessageId ||
            null,
          closeReason:
            oldState.closeReason ||
            "Done"
        },

        logMessageId: null
      };

      await saveTicketState(
        channel,
        entry
      );

      await channel.setTopic(null);

      return entry;
    }
  }

  return null;
}

// ==================================================
// CHECK FOR DUPLICATE OPEN TICKETS
// ==================================================

async function findOpenTicket(
  guild,
  userId,
  type
) {
  await initializeTicketStorage(guild);

  for (
    const entry
    of ticketCache.values()
  ) {
    if (
      entry.state.ownerId !== userId ||
      entry.state.type !== type ||
      entry.state.status === "closed"
    ) {
      continue;
    }

    const channel =
      await guild.channels
        .fetch(entry.state.channelId)
        .catch(() => null);

    if (channel) {
      return channel;
    }
  }

  return null;
}

// ==================================================
// TICKET CATEGORY CREATION
// ==================================================

async function getTicketCategory(
  guild,
  type
) {
  const settings =
    TICKET_TYPES[type];

  const configuredId =
    process.env[settings.categoryEnv];

  if (configuredId) {
    const category =
      await guild.channels.fetch(
        configuredId
      );

    if (
      !category ||
      category.type !==
        ChannelType.GuildCategory
    ) {
      throw new Error(
        `${settings.categoryEnv} must be a valid category ID.`
      );
    }

    return category;
  }

  await guild.channels.fetch();

  const existing =
    guild.channels.cache.find(
      channel =>
        channel.type ===
          ChannelType.GuildCategory &&
        channel.name ===
          `chuppys-${type}`
    );

  if (existing) {
    return existing;
  }

  const allowedRoles =
    TICKET_ACCESS[type].filter(
      id => guild.roles.cache.has(id)
    );

  return guild.channels.create({
    name: `chuppys-${type}`,

    type:
      ChannelType.GuildCategory,

    permissionOverwrites: [
      {
        id:
          guild.roles.everyone.id,

        deny: [
          PermissionFlagsBits.ViewChannel
        ]
      },

      ...allowedRoles.map(
        roleId => ({
          id: roleId,

          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.SendMessages
          ]
        })
      )
    ]
  });
}

// ==================================================
// PURCHASE / CASHOUT FORM
// ==================================================

function makeTicketForm(type) {
  const settings =
    TICKET_TYPES[type];

  const modal = new ModalBuilder()
    .setCustomId(
      TICKET_FORM_PREFIX + type
    )
    .setTitle(
      `${settings.name} Ticket`
    );

  settings.questions.forEach(
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

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(input)
      );
    }
  );

  return modal;
}

// ==================================================
// CLOSE REASON FORM
// ==================================================

function makeCloseReasonModal(channelId) {
  const modal =
    new ModalBuilder()
      .setCustomId(
        TICKET_CLOSE_MODAL_PREFIX +
        channelId
      )
      .setTitle("Close Ticket");

  const reason =
    new TextInputBuilder()
      .setCustomId(
        "ticket_close_reason"
      )
      .setLabel(
        "Reason for closing this ticket"
      )
      .setPlaceholder(
        "Done"
      )
      .setStyle(
        TextInputStyle.Paragraph
      )
      .setRequired(false)
      .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder()
      .addComponents(reason)
  );

  return modal;
}

// ==================================================
// SEND TICKET LOG
// ==================================================

async function sendTicketLog(
  guild,
  state,
  executorId,
  event,
  reason = "Done",
  transcriptUrl = null
) {
  const logChannel =
    await getLogChannel(guild);

  const embed =
    await makeTicketEventLog(
      guild,
      state,
      executorId,
      event,
      reason
    );

  if (transcriptUrl) {
    embed.addFields({
      name: "Transcript",
      value:
        "Press **View Transcript** " +
        "to access the conversation.",
      inline: false
    });
  }

  return logChannel.send({
    embeds: [embed],

    components:
      transcriptUrl
        ? transcriptLinkButton(
            transcriptUrl
          )
        : [],

    allowedMentions: {
      parse: []
    }
  });
}

// ==================================================
// CREATE TICKET
// ==================================================

async function createTicket(
  interaction,
  type,
  answers = []
) {
  return runTicketQueue(
    async () => {
      const guild =
        interaction.guild;

      const settings =
        TICKET_TYPES[type];

      if (!settings) {
        throw new Error(
          "Invalid ticket category."
        );
      }

      const existing =
        await findOpenTicket(
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

      const category =
        await getTicketCategory(
          guild,
          type
        );

      const number =
        await nextTicketNumber(
          guild
        );

      const allowedRoles =
        TICKET_ACCESS[type].filter(
          id =>
            guild.roles.cache.has(id)
        );

      const overwrites = [
        {
          id:
            guild.roles.everyone.id,

          deny: [
            PermissionFlagsBits.ViewChannel
          ]
        },

        {
          id:
            interaction.user.id,

          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        },

        {
          id:
            guild.client.user.id,

          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages
          ]
        },

        ...allowedRoles.map(
          roleId => ({
            id: roleId,

            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory,
              PermissionFlagsBits.AttachFiles
            ]
          })
        )
      ];

      const channel =
        await guild.channels.create({
          name:
            makeTicketName(
              type,
              number
            ),

          type:
            ChannelType.GuildText,

          parent:
            category.id,

          // Ticket description is blank.
          topic: null,

          permissionOverwrites:
            overwrites,

          reason:
            `Ticket opened by ${interaction.user.id}`
        });

      const state = {
        channelId:
          channel.id,

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
          null
      };

      const entry = {
        state,
        logMessageId: null
      };

      await saveTicketState(
        channel,
        entry
      );

      let details =
        settings.description;

      if (
        settings.questions &&
        answers.length
      ) {
        details =
          settings.questions
            .map(
              (question, index) =>
                `**${question}**\n` +
                sanitize(
                  answers[index],
                  250
                )
            )
            .join("\n\n");
      }

      const pingRoles =
        TICKET_PINGS[type];

      const content = [
        `<@${interaction.user.id}>`,

        ...pingRoles.map(
          roleId =>
            `<@&${roleId}>`
        )
      ].join(" ");

      const welcome =
        await channel.send({
          content,

          embeds: [
            makeTicketEmbed(
              `${TICKET_EMOJI} ${settings.name} Ticket #${formatNumber(number)}`,

              `Welcome <@${interaction.user.id}>!\n\n` +
              `${details}\n\n` +
              "Please wait for a member of our team."
            )
          ],

          components:
            ticketControlButtons(),

          allowedMentions: {
            users: [
              interaction.user.id
            ],

            roles:
              pingRoles.filter(
                id =>
                  guild.roles.cache.has(id)
              ),

            parse: []
          }
        });

      state.controlMessageId =
        welcome.id;

      await saveTicketState(
        channel,
        entry
      );

      await sendTicketLog(
        guild,
        state,
        interaction.user.id,
        "opened"
      );

      return {
        channel,
        existing: false
      };
    }
  );
}

// ==================================================
// UPDATE TICKET BUTTONS
// ==================================================

async function updateTicketControls(
  channel,
  state
) {
  if (
    !state.controlMessageId
  ) {
    return;
  }

  const message =
    await channel.messages
      .fetch(
        state.controlMessageId
      )
      .catch(() => null);

  if (message) {
    await message.edit({
      components:
        ticketControlButtons(
          state.status === "closed"
        )
    });
  }
}

// ==================================================
// FETCH ENTIRE TICKET CONVERSATION
// ==================================================

async function fetchAllTicketMessages(
  channel
) {
  const messages = [];

  let before;

  while (true) {
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

// ==================================================
// CREATE TRANSCRIPT TEXT
// ==================================================

async function buildTranscript(
  channel,
  state
) {
  const messages =
    await fetchAllTicketMessages(
      channel
    );

  const lines = [
    "CHUPPYS TICKET TRANSCRIPT",
    "==========================================",
    `Ticket: ${channel.name}`,
    `Ticket Number: #${state.number}`,
    `Ticket ID: ${channel.id}`,
    `Category: ${state.type}`,
    `Creator ID: ${state.ownerId}`,
    `Status: ${state.status}`,
    `Generated: ${new Date().toISOString()}`,
    `Messages: ${messages.length}`,
    "==========================================",
    ""
  ];

  for (
    const message
    of messages
  ) {
    const date =
      new Date(
        message.createdTimestamp
      ).toISOString();

    const username =
      message.author?.username ||
      "Unknown";

    const userId =
      message.author?.id ||
      "Unknown";

    lines.push(
      `[${date}] ${username} (${userId})`
    );

    if (message.content) {
      lines.push(
        message.content
      );
    }

    for (
      const item
      of message.embeds
    ) {
      lines.push(
        "[EMBED]"
      );

      if (item.title) {
        lines.push(
          `Title: ${item.title}`
        );
      }

      if (item.description) {
        lines.push(
          item.description
        );
      }

      for (
        const field
        of item.fields || []
      ) {
        lines.push(
          `${field.name}: ${field.value}`
        );
      }
    }

    for (
      const file
      of message.attachments.values()
    ) {
      lines.push(
        `[ATTACHMENT] ${file.name}`
      );

      lines.push(
        file.url
      );
    }

    lines.push("");
    lines.push("------------------------------------------");
    lines.push("");
  }

  const filename =
    `transcript-${state.type}-${state.number}.txt`;

  return {
    filename,

    buffer:
      Buffer.from(
        lines.join("\n"),
        "utf8"
      ),

    messageCount:
      messages.length
  };
}

// ==================================================
// SAVE TRANSCRIPT PRIVATELY
// ==================================================

async function saveTranscript(
  channel,
  state
) {
  const transcriptChannel =
    await getTranscriptChannel(
      channel.guild
    );

  const transcript =
    await buildTranscript(
      channel,
      state
    );

  const attachment =
    new AttachmentBuilder(
      transcript.buffer,
      {
        name:
          transcript.filename
      }
    );

  const saved =
    await transcriptChannel.send({
      content:
        `Transcript for **${channel.name}** ` +
        `| Ticket #${state.number} ` +
        `| Creator ID: ${state.ownerId}`,

      files: [
        attachment
      ],

      allowedMentions: {
        parse: []
      }
    });

  // Using the saved Discord message link
  // keeps the link stable even if Discord
  // rotates temporary attachment URLs.

  return {
    message:
      saved,

    url:
      saved.url,

    messageCount:
      transcript.messageCount
  };
}

// ==================================================
// CLAIM TICKET
// ==================================================

async function claimTicket(
  interaction,
  channel,
  entry
) {
  const state =
    entry.state;

  if (
    state.status === "closed"
  ) {
    return respond(
      interaction,
      "Reopen this ticket before claiming it."
    );
  }

  if (
    state.claimedBy &&
    state.claimedBy !==
      interaction.user.id
  ) {
    return respond(
      interaction,
      `This ticket is already claimed by <@${state.claimedBy}>.`
    );
  }

  if (
    state.claimedBy ===
    interaction.user.id
  ) {
    return respond(
      interaction,
      "You already claimed this ticket."
    );
  }

  state.claimedBy =
    interaction.user.id;

  await saveTicketState(
    channel,
    entry
  );

  await channel.send({
    embeds: [
      makeTicketEmbed(
        "Ticket Claimed",

        `This ticket has been claimed by <@${interaction.user.id}>.`
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  await sendTicketLog(
    channel.guild,
    state,
    interaction.user.id,
    "claimed"
  );

  return respond(
    interaction,
    "Ticket claimed successfully."
  );
}

// ==================================================
// CLOSE TICKET
// ==================================================

async function closeTicket(
  interaction,
  channel,
  entry,
  reason
) {
  const state =
    entry.state;

  if (
    state.status === "closed"
  ) {
    return respond(
      interaction,
      "This ticket is already closed."
    );
  }

  // Save the original conversation
  // before changing the ticket state.

  const transcript =
    await saveTranscript(
      channel,
      state
    );

  await channel.permissionOverwrites.edit(
    state.ownerId,
    {
      ViewChannel: true,
      SendMessages: false,
      ReadMessageHistory: true,
      AttachFiles: false
    }
  );

  state.status =
    "closed";

  state.closeReason =
    reason || "Done";

  await saveTicketState(
    channel,
    entry
  );

  await channel.setName(
    makeTicketName(
      state.type,
      state.number,
      true
    )
  );

  await channel.setTopic(null);

  await updateTicketControls(
    channel,
    state
  );

  await channel.send({
    embeds: [
      makeTicketEmbed(
        `${TICKET_EMOJI} Ticket Closed`,

        `This ticket was closed by <@${interaction.user.id}>.\n\n` +
        `**Reason:** ${sanitize(state.closeReason, 500)}\n\n` +
        "Staff can reopen or delete this ticket."
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  // Tickety-style log and link button.

  await sendTicketLog(
    channel.guild,
    state,
    interaction.user.id,
    "closed",
    state.closeReason,
    transcript.url
  );

  return respond(
    interaction,
    "Ticket closed successfully."
  );
}

// ==================================================
// REOPEN TICKET
// ==================================================

async function reopenTicket(
  interaction,
  channel,
  entry
) {
  const state =
    entry.state;

  if (
    state.status !== "closed"
  ) {
    return respond(
      interaction,
      "This ticket is already open."
    );
  }

  await channel.permissionOverwrites.edit(
    state.ownerId,
    {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true
    }
  );

  state.status =
    "open";

  await saveTicketState(
    channel,
    entry
  );

  await channel.setName(
    makeTicketName(
      state.type,
      state.number
    )
  );

  await channel.setTopic(null);

  await updateTicketControls(
    channel,
    state
  );

  await channel.send({
    embeds: [
      makeTicketEmbed(
        `${TICKET_EMOJI} Ticket Reopened`,

        `This ticket was reopened by <@${interaction.user.id}>.`
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  await sendTicketLog(
    channel.guild,
    state,
    interaction.user.id,
    "reopened"
  );

  return respond(
    interaction,
    "Ticket reopened successfully."
  );
}

// ==================================================
// DELETE TICKET
// ==================================================

async function deleteTicket(
  interaction,
  channel,
  entry
) {
  const state =
    entry.state;

  if (
    state.status !== "closed"
  ) {
    return respond(
      interaction,
      "Close the ticket before deleting it."
    );
  }

  // Save final transcript.
  // This includes messages added after closing.

  const transcript =
    await saveTranscript(
      channel,
      state
    );

  // Tickety-style deletion log.

  await sendTicketLog(
    channel.guild,
    state,
    interaction.user.id,
    "deleted",
    state.closeReason || "Done",
    transcript.url
  );

  await respond(
    interaction,
    "Transcript saved. Deleting ticket..."
  );

  ticketCache.delete(
    channel.id
  );

  await channel.delete(
    `Ticket deleted by ${interaction.user.id}`
  );
}

// ==================================================
// HANDLE TICKET BUTTONS
// ==================================================

async function handleTicketAction(
  interaction,
  action
) {
  if (
    !isTicketManager(interaction)
  ) {
    return respond(
      interaction,
      "Only authorized ticket staff can manage tickets."
    );
  }

  const channel =
    interaction.channel;

  const entry =
    await loadTicketState(
      channel
    );

  if (!entry) {
    return respond(
      interaction,
      "This channel is not a recognized Chuppys ticket."
    );
  }

  if (action === "claim") {
    return claimTicket(
      interaction,
      channel,
      entry
    );
  }

  if (action === "close") {
    // Close opens a modal rather than
    // immediately closing the ticket.

    if (
      entry.state.status === "closed"
    ) {
      return respond(
        interaction,
        "This ticket is already closed."
      );
    }

    return interaction.showModal(
      makeCloseReasonModal(
        channel.id
      )
    );
  }

  if (action === "reopen") {
    await interaction.deferReply({
      flags: EPHEMERAL
    });

    return reopenTicket(
      interaction,
      channel,
      entry
    );
  }

  if (action === "delete") {
    await interaction.deferReply({
      flags: EPHEMERAL
    });

    return deleteTicket(
      interaction,
      channel,
      entry
    );
  }

  return respond(
    interaction,
    "Unknown ticket action."
  );
}

// ==================================================
// HANDLE CLOSE REASON SUBMISSION
// ==================================================

async function handleCloseModal(
  interaction
) {
  if (
    !isTicketManager(interaction)
  ) {
    return respond(
      interaction,
      "Only authorized ticket staff can close tickets."
    );
  }

  const channelId =
    interaction.customId.slice(
      TICKET_CLOSE_MODAL_PREFIX.length
    );

  if (
    channelId !== interaction.channelId
  ) {
    return respond(
      interaction,
      "This close form belongs to a different ticket."
    );
  }

  const entry =
    await loadTicketState(
      interaction.channel
    );

  if (!entry) {
    return respond(
      interaction,
      "Ticket data could not be found."
    );
  }

  const reason =
    interaction.fields
      .getTextInputValue(
        "ticket_close_reason"
      )
      .trim() || "Done";

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return closeTicket(
    interaction,
    interaction.channel,
    entry,
    reason
  );
}

// ==================================================
// LEGACY TRANSCRIPT BUTTON
// ==================================================

async function handleLegacyTranscript(
  interaction
) {
  if (
    !canViewTranscript(interaction)
  ) {
    return respond(
      interaction,
      "Only authorized ticket staff can view transcripts."
    );
  }

  const message =
    interaction.message;

  const attachment =
    message.attachments.find(
      file =>
        file.name?.startsWith(
          "transcript-"
        ) &&
        file.name?.endsWith(".txt")
    );

  if (!attachment) {
    return respond(
      interaction,
      "The transcript attachment could not be found."
    );
  }

  return respond(
    interaction,
    `**View Transcript**\n${message.url}`
  );
}

// ==================================================
// HANDLE /TICKETPANEL
// ==================================================

async function handleTicketPanel(
  interaction
) {
  if (
    !isTicketManager(interaction)
  ) {
    return respond(
      interaction,
      "You need staff permissions to update the ticket panel."
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const channel =
    await interaction.guild.channels.fetch(
      TICKET_PANEL_CHANNEL_ID
    );

  if (
    !channel ||
    !channel.isTextBased() ||
    !channel.messages
  ) {
    throw new Error(
      "Ticket panel channel could not be found."
    );
  }

  const existing =
    await findMessage(
      channel,
      message =>
        message.author.id ===
          interaction.client.user.id &&
        message.components.some(
          row =>
            row.components.some(
              component =>
                TICKET_SELECT_IDS.has(
                  component.customId
                )
            )
        ),
      2
    );

  if (existing) {
    await existing.edit(
      ticketPanelPayload()
    );

    return respond(
      interaction,
      `Ticket panel updated in <#${TICKET_PANEL_CHANNEL_ID}>.`
    );
  }

  await channel.send(
    ticketPanelPayload()
  );

  return respond(
    interaction,
    `Ticket panel posted in <#${TICKET_PANEL_CHANNEL_ID}>.`
  );
}

// ==================================================
// HANDLE TICKET DROPDOWN
// ==================================================

async function handleTicketSelect(
  interaction
) {
  const type =
    String(
      interaction.values[0] || ""
    ).toLowerCase();

  const settings =
    TICKET_TYPES[type];

  if (!settings) {
    return respond(
      interaction,
      "Please select a valid ticket category."
    );
  }

  if (settings.questions) {
    return interaction.showModal(
      makeTicketForm(type)
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

  if (result.existing) {
    return respond(
      interaction,
      `You already have an open **${settings.name}** ticket: ${result.channel}`
    );
  }

  return respond(
    interaction,
    `${TICKET_EMOJI} Your **${settings.name}** ticket has been created!\n\n${result.channel}`
  );
}

// ==================================================
// HANDLE PURCHASE / CASHOUT FORM
// ==================================================

async function handleTicketForm(
  interaction
) {
  const type =
    interaction.customId.slice(
      TICKET_FORM_PREFIX.length
    );

  const settings =
    TICKET_TYPES[type];

  if (
    !settings?.questions
  ) {
    return respond(
      interaction,
      "Invalid ticket form."
    );
  }

  const answers =
    settings.questions.map(
      (_, index) =>
        interaction.fields
          .getTextInputValue(
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

  if (result.existing) {
    return respond(
      interaction,
      `You already have an open **${settings.name}** ticket: ${result.channel}`
    );
  }

  return respond(
    interaction,
    `${TICKET_EMOJI} Your **${settings.name}** ticket has been created!\n\n${result.channel}`
  );
}

// ==================================================
// DETERMINE BUTTON ACTION
// ==================================================

function getTicketAction(customId) {
  for (
    const [action, id]
    of Object.entries(
      TICKET_BUTTON_IDS
    )
  ) {
    if (customId === id) {
      return action;
    }
  }

  if (
    customId.startsWith(
      LEGACY_BUTTON_PREFIX
    )
  ) {
    const action =
      customId.slice(
        LEGACY_BUTTON_PREFIX.length
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

// ==================================================
// INSTALL CHUPPYS TICKET SYSTEM
// ==================================================

function setupTickets(client) {
  if (
    client.__chuppysTicketsInstalled
  ) {
    return;
  }

  client.__chuppysTicketsInstalled =
    true;

  console.log(
    "[TICKETS] Installing Chuppys Render ticket system..."
  );

  // ================================================
  // INITIAL STORAGE LOAD
  // ================================================

  client.once(
    Events.ClientReady,
    async () => {
      try {
        const guildId =
          process.env.DISCORD_GUILD_ID;

        if (!guildId) {
          console.warn(
            "[TICKETS] DISCORD_GUILD_ID is missing."
          );

          return;
        }

        const guild =
          await client.guilds.fetch(
            guildId
          );

        await initializeTicketStorage(
          guild
        );

        console.log(
          "[TICKETS] Storage initialized."
        );

      } catch (error) {
        console.error(
          "[TICKETS] Storage initialization failed:",
          error
        );
      }
    }
  );

  // ================================================
  // INTERACTION HANDLER
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
        TICKET_SELECT_IDS.has(
          interaction.customId
        );

      const isTicketForm =
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(
          TICKET_FORM_PREFIX
        );

      const isCloseModal =
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(
          TICKET_CLOSE_MODAL_PREFIX
        );

      const action =
        interaction.isButton()
          ? getTicketAction(
              interaction.customId
            )
          : null;

      const isLegacyTranscript =
        interaction.isButton() &&
        interaction.customId.startsWith(
          LEGACY_TRANSCRIPT_PREFIX
        );

      if (
        !isPanel &&
        !isSelect &&
        !isTicketForm &&
        !isCloseModal &&
        !action &&
        !isLegacyTranscript
      ) {
        return;
      }

      try {
        if (
          !interaction.inGuild()
        ) {
          return respond(
            interaction,
            "Tickets are only available inside the server."
          );
        }

        // ========================================
        // /TICKETPANEL
        // ========================================

        if (isPanel) {
          return handleTicketPanel(
            interaction
          );
        }

        // ========================================
        // TICKET DROPDOWN
        // ========================================

        if (isSelect) {
          return handleTicketSelect(
            interaction
          );
        }

        // ========================================
        // PURCHASE / CASHOUT MODAL
        // ========================================

        if (isTicketForm) {
          return handleTicketForm(
            interaction
          );
        }

        // ========================================
        // CLOSE REASON MODAL
        // ========================================

        if (isCloseModal) {
          return handleCloseModal(
            interaction
          );
        }

        // ========================================
        // LEGACY TRANSCRIPT BUTTON
        // ========================================

        if (isLegacyTranscript) {
          await interaction.deferReply({
            flags: EPHEMERAL
          });

          return handleLegacyTranscript(
            interaction
          );
        }

        // ========================================
        // TICKET BUTTONS
        // ========================================

        if (action) {
          if (
            action === "close"
          ) {
            return handleTicketAction(
              interaction,
              action
            );
          }

          await interaction.deferReply({
            flags: EPHEMERAL
          });

          return handleTicketAction(
            interaction,
            action
          );
        }

      } catch (error) {
        console.error(
          "[TICKETS] Interaction error:",
          error
        );

        await respond(
          interaction,
          `Ticket error: ${error.message}`
        ).catch(
          console.error
        );
      }
    }
  );

  console.log(
    "[TICKETS] Chuppys ticket system installed."
  );
}

// ==================================================
// EXPORTS
// MATCHES YOUR EXISTING INDEX.JS
// ==================================================

module.exports =
  setupTickets;

module.exports.command =
  command;
