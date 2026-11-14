"use strict";

// ==================================================
// CHUPPYS TICKET SYSTEM
// RENDER ONLY — DISCORD.JS V14
// ==================================================
//
// Compatible with:
//
// require("./tickets")(client);
//
// And:
//
// require("./tickets").command
//
// FEATURES:
// - Purchase tickets
// - Cash Out tickets
// - Giveaway tickets
// - Partnership tickets
// - Support tickets
// - One global ticket counter
// - Blank ticket channel descriptions
// - Claim, close, reopen, delete
// - Claim-based private permissions
// - Tickety-style ticket logs
// - Separate transcript storage
// - Separate metadata storage
// - Migration from older ticket logs
// - Transcript link buttons
//
// IMPORTANT:
// Keep only ONE running Render bot instance.
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
// CHANNEL IDS
// ==================================================

const TICKET_PANEL_CHANNEL_ID =
  "1530811385678790716";

const TICKET_LOG_CHANNEL_ID =
  "1570913954333728808";

const TICKET_TRANSCRIPT_CHANNEL_ID =
  "1571112508922531870";

const TICKET_DATA_CHANNEL_ID =
  "1571112668037644388";

// ==================================================
// ROLE IDS
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

// ==================================================
// BOT APPEARANCE
// ==================================================

const BRAND = ".gg/chuppys";

const TICKET_EMOJI =
  "<:chuppyhi:1561103471325745242>";

const TICKET_COLOR = 0xffffff;

const LOG_COLOR = 0x3498db;

const EPHEMERAL =
  MessageFlags.Ephemeral;

// ==================================================
// ROLE PERMISSIONS
// ==================================================

// Staff who may manage unclaimed tickets.

const TICKET_MANAGER_ROLES = [
  OWNER_ROLE_ID,
  ADMIN_ROLE_ID,
  MOD_ROLE_ID,
  TICKET_SUPPORT_ROLE_ID,
  SELLER_ROLE_ID
];

// Once a ticket is claimed, ONLY:
//
// - Ticket creator
// - Person who claimed it
// - Owner role
// - Mod role
// - The bot
//
// retain access.
//
// Server administrators with Discord's
// Administrator permission can bypass
// channel permission restrictions.

const CLAIMED_STAFF_ROLES = [
  OWNER_ROLE_ID,
  MOD_ROLE_ID
];

// ==================================================
// UNCLAIMED TICKET ACCESS
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
// TICKET TYPES
// ==================================================

const TICKET_TYPES = {
  purchase: {
    name: "Purchase",

    description:
      "Please provide your purchase details.",

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
      "Please provide your cash out details.",

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
      "Please provide details about the giveaway you won.",

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
      "Please explain what you need help with.",

    categoryEnv:
      "SUPPORT_TICKET_CATEGORY_ID"
  }
};

// ==================================================
// INTERACTION IDS
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

const CLOSE_MODAL_PREFIX =
  "chuppys_ticket_close_modal:";

const BUTTON_IDS = {
  claim: "chuppys_ticket_claim",
  close: "chuppys_ticket_close",
  reopen: "chuppys_ticket_reopen",
  delete: "chuppys_ticket_delete"
};

const OLD_BUTTON_PREFIX =
  "chuppys_ticket:";

const OLD_TRANSCRIPT_PREFIX =
  "chuppys_transcript:";

// ==================================================
// PERSISTENT STORAGE PREFIXES
// ==================================================

const STATE_PREFIX =
  "CHUPPYS_PRIVATE_TICKET_METADATA_V3:";

const LEGACY_STATE_PREFIXES = [
  "CHUPPYS_PRIVATE_TICKET_METADATA_V2:",
  "CHUPPYS_TICKET_STATE_V4:",
  "CHUPPYS_TICKET_STATE_V3:",
  "CHUPPYS_TICKET_STATE_V2:"
];

const COUNTER_PREFIX =
  "CHUPPYS_GLOBAL_TICKET_COUNTER_V1:";

const OLD_COUNTER_PREFIX =
  "CHUPPYS_TICKET_COUNTERS_V1:";

const OLD_TOPIC_PREFIX =
  "chuppys-ticket:";

// ==================================================
// RUNTIME STORAGE
// ==================================================

const ticketCache = new Map();

let ticketQueue = Promise.resolve();

let initializationPromise = null;

let initialized = false;

let globalCounter = 0;

let counterMessageId = null;

// ==================================================
// SLASH COMMAND
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
// BASIC HELPERS
// ==================================================

function formatTicketNumber(number) {
  return String(number).padStart(4, "0");
}

function makeTicketName(
  type,
  number,
  closed = false
) {
  return (
    `${closed ? "closed-" : ""}` +
    `${type}-${formatTicketNumber(number)}`
  ).slice(0, 100);
}

function safeText(
  value,
  maxLength = 1000
) {
  return String(value ?? "")
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

function runQueued(callback) {
  const job = ticketQueue.then(callback);

  ticketQueue = job.catch(() => {});

  return job;
}

function memberHasRole(
  interaction,
  roleId
) {
  const roles =
    interaction.member?.roles;

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
      memberHasRole(
        interaction,
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
      memberHasRole(
        interaction,
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

async function getUserInfo(
  guild,
  userId
) {
  if (!userId) {
    return {
      id: "Unknown",
      username: "Unknown",
      mention: "Unknown"
    };
  }

  const user =
    await guild.client.users
      .fetch(userId)
      .catch(() => null);

  return {
    id: userId,

    username:
      user?.username || "Unknown",

    mention:
      `<@${userId}>`
  };
}

// ==================================================
// TICKETY-STYLE LOG EMBEDS
// ==================================================

async function makeTicketyLog(
  guild,
  state,
  executorId,
  action,
  reason = "Done"
) {
  const creator =
    await getUserInfo(
      guild,
      state.ownerId
    );

  const executor =
    await getUserInfo(
      guild,
      executorId
    );

  const titles = {
    opened: "Ticket Opened",
    claimed: "Ticket Claimed",
    closed: "Ticket Closed",
    reopened: "Ticket Reopened",
    deleted: "Ticket Deleted"
  };

  const verbs = {
    opened: "opened a ticket.",
    claimed: "claimed a ticket.",
    closed: "closed a ticket.",
    reopened: "reopened a ticket.",
    deleted: "deleted a ticket."
  };

  const sections = {
    opened: "Open Information",
    claimed: "Claim Information",
    closed: "Close Information",
    reopened: "Reopen Information",
    deleted: "Delete Information"
  };

  const displayName =
    makeTicketName(
      state.type,
      state.number,
      action === "deleted"
    );

  const information = [
    `**Ticket Name:** ${displayName}`,
    `**Ticket ID:** ${state.channelId}`
  ];

  if (
    action === "closed" ||
    action === "deleted"
  ) {
    information.push(
      `**Reason:** ${safeText(reason, 500)}`
    );
  }

  const embed =
    new EmbedBuilder()
      .setTitle(
        titles[action] ||
        "Ticket Updated"
      )
      .setDescription(
        `${executor.mention} ` +
        (verbs[action] || "updated a ticket.")
      )
      .setColor(LOG_COLOR)
      .addFields(
        {
          name:
            sections[action] ||
            "Ticket Information",

          value:
            information.join("\n"),

          inline: false
        },

        {
          name: "Creator Information",

          value:
            `**Creator:** ${creator.mention}\n` +
            `**Creator Username:** @${safeText(creator.username, 100)}\n` +
            `**Creator ID:** ${creator.id}`,

          inline: false
        },

        {
          name: "Executor Information",

          value:
            `**Executor:** ${executor.mention}\n` +
            `**Executor Username:** @${safeText(executor.username, 100)}\n` +
            `**Executor ID:** ${executor.id}`,

          inline: false
        }
      )
      .setFooter({
        text: `${BRAND} | Ticket System`
      })
      .setTimestamp();

  return embed;
}

// ==================================================
// TRANSCRIPT LINK BUTTON
// ==================================================

function makeTranscriptLink(url) {
  return [
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setLabel(
            "View Transcript"
          )
          .setStyle(
            ButtonStyle.Link
          )
          .setURL(url)
      )
  ];
}

// ==================================================
// TICKET ACTION BUTTONS
// ==================================================

function makeTicketButtons(
  closed = false
) {
  const row =
    new ActionRowBuilder();

  if (closed) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(
          BUTTON_IDS.reopen
        )
        .setLabel("Reopen")
        .setEmoji("🔓")
        .setStyle(
          ButtonStyle.Success
        ),

      new ButtonBuilder()
        .setCustomId(
          BUTTON_IDS.delete
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
          BUTTON_IDS.claim
        )
        .setLabel("Claim")
        .setEmoji("🙋")
        .setStyle(
          ButtonStyle.Primary
        ),

      new ButtonBuilder()
        .setCustomId(
          BUTTON_IDS.close
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

// ==================================================
// TICKET PANEL
// ==================================================

function ticketPanelPayload() {
  const menu =
    new StringSelectMenuBuilder()
      .setCustomId(
        TICKET_SELECT_ID
      )
      .setPlaceholder(
        "Select a ticket category"
      )
      .addOptions(
        Object.entries(
          TICKET_TYPES
        ).map(
          ([value, settings]) => ({
            label:
              settings.name,

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
        "Select the category that matches " +
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
        .addComponents(menu)
    ],

    allowedMentions: {
      parse: []
    }
  };
}

// ==================================================
// FETCH STORAGE CHANNELS
// ==================================================

async function getTextChannel(
  guild,
  id,
  name
) {
  const channel =
    await guild.channels.fetch(id);

  if (
    !channel ||
    !channel.isTextBased() ||
    !channel.messages ||
    !channel.send
  ) {
    throw new Error(
      `${name} channel is unavailable.`
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

async function getDataChannel(guild) {
  return getTextChannel(
    guild,
    TICKET_DATA_CHANNEL_ID,
    "Ticket data"
  );
}

async function getTranscriptChannel(guild) {
  return getTextChannel(
    guild,
    TICKET_TRANSCRIPT_CHANNEL_ID,
    "Ticket transcript"
  );
}

// ==================================================
// PARSE OLD AND NEW TICKET DATA
// ==================================================

function parseStateMessage(message) {
  const content =
    message?.content || "";

  const prefixes = [
    STATE_PREFIX,
    ...LEGACY_STATE_PREFIXES
  ];

  const prefix =
    prefixes.find(
      p => content.startsWith(p)
    );

  if (!prefix) {
    return null;
  }

  try {
    const data =
      JSON.parse(
        content.slice(
          prefix.length
        )
      );

    if (
      !data.channelId ||
      !data.ownerId ||
      !TICKET_TYPES[data.type]
    ) {
      return null;
    }

    return {
      channelId:
        data.channelId,

      ownerId:
        data.ownerId,

      type:
        data.type,

      number:
        Number(data.number),

      status:
        data.status || "open",

      claimedBy:
        data.claimedBy || null,

      controlMessageId:
        data.controlMessageId || null,

      closeReason:
        data.closeReason || "Done",

      transcriptUrl:
        data.transcriptUrl || null
    };

  } catch {
    return null;
  }
}

// ==================================================
// SCAN STORAGE MESSAGES
// ==================================================

async function scanChannel(
  channel,
  callback,
  maxPages = 200
) {
  let before;

  for (
    let page = 0;
    page < maxPages;
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
      await callback(message);
    }

    if (messages.size < 100) {
      return;
    }

    before =
      messages.last().id;
  }

  console.warn(
    `[TICKETS] Message scan limit reached in ${channel.id}.`
  );
}

// ==================================================
// INITIALIZE STORAGE AND MIGRATE OLD LOGS
// ==================================================

async function initializeStorage(guild) {
  if (initialized) {
    return;
  }

  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise =
    (async () => {
      const dataChannel =
        await getDataChannel(guild);

      const oldLogChannel =
        await getLogChannel(guild);

      let highestNumber = 0;

      let newCounterMessage = null;

      // ----------------------------------------------
      // Read new private storage FIRST.
      // ----------------------------------------------

      await scanChannel(
        dataChannel,
        async message => {
          if (
            message.author.id !==
            guild.client.user.id
          ) {
            return;
          }

          const state =
            parseStateMessage(message);

          if (state) {
            if (
              !ticketCache.has(
                state.channelId
              )
            ) {
              ticketCache.set(
                state.channelId,
                {
                  state,
                  logMessageId:
                    message.id
                }
              );
            }

            highestNumber = Math.max(
              highestNumber,
              state.number || 0
            );
          }

          if (
            message.content.startsWith(
              COUNTER_PREFIX
            )
          ) {
            const value = Number(
              message.content.slice(
                COUNTER_PREFIX.length
              )
            );

            if (
              Number.isSafeInteger(value) &&
              value >= 0
            ) {
              highestNumber = Math.max(
                highestNumber,
                value
              );

              if (!newCounterMessage) {
                newCounterMessage =
                  message;
              }
            }
          }
        }
      );

      // ----------------------------------------------
      // Read OLD ticket log channel.
      //
      // This preserves numbers and metadata
      // from previous tickets.js versions.
      // ----------------------------------------------

      if (
        oldLogChannel.id !==
        dataChannel.id
      ) {
        await scanChannel(
          oldLogChannel,
          async message => {
            if (
              message.author.id !==
              guild.client.user.id
            ) {
              return;
            }

            const state =
              parseStateMessage(
                message
              );

            if (state) {
              highestNumber =
                Math.max(
                  highestNumber,
                  state.number || 0
                );

              if (
                !ticketCache.has(
                  state.channelId
                )
              ) {
                ticketCache.set(
                  state.channelId,
                  {
                    state,

                    // Metadata must be migrated
                    // into the new data channel.
                    logMessageId: null
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
                Number.isSafeInteger(value)
              ) {
                highestNumber =
                  Math.max(
                    highestNumber,
                    value
                  );
              }
            }

            if (
              message.content.startsWith(
                OLD_COUNTER_PREFIX
              )
            ) {
              try {
                const oldCounters =
                  JSON.parse(
                    message.content.slice(
                      OLD_COUNTER_PREFIX.length
                    )
                  );

                const values =
                  Object.values(
                    oldCounters
                  )
                    .map(Number)
                    .filter(
                      Number.isSafeInteger
                    );

                const total =
                  values.reduce(
                    (sum, number) =>
                      sum + number,
                    0
                  );

                highestNumber =
                  Math.max(
                    highestNumber,
                    total
                  );

              } catch (_) {}
            }
          }
        );
      }

      // ----------------------------------------------
      // Check existing ticket channel names.
      // ----------------------------------------------

      await guild.channels.fetch();

      for (
        const channel
        of guild.channels.cache.values()
      ) {
        const match =
          channel.name?.match(
            /^(?:closed-)?(?:purchase|purchasing|cashout|giveaway|partnership|support)-(\d+)$/
          );

        if (match) {
          highestNumber =
            Math.max(
              highestNumber,
              Number(match[1])
            );
        }
      }

      // ----------------------------------------------
      // Preserve highest known number.
      // ----------------------------------------------

      globalCounter =
        highestNumber;

      if (newCounterMessage) {
        counterMessageId =
          newCounterMessage.id;

        const storedValue =
          Number(
            newCounterMessage.content.slice(
              COUNTER_PREFIX.length
            )
          );

        if (
          storedValue < globalCounter
        ) {
          await newCounterMessage.edit({
            content:
              COUNTER_PREFIX +
              globalCounter
          });
        }
      } else {
        const message =
          await dataChannel.send({
            content:
              COUNTER_PREFIX +
              globalCounter,

            allowedMentions: {
              parse: []
            }
          });

        counterMessageId =
          message.id;
      }

      // ----------------------------------------------
      // Migrate old metadata into new data storage.
      // ----------------------------------------------

      for (
        const [channelId, entry]
        of ticketCache.entries()
      ) {
        if (
          entry.logMessageId
        ) {
          continue;
        }

        const channel =
          await guild.channels
            .fetch(channelId)
            .catch(() => null);

        // Deleted tickets don't need
        // new active-state records.

        if (!channel) {
          continue;
        }

        await saveTicketState(
          channel,
          entry
        );
      }

      initialized = true;

      console.log(
        `[TICKETS] Global counter preserved at #${globalCounter}.`
      );

      console.log(
        `[TICKETS] Loaded ${ticketCache.size} ticket records.`
      );

    })();

  try {
    await initializationPromise;
  } finally {
    initializationPromise = null;
  }
}

// ==================================================
// NEXT GLOBAL TICKET NUMBER
// ==================================================

async function nextTicketNumber(guild) {
  await initializeStorage(guild);

  const dataChannel =
    await getDataChannel(guild);

  const message =
    await dataChannel.messages.fetch(
      counterMessageId
    );

  const storedValue =
    Number(
      message.content.slice(
        COUNTER_PREFIX.length
      )
    );

  globalCounter =
    Math.max(
      globalCounter,
      Number.isSafeInteger(storedValue)
        ? storedValue
        : 0
    );

  const next =
    globalCounter + 1;

  await message.edit({
    content:
      COUNTER_PREFIX + next
  });

  globalCounter = next;

  return next;
}

// ==================================================
// SAVE PRIVATE METADATA
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
    JSON.stringify(
      entry.state
    );

  let message = null;

  if (entry.logMessageId) {
    message =
      await dataChannel.messages
        .fetch(
          entry.logMessageId
        )
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
// LOAD TICKET STATE
// ==================================================

async function loadTicketState(channel) {
  await initializeStorage(
    channel.guild
  );

  const existing =
    ticketCache.get(
      channel.id
    );

  if (existing) {
    if (channel.topic) {
      await channel
        .setTopic(null)
        .catch(() => {});
    }

    return existing;
  }

  // Migrate older tickets with
  // JSON stored in their descriptions.

  if (channel.topic) {
    let oldData = null;

    try {
      if (
        channel.topic.startsWith(
          OLD_TOPIC_PREFIX
        )
      ) {
        oldData =
          JSON.parse(
            channel.topic.slice(
              OLD_TOPIC_PREFIX.length
            )
          );
      } else if (
        channel.topic.trim()
          .startsWith("{")
      ) {
        oldData =
          JSON.parse(
            channel.topic
          );
      }
    } catch (_) {}

    if (
      oldData?.ownerId &&
      TICKET_TYPES[
        oldData.type
      ]
    ) {
      const entry = {
        state: {
          channelId:
            channel.id,

          ownerId:
            oldData.ownerId,

          type:
            oldData.type,

          number:
            Number(
              oldData.number
            ),

          status:
            oldData.status ||
            "open",

          claimedBy:
            oldData.claimedBy ||
            null,

          controlMessageId:
            oldData.controlMessageId ||
            null,

          closeReason:
            oldData.closeReason ||
            "Done",

          transcriptUrl:
            oldData.transcriptUrl ||
            null
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
// FIND EXISTING TICKET
// ==================================================

async function findExistingTicket(
  guild,
  userId,
  type
) {
  await initializeStorage(guild);

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
        .fetch(
          entry.state.channelId
        )
        .catch(() => null);

    if (channel) {
      return channel;
    }
  }

  return null;
}

// ==================================================
// CATEGORY CREATION
// ==================================================

async function getTicketCategory(
  guild,
  type
) {
  const settings =
    TICKET_TYPES[type];

  const configuredId =
    process.env[
      settings.categoryEnv
    ];

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
        `${settings.categoryEnv} is not a valid category.`
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

  return guild.channels.create({
    name:
      `chuppys-${type}`,

    type:
      ChannelType.GuildCategory
  });
}

// ==================================================
// PERMISSION OVERWRITES
// ==================================================

function buildTicketPermissions(
  guild,
  state
) {
  const claimed =
    Boolean(state.claimedBy);

  const roleIds =
    claimed
      ? CLAIMED_STAFF_ROLES
      : TICKET_ACCESS[
          state.type
        ];

  const uniqueRoles = [
    ...new Set(roleIds)
  ].filter(
    roleId =>
      guild.roles.cache.has(
        roleId
      )
  );

  const allowedPermissions = [
    PermissionFlagsBits.ViewChannel,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.AttachFiles
  ];

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
        guild.client.user.id,

      allow: [
        ...allowedPermissions,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageMessages
      ]
    },

    ...uniqueRoles.map(
      roleId => ({
        id: roleId,

        allow:
          allowedPermissions
      })
    )
  ];

  // Ticket customer stays inside,
  // even after the ticket is claimed.

  overwrites.push({
    id:
      state.ownerId,

    allow:
      state.status === "closed"
        ? [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory
          ]
        : allowedPermissions,

    deny:
      state.status === "closed"
        ? [
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles
          ]
        : []
  });

  // Claimer receives individual access.
  // The Seller role itself is NOT granted
  // role-wide access after claiming.

  if (
    claimed &&
    state.claimedBy !==
      state.ownerId
  ) {
    overwrites.push({
      id:
        state.claimedBy,

      allow:
        allowedPermissions
    });
  }

  return overwrites;
}

// ==================================================
// APPLY TICKET PERMISSIONS
// ==================================================

async function applyTicketPermissions(
  channel,
  state
) {
  // Replaces the channel's existing overwrites,
  // removing everyone outside the allowed list.

  const overwrites =
    buildTicketPermissions(
      channel.guild,
      state
    );

  await channel.permissionOverwrites.set(
    overwrites,
    "Chuppys ticket access updated."
  );

  // Keep channel description completely blank.

  if (channel.topic) {
    await channel.setTopic(null);
  }
}

// ==================================================
// PURCHASE / CASHOUT MODAL
// ==================================================

function makeTicketForm(type) {
  const settings =
    TICKET_TYPES[type];

  const modal =
    new ModalBuilder()
      .setCustomId(
        TICKET_FORM_PREFIX +
        type
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

      modal.addComponents(
        new ActionRowBuilder()
          .addComponents(input)
      );
    }
  );

  return modal;
}

// ==================================================
// CLOSE REASON MODAL
// ==================================================

function makeCloseModal(channelId) {
  const modal =
    new ModalBuilder()
      .setCustomId(
        CLOSE_MODAL_PREFIX +
        channelId
      )
      .setTitle(
        "Close Ticket"
      );

  const reason =
    new TextInputBuilder()
      .setCustomId(
        "close_reason"
      )
      .setLabel(
        "Reason for closing"
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
// SEND TICKETY-STYLE LOG
// ==================================================

async function sendTicketLog(
  guild,
  state,
  executorId,
  action,
  reason = "Done",
  transcriptUrl = null
) {
  const logChannel =
    await getLogChannel(guild);

  const embed =
    await makeTicketyLog(
      guild,
      state,
      executorId,
      action,
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
    embeds: [
      embed
    ],

    components:
      transcriptUrl
        ? makeTranscriptLink(
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
  return runQueued(
    async () => {
      const guild =
        interaction.guild;

      const settings =
        TICKET_TYPES[type];

      if (!settings) {
        throw new Error(
          "Invalid ticket type."
        );
      }

      await initializeStorage(
        guild
      );

      const existing =
        await findExistingTicket(
          guild,
          interaction.user.id,
          type
        );

      if (existing) {
        return {
          channel:
            existing,

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
          "Done",

        transcriptUrl:
          null
      };

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

          topic: null,

          permissionOverwrites:
            buildTicketPermissions(
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

        logMessageId:
          null
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
                safeText(
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
              `${TICKET_EMOJI} ${settings.name} Ticket #${formatTicketNumber(number)}`,

              `Welcome <@${interaction.user.id}>!\n\n` +
              `${details}\n\n` +
              "Please wait for our team to assist you."
            )
          ],

          components:
            makeTicketButtons(),

          allowedMentions: {
            users: [
              interaction.user.id
            ],

            roles:
              pingRoles.filter(
                id =>
                  guild.roles.cache.has(
                    id
                  )
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
// UPDATE TICKET CONTROL MESSAGE
// ==================================================

async function updateTicketButtons(
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
        makeTicketButtons(
          state.status ===
          "closed"
        )
    });
  }
}

// ==================================================
// GET ENTIRE TICKET HISTORY
// ==================================================

async function fetchAllMessages(
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

    before =
      batch.last().id;
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
  state
) {
  const messages =
    await fetchAllMessages(
      channel
    );

  const lines = [
    ".gg/chuppys Ticket Transcript",
    "========================================",
    `Ticket: ${channel.name}`,
    `Ticket ID: ${channel.id}`,
    `Ticket Number: #${state.number}`,
    `Type: ${state.type}`,
    `Creator ID: ${state.ownerId}`,
    `Claimed By: ${state.claimedBy || "Nobody"}`,
    `Generated: ${new Date().toISOString()}`,
    `Total Messages: ${messages.length}`,
    "========================================",
    ""
  ];

  for (
    const message
    of messages
  ) {
    const timestamp =
      new Date(
        message.createdTimestamp
      ).toISOString();

    lines.push(
      `[${timestamp}]`
    );

    lines.push(
      `${message.author?.username || "Unknown"} ` +
      `(${message.author?.id || "Unknown"})`
    );

    if (message.content) {
      lines.push(
        message.content
      );
    }

    for (
      const embed
      of message.embeds
    ) {
      lines.push(
        "[EMBED]"
      );

      if (embed.title) {
        lines.push(
          `Title: ${embed.title}`
        );
      }

      if (embed.description) {
        lines.push(
          embed.description
        );
      }

      for (
        const field
        of embed.fields || []
      ) {
        lines.push(
          `${field.name}: ${field.value}`
        );
      }
    }

    for (
      const attachment
      of message.attachments.values()
    ) {
      lines.push(
        `[ATTACHMENT] ${attachment.name}`
      );

      lines.push(
        attachment.url
      );
    }

    lines.push("");
    lines.push("----------------------------------------");
    lines.push("");
  }

  const filename =
    `transcript-${state.type}-${state.number}.txt`;

  let buffer =
    Buffer.from(
      lines.join("\n"),
      "utf8"
    );

  // Keep files below common Discord
  // upload limits.

  const maxBytes =
    7 * 1024 * 1024;

  if (
    buffer.length > maxBytes
  ) {
    buffer =
      Buffer.concat([
        buffer.subarray(
          0,
          maxBytes - 100
        ),

        Buffer.from(
          "\n\n[Transcript truncated because the file exceeded 7 MB.]"
        )
      ]);
  }

  return {
    filename,

    buffer,

    messageCount:
      messages.length
  };
}

// ==================================================
// SAVE TRANSCRIPT IN SEPARATE CHANNEL
// ==================================================

async function saveTranscript(
  channel,
  state
) {
  const storage =
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

  const message =
    await storage.send({
      content:
        `**Ticket Transcript**\n` +
        `Ticket: ${channel.name}\n` +
        `Ticket Number: #${state.number}\n` +
        `Creator ID: ${state.ownerId}`,

      files: [
        attachment
      ],

      allowedMentions: {
        parse: []
      }
    });

  // A link to the Discord message
  // remains stable and provides access
  // to the saved attachment.

  return {
    message,

    url:
      message.url,

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

  if (state.claimedBy) {
    if (
      state.claimedBy ===
      interaction.user.id
    ) {
      return respond(
        interaction,
        "You already claimed this ticket."
      );
    }

    return respond(
      interaction,
      `This ticket is already claimed by <@${state.claimedBy}>.`
    );
  }

  // ----------------------------------------------
  // Claim ticket.
  //
  // Customer remains.
  // Claimer remains.
  // Owners remain.
  // Mods remain.
  //
  // All other role-wide ticket permissions
  // are removed.
  // ----------------------------------------------

  state.claimedBy =
    interaction.user.id;

  await applyTicketPermissions(
    channel,
    state
  );

  await saveTicketState(
    channel,
    entry
  );

  await channel.send({
    embeds: [
      makeTicketEmbed(
        `${TICKET_EMOJI} Ticket Claimed`,

        `This ticket has been claimed by <@${interaction.user.id}>.\n\n` +
        "This ticket is now private to the customer, " +
        "the staff member who claimed it, " +
        "moderators, and owners."
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
    "Ticket claimed successfully. Other sellers and ticket support staff no longer have role-wide access."
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

  // Save the conversation to the
  // private transcript channel.

  const transcript =
    await saveTranscript(
      channel,
      state
    );

  state.status =
    "closed";

  state.closeReason =
    reason || "Done";

  state.transcriptUrl =
    transcript.url;

  await applyTicketPermissions(
    channel,
    state
  );

  await channel.setName(
    makeTicketName(
      state.type,
      state.number,
      true
    )
  );

  await saveTicketState(
    channel,
    entry
  );

  await updateTicketButtons(
    channel,
    state
  );

  await channel.send({
    embeds: [
      makeTicketEmbed(
        `${TICKET_EMOJI} Ticket Closed`,

        `This ticket was closed by <@${interaction.user.id}>.\n\n` +
        `**Reason:** ${safeText(reason, 500)}\n\n` +
        "Staff may reopen or delete this ticket."
      )
    ],

    allowedMentions: {
      parse: []
    }
  });

  // Send new Tickety-style log.

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

  state.status =
    "open";

  // If ticket was claimed, preserve
  // the claim-based restrictions.

  await applyTicketPermissions(
    channel,
    state
  );

  await channel.setName(
    makeTicketName(
      state.type,
      state.number
    )
  );

  await saveTicketState(
    channel,
    entry
  );

  await updateTicketButtons(
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

  // Save final conversation, including
  // messages after the first close.

  const transcript =
    await saveTranscript(
      channel,
      state
    );

  state.transcriptUrl =
    transcript.url;

  await saveTicketState(
    channel,
    entry
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
// HANDLE STAFF BUTTONS
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
      "This is not a recognized Chuppys ticket."
    );
  }

  const state =
    entry.state;

  // A claimed ticket may only be managed
  // by its claimer, Owner, or Mod.
  // The original ticket creator is not
  // given staff management privileges.

  if (
    state.claimedBy &&
    state.claimedBy !== interaction.user.id &&
    !memberHasRole(
      interaction,
      OWNER_ROLE_ID
    ) &&
    !memberHasRole(
      interaction,
      MOD_ROLE_ID
    ) &&
    !interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return respond(
      interaction,
      "Only the claiming staff member, moderators, or owners can manage this claimed ticket."
    );
  }

  if (action === "claim") {
    await interaction.deferReply({
      flags: EPHEMERAL
    });

    return runQueued(
      () =>
        claimTicket(
          interaction,
          channel,
          entry
        )
    );
  }

  if (action === "close") {
    if (
      state.status === "closed"
    ) {
      return respond(
        interaction,
        "This ticket is already closed."
      );
    }

    return interaction.showModal(
      makeCloseModal(
        channel.id
      )
    );
  }

  if (action === "reopen") {
    await interaction.deferReply({
      flags: EPHEMERAL
    });

    return runQueued(
      () =>
        reopenTicket(
          interaction,
          channel,
          entry
        )
    );
  }

  if (action === "delete") {
    await interaction.deferReply({
      flags: EPHEMERAL
    });

    return runQueued(
      () =>
        deleteTicket(
          interaction,
          channel,
          entry
        )
    );
  }

  return respond(
    interaction,
    "Unknown ticket action."
  );
}

// ==================================================
// HANDLE CLOSE REASON MODAL
// ==================================================

async function handleCloseModal(
  interaction
) {
  const channelId =
    interaction.customId.slice(
      CLOSE_MODAL_PREFIX.length
    );

  if (
    channelId !==
    interaction.channelId
  ) {
    return respond(
      interaction,
      "This close form belongs to another ticket."
    );
  }

  if (
    !isTicketManager(interaction)
  ) {
    return respond(
      interaction,
      "Only authorized staff can close tickets."
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

  const state =
    entry.state;

  if (
    state.claimedBy &&
    state.claimedBy !== interaction.user.id &&
    !memberHasRole(
      interaction,
      OWNER_ROLE_ID
    ) &&
    !memberHasRole(
      interaction,
      MOD_ROLE_ID
    ) &&
    !interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return respond(
      interaction,
      "You cannot close another staff member's claimed ticket."
    );
  }

  const reason =
    interaction.fields
      .getTextInputValue(
        "close_reason"
      )
      .trim() || "Done";

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  return runQueued(
    () =>
      closeTicket(
        interaction,
        interaction.channel,
        entry,
        reason
      )
  );
}

// ==================================================
// HANDLE /TICKETPANEL
// ==================================================

async function handleTicketPanel(
  interaction
) {
  if (
    !interaction.memberPermissions?.has(
      PermissionFlagsBits.ManageGuild
    ) &&
    !interaction.memberPermissions?.has(
      PermissionFlagsBits.Administrator
    )
  ) {
    return respond(
      interaction,
      "You need Manage Server permission to update the ticket panel."
    );
  }

  await interaction.deferReply({
    flags: EPHEMERAL
  });

  const channel =
    await getTextChannel(
      interaction.guild,
      TICKET_PANEL_CHANNEL_ID,
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
                TICKET_SELECT_IDS.has(
                  component.customId
                )
            )
        )
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
      interaction.values[0] ||
      ""
    ).toLowerCase();

  const settings =
    TICKET_TYPES[type];

  if (!settings) {
    return respond(
      interaction,
      "Please select a valid category."
    );
  }

  if (settings.questions) {
    return interaction.showModal(
      makeTicketForm(
        type
      )
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
      `You already have an open ticket: ${result.channel}`
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

  if (!settings?.questions) {
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
      `You already have an open ticket: ${result.channel}`
    );
  }

  return respond(
    interaction,
    `${TICKET_EMOJI} Your **${settings.name}** ticket has been created!\n\n${result.channel}`
  );
}

// ==================================================
// DETECT TICKET ACTION
// ==================================================

function getTicketAction(customId) {
  for (
    const [action, id]
    of Object.entries(
      BUTTON_IDS
    )
  ) {
    if (
      customId === id
    ) {
      return action;
    }
  }

  if (
    customId.startsWith(
      OLD_BUTTON_PREFIX
    )
  ) {
    const action =
      customId.slice(
        OLD_BUTTON_PREFIX.length
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
// HANDLE OLD TRANSCRIPT BUTTONS
// ==================================================

async function handleOldTranscriptButton(
  interaction
) {
  if (
    !canViewTranscript(interaction)
  ) {
    return respond(
      interaction,
      "Only authorized ticket staff can access transcripts."
    );
  }

  if (
    interaction.channelId !==
    TICKET_LOG_CHANNEL_ID
  ) {
    return respond(
      interaction,
      "Transcript buttons can only be used in the ticket log channel."
    );
  }

  const attachment =
    interaction.message.attachments.find(
      file =>
        file.name?.startsWith(
          "transcript-"
        ) &&
        file.name?.endsWith(
          ".txt"
        )
    );

  if (attachment) {
    return respond(
      interaction,
      `**View Transcript**\n${interaction.message.url}`
    );
  }

  return respond(
    interaction,
    "This older transcript button could not find an attachment. Check the original transcript message in the log channel."
  );
}

// ==================================================
// INSTALL TICKET SYSTEM
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

  // ==================================================
  // CLIENT READY
  // ==================================================

  client.once(
    Events.ClientReady,
    async () => {
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

        await initializeStorage(
          guild
        );

        console.log(
          "[TICKETS] Ticket system ready."
        );

        console.log(
          `[TICKETS] Next ticket number: #${globalCounter + 1}`
        );

      } catch (error) {
        console.error(
          "[TICKETS] Initialization error:",
          error
        );
      }
    }
  );

  // ==================================================
  // INTERACTIONS
  // ==================================================

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

      const isCloseForm =
        interaction.isModalSubmit() &&
        interaction.customId.startsWith(
          CLOSE_MODAL_PREFIX
        );

      const action =
        interaction.isButton()
          ? getTicketAction(
              interaction.customId
            )
          : null;

      const isOldTranscript =
        interaction.isButton() &&
        interaction.customId.startsWith(
          OLD_TRANSCRIPT_PREFIX
        );

      if (
        !isPanel &&
        !isSelect &&
        !isTicketForm &&
        !isCloseForm &&
        !action &&
        !isOldTranscript
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

        // ============================================
        // /TICKETPANEL
        // ============================================

        if (isPanel) {
          return await handleTicketPanel(
            interaction
          );
        }

        // ============================================
        // SELECT MENU
        // ============================================

        if (isSelect) {
          return await handleTicketSelect(
            interaction
          );
        }

        // ============================================
        // PURCHASE / CASHOUT FORM
        // ============================================

        if (isTicketForm) {
          return await handleTicketForm(
            interaction
          );
        }

        // ============================================
        // CLOSE FORM
        // ============================================

        if (isCloseForm) {
          return await handleCloseModal(
            interaction
          );
        }

        // ============================================
        // OLD TRANSCRIPT BUTTON
        // ============================================

        if (isOldTranscript) {
          await interaction.deferReply({
            flags: EPHEMERAL
          });

          return await handleOldTranscriptButton(
            interaction
          );
        }

        // ============================================
        // TICKET BUTTONS
        // ============================================

        if (action) {
          return await handleTicketAction(
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
// ==================================================

module.exports =
  setupTickets;

module.exports.command =
  command;
