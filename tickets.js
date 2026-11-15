
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
// ,forceclaim  - OWNER ONLY
// ,close
// ,close reason here
// ,reopen
// ,delete
//
// FEATURES:
// - Purchase, Cashout, Giveaway, Partnership, Support
// - Sellers can claim Purchase and Cashout
// - Other sellers lose access after claim
// - Buyer, exact claimer, Owner and Mod retain access
// - Owner-only forceclaim overrides an existing claim
// - One permanent white Ticket Closed embed
// - Simple white Opened / Claimed / Closed / Deleted logs
// - Closing message never mentions transcripts or ,delete
// - Existing counter and metadata preserved
// - Existing ticket category synchronization
// - No duplicate category creation
// - Private HTML transcripts
//
// IMPORTANT:
// Enable Message Content Intent.
// Bot needs Manage Channels and Manage Roles.
// Run only ONE Render bot instance.
// Remove older duplicate ticket handlers.
// Administrator permission bypasses channel privacy.
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
// CHANNEL AND ROLE IDS
// ============================================================

const IDS = Object.freeze({
  panel: "1530811385678790716",

  logs: "1570913954333728808",

  transcripts: "1571112508922531870",

  data: "1571112668037644388",

  // Original Owner USER ID.
  // Also supports this ID if it belongs to a role.
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
const WHITE = 0xffffff;
const EPHEMERAL = MessageFlags.Ephemeral;

// ============================================================
// EXISTING STORAGE PREFIXES — DO NOT CHANGE
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

const FORM_PREFIX = "chuppys_ticket_form:";
const CLOSE_PREFIX = "chuppys_ticket_close_modal:";

const BUTTONS = {
  claim: "chuppys_ticket_claim",
  close: "chuppys_ticket_close",
  reopen: "chuppys_ticket_reopen",
  delete: "chuppys_ticket_delete"
};

// ============================================================
// TICKET TYPES
// ============================================================

const TYPES = {
  purchase: {
    label: "Purchase",
    env: "PURCHASE_TICKET_CATEGORY_ID",
    categories: [
      "Purchasing tickets",
      "Purchase tickets"
    ],
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
    categories: ["Giveaway tickets"],
    description:
      "Explain the giveaway you won."
  },

  partnership: {
    label: "Partnership",
    env: "PARTNERSHIP_TICKET_CATEGORY_ID",
    categories: ["Partnership tickets"],
    description:
      "Explain your partnership request."
  },

  support: {
    label: "Support",
    env: "SUPPORT_TICKET_CATEGORY_ID",
    categories: ["Support tickets"],
    description:
      "Explain what you need help with."
  }
};

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

const states = new Map();

let readyPromise = null;
let readyDone = false;
let counter = 0;
let counterMessageId = null;
let queue = Promise.resolve();

// ============================================================
// SERIAL QUEUE
// ============================================================

const serialized = action => {
  const run = queue.then(action);
  queue = run.catch(() => {});
  return run;
};

// ============================================================
// HELPERS
// ============================================================

function clean(value, max = 800) {
  return String(value ?? "")
    .replace(/@/g, "＠")
    .replace(/```/g, "''' ")
    .slice(0, max);
}

function escapeHtml(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]
  );
}

function nameOf(type, number, closed = false) {
  return (
    `${closed ? "closed-" : ""}` +
    `${type}-${String(number).padStart(4, "0")}`
  );
}

function parseName(name) {
  const match = String(name || "").match(
    /^(closed-)?(purchase|purchasing|cashout|cash-out|giveaway|partnership|support)-(\d+)$/i
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

async function getText(guild, id, description) {
  const channel = await guild.channels.fetch(id);

  if (
    !channel?.isTextBased() ||
    !channel.messages?.fetch ||
    !channel.send
  ) {
    throw new Error(
      `${description} channel missing or inaccessible (${id}).`
    );
  }

  return channel;
}

// ============================================================
// MEMBER AND ROLE PERMISSIONS
// ============================================================

function getRole(member, id) {
  return Boolean(
    member?.roles?.cache?.has(id)
  );
}

async function currentMember(context) {
  if (
    !context.guild ||
    !context.user?.id
  ) {
    throw new Error(
      "Guild member unavailable."
    );
  }

  return context.guild.members.fetch({
    user: context.user.id,
    force: true
  });
}

// ============================================================
// OWNER CHECK
// ============================================================
//
// Supports:
// - Configured Owner user ID
// - Actual Discord server owner
// - Configured Owner role ID
//
// Only these users can use ,forceclaim.
//
// ============================================================

function isOwner(member) {
  if (!member) return false;

  return (
    member.id === IDS.owner ||
    member.id === member.guild.ownerId ||
    getRole(member, IDS.owner)
  );
}

function isMod(member) {
  return getRole(member, IDS.mod);
}

// ============================================================
// CLAIM AUTHORIZATION
// ============================================================
//
// PURCHASE / CASHOUT:
// Seller role can claim.
//
// OTHER TICKETS:
// Support or Admin role can claim.
//
// Owner and Mod can claim any ticket.
//
// ============================================================

function canClaim(member, state) {
  if (
    isOwner(member) ||
    isMod(member)
  ) {
    return true;
  }

  if (
    state.type === "purchase" ||
    state.type === "cashout"
  ) {
    return getRole(
      member,
      IDS.seller
    );
  }

  return (
    getRole(member, IDS.support) ||
    getRole(member, IDS.admin)
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
// REPLIES
// ============================================================

async function reply(context, text) {
  if (context.kind === "prefix") {
    return context.message.reply({
      content: text,
      allowedMentions: {
        parse: [],
        repliedUser: false
      }
    });
  }

  if (context.deferred) {
    return context.editReply({
      content: text
    });
  }

  if (context.replied) {
    return context.followUp({
      content: text,
      flags: EPHEMERAL
    });
  }

  return context.reply({
    content: text,
    flags: EPHEMERAL
  });
}

// ============================================================
// TICKET BUTTONS
// ============================================================

function buttons(state) {
  const row = new ActionRowBuilder();

  if (state.status === "closed") {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTONS.reopen)
        .setLabel("Reopen")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(BUTTONS.delete)
        .setLabel("Delete")
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
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(BUTTONS.close)
        .setLabel("Close")
        .setStyle(ButtonStyle.Danger)
    );
  }

  return [row];
}

// ============================================================
// TICKET PANEL
// ============================================================

function panelPayload() {
  const select =
    new StringSelectMenuBuilder()
      .setCustomId(SELECT_ID)
      .setPlaceholder(
        "Select a ticket category"
      )
      .addOptions(
        Object.entries(TYPES).map(
          ([value, settings]) => ({
            value,
            label: settings.label,
            description:
              `Open a ${settings.label} ticket`
          })
        )
      );

  return {
    embeds: [
      whiteEmbed(
        "Chuppys Tickets",

        "Select the category you need below.\n\n" +

        "**Purchase** · **Cash Out** · " +
        "**Giveaway** · **Partnership** · **Support**"
      )
    ],

    components: [
      new ActionRowBuilder()
        .addComponents(select)
    ],

    allowedMentions: {
      parse: []
    }
  };
}

// ============================================================
// NORMALIZE SAVED TICKET DATA
// ============================================================

function normalized(data) {
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

function parseState(message) {
  const content =
    message?.content || "";

  const prefix = [
    STATE_PREFIX,
    ...LEGACY_PREFIXES
  ].find(
    value => content.startsWith(value)
  );

  if (!prefix) return null;

  try {
    return normalized(
      JSON.parse(
        content.slice(prefix.length)
      )
    );
  } catch {
    return null;
  }
}

// ============================================================
// SCAN STORAGE MESSAGES
// ============================================================

async function scan(
  channel,
  consumer,
  maxPages = 200
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

        ...(before ? { before } : {})
      });

    if (!batch.size) return;

    for (const message of batch.values()) {
      await consumer(message);
    }

    if (batch.size < 100) return;

    before = batch.last().id;
  }

  console.warn(
    `[TICKETS] Storage scan limit reached in ${channel.id}`
  );
}

// ============================================================
// SAVE TICKET STATE
// ============================================================

async function saveState(channel, entry) {
  const storage = await getText(
    channel.guild,
    IDS.data,
    "Ticket metadata"
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

  states.set(channel.id, entry);
}

// ============================================================
// INITIALIZE EXISTING STORAGE
// ============================================================

async function init(guild) {
  if (readyDone) return;

  if (readyPromise) {
    return readyPromise;
  }

  readyPromise = (async () => {
    const storage = await getText(
      guild,
      IDS.data,
      "Ticket metadata"
    );

    const logs = await getText(
      guild,
      IDS.logs,
      "Ticket logs"
    );

    let highest = 0;
    let foundCounter = null;

    function consume(message, inData) {
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
          states.get(state.channelId);

        if (
          !existing ||
          (
            inData &&
            !existing.storageMessageId
          )
        ) {
          states.set(state.channelId, {
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

          if (inData && !foundCounter) {
            foundCounter = message;
          }
        }
      }

      if (
        message.content.startsWith(
          OLD_COUNTER_PREFIX
        )
      ) {
        try {
          const values = Object.values(
            JSON.parse(
              message.content.slice(
                OLD_COUNTER_PREFIX.length
              )
            )
          );

          highest = Math.max(
            highest,

            values
              .map(Number)
              .filter(Number.isSafeInteger)
              .reduce(
                (a, b) => a + b,
                0
              )
          );
        } catch {
          // Legacy counter unavailable.
        }
      }
    }

    await scan(
      storage,
      message => consume(message, true)
    );

    if (logs.id !== storage.id) {
      await scan(
        logs,
        message => consume(message, false)
      );
    }

    await guild.channels.fetch();

    for (
      const channel of
      guild.channels.cache.values()
    ) {
      const parsed = parseName(channel.name);

      if (parsed) {
        highest = Math.max(
          highest,
          parsed.number
        );
      }
    }

    counter = highest;

    if (foundCounter) {
      counterMessageId = foundCounter.id;

      const stored = Number(
        foundCounter.content.slice(
          COUNTER_PREFIX.length
        )
      );

      if (stored < counter) {
        await foundCounter.edit({
          content:
            COUNTER_PREFIX + counter
        });
      }
    } else {
      const message = await storage.send({
        content:
          COUNTER_PREFIX + counter
      });

      counterMessageId = message.id;
    }

    // Migrate older valid records
    // into the current data channel.

    for (const [id, entry] of states) {
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
        await saveState(
          channel,
          entry
        );
      }
    }

    readyDone = true;

    console.log(
      `[TICKETS] Loaded ${states.size} tickets, highest #${counter}`
    );
  })();

  try {
    await readyPromise;
  } finally {
    readyPromise = null;
  }
}

// ============================================================
// NEXT TICKET NUMBER
// ============================================================

async function nextNumber(guild) {
  await init(guild);

  const storage = await getText(
    guild,
    IDS.data,
    "Ticket metadata"
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

  counter = Math.max(
    counter,

    Number.isSafeInteger(stored)
      ? stored
      : 0
  );

  await message.edit({
    content:
      COUNTER_PREFIX + (counter + 1)
  });

  return ++counter;
}

// ============================================================
// LEGACY TOPIC RECOVERY
// ============================================================

function legacyTopic(channel) {
  if (!channel.topic) return null;

  try {
    const topic =
      channel.topic.startsWith(
        "chuppys-ticket:"
      )
        ? channel.topic.slice(
            "chuppys-ticket:".length
          )
        : channel.topic;

    return normalized({
      ...JSON.parse(topic),

      channelId: channel.id
    });
  } catch {
    return null;
  }
}

// ============================================================
// EXISTING WELCOME MESSAGE RECOVERY
// ============================================================

function oldWelcome(
  message,
  parsed,
  botId
) {
  if (
    message.author.id !== botId
  ) {
    return false;
  }

  const component =
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

  if (!component) return false;

  return message.embeds.some(embed => {
    const title = String(
      embed.title || ""
    ).toLowerCase();

    const match =
      title.match(
        /#\s*0*(\d+)/
      );

    const type =
      TYPES[parsed.type].label
        .toLowerCase();

    return (
      match &&
      Number(match[1]) === parsed.number &&
      (
        title.includes(type) ||
        (
          parsed.type === "cashout" &&
          title.includes("cashout")
        )
      )
    );
  });
}

// ============================================================
// IDENTIFY TICKET CREATOR
// ============================================================

function creatorFromWelcome(message) {
  for (const embed of message.embeds) {
    for (
      const field of
      embed.fields || []
    ) {
      if (
        /opened by|created by|ticket owner/i
          .test(field.name)
      ) {
        const match =
          field.value.match(
            /<@!?(\d{17,20})>/
          );

        if (match) {
          return match[1];
        }
      }
    }

    const match = String(
      embed.description || ""
    ).match(
      /(?:welcome|opened by|created by)\s*:?\s*<@!?(\d{17,20})>/i
    );

    if (match) return match[1];
  }

  return String(
    message.content || ""
  ).match(
    /<@!?(\d{17,20})>/
  )?.[1] || null;
}

// ============================================================
// RECOVER EXISTING TICKET
// ============================================================

async function recoverTicket(channel) {
  const parsed =
    parseName(channel.name);

  if (!parsed) return null;

  let before;

  for (
    let page = 0;
    page < 15;
    page++
  ) {
    const batch =
      await channel.messages.fetch({
        limit: 100,

        ...(before ? { before } : {})
      });

    for (const message of batch.values()) {
      if (
        !oldWelcome(
          message,
          parsed,
          channel.client.user.id
        )
      ) {
        continue;
      }

      const ownerId =
        creatorFromWelcome(message);

      if (!ownerId) return null;

      // Don't reset permissions during
      // recovery if historical claim
      // information is missing.

      const entry = {
        state: normalized({
          channelId: channel.id,
          ownerId,
          type: parsed.type,
          number: parsed.number,

          status:
            parsed.closed
              ? "closed"
              : "open",

          claimedBy: null,

          controlMessageId: message.id,

          createdAt:
            message.createdAt.toISOString()
        }),

        storageMessageId: null,

        recovered: true
      };

      await saveState(
        channel,
        entry
      );

      return entry;
    }

    if (batch.size < 100) break;

    before = batch.last().id;
  }

  return null;
}

// ============================================================
// LOAD STATE
// ============================================================

async function loadState(channel) {
  if (
    channel?.type !==
    ChannelType.GuildText
  ) {
    return null;
  }

  await init(channel.guild);

  if (states.has(channel.id)) {
    return states.get(channel.id);
  }

  const old = legacyTopic(channel);

  if (old) {
    const entry = {
      state: old,

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
// FIND EXISTING OPEN TICKET
// ============================================================

async function existingTicket(
  guild,
  userId,
  type
) {
  await init(guild);

  for (const entry of states.values()) {
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

    if (channel) return channel;
  }

  await guild.channels.fetch();

  for (
    const channel of
    guild.channels.cache.values()
  ) {
    const parsed =
      parseName(channel.name);

    if (
      !parsed ||
      parsed.closed ||
      parsed.type !== type ||
      states.has(channel.id) ||
      channel.type !== ChannelType.GuildText
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
//
// Never create extra chuppys-* categories.
//
// ============================================================

async function findCategory(guild, type) {
  await guild.channels.fetch();

  const config = TYPES[type];

  const env =
    process.env[config.env];

  if (env) {
    const found =
      await guild.channels.fetch(env)
        .catch(() => null);

    if (
      found?.type !==
      ChannelType.GuildCategory
    ) {
      throw new Error(
        `${config.env} is not a valid category ID.`
      );
    }

    return found;
  }

  const categories = [
    ...guild.channels.cache.values()
  ].filter(
    channel =>
      channel.type ===
      ChannelType.GuildCategory
  );

  for (const label of config.categories) {
    const match =
      categories.find(
        channel =>
          channel.name
            .trim()
            .toLowerCase() ===
          label.toLowerCase()
      );

    if (match) return match;
  }

  throw new Error(
    `Can't find existing category "${config.categories[0]}". ` +
    `Set ${config.env} in Render.`
  );
}

// ============================================================
// STRICT PERMISSIONS
// ============================================================
//
// BEFORE CLAIM:
// Sellers and staff see Purchase/Cashout.
//
// AFTER CLAIM:
// Buyer + Exact Claimer + Owner + Mod + Bot.
//
// No Seller role permission after claim.
// No Support role permission after claim.
//
// ============================================================

const FULL = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.ReadMessageHistory,
  PermissionFlagsBits.AttachFiles
];

const READ = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.ReadMessageHistory
];

function allowed(id, closed) {
  return {
    id,

    allow:
      closed ? READ : FULL,

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

  const entries = [
    {
      id:
        guild.roles.everyone.id,

      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },

    {
      id:
        guild.client.user.id,

      allow: [
        ...FULL,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
      ]
    }
  ];

  // Owner user or Owner role.
  entries.push(
    allowed(IDS.owner, closed)
  );

  // Actual server owner, if different.
  if (
    guild.ownerId !== IDS.owner &&
    guild.ownerId !== state.ownerId
  ) {
    entries.push(
      allowed(guild.ownerId, closed)
    );
  }

  // Mod role always retains access.
  if (
    guild.roles.cache.has(
      IDS.mod
    )
  ) {
    entries.push(
      allowed(IDS.mod, closed)
    );
  }

  // BEFORE CLAIM ONLY:
  if (!state.claimedBy) {
    const roles =
      state.type === "purchase" ||
      state.type === "cashout"
        ? [
            IDS.seller,
            IDS.support,
            IDS.admin
          ]
        : [
            IDS.support,
            IDS.admin
          ];

    for (const id of roles) {
      if (
        guild.roles.cache.has(id)
      ) {
        entries.push(
          allowed(id, closed)
        );
      }
    }
  }

  // Ticket creator always retains access.
  if (
    state.ownerId !== IDS.owner
  ) {
    entries.push(
      allowed(state.ownerId, closed)
    );
  }

  // Exact seller who claimed.
  if (
    state.claimedBy &&
    state.claimedBy !== state.ownerId &&
    state.claimedBy !== IDS.owner
  ) {
    entries.push(
      allowed(state.claimedBy, closed)
    );
  }

  // Deduplicate IDs.
  return [
    ...new Map(
      entries.map(entry => [
        entry.id,
        entry
      ])
    ).values()
  ];
}

// ============================================================
// APPLY PERMISSIONS
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

    "Chuppys private claimed-ticket permissions"
  );
}

// ============================================================
// SYNC EXISTING TICKETS
// ============================================================

async function syncExistingTickets(guild) {
  await init(guild);

  await guild.channels.fetch();

  const categories = {};

  for (
    const type of
    Object.keys(TYPES)
  ) {
    try {
      categories[type] =
        await findCategory(guild, type);
    } catch (error) {
      console.error(
        `[TICKETS] ${type} category: ${error.message}`
      );
    }
  }

  let moved = 0;

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
      parseName(channel.name);

    if (
      !parsed &&
      !states.has(channel.id)
    ) {
      continue;
    }

    try {
      const entry =
        await loadState(channel);

      if (!entry) continue;

      const target =
        categories[entry.state.type];

      if (!target) continue;

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

      // Don't expose recovered tickets
      // with unverifiable historic claims.
      if (!entry.recovered) {
        await applyPermissions(
          channel,
          entry.state
        );
      }
    } catch (error) {
      console.error(
        `[TICKETS] Could not sync ${channel.name}:`,
        error
      );
    }
  }

  console.log(
    `[TICKETS] Category sync: ${moved} ticket(s) moved.`
  );
}

// ============================================================
// SIMPLE WHITE TICKET LOGS
// ============================================================

async function logTicket(
  guild,
  state,
  action,
  actorId
) {
  const title = {
    opened: "Ticket Opened",
    claimed: "Ticket Claimed",
    closed: "Ticket Closed",
    deleted: "Ticket Deleted"
  }[action];

  if (!title) return;

  try {
    const channel = await getText(
      guild,
      IDS.logs,
      "Ticket logs"
    );

    const name = nameOf(
      state.type,
      state.number,
      action === "closed" ||
      action === "deleted"
    );

    await channel.send({
      embeds: [
        whiteEmbed(
          title,

          `**Ticket:** \`${name}\`\n` +
          `**By:** <@${actorId}>`
        )
      ],

      allowedMentions: {
        parse: []
      }
    });
  } catch (error) {
    console.error(
      `[TICKETS] ${action} log:`,
      error
    );
  }
}

// ============================================================
// PRIVATE TRANSCRIPTS
// ============================================================

async function readAllMessages(channel) {
  const items = [];

  let before;

  for (;;) {
    const batch =
      await channel.messages.fetch({
        limit: 100,

        ...(before ? { before } : {})
      });

    if (!batch.size) break;

    items.push(
      ...batch.values()
    );

    if (batch.size < 100) break;

    before =
      batch.last().id;
  }

  return items.sort(
    (a, b) =>
      a.createdTimestamp -
      b.createdTimestamp
  );
}

function transcriptHtml(
  channel,
  state,
  messages
) {
  const rows = messages.map(message => {
    const embeds = message.embeds.map(embed => {
      const fields = (
        embed.fields || []
      )
        .map(
          field =>
            `<p><b>${escapeHtml(field.name)}</b>: ` +
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

    const files = [
      ...message.attachments.values()
    ].map(attachment => {
      if (
        !/^https:\/\//i.test(
          attachment.url || ""
        )
      ) {
        return "";
      }

      return (
        `<p><a href="${escapeHtml(attachment.url)}">` +
        `${escapeHtml(attachment.name || "Attachment")}` +
        `</a></p>`
      );
    }).join("");

    return (
      `<article>` +

      `<b>${escapeHtml(
        message.author?.username ||
        "Unknown"
      )}</b>` +

      ` <small>${escapeHtml(
        message.createdAt.toISOString()
      )}</small>` +

      `<p>${escapeHtml(
        message.content
      )}</p>` +

      embeds +
      files +

      `</article>`
    );
  }).join("\n");

  return (
    `<!doctype html>` +
    `<html lang="en">` +
    `<head>` +
    `<meta charset="utf-8">` +
    `<title>Ticket #${state.number}</title>` +

    `<style>` +
    `body{background:#15141c;color:white;` +
    `max-width:850px;margin:30px auto;` +
    `font:15px/1.6 system-ui;padding:0 20px}` +

    `article{padding:14px 0;` +
    `border-bottom:1px solid #444}` +

    `p,blockquote{white-space:pre-wrap;` +
    `overflow-wrap:anywhere}` +

    `blockquote{border-left:3px solid #fff;` +
    `padding:10px;background:#292734}` +

    `a{color:#aaccff}` +
    `</style>` +

    `</head><body>` +

    `<h1>${escapeHtml(BRAND)} Ticket Transcript</h1>` +

    `<p>${escapeHtml(channel.name)} · ` +
    `${messages.length} messages</p>` +

    rows +

    `</body></html>`
  );
}

async function saveTranscript(
  channel,
  state
) {
  const storage = await getText(
    channel.guild,
    IDS.transcripts,
    "Private transcripts"
  );

  const messages =
    await readAllMessages(channel);

  const bytes = Buffer.from(
    transcriptHtml(
      channel,
      state,
      messages
    )
  );

  if (
    bytes.length >
    7 * 1024 * 1024
  ) {
    throw new Error(
      "Transcript is larger than 7 MB."
    );
  }

  const file = new AttachmentBuilder(
    bytes,
    {
      name:
        `transcript-${state.type}-${state.number}.html`
    }
  );

  const result = await storage.send({
    content:
      `Transcript: ${clean(channel.name, 100)}`,

    files: [file],

    allowedMentions: {
      parse: []
    }
  });

  return result.url;
}

// ============================================================
// TICKET FORM
// ============================================================

function ticketForm(type) {
  const modal = new ModalBuilder()
    .setCustomId(
      FORM_PREFIX + type
    )
    .setTitle(
      `${TYPES[type].label} Ticket`
    );

  TYPES[type].questions.forEach(
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
// CREATE TICKET
// ============================================================

async function createTicket(
  interaction,
  type,
  answers = []
) {
  return serialized(async () => {
    const guild =
      interaction.guild;

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

    // Find category BEFORE spending
    // a new ticket number.
    const parent =
      await findCategory(guild, type);

    const number =
      await nextNumber(guild);

    const state = normalized({
      channelId: "pending",

      ownerId:
        interaction.user.id,

      type,
      number,

      status: "open",

      claimedBy: null,

      createdAt:
        new Date().toISOString()
    });

    const channel =
      await guild.channels.create({
        name:
          nameOf(type, number),

        type:
          ChannelType.GuildText,

        parent:
          parent.id,

        topic: null,

        permissionOverwrites:
          permissions(guild, state),

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
      TYPES[type].questions?.length &&
      answers.length
        ? TYPES[type].questions.map(
            (question, index) =>
              `**${question}**\n` +
              clean(answers[index], 250)
          ).join("\n\n")
        : TYPES[type].description;

    const pings = (
      type === "purchase" ||
      type === "cashout"
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

    const welcome =
      await channel.send({
        content: [
          `<@${interaction.user.id}>`,

          ...pings.map(
            id => `<@&${id}>`
          )
        ].join(" "),

        embeds: [
          whiteEmbed(
            `${TYPES[type].label} Ticket #${String(number).padStart(4, "0")}`,

            `Welcome <@${interaction.user.id}>!\n\n` +

            `${details}\n\n` +

            "Please wait for our team."
          )
        ],

        components:
          buttons(state),

        allowedMentions: {
          parse: [],

          users: [
            interaction.user.id
          ],

          roles: pings
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
// REFRESH BUTTONS
// ============================================================

async function refreshButtons(
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

  if (
    message &&
    message.author.id ===
      channel.client.user.id
  ) {
    await message.edit({
      components:
        buttons(state)
    });
  }
}

// ============================================================
// CLAIM AND FORCECLAIM
// ============================================================
//
// ,claim:
// Authorized sellers claim normal tickets.
//
// ,forceclaim:
// OWNER ONLY.
// Takes ownership of an already claimed
// or unclaimed ticket.
//
// No extra public claim confirmation.
// Only a private response and one white log.
//
// ============================================================

async function claim(
  context,
  channel,
  entry,
  force = false
) {
  const member =
    await currentMember(context);

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
    !canClaim(member, state)
  ) {
    return reply(
      context,
      "You do not have permission to claim this ticket."
    );
  }

  if (
    state.status !== "open"
  ) {
    return reply(
      context,
      "Reopen this ticket first."
    );
  }

  // Existing claim.
  if (
    state.claimedBy &&
    !force
  ) {
    if (
      state.claimedBy ===
        context.user.id ||
      isOwner(member) ||
      isMod(member)
    ) {
      await applyPermissions(
        channel,
        state
      );

      await refreshButtons(
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

      `This ticket is already claimed by <@${state.claimedBy}>.`
    );
  }

  if (
    state.claimedBy ===
      context.user.id &&
    force
  ) {
    return reply(
      context,
      "You already claim this ticket."
    );
  }

  const previous =
    state.claimedBy;

  state.claimedBy =
    context.user.id;

  try {
    await applyPermissions(
      channel,
      state
    );
  } catch (error) {
    state.claimedBy =
      previous;

    throw error;
  }

  await saveState(
    channel,
    entry
  );

  await refreshButtons(
    channel,
    state
  );

  // Only ONE white claim log.
  // No second public claim message.
  await logTicket(
    channel.guild,
    state,
    "claimed",
    context.user.id
  );

  return reply(
    context,

    force
      ? "Ticket force-claimed successfully."
      : "This ticket has been claimed successfully."
  );
}

// ============================================================
// CLOSE TICKET
// ============================================================
//
// Keep the white Ticket Closed embed.
//
// Closing confirmation says ONLY:
// This ticket has been closed successfully.
//
// No transcript announcement.
// No instruction to use ,delete.
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

  const member =
    await currentMember(context);

  if (
    !canManage(member, state)
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
    transcript;

  await applyPermissions(
    channel,
    state
  );

  await channel.setName(
    nameOf(
      state.type,
      state.number,
      true
    )
  );

  await saveState(
    channel,
    entry
  );

  await refreshButtons(
    channel,
    state
  );

  // Permanent white close embed.
  await channel.send({
    embeds: [
      whiteEmbed(
        "Ticket Closed",

        "This ticket has been closed successfully."
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  await logTicket(
    channel.guild,
    state,
    "closed",
    context.user.id
  );

  // Prefix commands don't send a
  // second closing confirmation.
  if (
    context.kind === "prefix"
  ) {
    return;
  }

  return reply(
    context,
    "This ticket has been closed successfully."
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
    await currentMember(context);

  const state =
    entry.state;

  if (
    !canManage(member, state)
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

  await applyPermissions(
    channel,
    state
  );

  await channel.setName(
    nameOf(
      state.type,
      state.number
    )
  );

  await saveState(
    channel,
    entry
  );

  await refreshButtons(
    channel,
    state
  );

  return reply(
    context,
    "This ticket has been reopened successfully."
  );
}

// ============================================================
// DELETE TICKET
// ============================================================
//
// ,delete and Delete button remain available.
//
// ============================================================

async function deleteTicket(
  context,
  channel,
  entry
) {
  const member =
    await currentMember(context);

  const state =
    entry.state;

  if (
    !canManage(member, state)
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

  state.transcriptUrl =
    await saveTranscript(
      channel,
      state
    );

  await saveState(
    channel,
    entry
  );

  await logTicket(
    channel.guild,
    state,
    "deleted",
    context.user.id
  );

  if (
    context.kind !== "prefix"
  ) {
    await reply(
      context,
      "Ticket deleted successfully."
    );
  }

  await channel.delete(
    `Ticket deleted by ${context.user.id}`
  );

  states.delete(channel.id);
}

// ============================================================
// POST TICKET PANEL
// ============================================================

async function postPanel(interaction) {
  const member =
    await currentMember(interaction);

  if (
    !member.permissions.has(
      PermissionFlagsBits.ManageGuild
    ) &&
    !isOwner(member)
  ) {
    return reply(
      interaction,
      "Manage Server permission is required."
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const panel = await getText(
    interaction.guild,
    IDS.panel,
    "Ticket panel"
  );

  const recent =
    await panel.messages.fetch({
      limit: 100
    });

  const existing =
    recent.find(
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
    await panel.send(
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
// TICKET SELECT
// ============================================================

async function selectTicket(interaction) {
  const type =
    String(
      interaction.values[0] || ""
    ).toLowerCase();

  if (!TYPES[type]) {
    return reply(
      interaction,
      "Invalid ticket category."
    );
  }

  if (
    TYPES[type].questions?.length
  ) {
    return interaction.showModal(
      ticketForm(type)
    );
  }

  // Support, Giveaway, Partnership
  // open without a modal.
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
// PURCHASE / CASHOUT SUBMISSION
// ============================================================

async function submitForm(interaction) {
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

function actionFromId(id) {
  for (
    const [action, customId] of
    Object.entries(BUTTONS)
  ) {
    if (id === customId) {
      return action;
    }
  }

  if (
    id.startsWith(
      "chuppys_ticket:"
    )
  ) {
    const action =
      id.slice(
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
  if (
    action === "close"
  ) {
    const entry =
      await loadState(
        interaction.channel
      );

    if (!entry) {
      return reply(
        interaction,
        "This is not a recognized Chuppys ticket."
      );
    }

    const member =
      await currentMember(interaction);

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
      closeModal(
        interaction.channelId
      )
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return serialized(async () => {
    const entry =
      await loadState(
        interaction.channel
      );

    if (!entry) {
      return reply(
        interaction,
        "This is not a recognized Chuppys ticket."
      );
    }

    if (
      action === "claim"
    ) {
      return claim(
        interaction,
        interaction.channel,
        entry
      );
    }

    if (
      action === "reopen"
    ) {
      return reopenTicket(
        interaction,
        interaction.channel,
        entry
      );
    }

    if (
      action === "delete"
    ) {
      return deleteTicket(
        interaction,
        interaction.channel,
        entry
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

async function handleCloseForm(interaction) {
  if (
    interaction.customId.slice(
      CLOSE_PREFIX.length
    ) !== interaction.channelId
  ) {
    return reply(
      interaction,
      "This form belongs to a different ticket."
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

  return serialized(async () => {
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

async function handleMessage(message) {
  if (
    !message.guild ||
    message.author.bot ||
    !message.content.startsWith(",")
  ) {
    return;
  }

  const raw =
    message.content.slice(1).trim();

  const [name] =
    raw.split(/\s+/, 1);

  if (
    ![
      "claim",
      "forceclaim",
      "close",
      "reopen",
      "delete"
    ].includes(
      String(name).toLowerCase()
    )
  ) {
    return;
  }

  if (
    message.channel.type !==
    ChannelType.GuildText
  ) {
    return;
  }

  const command =
    name.toLowerCase();

  const reason =
    raw.slice(name.length)
      .trim()
      .slice(0, 500);

  const context = {
    kind: "prefix",

    message,

    guild: message.guild,

    channel: message.channel,

    user: message.author
  };

  return serialized(async () => {
    // Owner-only authorization is
    // checked before processing forceclaim.
    if (
      command === "forceclaim"
    ) {
      const member =
        await currentMember(context);

      if (
        !isOwner(member)
      ) {
        return reply(
          context,
          "Only owners can use ,forceclaim."
        );
      }
    }

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

    if (
      command === "claim"
    ) {
      return claim(
        context,
        message.channel,
        entry
      );
    }

    if (
      command === "forceclaim"
    ) {
      return claim(
        context,
        message.channel,
        entry,
        true
      );
    }

    if (
      command === "close"
    ) {
      return closeTicket(
        context,
        message.channel,
        entry,
        reason
      );
    }

    if (
      command === "reopen"
    ) {
      return reopenTicket(
        context,
        message.channel,
        entry
      );
    }

    if (
      command === "delete"
    ) {
      return deleteTicket(
        context,
        message.channel,
        entry
      );
    }
  });
}

// ============================================================
// INSTALL ONCE
// ============================================================

function setupTickets(client) {
  if (
    client.__chuppysTicketsInstalled
  ) {
    return;
  }

  client.__chuppysTicketsInstalled =
    true;

  // ==========================================================
  // READY
  // ==========================================================

  async function onReady() {
    try {
      if (
        !process.env.DISCORD_GUILD_ID
      ) {
        throw new Error(
          "Missing DISCORD_GUILD_ID in Render."
        );
      }

      const guild =
        await client.guilds.fetch(
          process.env.DISCORD_GUILD_ID
        );

      await guild.roles.fetch();

      await init(guild);

      await syncExistingTickets(
        guild
      );

      console.log(
        `[TICKETS] Ready; next ticket #${counter + 1}.`
      );

      console.log(
        `[TICKETS] Seller ${IDS.seller}; owner ${IDS.owner}; mod ${IDS.mod}.`
      );
    } catch (error) {
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

  if (
    client.isReady()
  ) {
    void onReady();
  }

  // ==========================================================
  // DUPLICATE EVENT PROTECTION
  // ==========================================================

  const handledMessages =
    new Set();

  const handledInteractions =
    new Set();

  function oncePer(set, id) {
    if (set.has(id)) {
      return false;
    }

    set.add(id);

    if (
      set.size > 3000
    ) {
      set.clear();
    }

    return true;
  }

  // ==========================================================
  // PREFIX LISTENER
  // ==========================================================

  client.on(
    Events.MessageCreate,

    async message => {
      if (
        !oncePer(
          handledMessages,
          message.id
        )
      ) {
        return;
      }

      try {
        await handleMessage(message);
      } catch (error) {
        console.error(
          "[TICKETS] Command:",
          error
        );

        if (
          message.guild &&
          message.channel?.send
        ) {
          await message.channel.send({
            content:
              `Ticket error: ${clean(error.message)}`,

            allowedMentions: {
              parse: []
            }
          }).catch(() => {});
        }
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
          ? actionFromId(
              interaction.customId
            )
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
        !oncePer(
          handledInteractions,
          interaction.id
        )
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

        if (isPanel) {
          return await postPanel(
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
          "[TICKETS] Interaction:",
          error
        );

        await reply(
          interaction,
          `Ticket error: ${clean(error.message)}`
        ).catch(() => {});
      }
    }
  );

  console.log(
    "[TICKETS] Chuppys ticket handlers installed."
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
