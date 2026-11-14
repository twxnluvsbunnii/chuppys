"use strict";

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
// CONFIGURATION
// ==================================================

const PANEL_CHANNEL_ID = "1530811385678790716";
const LOG_CHANNEL_ID = "1570913954333728808";

const OWNER_ROLE_ID = "1530988662970650865";
const ADMIN_ROLE_ID = "1531800870444994641";
const MOD_ROLE_ID = "1531800784700706887";
const TICKET_SUPPORT_ROLE_ID = "1563003884656398406";
const SELLER_ROLE_ID = "1550322075208646766";
const VERIFIED_ROLE_ID = "1550230619127021568";

const TICKET_EMOJI = "<:chuppyhi:1561103471325745242>";

const ACCESS_ROLES = [
  OWNER_ROLE_ID,
  ADMIN_ROLE_ID,
  MOD_ROLE_ID,
  TICKET_SUPPORT_ROLE_ID,
  SELLER_ROLE_ID
];

const MANAGER_ROLES = [
  OWNER_ROLE_ID,
  ADMIN_ROLE_ID,
  MOD_ROLE_ID,
  TICKET_SUPPORT_ROLE_ID
];

// ==================================================
// CATEGORY-SPECIFIC PINGS
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

  support: [
    OWNER_ROLE_ID,
    ADMIN_ROLE_ID,
    MOD_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ],

  giveaway: [],

  partnership: []
};

// ==================================================
// CATEGORY-SPECIFIC ACCESS
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

  support: [
    OWNER_ROLE_ID,
    ADMIN_ROLE_ID,
    MOD_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
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
  ]
};

// ==================================================
// TICKET TYPES
// ==================================================

const TICKET_TYPES = {
  purchase: {
    label: "Purchase",
    description: "Open a purchase ticket.",
    categoryEnv: "PURCHASE_TICKET_CATEGORY_ID",

    questions: [
      "What are you purchasing?",
      "Who are you buying from?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  cashout: {
    label: "Cash Out",
    description: "Open a cash out ticket.",
    categoryEnv: "CASHOUT_TICKET_CATEGORY_ID",

    questions: [
      "What are you cashing out?",
      "How much are you looking for?",
      "Payment method?",
      "Roblox user?"
    ]
  },

  giveaway: {
    label: "Giveaway",
    description: "Open a giveaway ticket.",
    categoryEnv: "GIVEAWAY_TICKET_CATEGORY_ID"
  },

  partnership: {
    label: "Partnership",
    description: "Open a partnership ticket.",
    categoryEnv: "PARTNERSHIP_TICKET_CATEGORY_ID"
  },

  support: {
    label: "Support",
    description: "Open a support ticket.",
    categoryEnv: "SUPPORT_TICKET_CATEGORY_ID"
  }
};

// ==================================================
// CUSTOM IDS
// ==================================================

const TICKET_SELECT_ID = "chuppys_ticket_select";

const TICKET_SELECT_IDS = new Set([
  "chuppys_ticket_select",
  "chuppys_ticket_category",
  "chuppys_tickets",
  "ticket_select",
  "ticket_category",
  "ticket_open",
  "ticket_create"
]);

const TICKET_MODAL_PREFIX = "chuppys_ticket_form:";

const BUTTON_IDS = {
  claim: "chuppys_ticket_claim",
  close: "chuppys_ticket_close",
  reopen: "chuppys_ticket_reopen",
  delete: "chuppys_ticket_delete"
};

const TRANSCRIPT_BUTTON_PREFIX = "chuppys_transcript:";

// ==================================================
// PRIVATE TICKET STORAGE
// ==================================================

const STATE_PREFIX = "CHUPPYS_TICKET_STATE_V3:";
const OLD_STATE_PREFIX = "CHUPPYS_TICKET_STATE_V2:";

const COUNTER_PREFIX =
  "CHUPPYS_GLOBAL_TICKET_COUNTER_V1:";

const OLD_COUNTER_PREFIX =
  "CHUPPYS_TICKET_COUNTERS_V1:";

const LEGACY_TOPIC_PREFIX = "chuppys-ticket:";

const EPHEMERAL = MessageFlags.Ephemeral;

const ticketCache = new Map();

let ticketQueue = Promise.resolve();

// ==================================================
// SLASH COMMAND EXPORT
// ==================================================

const command = new SlashCommandBuilder()
  .setName("ticketpanel")
  .setDescription("Post or update the Chuppys ticket panel.")
  .setDefaultMemberPermissions(
    PermissionFlagsBits.ManageGuild
  );

// ==================================================
// BASIC HELPERS
// ==================================================

function ticketNumberText(number) {
  return String(number).padStart(4, "0");
}

function ticketChannelName(type, number, closed = false) {
  return (
    `${closed ? "closed-" : ""}${type}-` +
    ticketNumberText(number)
  ).slice(0, 100);
}

function safeText(value) {
  return String(value ?? "")
    .replace(/@/g, "＠")
    .slice(0, 1500);
}

function makeEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor("#FFFFFF")
    .setFooter({
      text: ".gg/chuppys | Ticket System"
    })
    .setTimestamp();
}

function serializeTicketOperation(callback) {
  const operation = ticketQueue.then(callback);

  ticketQueue = operation.catch(() => {});

  return operation;
}

function canManageTicket(interaction) {
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

  const roles = interaction.member?.roles;

  return MANAGER_ROLES.some(roleId => {
    if (roles?.cache) {
      return roles.cache.has(roleId);
    }

    if (Array.isArray(roles)) {
      return roles.includes(roleId);
    }

    return false;
  });
}

function canViewTranscript(interaction) {
  if (
    interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return true;
  }

  const roles = interaction.member?.roles;

  return [
    OWNER_ROLE_ID,
    TICKET_SUPPORT_ROLE_ID
  ].some(roleId => {
    if (roles?.cache) {
      return roles.cache.has(roleId);
    }

    if (Array.isArray(roles)) {
      return roles.includes(roleId);
    }

    return false;
  });
}

async function respond(interaction, content) {
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
// TICKET BUTTONS
// ==================================================

function ticketButtons(closed = false) {
  const row = new ActionRowBuilder();

  if (closed) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.reopen)
        .setLabel("Reopen")
        .setEmoji("🔓")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.delete)
        .setLabel("Delete")
        .setEmoji("🗑️")
        .setStyle(ButtonStyle.Danger)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.claim)
        .setLabel("Claim")
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId(BUTTON_IDS.close)
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
  const dropdown = new StringSelectMenuBuilder()
    .setCustomId(TICKET_SELECT_ID)
    .setPlaceholder("Select a ticket category")
    .addOptions(
      Object.entries(TICKET_TYPES).map(
        ([value, settings]) => ({
          label: settings.label,
          value,
          description: settings.description
        })
      )
    );

  return {
    embeds: [
      makeEmbed(
        `${TICKET_EMOJI} .gg/chuppys Tickets`,
        "Welcome to the Chuppys ticket system!\n\n" +
        "Please select the category that best matches " +
        "what you need assistance with.\n\n" +
        "**Purchase** — Purchase assistance\n" +
        "**Cash Out** — Cashout assistance\n" +
        "**Giveaway** — Giveaway claims\n" +
        "**Partnership** — Partnership inquiries\n" +
        "**Support** — General support\n\n" +
        "Our team will assist you as soon as possible."
      )
    ],

    components: [
      new ActionRowBuilder().addComponents(dropdown)
    ],

    allowedMentions: {
      parse: []
    }
  };
}

// ==================================================
// TICKET LOG CHANNEL
// ==================================================

async function getLogChannel(guild) {
  const channel = await guild.channels.fetch(
    LOG_CHANNEL_ID
  );

  if (
    !channel ||
    !channel.isTextBased() ||
    !channel.messages
  ) {
    throw new Error(
      "Ticket log channel could not be found."
    );
  }

  return channel;
}

// ==================================================
// MESSAGE SEARCH
// ==================================================

async function findMessage(
  channel,
  predicate,
  maxPages = 50
) {
  let before;

  for (let page = 0; page < maxPages; page++) {
    const messages = await channel.messages.fetch({
      limit: 100,
      ...(before ? { before } : {})
    });

    for (const message of messages.values()) {
      if (predicate(message)) {
        return message;
      }
    }

    if (messages.size < 100) {
      return null;
    }

    before = messages.last().id;
  }

  return null;
}

// ==================================================
// GLOBAL TICKET COUNTER
// ==================================================

async function findGlobalCounter(logChannel) {
  return findMessage(
    logChannel,
    message =>
      message.author.id === logChannel.client.user.id &&
      message.content.startsWith(COUNTER_PREFIX)
  );
}

async function getGlobalCounter(logChannel) {
  const existing = await findGlobalCounter(
    logChannel
  );

  if (existing) {
    const number = Number(
      existing.content.slice(
        COUNTER_PREFIX.length
      )
    );

    if (
      Number.isSafeInteger(number) &&
      number >= 0
    ) {
      return {
        message: existing,
        number
      };
    }
  }

  let startingNumber = 0;

  const oldCounter = await findMessage(
    logChannel,
    message =>
      message.author.id === logChannel.client.user.id &&
      message.content.startsWith(
        OLD_COUNTER_PREFIX
      )
  );

  if (oldCounter) {
    try {
      const counters = JSON.parse(
        oldCounter.content.slice(
          OLD_COUNTER_PREFIX.length
        )
      );

      const values = Object.values(counters)
        .map(Number)
        .filter(value =>
          Number.isSafeInteger(value) &&
          value >= 0
        );

      startingNumber = values.reduce(
        (total, value) => total + value,
        0
      );
    } catch (error) {
      console.warn(
        "[TICKETS] Old counter migration failed:",
        error.message
      );
    }
  }

  await logChannel.guild.channels.fetch();

  for (
    const channel
    of logChannel.guild.channels.cache.values()
  ) {
    const match = channel.name?.match(
      /^(?:closed-)?(?:purchase|cashout|support|giveaway|partnership)-(\d+)$/
    );

    if (match) {
      startingNumber = Math.max(
        startingNumber,
        Number(match[1])
      );
    }

    if (
      channel.topic?.startsWith(
        LEGACY_TOPIC_PREFIX
      )
    ) {
      try {
        const oldTicket = JSON.parse(
          channel.topic.slice(
            LEGACY_TOPIC_PREFIX.length
          )
        );

        if (
          Number.isSafeInteger(oldTicket.number)
        ) {
          startingNumber = Math.max(
            startingNumber,
            oldTicket.number
          );
        }
      } catch (_) {}
    }
  }

  const message = await logChannel.send({
    content:
      COUNTER_PREFIX + startingNumber,

    allowedMentions: {
      parse: []
    }
  });

  return {
    message,
    number: startingNumber
  };
}

async function nextTicketNumber(logChannel) {
  const counter = await getGlobalCounter(
    logChannel
  );

  const nextNumber = counter.number + 1;

  await counter.message.edit({
    content:
      COUNTER_PREFIX + nextNumber
  });

  return nextNumber;
}

// ==================================================
// PRIVATE TICKET METADATA
// ==================================================

function parseTicketState(message) {
  if (!message?.content) {
    return null;
  }

  let prefix;

  if (
    message.content.startsWith(
      STATE_PREFIX
    )
  ) {
    prefix = STATE_PREFIX;
  } else if (
    message.content.startsWith(
      OLD_STATE_PREFIX
    )
  ) {
    prefix = OLD_STATE_PREFIX;
  } else {
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

async function findTicketStateMessage(
  logChannel,
  channelId
) {
  return findMessage(
    logChannel,
    message => {
      if (
        message.author.id !==
        logChannel.client.user.id
      ) {
        return false;
      }

      const state = parseTicketState(message);

      return state?.channelId === channelId;
    }
  );
}

async function loadTicketState(channel) {
  if (ticketCache.has(channel.id)) {
    return ticketCache.get(channel.id);
  }

  const logChannel = await getLogChannel(
    channel.guild
  );

  const message = await findTicketStateMessage(
    logChannel,
    channel.id
  );

  const state = parseTicketState(message);

  if (state) {
    const entry = {
      state,
      logMessageId: message.id
    };

    ticketCache.set(channel.id, entry);

    if (channel.topic) {
      await channel.setTopic(null).catch(
        console.error
      );
    }

    return entry;
  }

  // Migrate tickets created by the old Vercel bot.

  if (
    channel.topic?.startsWith(
      LEGACY_TOPIC_PREFIX
    )
  ) {
    try {
      const oldState = JSON.parse(
        channel.topic.slice(
          LEGACY_TOPIC_PREFIX.length
        )
      );

      if (
        !oldState.ownerId ||
        !TICKET_TYPES[oldState.type]
      ) {
        return null;
      }

      const migratedState = {
        channelId: channel.id,
        ownerId: oldState.ownerId,
        type: oldState.type,
        number: oldState.number,
        status: oldState.status || "open",
        claimedBy: oldState.claimedBy || null,
        controlMessageId:
          oldState.controlMessageId || null
      };

      const entry = {
        state: migratedState,
        logMessageId: null
      };

      await saveTicketState(
        channel,
        entry
      );

      await channel.setTopic(null);

      return entry;
    } catch (error) {
      console.error(
        "[TICKETS] Migration error:",
        error
      );
    }
  }

  return null;
}

async function saveTicketState(
  channel,
  entry
) {
  const logChannel = await getLogChannel(
    channel.guild
  );

  const content =
    STATE_PREFIX +
    JSON.stringify(entry.state);

  let message = null;

  if (entry.logMessageId) {
    message = await logChannel.messages
      .fetch(entry.logMessageId)
      .catch(() => null);
  }

  if (message) {
    await message.edit({
      content
    });
  } else {
    message = await logChannel.send({
      content,

      allowedMentions: {
        parse: []
      }
    });

    entry.logMessageId = message.id;
  }

  ticketCache.set(
    channel.id,
    entry
  );

  return entry;
}

// ==================================================
// TICKET CATEGORY
// ==================================================

async function getTicketCategory(
  guild,
  type
) {
  const settings = TICKET_TYPES[type];

  const configuredId =
    process.env[settings.categoryEnv];

  if (configuredId) {
    const category = await guild.channels.fetch(
      configuredId
    );

    if (
      !category ||
      category.type !== ChannelType.GuildCategory
    ) {
      throw new Error(
        `${settings.categoryEnv} is not a valid category.`
      );
    }

    return category;
  }

  await guild.channels.fetch();

  const existing = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === `chuppys-${type}`
  );

  if (existing) {
    return existing;
  }

  return guild.channels.create({
    name: `chuppys-${type}`,
    type: ChannelType.GuildCategory,

    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [
          PermissionFlagsBits.ViewChannel
        ]
      },

      ...TICKET_ACCESS[type].map(
        roleId => ({
          id: roleId,

          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        })
      )
    ]
  });
}

// ==================================================
// PURCHASE / CASHOUT MODALS
// ==================================================

function makeTicketModal(type) {
  const settings = TICKET_TYPES[type];

  const modal = new ModalBuilder()
    .setCustomId(
      TICKET_MODAL_PREFIX + type
    )
    .setTitle(
      `${settings.label} Ticket`
    );

  settings.questions.forEach(
    (question, index) => {
      const input = new TextInputBuilder()
        .setCustomId(`answer_${index}`)
        .setLabel(question)
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMinLength(1)
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
// CHECK EXISTING OPEN TICKETS
// ==================================================

async function findExistingTicket(
  guild,
  userId,
  type
) {
  await guild.channels.fetch();

  for (
    const channel
    of guild.channels.cache.values()
  ) {
    if (
      channel.type !== ChannelType.GuildText
    ) {
      continue;
    }

    if (
      !channel.name.match(
        /^(?:closed-)?(?:purchase|cashout|support|giveaway|partnership)-\d+$/
      ) &&
      !channel.topic?.startsWith(
        LEGACY_TOPIC_PREFIX
      )
    ) {
      continue;
    }

    const entry = await loadTicketState(
      channel
    );

    if (
      entry?.state?.ownerId === userId &&
      entry.state.type === type &&
      entry.state.status !== "closed"
    ) {
      return channel;
    }
  }

  return null;
}

// ==================================================
// CREATE TICKET
// ==================================================

async function createTicket(
  interaction,
  type,
  answers = []
) {
  return serializeTicketOperation(
    async () => {
      const guild = interaction.guild;

      const settings = TICKET_TYPES[type];

      if (!settings) {
        throw new Error(
          "Invalid ticket category."
        );
      }

      const existing = await findExistingTicket(
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

      const logChannel = await getLogChannel(
        guild
      );

      const category = await getTicketCategory(
        guild,
        type
      );

      const number = await nextTicketNumber(
        logChannel
      );

      const channelName = ticketChannelName(
        type,
        number
      );

      const permissionOverwrites = [
        {
          id: guild.roles.everyone.id,

          deny: [
            PermissionFlagsBits.ViewChannel
          ]
        },

        {
          id: interaction.user.id,

          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles
          ]
        },

        {
          id: guild.client.user.id,

          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.ManageMessages,
            PermissionFlagsBits.AttachFiles
          ]
        },

        ...TICKET_ACCESS[type].map(
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

      const channel = await guild.channels.create({
        name: channelName,

        type: ChannelType.GuildText,

        parent: category.id,

        topic: null,

        permissionOverwrites,

        reason:
          `Chuppys ${type} ticket opened by ` +
          interaction.user.id
      });

      const state = {
        channelId: channel.id,
        ownerId: interaction.user.id,
        type,
        number,
        status: "open",
        claimedBy: null,
        controlMessageId: null
      };

      const entry = {
        state,
        logMessageId: null
      };

      await saveTicketState(
        channel,
        entry
      );

      let answerText = settings.description;

      if (answers.length) {
        answerText = settings.questions
          .map(
            (question, index) =>
              `**${question}**\n` +
              safeText(answers[index])
          )
          .join("\n\n");
      }

      const pingRoles = TICKET_PINGS[type];

      const pingContent = [
        `<@${interaction.user.id}>`,
        ...pingRoles.map(
          roleId => `<@&${roleId}>`
        )
      ].join(" ");

      const welcome = await channel.send({
        content: pingContent,

        embeds: [
          makeEmbed(
            `${TICKET_EMOJI} ${settings.label} #${ticketNumberText(number)}`,

            `Welcome to your private **${settings.label}** ticket!\n\n` +
            `${answerText}\n\n` +
            `**Opened by:** <@${interaction.user.id}>\n\n` +
            "Our team will assist you as soon as possible."
          )
        ],

        components: ticketButtons(),

        allowedMentions: {
          users: [interaction.user.id],
          roles: pingRoles,
          parse: []
        }
      });

      state.controlMessageId = welcome.id;

      await saveTicketState(
        channel,
        entry
      );

      await logChannel.send({
        embeds: [
          makeEmbed(
            "Ticket Opened",

            `**Ticket:** ${channel.name}\n` +
            `**Number:** #${number}\n` +
            `**Category:** ${settings.label}\n` +
            `**Opened by:** <@${interaction.user.id}>\n` +
            `**Channel ID:** ${channel.id}`
          )
        ],

        allowedMentions: {
          parse: []
        }
      });

      return {
        channel,
        existing: false
      };
    }
  );
}

// ==================================================
// UPDATE TICKET CONTROL BUTTONS
// ==================================================

async function updateTicketControls(
  channel,
  state
) {
  if (!state.controlMessageId) {
    return;
  }

  const message = await channel.messages
    .fetch(state.controlMessageId)
    .catch(() => null);

  if (message) {
    await message.edit({
      components: ticketButtons(
        state.status === "closed"
      )
    });
  }
}

// ==================================================
// FETCH ALL TICKET MESSAGES
// ==================================================

async function fetchTicketMessages(channel) {
  const messages = [];

  let before;

  while (true) {
    const batch = await channel.messages.fetch({
      limit: 100,
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

// ==================================================
// BUILD TRANSCRIPT
// ==================================================

async function buildTranscript(
  channel,
  state,
  deletedBy
) {
  const messages = await fetchTicketMessages(
    channel
  );

  const lines = [
    ".gg/chuppys Ticket Transcript",
    "====================================",
    `Ticket: ${channel.name}`,
    `Channel ID: ${channel.id}`,
    `Ticket Number: ${state.number}`,
    `Category: ${state.type}`,
    `Owner ID: ${state.ownerId}`,
    `Deleted By: ${deletedBy}`,
    `Generated: ${new Date().toISOString()}`,
    `Total Messages: ${messages.length}`,
    "====================================",
    ""
  ];

  for (const message of messages) {
    lines.push(
      `[${new Date(message.createdTimestamp).toISOString()}]`
    );

    lines.push(
      `${message.author?.tag || "Unknown"} ` +
      `(${message.author?.id || "Unknown"})`
    );

    lines.push(
      message.content || ""
    );

    for (const messageEmbed of message.embeds) {
      lines.push(
        "[EMBED]"
      );

      if (messageEmbed.title) {
        lines.push(
          messageEmbed.title
        );
      }

      if (messageEmbed.description) {
        lines.push(
          messageEmbed.description
        );
      }
    }

    for (
      const attachment
      of message.attachments.values()
    ) {
      lines.push(
        `[ATTACHMENT] ${attachment.name}: ${attachment.url}`
      );
    }

    lines.push("");
    lines.push("------------------------------------");
    lines.push("");
  }

  const filename =
    `transcript-${state.type}-${state.number}.txt`;

  return {
    filename,
    buffer: Buffer.from(
      lines.join("\n"),
      "utf8"
    ),
    messageCount: messages.length
  };
}

// ==================================================
// SAVE TRANSCRIPT
// ==================================================

async function saveTranscript(
  channel,
  state,
  deletedBy
) {
  const logChannel = await getLogChannel(
    channel.guild
  );

  const transcript = await buildTranscript(
    channel,
    state,
    deletedBy
  );

  const attachment = new AttachmentBuilder(
    transcript.buffer,
    {
      name: transcript.filename
    }
  );

  const saved = await logChannel.send({
    embeds: [
      makeEmbed(
        "Ticket Deleted",

        `**Ticket:** ${channel.name}\n` +
        `**Number:** #${state.number}\n` +
        `**Category:** ${state.type}\n` +
        `**Owner:** <@${state.ownerId}>\n` +
        `**Deleted by:** <@${deletedBy}>\n` +
        `**Messages:** ${transcript.messageCount}\n\n` +
        "Click **View Transcript** below to view the conversation."
      )
    ],

    files: [attachment],

    allowedMentions: {
      parse: []
    }
  });

  await saved.edit({
    components: [
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(
              TRANSCRIPT_BUTTON_PREFIX +
              saved.id
            )
            .setLabel("View Transcript")
            .setEmoji("📄")
            .setStyle(ButtonStyle.Primary)
        )
    ]
  });

  return saved;
}

// ==================================================
// VIEW TRANSCRIPT
// ==================================================

async function handleViewTranscript(
  interaction
) {
  if (
    interaction.channelId !== LOG_CHANNEL_ID ||
    !canViewTranscript(interaction)
  ) {
    return respond(
      interaction,
      "Only authorized ticket staff can view transcripts."
    );
  }

  const messageId = interaction.customId.slice(
    TRANSCRIPT_BUTTON_PREFIX.length
  );

  if (
    messageId !== interaction.message.id
  ) {
    return respond(
      interaction,
      "Invalid transcript button."
    );
  }

  const attachment = interaction.message.attachments.find(
    file =>
      file.name?.startsWith("transcript-") &&
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
    `📄 **Ticket Transcript**\n\n` +
    `[Open ${attachment.name}](${attachment.url})`
  );
}

// ==================================================
// CLAIM TICKET
// ==================================================

async function claimTicket(
  interaction,
  channel,
  entry
) {
  const state = entry.state;

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
    state.claimedBy !== interaction.user.id
  ) {
    return respond(
      interaction,
      `This ticket is already claimed by <@${state.claimedBy}>.`
    );
  }

  state.claimedBy = interaction.user.id;

  await saveTicketState(
    channel,
    entry
  );

  await channel.send({
    embeds: [
      makeEmbed(
        `${TICKET_EMOJI} Ticket Claimed`,

        `This ticket has been claimed by <@${interaction.user.id}>.`
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  const logChannel = await getLogChannel(
    channel.guild
  );

  await logChannel.send({
    embeds: [
      makeEmbed(
        "Ticket Claimed",

        `**Ticket:** ${channel.name}\n` +
        `**Number:** #${state.number}\n` +
        `**Claimed by:** <@${interaction.user.id}>`
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

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
  entry
) {
  const state = entry.state;

  if (
    state.status === "closed"
  ) {
    return respond(
      interaction,
      "This ticket is already closed."
    );
  }

  await channel.permissionOverwrites.edit(
    state.ownerId,
    {
      ViewChannel: true,
      SendMessages: false,
      ReadMessageHistory: true
    }
  );

  state.status = "closed";

  await saveTicketState(
    channel,
    entry
  );

  await channel.setName(
    ticketChannelName(
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
      makeEmbed(
        `${TICKET_EMOJI} Ticket Closed`,

        `Closed by <@${interaction.user.id}>.\n\n` +
        "Staff can reopen or delete this ticket."
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  const logChannel = await getLogChannel(
    channel.guild
  );

  await logChannel.send({
    embeds: [
      makeEmbed(
        "Ticket Closed",

        `**Ticket:** ${channel.name}\n` +
        `**Number:** #${state.number}\n` +
        `**Category:** ${state.type}\n` +
        `**Closed by:** <@${interaction.user.id}>`
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

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
  const state = entry.state;

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

  state.status = "open";

  await saveTicketState(
    channel,
    entry
  );

  await channel.setName(
    ticketChannelName(
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
      makeEmbed(
        `${TICKET_EMOJI} Ticket Reopened`,

        `Reopened by <@${interaction.user.id}>.`
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  const logChannel = await getLogChannel(
    channel.guild
  );

  await logChannel.send({
    embeds: [
      makeEmbed(
        "Ticket Reopened",

        `**Ticket:** ${channel.name}\n` +
        `**Number:** #${state.number}\n` +
        `**Category:** ${state.type}\n` +
        `**Reopened by:** <@${interaction.user.id}>`
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

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
  const state = entry.state;

  if (
    state.status !== "closed"
  ) {
    return respond(
      interaction,
      "Close the ticket before deleting it."
    );
  }

  await saveTranscript(
    channel,
    state,
    interaction.user.id
  );

  await respond(
    interaction,
    "Transcript saved successfully. Deleting ticket..."
  );

  ticketCache.delete(
    channel.id
  );

  await channel.delete(
    `Ticket deleted by ${interaction.user.id}`
  );
}

// ==================================================
// HANDLE TICKET ACTION
// ==================================================

async function handleTicketAction(
  interaction,
  action
) {
  if (!canManageTicket(interaction)) {
    return respond(
      interaction,
      "Only authorized ticket staff can manage tickets."
    );
  }

  const channel = interaction.channel;

  const entry = await loadTicketState(
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
    return closeTicket(
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

  return respond(
    interaction,
    "Unknown ticket action."
  );
}

// ==================================================
// POST OR UPDATE TICKET PANEL
// ==================================================

async function handleTicketPanel(
  interaction
) {
  if (!canManageTicket(interaction)) {
    return respond(
      interaction,
      "You need staff permissions to update the ticket panel."
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const channel = await interaction.guild.channels.fetch(
    PANEL_CHANNEL_ID
  );

  if (
    !channel ||
    !channel.isTextBased() ||
    !channel.messages
  ) {
    throw new Error(
      "Ticket panel channel not found."
    );
  }

  const existing = await findMessage(
    channel,
    message =>
      message.author.id === interaction.client.user.id &&
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
      `Ticket panel updated in <#${PANEL_CHANNEL_ID}>.`
    );
  }

  await channel.send(
    ticketPanelPayload()
  );

  return respond(
    interaction,
    `Ticket panel posted in <#${PANEL_CHANNEL_ID}>.`
  );
}

// ==================================================
// HANDLE TICKET SELECT
// ==================================================

async function handleTicketSelect(
  interaction
) {
  const type = String(
    interaction.values[0] || ""
  ).toLowerCase();

  const settings = TICKET_TYPES[type];

  if (!settings) {
    return respond(
      interaction,
      "Please select a valid ticket category."
    );
  }

  if (settings.questions) {
    return interaction.showModal(
      makeTicketModal(type)
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const result = await createTicket(
    interaction,
    type
  );

  if (result.existing) {
    return respond(
      interaction,
      `You already have an open **${settings.label}** ticket: ${result.channel}`
    );
  }

  return respond(
    interaction,
    `${TICKET_EMOJI} Your **${settings.label}** ticket has been created!\n\n${result.channel}`
  );
}

// ==================================================
// HANDLE TICKET FORM
// ==================================================

async function handleTicketForm(
  interaction
) {
  const type = interaction.customId.slice(
    TICKET_MODAL_PREFIX.length
  );

  const settings = TICKET_TYPES[type];

  if (!settings?.questions) {
    return respond(
      interaction,
      "Invalid ticket form."
    );
  }

  const answers = settings.questions.map(
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

  if (result.existing) {
    return respond(
      interaction,
      `You already have an open **${settings.label}** ticket: ${result.channel}`
    );
  }

  return respond(
    interaction,
    `${TICKET_EMOJI} Your **${settings.label}** ticket has been created!\n\n${result.channel}`
  );
}

// ==================================================
// INSTALL TICKET SYSTEM
// ==================================================

function setupTickets(client) {
  if (client.__chuppysTicketsInstalled) {
    return;
  }

  client.__chuppysTicketsInstalled = true;

  console.log(
    "[TICKETS] Installing Render ticket system..."
  );

  client.on(
    Events.InteractionCreate,
    async interaction => {
      const isPanel =
        interaction.isChatInputCommand() &&
        interaction.commandName === "ticketpanel";

      const isSelect =
        interaction.isStringSelectMenu() &&
        TICKET_SELECT_IDS.has(
          interaction.customId
        );

      const isForm =
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(
          TICKET_MODAL_PREFIX
        );

      const isAction =
        interaction.isButton() &&
        Object.values(BUTTON_IDS).includes(
          interaction.customId
        );

      const isTranscript =
        interaction.isButton() &&
        interaction.customId.startsWith(
          TRANSCRIPT_BUTTON_PREFIX
        );

      if (
        !isPanel &&
        !isSelect &&
        !isForm &&
        !isAction &&
        !isTranscript
      ) {
        return;
      }

      try {
        if (!interaction.inGuild()) {
          return respond(
            interaction,
            "Tickets can only be used inside the server."
          );
        }

        // ============================================
        // /TICKETPANEL
        // ============================================

        if (isPanel) {
          return handleTicketPanel(
            interaction
          );
        }

        // ============================================
        // TICKET DROPDOWN
        // ============================================

        if (isSelect) {
          return handleTicketSelect(
            interaction
          );
        }

        // ============================================
        // PURCHASE / CASHOUT FORM
        // ============================================

        if (isForm) {
          return handleTicketForm(
            interaction
          );
        }

        // ============================================
        // TRANSCRIPT BUTTON
        // ============================================

        if (isTranscript) {
          await interaction.deferReply({
            flags: EPHEMERAL
          });

          return handleViewTranscript(
            interaction
          );
        }

        // ============================================
        // TICKET ACTION BUTTONS
        // ============================================

        if (isAction) {
          await interaction.deferReply({
            flags: EPHEMERAL
          });

          const action = Object.entries(
            BUTTON_IDS
          ).find(
            ([, id]) =>
              id === interaction.customId
          )?.[0];

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
        ).catch(console.error);
      }
    }
  );

  console.log(
    "[TICKETS] Render ticket system installed successfully."
  );
}

// ==================================================
// COMMONJS EXPORTS — REQUIRED BY INDEX.JS
// ==================================================

module.exports = setupTickets;

module.exports.command = command;
