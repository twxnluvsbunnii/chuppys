"use strict";

// ============================================================
// CHUPPYS TICKET SYSTEM - DISCORD.JS V14 / RENDER
// ============================================================
//
// require("./tickets")(client);
// Slash command: require("./tickets").command
//
// COMMANDS:
// ,claim
// ,close
// ,close reason here
// ,reopen
// ,delete
//
// FIXES:
// - Seller role can claim Purchase and Cash Out tickets
// - Only buyer, exact claimer, Owner role and Mod role
//   retain normal access after claim
// - Other sellers lose ticket visibility
// - Support tickets open without forms
// - Existing tickets sync to correct categories
// - No duplicate category creation
// - White Opened, Claimed, Closed and Deleted logs
// - No raw metadata in activity logs
// - Closing confirmation is one short sentence
// - Transcripts saved privately
// - Existing ticket counter and V3 storage retained
// - Existing legacy ticket metadata recovery
//
// IMPORTANT:
// Run exactly ONE bot instance.
// Enable Message Content Intent.
// Recommended: enable Server Members Intent.
// Bot needs Manage Channels and Manage Roles.
// Members with Administrator bypass channel privacy.
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
// IDS
// ============================================================

const IDS = Object.freeze({
  panel: "1530811385678790716",
  logs: "1570913954333728808",
  transcripts: "1571112508922531870",
  data: "1571112668037644388",

  // These three IDs are treated as ROLE IDs.
  owner: "1530988662970650865",
  mod: "1531800784700706887",
  seller: "1550322075208646766",

  admin: "1531800870444994641",
  support: "1563003884656398406",
  verified: "1550230619127021568"
});

const BRAND = ".gg/chuppys";
const EMOJI = "<:chuppyhi:1561103471325745242>";
const WHITE = 0xffffff;
const EPHEMERAL = MessageFlags.Ephemeral;

// ============================================================
// STORAGE - KEEP EXISTING PREFIXES
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

const BUTTONS = Object.freeze({
  claim: "chuppys_ticket_claim",
  close: "chuppys_ticket_close",
  reopen: "chuppys_ticket_reopen",
  delete: "chuppys_ticket_delete"
});

// ============================================================
// TICKET TYPES AND EXISTING CATEGORY NAMES
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
    ],
    description: "Please provide your purchase details."
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
    ],
    description: "Please provide your cash out details."
  },

  giveaway: {
    label: "Giveaway",
    env: "GIVEAWAY_TICKET_CATEGORY_ID",
    categories: ["Giveaway tickets"],
    description:
      "Please provide details about the giveaway you won."
  },

  partnership: {
    label: "Partnership",
    env: "PARTNERSHIP_TICKET_CATEGORY_ID",
    categories: ["Partnership tickets"],
    description:
      "Please provide your partnership information."
  },

  support: {
    label: "Support",
    env: "SUPPORT_TICKET_CATEGORY_ID",
    categories: ["Support tickets"],
    description:
      "Please explain what you need help with."
  }
};

// ============================================================
// SLASH COMMAND
// ============================================================

const command = new SlashCommandBuilder()
  .setName("ticketpanel")
  .setDescription("Post or update the Chuppys ticket panel.")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageGuild
  );

// ============================================================
// RUNTIME STATE
// ============================================================

const cache = new Map();
let queue = Promise.resolve();
let initialization = null;
let initialized = false;
let globalCounter = 0;
let counterMessageId = null;

// ============================================================
// SERIAL QUEUE
// ============================================================

function queued(task) {
  const result = queue.then(task);
  queue = result.catch(() => {});
  return result;
}

// ============================================================
// HELPERS
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
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]
  );
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

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

function parseTicketName(name) {
  const match = String(name || "").match(
    /^(closed-)?(purchase|purchasing|cashout|cash-out|giveaway|partnership|support)-(\d+)$/i
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
  ) return null;

  return {
    type,
    number,
    closed: Boolean(match[1])
  };
}

// ============================================================
// FETCH REAL MEMBER ROLES
// ============================================================
//
// This is important for the Seller Claim button.
//
// The bot fetches the current GuildMember from Discord
// before deciding whether someone has the Seller role.
//
// ============================================================

async function getMember(context) {
  const guild = context.guild;
  const userId = context.user?.id;

  if (!guild || !userId) return null;

  return guild.members.fetch({
    user: userId,
    force: true
  }).catch(() => null);
}

async function getRoleInfo(context) {
  const member = await getMember(context);

  if (!member) {
    throw new Error(
      "Could not verify your server roles. Please try again."
    );
  }

  const roles = member.roles.cache;

  return {
    member,
    owner: roles.has(IDS.owner),
    mod: roles.has(IDS.mod),
    seller: roles.has(IDS.seller),
    support: roles.has(IDS.support),
    adminRole: roles.has(IDS.admin),
    administrator: member.permissions.has(
      PermissionFlagsBits.Administrator
    )
  };
}

// ============================================================
// AUTHORIZATION
// ============================================================
//
// Sellers:
// Can claim Purchase and Cashout.
//
// Owner and Mod:
// Can manage every ticket.
//
// Support:
// Can manage unclaimed Support, Giveaway
// and Partnership tickets.
//
// After claim:
// Claimer, Owner and Mod can manage.
//
// ============================================================

function mayClaim(roles, state) {
  if (roles.owner || roles.mod) return true;

  if (
    state.type === "purchase" ||
    state.type === "cashout"
  ) {
    return roles.seller || roles.support;
  }

  return roles.support || roles.adminRole;
}

function mayManage(roles, state, userId) {
  if (roles.owner || roles.mod) return true;

  if (state.claimedBy) {
    return state.claimedBy === userId;
  }

  return mayClaim(roles, state);
}

// ============================================================
// REPLIES
// ============================================================

async function reply(context, content) {
  if (context.deferred) {
    return context.editReply({ content });
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
    guild: message.guild,
    channel: message.channel,
    user: message.author,
    deferred: false,
    replied: false,

    reply(content) {
      return message.reply({
        content:
          typeof content === "string"
            ? content
            : content.content,
        allowedMentions: {
          parse: [],
          repliedUser: false
        }
      });
    }
  };
}

// ============================================================
// WHITE EMBEDS
// ============================================================

function embed(title, description) {
  return new EmbedBuilder()
    .setColor(WHITE)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: BRAND });
}

async function textChannel(guild, id, label) {
  const channel = await guild.channels.fetch(id);

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
        .setStyle(ButtonStyle.Danger)
    );
  }

  return [row];
}

// ============================================================
// PANEL
// ============================================================

function panelPayload() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(SELECT_ID)
    .setPlaceholder("Select a ticket category")
    .addOptions(
      Object.entries(TYPES).map(([value, settings]) => ({
        value,
        label: settings.label,
        description: `Open a ${settings.label} ticket`
      }))
    );

  return {
    embeds: [
      embed(
        `${EMOJI} Chuppys Tickets`,
        "Welcome to the Chuppys ticket system!\n\n" +
        "Select the category you need below.\n\n" +
        "**Purchase** — Purchase assistance\n" +
        "**Cash Out** — Cashout assistance\n" +
        "**Giveaway** — Giveaway claims\n" +
        "**Partnership** — Partnerships\n" +
        "**Support** — General assistance"
      )
    ],
    components: [
      new ActionRowBuilder().addComponents(menu)
    ],
    allowedMentions: { parse: [] }
  };
}

// ============================================================
// STATE PARSING
// ============================================================

function normalizeState(data) {
  if (
    !data?.channelId ||
    !data?.ownerId ||
    !TYPES[data.type]
  ) return null;

  const number = Number(data.number);

  if (
    !Number.isSafeInteger(number) ||
    number < 1
  ) return null;

  return {
    channelId: String(data.channelId),
    ownerId: String(data.ownerId),
    type: data.type,
    number,
    status:
      data.status === "closed" ? "closed" : "open",
    claimedBy: data.claimedBy
      ? String(data.claimedBy)
      : null,
    controlMessageId: data.controlMessageId || null,
    closeReason:
      data.closeReason || "No further action required.",
    transcriptUrl: data.transcriptUrl || null,
    createdAt: data.createdAt || null
  };
}

function parseState(message) {
  const content = message?.content || "";

  const prefix = [
    STATE_PREFIX,
    ...LEGACY_PREFIXES
  ].find(value => content.startsWith(value));

  if (!prefix) return null;

  try {
    return normalizeState(
      JSON.parse(content.slice(prefix.length))
    );
  } catch {
    return null;
  }
}

// ============================================================
// SCAN MESSAGES
// ============================================================

async function scan(channel, callback, pages = 200) {
  let before;

  for (let page = 0; page < pages; page++) {
    const batch = await channel.messages.fetch({
      limit: 100,
      ...(before ? { before } : {})
    });

    if (!batch.size) return;

    for (const message of batch.values()) {
      await callback(message);
    }

    if (batch.size < 100) return;
    before = batch.last().id;
  }

  console.warn(
    `[TICKETS] Scan limit reached in ${channel.id}`
  );
}

// ============================================================
// PRIVATE STATE STORAGE
// ============================================================

async function saveState(channel, entry) {
  const storage = await textChannel(
    channel.guild,
    IDS.data,
    "Ticket data"
  );

  const content =
    STATE_PREFIX + JSON.stringify(entry.state);

  let message = entry.storageMessageId
    ? await storage.messages.fetch(
        entry.storageMessageId
      ).catch(() => null)
    : null;

  if (message) {
    await message.edit({
      content,
      allowedMentions: { parse: [] }
    });
  } else {
    message = await storage.send({
      content,
      allowedMentions: { parse: [] }
    });

    entry.storageMessageId = message.id;
  }

  cache.set(channel.id, entry);
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

    const logs = await textChannel(
      guild,
      IDS.logs,
      "Ticket logs"
    );

    let highest = 0;
    let counterMessage = null;

    function processMessage(message, inData) {
      if (
        message.author.id !== guild.client.user.id
      ) return;

      const state = parseState(message);

      if (state) {
        highest = Math.max(highest, state.number);

        const existing = cache.get(state.channelId);

        if (
          !existing ||
          (inData && !existing.storageMessageId)
        ) {
          cache.set(state.channelId, {
            state,
            storageMessageId:
              inData ? message.id : null
          });
        }
      }

      if (
        message.content.startsWith(COUNTER_PREFIX)
      ) {
        const number = Number(
          message.content.slice(COUNTER_PREFIX.length)
        );

        if (
          Number.isSafeInteger(number) &&
          number >= 0
        ) {
          highest = Math.max(highest, number);

          if (inData && !counterMessage) {
            counterMessage = message;
          }
        }
      }

      if (
        !inData &&
        message.content.startsWith(OLD_COUNTER_PREFIX)
      ) {
        try {
          const old = JSON.parse(
            message.content.slice(
              OLD_COUNTER_PREFIX.length
            )
          );

          const total = Object.values(old)
            .map(Number)
            .filter(
              n => Number.isSafeInteger(n) && n >= 0
            )
            .reduce((sum, n) => sum + n, 0);

          highest = Math.max(highest, total);
        } catch {
          // Ignore invalid legacy counters.
        }
      }
    }

    await scan(
      data,
      message => processMessage(message, true)
    );

    if (logs.id !== data.id) {
      await scan(
        logs,
        message => processMessage(message, false)
      );
    }

    await guild.channels.fetch();

    for (const channel of guild.channels.cache.values()) {
      const parsed = parseTicketName(channel.name);

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
          content: COUNTER_PREFIX + highest
        });
      }
    } else {
      const message = await data.send({
        content: COUNTER_PREFIX + highest,
        allowedMentions: { parse: [] }
      });

      counterMessageId = message.id;
    }

    // Migrate older valid records into the data channel.

    for (const [id, entry] of cache) {
      if (entry.storageMessageId) continue;

      const channel = await guild.channels.fetch(id)
        .catch(() => null);

      if (channel?.type === ChannelType.GuildText) {
        await saveState(channel, entry);
      }
    }

    initialized = true;

    console.log(
      `[TICKETS] Loaded ${cache.size} saved tickets.`
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
// NEXT TICKET NUMBER
// ============================================================

async function nextNumber(guild) {
  await init(guild);

  const storage = await textChannel(
    guild,
    IDS.data,
    "Ticket data"
  );

  const message = await storage.messages.fetch(
    counterMessageId
  );

  const stored = message.content.startsWith(
    COUNTER_PREFIX
  )
    ? Number(
        message.content.slice(COUNTER_PREFIX.length)
      )
    : 0;

  globalCounter = Math.max(
    globalCounter,
    Number.isSafeInteger(stored) && stored >= 0
      ? stored
      : 0
  );

  const next = globalCounter + 1;

  await message.edit({
    content: COUNTER_PREFIX + next
  });

  globalCounter = next;

  return next;
}

// ============================================================
// LEGACY TOPIC RECOVERY
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

// ============================================================
// EXISTING WELCOME MESSAGE RECOVERY
// ============================================================

function originalWelcome(message, parsed, botId) {
  if (message.author.id !== botId) return false;

  const validButton = message.components.some(
    row => row.components.some(component => {
      const id = component.customId;

      return (
        Object.values(BUTTONS).includes(id) ||
        String(id || "").startsWith(
          "chuppys_ticket:"
        )
      );
    })
  );

  if (!validButton) return false;

  return message.embeds.some(item => {
    const title = String(
      item.title || ""
    ).toLowerCase();

    const numberMatch = title.match(
      /#\s*0*(\d+)/
    );

    if (
      !numberMatch ||
      Number(numberMatch[1]) !== parsed.number
    ) {
      return false;
    }

    const typeText = TYPES[parsed.type].label
      .toLowerCase();

    return (
      title.includes(typeText) ||
      (
        parsed.type === "cashout" &&
        title.includes("cashout")
      )
    );
  });
}

function extractOwner(message) {
  const description = message.embeds
    .map(e => e.description || "")
    .join("\n");

  const match = description.match(
    /(?:welcome|opened by|created by|creator)\s*:?\s*<@!?(\d{17,20})>/i
  );

  if (match) return match[1];

  const contentMatch = String(
    message.content || ""
  ).match(
    /<@!?(\d{17,20})>/
  );

  return contentMatch?.[1] || null;
}

// ============================================================
// RECOVER EXISTING TICKETS
// ============================================================

async function recoverWelcome(channel) {
  const parsed = parseTicketName(channel.name);
  if (!parsed) return null;

  let before;

  for (let page = 0; page < 20; page++) {
    const batch = await channel.messages.fetch({
      limit: 100,
      ...(before ? { before } : {})
    });

    for (const message of batch.values()) {
      if (
        !originalWelcome(
          message,
          parsed,
          channel.client.user.id
        )
      ) continue;

      const ownerId = extractOwner(message);

      if (!ownerId) return null;

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
          createdAt: message.createdAt.toISOString()
        },

        storageMessageId: null
      };

      await saveState(channel, entry);

      return entry;
    }

    if (batch.size < 100) break;
    before = batch.last().id;
  }

  return null;
}

// ============================================================
// LOAD TICKET
// ============================================================

async function loadState(channel) {
  if (
    channel?.type !== ChannelType.GuildText
  ) return null;

  await init(channel.guild);

  if (cache.has(channel.id)) {
    return cache.get(channel.id);
  }

  const legacy = fromTopic(channel);

  if (legacy) {
    const entry = {
      state: legacy,
      storageMessageId: null
    };

    await saveState(channel, entry);

    await channel.setTopic(null)
      .catch(() => {});

    return entry;
  }

  return recoverWelcome(channel);
}

// ============================================================
// EXISTING OPEN TICKET
// ============================================================

async function existingTicket(guild, userId, type) {
  await init(guild);

  for (const entry of cache.values()) {
    const state = entry.state;

    if (
      state.ownerId !== userId ||
      state.type !== type ||
      state.status !== "open"
    ) continue;

    const channel = await guild.channels.fetch(
      state.channelId
    ).catch(() => null);

    if (channel) return channel;
  }

  // Recover existing tickets missing metadata.

  await guild.channels.fetch();

  for (const channel of guild.channels.cache.values()) {
    if (
      channel.type !== ChannelType.GuildText ||
      cache.has(channel.id)
    ) continue;

    const parsed = parseTicketName(channel.name);

    if (
      !parsed ||
      parsed.type !== type ||
      parsed.closed
    ) continue;

    const entry = await loadState(channel)
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
// CATEGORY LOOKUP
// ============================================================
//
// Uses existing categories ONLY.
//
// Does not create chuppys-purchase
// or other duplicate categories.
//
// ============================================================

async function category(guild, type) {
  const settings = TYPES[type];

  if (!settings) {
    throw new Error(
      `Unknown ticket type: ${type}`
    );
  }

  await guild.channels.fetch();

  const configured = process.env[settings.env];

  if (configured) {
    const found = await guild.channels.fetch(
      configured
    ).catch(() => null);

    if (
      found?.type !== ChannelType.GuildCategory
    ) {
      throw new Error(
        `${settings.env} is not a valid category ID.`
      );
    }

    return found;
  }

  const categories = [
    ...guild.channels.cache.values()
  ].filter(
    c => c.type === ChannelType.GuildCategory
  );

  for (const name of settings.categories) {
    const found = categories.find(
      c => normalizeName(c.name) === normalizeName(name)
    );

    if (found) return found;
  }

  throw new Error(
    `Cannot find "${settings.categories[0]}". ` +
    `Set ${settings.env} in Render to the correct category ID.`
  );
}

// ============================================================
// STRICT TICKET PERMISSIONS
// ============================================================
//
// BEFORE CLAIM:
// Purchase/Cashout visible to Seller,
// Owner, Mod, Support.
//
// AFTER CLAIM:
// - Buyer: allowed
// - Exact claimer: allowed
// - Owner role: allowed
// - Mod role: allowed
// - Seller role: NO allow
// - Support role: NO allow
// - Other sellers: hidden
//
// CRITICAL:
//
// DO NOT explicitly deny ViewChannel
// to the Seller role.
//
// A member may have both Seller and Mod.
//
// Instead, remove the Seller role overwrite
// entirely after claim.
//
// @everyone is denied and exact users/
// Owner/Mod are explicitly allowed.
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

function permissionEntry(id, closed) {
  return {
    id,
    allow: closed ? READ_ONLY : FULL,
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
  const closed = state.status === "closed";

  const entries = [
    {
      id: guild.roles.everyone.id,
      deny: [
        PermissionFlagsBits.ViewChannel
      ]
    },
    {
      id: guild.client.user.id,
      allow: [
        ...FULL,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
      ]
    }
  ];

  // Owner and Mod roles ALWAYS retain access.

  for (const id of [IDS.owner, IDS.mod]) {
    if (guild.roles.cache.has(id)) {
      entries.push(
        permissionEntry(id, closed)
      );
    }
  }

  if (!state.claimedBy) {
    // Before claim, seller role can see
    // Purchase and Cashout tickets.

    const roles = (
      state.type === "purchase" ||
      state.type === "cashout"
    )
      ? [IDS.seller, IDS.support, IDS.admin]
      : [IDS.support, IDS.admin];

    for (const id of new Set(roles)) {
      if (
        guild.roles.cache.has(id) &&
        id !== IDS.owner &&
        id !== IDS.mod
      ) {
        entries.push(
          permissionEntry(id, closed)
        );
      }
    }
  }

  // Buyer always retains access.

  entries.push(
    permissionEntry(
      state.ownerId,
      closed
    )
  );

  // Exact claiming seller receives an
  // individual member overwrite.

  if (
    state.claimedBy &&
    state.claimedBy !== state.ownerId
  ) {
    entries.push(
      permissionEntry(
        state.claimedBy,
        closed
      )
    );
  }

  // No Seller-role or Support-role allow
  // is added after claim.

  return entries;
}

// ============================================================
// APPLY CHANNEL PERMISSIONS
// ============================================================

async function applyPermissions(channel, state) {
  await channel.permissionOverwrites.set(
    permissions(channel.guild, state),
    "Chuppys strict private ticket access"
  );

  if (channel.topic) {
    await channel.setTopic(null)
      .catch(() => {});
  }
}

// ============================================================
// CATEGORY SYNCHRONIZATION
// ============================================================
//
// Moves verified existing tickets into
// their correct existing categories.
//
// Does not delete or recreate ticket channels.
//
// Does not create duplicate categories.
//
// Keeps channel permissions independent
// from their parent category.
//
// ============================================================

async function syncExistingTickets(guild) {
  await init(guild);
  await guild.channels.fetch();

  const targets = {};

  for (const type of Object.keys(TYPES)) {
    try {
      targets[type] = await category(guild, type);
    } catch (error) {
      console.error(
        `[TICKETS] Missing ${type} category:`,
        error.message
      );
    }
  }

  let moved = 0;
  let secured = 0;

  for (const channel of guild.channels.cache.values()) {
    if (
      channel.type !== ChannelType.GuildText
    ) continue;

    const parsed = parseTicketName(channel.name);
    const cached = cache.get(channel.id);

    if (!parsed && !cached) continue;

    try {
      // Only move tickets with verifiable data.

      const entry = cached ||
        await loadState(channel);

      if (!entry) continue;

      const target = targets[entry.state.type];

      if (!target) continue;

      if (channel.parentId !== target.id) {
        await channel.setParent(target.id, {
          lockPermissions: false
        });

        moved++;
      }

      await applyPermissions(
        channel,
        entry.state
      );

      secured++;
    } catch (error) {
      console.error(
        `[TICKETS] Sync failed: ${channel.name}`,
        error
      );
    }
  }

  console.log(
    `[TICKETS] Sync complete: ${moved} moved, ` +
    `${secured} permission sets refreshed.`
  );
}

// ============================================================
// SIMPLE WHITE LOGS
// ============================================================
//
// OPENED
// CLAIMED
// CLOSED
// DELETED
//
// No raw metadata.
// No creator IDs.
// No username information sections.
// No transcript buttons.
//
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
    const logs = await textChannel(
      guild,
      IDS.logs,
      "Ticket logs"
    );

    const name = ticketName(
      state.type,
      state.number,
      action === "closed" ||
      action === "deleted"
    );

    await logs.send({
      embeds: [
        embed(
          title,
          `**Ticket:** \`${safe(name, 100)}\`\n` +
          `**By:** <@${actorId}>`
        )
      ],
      allowedMentions: { parse: [] }
    });
  } catch (error) {
    console.error(
      `[TICKETS] ${action} log error:`,
      error
    );
  }
}

// ============================================================
// TRANSCRIPTS
// ============================================================

async function allMessages(channel) {
  const messages = [];
  let before;

  for (;;) {
    const batch = await channel.messages.fetch({
      limit: 100,
      ...(before ? { before } : {})
    });

    if (!batch.size) break;

    messages.push(...batch.values());

    if (batch.size < 100) break;
    before = batch.last().id;
  }

  return messages.sort(
    (a, b) =>
      a.createdTimestamp - b.createdTimestamp
  );
}

function transcriptHtml(channel, state, messages) {
  const items = messages.map(message => {
    const attachments = [
      ...message.attachments.values()
    ].map(file => {
      if (!/^https:\/\//i.test(file.url || "")) {
        return "";
      }

      return (
        `<p>Attachment: ` +
        `<a href="${html(file.url)}">` +
        `${html(file.name || "File")}</a></p>`
      );
    }).join("");

    const embeds = message.embeds.map(item => {
      const fields = (item.fields || [])
        .map(field =>
          `<p><b>${html(field.name)}</b>: ` +
          `${html(field.value)}</p>`
        )
        .join("");

      return (
        `<blockquote>` +
        `<b>${html(item.title || "Embed")}</b>` +
        `<p>${html(item.description || "")}</p>` +
        fields +
        `</blockquote>`
      );
    }).join("");

    return (
      `<article>` +
      `<b>${html(message.author?.username || "Unknown")}</b>` +
      ` <small>${html(
        new Date(message.createdTimestamp).toISOString()
      )}</small>` +
      `<div>${html(message.content || "")}</div>` +
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
<title>Ticket ${state.number}</title>
<style>
body {
  background: #15141c;
  color: #eee;
  font: 15px/1.6 system-ui;
  max-width: 850px;
  margin: 30px auto;
  padding: 0 18px;
}
article {
  border-bottom: 1px solid #444;
  padding: 14px 0;
}
article div, blockquote {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
blockquote {
  border-left: 3px solid #ddd;
  padding: 8px 14px;
  background: #292734;
}
small { color: #aaa; }
a { color: #aaccff; }
</style>
</head>
<body>
<h1>${html(BRAND)} — Ticket Transcript</h1>
<p>${html(channel.name)} | Ticket #${state.number} |
${messages.length} messages</p>
${items}
</body>
</html>`;
}

async function saveTranscript(channel, state) {
  const storage = await textChannel(
    channel.guild,
    IDS.transcripts,
    "Ticket transcripts"
  );

  const messages = await allMessages(channel);

  const buffer = Buffer.from(
    transcriptHtml(channel, state, messages),
    "utf8"
  );

  if (buffer.length > 7 * 1024 * 1024) {
    throw new Error(
      "Transcript is larger than 7 MB."
    );
  }

  const file = new AttachmentBuilder(buffer, {
    name:
      `transcript-${state.type}-${state.number}.html`
  });

  const message = await storage.send({
    content: `Transcript: ${safe(channel.name, 100)}`,
    files: [file],
    allowedMentions: { parse: [] }
  });

  return message.url;
}

// ============================================================
// FORMS
// ============================================================

function ticketForm(type) {
  const settings = TYPES[type];

  const modal = new ModalBuilder()
    .setCustomId(FORM_PREFIX + type)
    .setTitle(`${settings.label} Ticket`);

  settings.questions.forEach((question, index) => {
    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId(`answer_${index}`)
          .setLabel(question.slice(0, 45))
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(250)
      )
    );
  });

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
// CREATE TICKET
// ============================================================

async function createTicket(
  interaction,
  type,
  answers = []
) {
  return queued(async () => {
    const guild = interaction.guild;
    const settings = TYPES[type];

    if (!settings) {
      throw new Error("Invalid ticket type.");
    }

    const already = await existingTicket(
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

    const parent = await category(guild, type);
    const number = await nextNumber(guild);

    const state = {
      channelId: null,
      ownerId: interaction.user.id,
      type,
      number,
      status: "open",
      claimedBy: null,
      controlMessageId: null,
      closeReason: "No further action required.",
      transcriptUrl: null,
      createdAt: new Date().toISOString()
    };

    const channel = await guild.channels.create({
      name: ticketName(type, number),
      type: ChannelType.GuildText,
      parent: parent.id,
      topic: null,
      permissionOverwrites:
        permissions(guild, state),
      reason:
        `Ticket opened by ${interaction.user.id}`
    });

    state.channelId = channel.id;

    const entry = {
      state,
      storageMessageId: null
    };

    await saveState(channel, entry);

    const details =
      settings.questions?.length && answers.length
        ? settings.questions.map(
            (question, index) =>
              `**${question}**\n` +
              safe(answers[index], 250)
          ).join("\n\n")
        : settings.description;

    const pingRoles = (
      type === "purchase" || type === "cashout"
        ? [IDS.seller, IDS.support]
        : [IDS.support]
    ).filter(id => guild.roles.cache.has(id));

    const welcome = await channel.send({
      content: [
        `<@${interaction.user.id}>`,
        ...pingRoles.map(id => `<@&${id}>`)
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

      components: controls(state),

      allowedMentions: {
        parse: [],
        users: [interaction.user.id],
        roles: pingRoles
      }
    });

    state.controlMessageId = welcome.id;

    await saveState(channel, entry);

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
// UPDATE BUTTONS
// ============================================================

async function updateControls(channel, state) {
  if (!state.controlMessageId) return;

  const message = await channel.messages.fetch(
    state.controlMessageId
  ).catch(() => null);

  if (!message) return;

  await message.edit({
    components: controls(state)
  });
}

// ============================================================
// CLAIM TICKET
// ============================================================
//
// FIX:
// Fetches real member roles.
// Checks Seller ID 1550322075208646766.
// Saves exact claiming USER ID.
// Replaces all channel overwrites.
// Keeps Owner, Mod, Buyer, Claimer.
// Removes Seller and Support role-wide access.
//
// ============================================================

async function claim(context, channel, entry) {
  const state = entry.state;
  const roles = await getRoleInfo(context);

  if (!mayClaim(roles, state)) {
    return reply(
      context,
      "You do not have permission to claim this ticket."
    );
  }

  if (state.status === "closed") {
    return reply(
      context,
      "Reopen this ticket first."
    );
  }

  // Already claimed: allow claimer, Owner or Mod
  // to refresh the permissions.

  if (state.claimedBy) {
    if (
      state.claimedBy === context.user.id ||
      roles.owner ||
      roles.mod
    ) {
      await applyPermissions(channel, state);
      await saveState(channel, entry);

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

  const original = state.claimedBy;

  state.claimedBy = context.user.id;

  try {
    await applyPermissions(channel, state);
  } catch (error) {
    state.claimedBy = original;
    throw error;
  }

  await saveState(channel, entry);

  await updateControls(channel, state);

  await channel.send({
    embeds: [
      embed(
        "Ticket Claimed",
        `Claimed by <@${context.user.id}>.`
      )
    ],
    allowedMentions: { parse: [] }
  });

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

async function closeTicket(
  context,
  channel,
  entry,
  reason
) {
  const state = entry.state;
  const roles = await getRoleInfo(context);

  if (
    !mayManage(roles, state, context.user.id)
  ) {
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

  const transcriptUrl = await saveTranscript(
    channel,
    state
  );

  state.status = "closed";
  state.closeReason =
    reason || "No further action required.";
  state.transcriptUrl = transcriptUrl;

  await applyPermissions(channel, state);

  await channel.setName(
    ticketName(state.type, state.number, true)
  );

  await saveState(channel, entry);
  await updateControls(channel, state);

  await logTicket(
    channel.guild,
    state,
    "closed",
    context.user.id
  );

  return reply(
    context,
    "This ticket has been closed successfully."
  );
}

// ============================================================
// REOPEN TICKET
// ============================================================

async function reopen(context, channel, entry) {
  const state = entry.state;
  const roles = await getRoleInfo(context);

  if (
    !mayManage(roles, state, context.user.id)
  ) {
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

  await applyPermissions(channel, state);

  await channel.setName(
    ticketName(state.type, state.number)
  );

  await saveState(channel, entry);
  await updateControls(channel, state);

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
  const state = entry.state;
  const roles = await getRoleInfo(context);

  if (
    !mayManage(roles, state, context.user.id)
  ) {
    return reply(
      context,
      "You cannot delete this ticket."
    );
  }

  if (state.status !== "closed") {
    return reply(
      context,
      "Close this ticket first."
    );
  }

  state.transcriptUrl = await saveTranscript(
    channel,
    state
  );

  await saveState(channel, entry);

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

  cache.delete(channel.id);
}

// ============================================================
// TICKET PANEL COMMAND
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

  const channel = await textChannel(
    interaction.guild,
    IDS.panel,
    "Ticket panel"
  );

  const messages = await channel.messages.fetch({
    limit: 100
  });

  const existing = messages.find(
    message =>
      message.author.id ===
        interaction.client.user.id &&
      message.components.some(
        row => row.components.some(
          component =>
            SELECT_IDS.has(component.customId)
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

async function select(interaction) {
  const type = String(
    interaction.values?.[0] || ""
  ).toLowerCase();

  if (!TYPES[type]) {
    return reply(
      interaction,
      "Invalid ticket category."
    );
  }

  if (TYPES[type].questions?.length) {
    return interaction.showModal(
      ticketForm(type)
    );
  }

  // Support, Giveaway and Partnership
  // open directly without a modal.

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const result = await createTicket(
    interaction,
    type
  );

  return reply(
    interaction,
    result.existing
      ? `You already have an open ticket: ${result.channel}`
      : `Your ${TYPES[type].label} ticket is ready: ${result.channel}`
  );
}

// ============================================================
// PURCHASE / CASHOUT FORM
// ============================================================

async function submitForm(interaction) {
  const type = interaction.customId.slice(
    FORM_PREFIX.length
  );

  if (!TYPES[type]?.questions) {
    return reply(
      interaction,
      "Invalid ticket form."
    );
  }

  const answers = TYPES[type].questions.map(
    (_, index) =>
      interaction.fields.getTextInputValue(
        `answer_${index}`
      )
  );

  await interaction.deferReply({
    flags: EPHEMERAL
  });

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
}

// ============================================================
// BUTTON ACTION DETECTION
// ============================================================

function actionFor(customId) {
  for (const [name, id] of Object.entries(BUTTONS)) {
    if (id === customId) return name;
  }

  if (
    customId.startsWith("chuppys_ticket:")
  ) {
    const name = customId.slice(
      "chuppys_ticket:".length
    );

    if (
      ["claim", "close", "reopen", "delete"]
        .includes(name)
    ) {
      return name;
    }
  }

  return null;
}

// ============================================================
// BUTTON HANDLER
// ============================================================

async function buttonAction(interaction, name) {
  const channel = interaction.channel;

  // Close needs to show its modal first.

  if (name === "close") {
    const entry = await loadState(channel);

    if (!entry) {
      return reply(
        interaction,
        "This is not a recognized Chuppys ticket."
      );
    }

    const roles = await getRoleInfo(interaction);

    if (
      !mayManage(
        roles,
        entry.state,
        interaction.user.id
      )
    ) {
      return reply(
        interaction,
        "You cannot close this ticket."
      );
    }

    if (entry.state.status === "closed") {
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
    const entry = await loadState(channel);

    if (!entry) {
      return reply(
        interaction,
        "This is not a recognized Chuppys ticket."
      );
    }

    if (name === "claim") {
      return claim(interaction, channel, entry);
    }

    if (name === "reopen") {
      return reopen(interaction, channel, entry);
    }

    if (name === "delete") {
      return deleteTicket(
        interaction,
        channel,
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
// CLOSE MODAL
// ============================================================

async function closeForm(interaction) {
  const channelId = interaction.customId.slice(
    CLOSE_PREFIX.length
  );

  if (channelId !== interaction.channelId) {
    return reply(
      interaction,
      "This close form belongs to another ticket."
    );
  }

  const reason = interaction.fields
    .getTextInputValue("close_reason")
    .trim();

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return queued(async () => {
    const entry = await loadState(
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

async function prefixCommand(message) {
  if (
    !message.guild ||
    message.author.bot ||
    !message.content.startsWith(",")
  ) return;

  const raw = message.content.slice(1).trim();

  const [commandName] = raw.split(/\s+/, 1);
  const name = String(
    commandName || ""
  ).toLowerCase();

  if (
    !["claim", "close", "reopen", "delete"]
      .includes(name)
  ) return;

  if (
    message.channel.type !==
    ChannelType.GuildText
  ) return;

  const context = messageContext(message);

  const reason = raw
    .slice(commandName.length)
    .trim()
    .slice(0, 500);

  return queued(async () => {
    const entry = await loadState(
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

    if (name === "close") {
      return closeTicket(
        context,
        message.channel,
        entry,
        reason
      );
    }

    if (name === "reopen") {
      return reopen(
        context,
        message.channel,
        entry
      );
    }

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
  if (client.__chuppysTicketsInstalled) {
    return;
  }

  client.__chuppysTicketsInstalled = true;

  const onReady = async () => {
    try {
      if (!process.env.DISCORD_GUILD_ID) {
        throw new Error(
          "DISCORD_GUILD_ID is missing."
        );
      }

      const guild = await client.guilds.fetch(
        process.env.DISCORD_GUILD_ID
      );

      await guild.roles.fetch();

      // Check required roles.
      for (const [label, id] of [
        ["Owner", IDS.owner],
        ["Mod", IDS.mod],
        ["Seller", IDS.seller]
      ]) {
        if (!guild.roles.cache.has(id)) {
          console.error(
            `[TICKETS] ${label} role missing: ${id}`
          );
        }
      }

      await init(guild);

      await syncExistingTickets(guild);

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
        `[TICKETS] Mod role: ${IDS.mod}`
      );

      console.log(
        "[TICKETS] Private seller claims enabled."
      );

      console.log(
        "[TICKETS] Support tickets enabled."
      );

      console.log(
        "[TICKETS] Category syncing enabled."
      );

    } catch (error) {
      console.error(
        "[TICKETS] Startup error:",
        error
      );
    }
  };

  client.once(
    Events.ClientReady,
    onReady
  );

  if (client.isReady()) {
    onReady().catch(console.error);
  }

  // ==========================================================
  // PREFIX COMMAND LISTENER
  // ==========================================================

  client.on(
    Events.MessageCreate,
    async message => {
      try {
        await prefixCommand(message);
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
              safe(error.message),
            allowedMentions: { parse: [] }
          }).catch(console.error);
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
        interaction.commandName === "ticketpanel";

      const isSelect =
        interaction.isStringSelectMenu() &&
        SELECT_IDS.has(interaction.customId);

      const isForm =
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(FORM_PREFIX);

      const isClose =
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(CLOSE_PREFIX);

      const buttonName =
        interaction.isButton()
          ? actionFor(interaction.customId)
          : null;

      if (
        !isPanel &&
        !isSelect &&
        !isForm &&
        !isClose &&
        !buttonName
      ) return;

      try {
        if (!interaction.inGuild()) {
          return reply(
            interaction,
            "Tickets only work inside the server."
          );
        }

        if (isPanel) {
          return await postPanel(interaction);
        }

        if (isSelect) {
          return await select(interaction);
        }

        if (isForm) {
          return await submitForm(interaction);
        }

        if (isClose) {
          return await closeForm(interaction);
        }

        if (buttonName) {
          return await buttonAction(
            interaction,
            buttonName
          );
        }
      } catch (error) {
        console.error(
          "[TICKETS] Interaction error:",
          error
        );

        await reply(
          interaction,
          "Ticket error: " + safe(error.message)
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

module.exports = setupTickets;
module.exports.command = command;

// ============================================================
// END OF CHUPPYS TICKET SYSTEM
// ============================================================
