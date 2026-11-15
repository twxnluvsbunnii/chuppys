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
// ,forceclaim     OWNER ONLY
// ,close
// ,close reason
// ,reopen
// ,delete
//
// FEATURES:
// - Purchase tickets
// - Cashout tickets
// - Giveaway tickets
// - Partnership tickets WITH 2 QUESTIONS
// - Support tickets without a modal
// - ONLY role 1550322075208646766 qualifies as Seller
// - All 11 seller user IDs included
// - Other sellers lose access after a claim
// - Individual seller who claimed keeps access
// - Buyer, Owner and Mod retain access
// - Owner-only forceclaim
// - Simple white logs
// - White Ticket Claimed embed
// - White Ticket Closed embed
// - Private HTML transcripts
// - Existing global counter and V3 metadata
// - Legacy ticket recovery
// - Existing categories, no duplicates
// - Single handler installation
// - Duplicate event protection
// - Seller privacy verification
//
// IMPORTANT:
// - Enable Message Content Intent
// - Bot needs Manage Channels and Manage Roles
// - Run only ONE Render instance
// - Remove old ticket handlers from other files
// - Administrator members bypass channel privacy
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

  // THE ONLY SELLER ROLE
  seller: "1550322075208646766"
});

// ============================================================
// ALL 11 SELLER USER IDS
// ============================================================
//
// These are USER IDs, not role IDs.
//
// A member still needs the Seller role
// to claim Purchase or Cashout tickets.
//
// These IDs help the bot remove individual
// sellers from claimed tickets.
//
// ============================================================

const SELLER_USER_IDS = new Set([
  "1192248188409749684", // Services Seller
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

const EPHEMERAL =
  MessageFlags.Ephemeral;

const PREFIX = ",";

// ============================================================
// STORAGE PREFIXES — DO NOT CHANGE
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

    env:
      "PURCHASE_TICKET_CATEGORY_ID",

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

    env:
      "CASHOUT_TICKET_CATEGORY_ID",

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

    env:
      "GIVEAWAY_TICKET_CATEGORY_ID",

    categories: [
      "Giveaway tickets"
    ],

    description:
      "Please explain the giveaway you won."
  },

  partnership: {
    label: "Partnership",

    env:
      "PARTNERSHIP_TICKET_CATEGORY_ID",

    categories: [
      "Partnership tickets"
    ],

    description:
      "Please provide your partnership details.",

    // Partnership questions requested.
    questions: [
      "How many vouches?",
      "How many server members?"
    ]
  },

  support: {
    label: "Support",

    env:
      "SUPPORT_TICKET_CATEGORY_ID",

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

const command =
  new SlashCommandBuilder()
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

let queue = Promise.resolve();

let initialization = null;

let initialized = false;

let globalCounter = 0;

let counterMessageId = null;

// ============================================================
// SERIAL QUEUE
// ============================================================

function queued(task) {
  const next = queue.then(task);

  queue = next.catch(() => {});

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
// MEMBER ROLE CHECKS
// ============================================================
//
// Every important permission check
// fetches the current guild member.
//
// Seller authorization uses ONLY:
//
// 1550322075208646766
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

  return context.guild.members.fetch({
    user: context.user.id,
    force: true
  });
}

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
  return hasRole(
    member,
    IDS.mod
  );
}

function isSeller(member) {
  return hasRole(
    member,
    IDS.seller
  );
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
//
// PURCHASE/CASHOUT:
//
// - Seller role
// - Owner
// - Mod
//
// OTHER TICKETS:
//
// - Support
// - Admin
// - Owner
// - Mod
//
// No verified-role seller authorization.
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
    isTradingTicket(state)
  ) {
    return isSeller(member);
  }

  return (
    hasRole(member, IDS.support) ||
    hasRole(member, IDS.admin)
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
    return (
      state.claimedBy === member.id
    );
  }

  return canClaim(
    member,
    state
  );
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

    user: message.author
  };
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
        .setCustomId(
          BUTTONS.reopen
        )
        .setLabel("Reopen")
        .setEmoji("🔓")
        .setStyle(
          ButtonStyle.Success
        ),

      new ButtonBuilder()
        .setCustomId(
          BUTTONS.delete
        )
        .setLabel("Delete")
        .setEmoji("🗑️")
        .setStyle(
          ButtonStyle.Danger
        )
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(
          BUTTONS.claim
        )
        .setLabel(
          state.claimedBy
            ? "Claimed"
            : "Claim"
        )
        .setEmoji("🙋")
        .setStyle(
          ButtonStyle.Primary
        ),

      new ButtonBuilder()
        .setCustomId(
          BUTTONS.close
        )
        .setLabel("Close")
        .setEmoji("🔒")
        .setStyle(
          ButtonStyle.Danger
        )
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

function parseState(message) {
  const content =
    message?.content || "";

  const prefix = [
    STATE_PREFIX,
    ...LEGACY_PREFIXES
  ].find(
    value =>
      content.startsWith(value)
  );

  if (!prefix) {
    return null;
  }

  try {
    return normalizeState(
      JSON.parse(
        content.slice(
          prefix.length
        )
      )
    );
  } catch {
    return null;
  }
}

// ============================================================
// SCAN STORAGE
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

    for (
      const message of
      batch.values()
    ) {
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
    JSON.stringify(
      entry.state
    );

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

  tickets.set(
    channel.id,
    entry
  );
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

              recovered: false
            }
          );
        }
      }

      if (
        message.content.startsWith(
          COUNTER_PREFIX
        )
      ) {
        const number =
          Number(
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
                n =>
                  Number.isSafeInteger(n) &&
                  n >= 0
              )
              .reduce(
                (sum, n) =>
                  sum + n,
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

    for (
      const [id, entry] of
      tickets
    ) {
      if (
        entry.storageMessageId
      ) {
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
      `[TICKETS] Loaded ${tickets.size} saved tickets.`
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
// NEXT NUMBER
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
// RECOVER EXISTING TICKETS
// ============================================================

function validWelcome(
  message,
  parsed,
  botId
) {
  if (
    message.author.id !==
    botId
  ) {
    return false;
  }

  const hasButtons =
    message.components.some(
      row =>
        row.components.some(
          component =>
            Object.values(BUTTONS)
              .includes(
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
    embed => {
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
            .label.toLowerCase()
        ) ||

        (
          parsed.type === "cashout" &&
          title.includes("cashout")
        )
      );
    }
  );
}

function extractOwner(message) {
  for (
    const embed of
    message.embeds
  ) {
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

async function recoverTicket(channel) {
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
      const message of
      batch.values()
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
          null,

        recovered:
          true
      };

      await saveState(
        channel,
        entry
      );

      return entry;
    }

    if (
      batch.size < 100
    ) {
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
    tickets.has(channel.id)
  ) {
    return tickets.get(
      channel.id
    );
  }

  const legacy =
    fromTopic(channel);

  if (legacy) {
    const entry = {
      state:
        legacy,

      storageMessageId:
        null,

      recovered:
        false
    };

    await saveState(
      channel,
      entry
    );

    return entry;
  }

  return recoverTicket(
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
    tickets.values()
  ) {
    const state =
      entry.state;

    if (
      state.ownerId !== userId ||
      state.type !== type ||
      state.status !== "open"
    ) {
      continue;
    }

    const channel =
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
      parseTicketName(
        channel.name
      );

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
// EXISTING CATEGORY LOOKUP
// ============================================================
//
// Support accepts common category names.
//
// No duplicate categories are created.
//
// ============================================================

async function category(
  guild,
  type
) {
  const config =
    TYPES[type];

  if (!config) {
    throw new Error(
      `Invalid ticket type: ${type}`
    );
  }

  await guild.channels.fetch();

  const configuredId =
    process.env[config.env];

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
      `[TICKETS] Invalid ${config.env}; trying category names.`
    );
  }

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

  for (
    const name of
    config.categories
  ) {
    const found =
      categories.find(
        channel =>
          normalize(channel.name) ===
          normalize(name)
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
// ROLE AND MEMBER OVERWRITES
// ============================================================
//
// FIXED SELLER CLAIMING SYSTEM
//
// BEFORE CLAIM:
//
// - All sellers can view Purchase/Cashout
// - Buyer can view
// - Owner can view
// - Mod can view
//
// AFTER CLAIM:
//
// - The claiming seller can view
// - Buyer can view
// - Owner can view
// - Mod can view
// - Other listed sellers are individually denied
// - Other staff role access is removed
//
// WHY THIS WORKS:
//
// Discord may allow a seller access through
// a second role or another channel overwrite.
//
// Instead of relying only on removing the
// Seller role's allow, we also add individual
// permission denies for the other sellers.
//
// Individual member denies take precedence
// over role permissions.
//
// We do NOT deny Owner/Mod members.
//
// Administrator permissions cannot be denied
// through ticket channel overwrites.
//
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
// FETCH SELLER MEMBERS
// ============================================================
//
// Fetch the current member roles so the bot
// does not accidentally deny Owners or Mods.
//
// ============================================================

async function fetchListedSellers(guild) {
  const members = new Map();

  for (const id of SELLER_USER_IDS) {
    try {
      const member =
        await guild.members.fetch({
          user: id,
          force: true
        });

      members.set(
        id,
        member
      );
    } catch (error) {
      // Unknown or departed members do not
      // need a permission overwrite.
      //
      // Do not silently ignore other errors.
      if (
        error?.code === 10007 ||
        error?.rawError?.code === 10007
      ) {
        continue;
      }

      throw error;
    }
  }

  return members;
}

// ============================================================
// BUILD TICKET PERMISSIONS
// ============================================================

async function permissions(guild, state) {
  const closed =
    state.status === "closed";

  await guild.roles.fetch();

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
    result.set(
      entry.id,
      entry
    );
  }

  // ==========================================================
  // EVERYONE DENIED
  // ==========================================================

  add({
    id:
      guild.roles.everyone.id,

    type:
      OverwriteType.Role,

    deny: [
      PermissionFlagsBits.ViewChannel
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
      ...FULL_PERMISSIONS,

      PermissionFlagsBits.ManageChannels,

      PermissionFlagsBits.ManageMessages
    ]
  });

  // ==========================================================
  // OWNER
  // ==========================================================

  if (
    guild.roles.cache.has(
      IDS.owner
    )
  ) {
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
  // MOD ROLE ALWAYS ALLOWED
  // ==========================================================

  if (
    guild.roles.cache.has(
      IDS.mod
    )
  ) {
    add(role(IDS.mod));
  }

  // ==========================================================
  // BEFORE CLAIM ONLY
  // ==========================================================

  if (!state.claimedBy) {
    const staffRoles =
      isTradingTicket(state)
        ? [
            IDS.seller,
            IDS.support,
            IDS.admin
          ]
        : [
            IDS.support,
            IDS.admin
          ];

    for (
      const id of
      new Set(staffRoles)
    ) {
      if (
        guild.roles.cache.has(id)
      ) {
        add(role(id));
      }
    }
  }

  // ==========================================================
  // AFTER CLAIM: REMOVE OTHER SELLERS
  // ==========================================================
  //
  // We do not give the Seller role a
  // ViewChannel allow after a claim.
  //
  // Individual denies are added for
  // each supplied seller user ID.
  //
  // This blocks ordinary additional
  // staff role permissions as well.
  //
  // ==========================================================

  if (
    state.claimedBy &&
    isTradingTicket(state)
  ) {
    const listedMembers =
      await fetchListedSellers(guild);

    for (
      const [id, sellerMember] of
      listedMembers
    ) {
      // Never block the claimer.
      if (
        id === state.claimedBy
      ) {
        continue;
      }

      // Never block the ticket creator.
      if (
        id === state.ownerId
      ) {
        continue;
      }

      // Never block the configured owner
      // or actual server owner.
      if (
        id === IDS.owner ||
        id === guild.ownerId
      ) {
        continue;
      }

      // Keep Owner and Mod access.
      if (
        isOwner(sellerMember) ||
        isMod(sellerMember)
      ) {
        continue;
      }

      // Explicit member-level DENY.
      //
      // This wins over channel role
      // allows from ordinary roles.
      add({
        id,

        type:
          OverwriteType.Member,

        deny:
          HIDDEN_PERMISSIONS
      });
    }
  }

  // ==========================================================
  // TICKET CREATOR ALWAYS ALLOWED
  // ==========================================================

  add(
    member(state.ownerId)
  );

  // ==========================================================
  // EXACT CLAIMING MEMBER ALLOWED
  // ==========================================================

  if (state.claimedBy) {
    add(
      member(state.claimedBy)
    );
  }

  // ==========================================================
  // CHANNEL OVERWRITE LIMIT
  // ==========================================================

  if (
    result.size > 100
  ) {
    throw new Error(
      "Discord allows a maximum of 100 " +
      "permission overwrites per channel."
    );
  }

  return [
    ...result.values()
  ];
}

// ============================================================
// VERIFY CLAIMED TICKET PRIVACY
// ============================================================
//
// After overwrites are applied:
//
// - Confirm the claimer has ViewChannel
// - Check each other listed seller
// - Warn about Administrator bypasses
// - Report unexpected visibility
//
// The log is private to Render.
//
// ============================================================

async function verifyClaimPrivacy(
  channel,
  state
) {
  if (
    !state.claimedBy ||
    !isTradingTicket(state)
  ) {
    return;
  }

  const guild =
    channel.guild;

  const fresh =
    await guild.channels.fetch(
      channel.id,
      {
        force: true
      }
    );

  if (!fresh) {
    throw new Error(
      "Could not verify ticket channel permissions."
    );
  }

  // ==========================================================
  // VERIFY CLAIMING SELLER
  // ==========================================================

  const claimer =
    await guild.members.fetch({
      user: state.claimedBy,
      force: true
    });

  const claimerCanView =
    fresh.permissionsFor(
      claimer
    )?.has(
      PermissionFlagsBits.ViewChannel
    );

  if (!claimerCanView) {
    throw new Error(
      "Ticket privacy error: The claiming " +
      "seller does not have ViewChannel."
    );
  }

  // ==========================================================
  // VERIFY TICKET CREATOR
  // ==========================================================

  const buyer =
    await guild.members.fetch({
      user: state.ownerId,
      force: true
    }).catch(() => null);

  if (
    buyer &&
    !fresh.permissionsFor(buyer)?.has(
      PermissionFlagsBits.ViewChannel
    )
  ) {
    throw new Error(
      "Ticket privacy error: The ticket " +
      "creator lost channel access."
    );
  }

  // ==========================================================
  // VERIFY OTHER SELLERS
  // ==========================================================

  const visibleSellers = [];
  const administratorSellers = [];

  const listedMembers =
    await fetchListedSellers(guild);

  for (
    const [id, sellerMember] of
    listedMembers
  ) {
    // Allowed exceptions.
    if (
      id === state.claimedBy ||
      id === state.ownerId ||
      id === IDS.owner ||
      id === guild.ownerId
    ) {
      continue;
    }

    if (
      isOwner(sellerMember) ||
      isMod(sellerMember)
    ) {
      continue;
    }

    // Discord Administrator bypass.
    if (
      sellerMember.permissions.has(
        PermissionFlagsBits.Administrator
      )
    ) {
      administratorSellers.push(id);

      continue;
    }

    const canView =
      fresh.permissionsFor(
        sellerMember
      )?.has(
        PermissionFlagsBits.ViewChannel
      );

    if (canView) {
      visibleSellers.push(id);
    }
  }

  if (
    administratorSellers.length
  ) {
    console.warn(
      `[TICKETS] Administrator sellers can ` +
      `still see ticket ${channel.id}: ` +
      administratorSellers.join(", ")
    );
  }

  if (
    visibleSellers.length
  ) {
    console.error(
      `[TICKETS] PRIVACY FAILURE in ` +
      `${channel.name}. Sellers still ` +
      `have ViewChannel: ` +
      visibleSellers.join(", ")
    );

    throw new Error(
      "Claim privacy check failed. " +
      "Other sellers can still view the ticket. " +
      "Check Render logs for their user IDs."
    );
  }

  console.log(
    `[TICKETS] Claim privacy verified: ` +
    `${channel.name}, claimer ${state.claimedBy}`
  );
}

// ============================================================
// APPLY CHANNEL PRIVACY
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

  // Replaces all existing overwrites,
  // including old Seller-role permissions
  // and outdated individual permissions.
  await channel.permissionOverwrites.set(
    overwrites,
    "Chuppys private ticket permissions"
  );

  // Verify the permissions immediately
  // after changing a claimed ticket.
  if (
    state.claimedBy &&
    isTradingTicket(state)
  ) {
    await verifyClaimPrivacy(
      channel,
      state
    );
  }

  if (channel.topic) {
    await channel.setTopic(null)
      .catch(() => {});
  }
}

// ============================================================
// CATEGORY SYNCHRONIZATION
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
      parseTicketName(
        channel.name
      );

    const cached =
      tickets.get(
        channel.id
      );

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

    if (!target) {
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
            lockPermissions: false
          }
        );

        moved++;
      }

      // Don't reset unverified historical
      // claims on recovered tickets.
      if (!entry.recovered) {
        await applyPermissions(
          channel,
          entry.state
        );

        refreshed++;
      }
    } catch (error) {
      console.error(
        `[TICKETS] Sync failed for ${channel.name}:`,
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
// SIMPLE WHITE LOGS
// ============================================================
//
// Ticket Opened
// Ticket Claimed
// Ticket Closed
// Ticket Deleted
//
// No transcript links or long information.
//
// ============================================================

async function logTicket(
  guild,
  state,
  action,
  actorId
) {
  const titles = {
    opened: "Ticket Opened",
    claimed: "Ticket Claimed",
    closed: "Ticket Closed",
    deleted: "Ticket Deleted"
  };

  if (!titles[action]) {
    return;
  }

  try {
    const logs =
      await textChannel(
        guild,
        IDS.logs,
        "Ticket logs"
      );

    const name =
      ticketName(
        state.type,
        state.number,

        action === "closed" ||
        action === "deleted"
      );

    await logs.send({
      embeds: [
        whiteEmbed(
          titles[action],

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
      `[TICKETS] ${action} log failed:`,
      error
    );
  }
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
// HTML TRANSCRIPT
// ============================================================

function transcriptHtml(
  channel,
  state,
  messages
) {
  const rows =
    messages.map(
      message => {
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
        ].map(
          file => {
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
          }
        ).join("");

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
      }
    ).join("\n");

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

  const file =
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
        `Transcript: ${safe(channel.name, 100)}`,

      files: [file],

      allowedMentions: {
        parse: []
      }
    });

  return message.url;
}

// ============================================================
// PURCHASE / CASHOUT / PARTNERSHIP FORM
// ============================================================
//
// Purchase: 4 questions
// Cashout: 4 questions
// Partnership: 2 questions
//
// Partnership proof is uploaded inside
// the ticket after the form is submitted.
//
// ============================================================

function ticketForm(type) {
  const config =
    TYPES[type];

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
            question.slice(
              0,
              45
            )
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
          .addComponents(
            input
          )
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

    // Find category before spending
    // the next ticket number.
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
      channelId: null,

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

    // ========================================================
    // CREATE PRIVATE CHANNEL
    // ========================================================

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

        // Updated permissions() is async,
        // so await it before creation.
        permissionOverwrites:
          await permissions(
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
        null,

      recovered:
        false
    };

    await saveState(
      channel,
      entry
    );

    // ========================================================
    // DISPLAY ANSWERS
    // ========================================================

    const details =
      config.questions?.length &&
      answers.length
        ? config.questions
            .map(
              (question, index) =>
                `**${question}**\n` +
                safe(
                  answers[index],
                  250
                )
            )
            .join("\n\n")
        : config.description;

    // ========================================================
    // PARTNERSHIP PROOF INSTRUCTION
    // ========================================================

    const proofInstruction =
      type === "partnership"
        ? (
            "\n\n**Please show us proof " +
            "of your vouches in this ticket!**"
          )
        : "";

    // ========================================================
    // STAFF PINGS
    // ========================================================

    const pingRoles = (
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

    // ========================================================
    // SEND TICKET WELCOME
    // ========================================================

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
  if (
    !state.controlMessageId
  ) {
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
        controls(state)
    });
  }
}

// ============================================================
// CLAIM TICKET
// ============================================================
//
// The seller who claims still has
// the Seller role.
//
// AFTER CLAIM:
//
// - Other listed sellers individually denied
// - Claimer user ID explicitly allowed
// - Ticket creator explicitly allowed
// - Owner and Mod allowed
// - Old staff role access removed
// - Claimed privacy verified
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

  // ==========================================================
  // FORCECLAIM — OWNER ONLY
  // ==========================================================

  if (
    force &&
    !isOwner(member)
  ) {
    return reply(
      context,
      "Only owners can use ,forceclaim."
    );
  }

  // ==========================================================
  // REGULAR CLAIM
  // ==========================================================

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

  if (
    state.status !== "open"
  ) {
    return reply(
      context,
      "Reopen this ticket first."
    );
  }

  // ==========================================================
  // ALREADY CLAIMED
  // ==========================================================

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
      // Reapply and verify all privacy rules.
      await applyPermissions(
        channel,
        state
      );

      await updateControls(
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

  if (
    force &&
    state.claimedBy ===
    context.user.id
  ) {
    await applyPermissions(
      channel,
      state
    );

    return reply(
      context,
      "You already claimed this ticket."
    );
  }

  // ==========================================================
  // NEW CLAIM OR FORCECLAIM
  // ==========================================================

  const previousClaimer =
    state.claimedBy;

  state.claimedBy =
    context.user.id;

  try {
    // Apply the complete privacy setup.
    //
    // All old permission overwrites
    // are replaced.
    //
    // Other listed sellers receive
    // member-specific denies.
    //
    // The individual claimer receives
    // a member-specific allow.
    //
    // The bot then verifies privacy.
    await applyPermissions(
      channel,
      state
    );
  } catch (error) {
    state.claimedBy =
      previousClaimer;

    throw error;
  }

  // ==========================================================
  // SAVE THE CLAIM
  // ==========================================================

  await saveState(
    channel,
    entry
  );

  await updateControls(
    channel,
    state
  );

  // ==========================================================
  // SHORT WHITE CLAIM EMBED
  // ==========================================================
  //
  // No Private Ticket Access section.
  // No extra privacy explanation.
  //
  // ==========================================================

  await channel.send({
    embeds: [
      whiteEmbed(
        "Ticket Claimed",

        `Claimed by <@${context.user.id}>.`
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  await logTicket(
    channel.guild,
    state,
    "claimed",
    context.user.id
  );

  // No second public prefix message.
  if (
    context.kind === "prefix"
  ) {
    return;
  }

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
// Do not mention the transcript.
// Do not mention ,delete.
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

  // Keep private access after closing.
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

  // ==========================================================
  // WHITE TICKET CLOSED EMBED
  // ==========================================================

  await channel.send({
    embeds: [
      whiteEmbed(
        "Ticket Closed",

        `Closed by <@${context.user.id}>.\n\n` +

        `**Reason:** ${safe(
          state.closeReason,
          450
        )}\n\n` +

        "This ticket is now closed."
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

  // No extra public confirmation
  // when using ,close.
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

  state.status =
    "open";

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
    !canManage(
      member,
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

  tickets.delete(
    channel.id
  );
}

// ============================================================
// PANEL COMMAND
// ============================================================

async function panelCommand(
  interaction
) {
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
//
// Purchase/Cashout show forms.
//
// Partnership shows 2 questions.
//
// Support/Giveaway open directly.
//
// ============================================================

async function selectTicket(
  interaction
) {
  const type =
    String(
      interaction.values?.[0] || ""
    ).toLowerCase();

  if (
    !TYPES[type]
  ) {
    return reply(
      interaction,
      "Please select a valid ticket category."
    );
  }

  // ==========================================================
  // SHOW MODAL IF QUESTIONS EXIST
  // ==========================================================

  if (
    TYPES[type].questions?.length
  ) {
    return interaction.showModal(
      ticketForm(type)
    );
  }

  // ==========================================================
  // SUPPORT/GIVEAWAY OPEN DIRECTLY
  // ==========================================================

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

    if (
      result.existing
    ) {
      return reply(
        interaction,
        `You already have an open ticket: ${result.channel}`
      );
    }

    return reply(
      interaction,

      `Your ${TYPES[type].label} ticket ` +
      `has been created successfully!\n\n` +
      `${result.channel}`
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
//
// Purchase
// Cashout
// Partnership
//
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
        : `Your ${TYPES[type].label} ticket is ready: ${result.channel}`
    );
  } catch (error) {
    console.error(
      `[TICKETS] Form submission failed:`,
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

  if (action === "close") {
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

    const member =
      await getMember(
        interaction
      );

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
        channel.id
      )
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return queued(async () => {
    const entry =
      await loadState(
        channel
      );

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
  });
}

// ============================================================
// CLOSE MODAL SUBMISSION
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
        "Ticket data unavailable."
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
    messageContext(
      message
    );

  const reason =
    raw.slice(
      commandName.length
    )
      .trim()
      .slice(0, 500);

  // Owner-only forceclaim.
  if (
    name === "forceclaim"
  ) {
    const member =
      await getMember(
        context
      );

    if (
      !isOwner(member)
    ) {
      return reply(
        context,
        "Only owners can use ,forceclaim."
      );
    }
  }

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

    if (name === "claim") {
      return claim(
        context,
        message.channel,
        entry
      );
    }

    if (
      name === "forceclaim"
    ) {
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

    return deleteTicket(
      context,
      message.channel,
      entry
    );
  });
}

// ============================================================
// SINGLE HANDLER INSTALLATION
// ============================================================
//
// Prevents THIS module from registering
// twice on the same Discord client.
//
// Cannot disable a separate older handler
// or another running Render process.
//
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
      "[TICKETS] Handler already installed. " +
      "Skipping duplicate installation."
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
    if (
      set.has(id)
    ) {
      return false;
    }

    set.add(id);

    if (
      set.size > 5000
    ) {
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

      await init(
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
        `[TICKETS] Listed seller IDs: ${SELLER_USER_IDS.size}`
      );

      console.log(
        "[TICKETS] Only the configured Seller role authorizes seller claims."
      );

      console.log(
        "[TICKETS] Individual seller privacy protection enabled."
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

  if (
    client.isReady()
  ) {
    onReady().catch(
      console.error
    );
  }

  // ==========================================================
  // SINGLE PREFIX LISTENER
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
        !message.content.startsWith(
          PREFIX
        )
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
  // SINGLE INTERACTION LISTENER
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
          ? actionFor(
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
        !firstTime(
          seenInteractions,
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
    "[TICKETS] Single Chuppys ticket handler installed."
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
