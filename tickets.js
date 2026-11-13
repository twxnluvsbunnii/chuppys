
const fs = require("fs");
const path = require("path");

const {
  Events,
  ChannelType,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  SlashCommandBuilder
} = require("discord.js");

// ==================================================
// CHUPPYS TICKET SETTINGS
// ==================================================

const PANEL_CHANNEL_ID = "1530811385678790716";

const OWNER_ROLE_ID = "1530988662970650865";
const STAFF_ROLE_ID = "1563003884656398406";
const SELLER_ROLE_ID = "1550322075208646766";
const CONVERTER_ROLE_ID = "1569334149695668287";
const MIDDLEMAN_ROLE_ID = "1569334076224053268";

const TICKET_ACCESS_ROLE_IDS = [
  OWNER_ROLE_ID,
  STAFF_ROLE_ID,
  SELLER_ROLE_ID,
  CONVERTER_ROLE_ID,
  MIDDLEMAN_ROLE_ID
];

const TICKET_MANAGEMENT_ROLE_IDS = [
  OWNER_ROLE_ID,
  STAFF_ROLE_ID
];

const EMOJI_ID = "1561103471325745242";
const EMOJI = "<:chuppyhi:1561103471325745242>";

const EMOJI_OBJECT = {
  id: EMOJI_ID,
  name: "chuppyhi"
};

const EMOJI_URL =
  `https://cdn.discordapp.com/emojis/${EMOJI_ID}.png`;

const LOG_CHANNEL_ID =
  process.env.TICKET_LOG_CHANNEL_ID || "";

const DATA_FILE =
  process.env.TICKET_DATA_PATH ||
  path.join(__dirname, "chuppys-tickets.json");

// ==================================================
// TICKET CATEGORIES
// ==================================================

const TYPES = {
  purchase: {
    label: "Purchase",
    description: "ONLY TO BUY",
    prefix: "purchasing",
    category: "Purchasing Tickets"
  },

  cashout: {
    label: "Cashout",
    description: "ONLY TO CASHOUT",
    prefix: "cashout",
    category: "Cashout Tickets"
  },

  giveaway: {
    label: "Giveaway",
    description: "ONLY TO CLAIM",
    prefix: "giveaway",
    category: "Giveaway Tickets"
  },

  partnership: {
    label: "Partnership",
    description: "PARTNERSHIP ONLY",
    prefix: "partnership",
    category: "Partnership Tickets"
  },

  support: {
    label: "Support",
    description: "GET ASSISTANCE",
    prefix: "support",
    category: "Support Tickets"
  }
};

// ==================================================
// TICKET DATABASE
// ==================================================

function loadDatabase() {
  if (!fs.existsSync(DATA_FILE)) {
    return {
      counter: 0,
      tickets: {}
    };
  }

  try {
    const data = JSON.parse(
      fs.readFileSync(DATA_FILE, "utf8")
    );

    return {
      counter: Number(data.counter) || 0,
      tickets: data.tickets || {}
    };
  } catch (error) {
    console.error("[TICKETS] Database load error:", error);

    // Do not silently overwrite an existing damaged database.
    throw error;
  }
}

const db = loadDatabase();

function saveDatabase() {
  fs.mkdirSync(path.dirname(DATA_FILE), {
    recursive: true
  });

  const temporary = DATA_FILE + ".tmp";

  fs.writeFileSync(
    temporary,
    JSON.stringify(db, null, 2),
    "utf8"
  );

  fs.renameSync(temporary, DATA_FILE);
}

const creationLocks = new Set();
const actionLocks = new Set();

// ==================================================
// ROLE PERMISSIONS
// ==================================================

function ticketRolePermissions() {
  return TICKET_ACCESS_ROLE_IDS.map(roleId => ({
    id: roleId,
    allow: [
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.AttachFiles
    ]
  }));
}

function hasTicketRole(interaction, roleIds) {
  const roles = interaction.member?.roles;

  if (roles?.cache) {
    return roleIds.some(id => roles.cache.has(id));
  }

  if (Array.isArray(roles)) {
    return roleIds.some(id => roles.includes(id));
  }

  return false;
}

function isTicketManager(interaction) {
  if (!interaction.guild) return false;

  if (interaction.user.id === interaction.guild.ownerId) {
    return true;
  }

  if (
    interaction.memberPermissions?.has(
      PermissionsBitField.Flags.Administrator
    ) ||
    interaction.memberPermissions?.has(
      PermissionsBitField.Flags.ManageGuild
    )
  ) {
    return true;
  }

  return hasTicketRole(
    interaction,
    TICKET_MANAGEMENT_ROLE_IDS
  );
}

function canCloseTicket(interaction, ticket) {
  return (
    isTicketManager(interaction) ||
    ticket.userId === interaction.user.id
  );
}

// ==================================================
// TICKET PANEL EMBED
// ==================================================

function makeTicketPanelEmbed() {
  return new EmbedBuilder()
    .setTitle("Open a Ticket")
    .setDescription(
      `${EMOJI} **Welcome to .gg/chuppys!**\n\n` +
      "Please select a category from the dropdown " +
      "menu below to open a private ticket.\n\n" +

      `${EMOJI} **Purchase**\n` +
      "Only open this ticket if you're buying.\n\n" +

      `${EMOJI} **Cashout**\n` +
      "Only open this ticket if you're cashing out.\n\n" +

      `${EMOJI} **Giveaway**\n` +
      "Only open this ticket to claim a giveaway.\n\n" +

      `${EMOJI} **Partnership**\n` +
      "Only open this ticket for partnerships.\n\n" +

      `${EMOJI} **Support**\n` +
      "Open this ticket if you need assistance.\n\n" +

      "Our team will assist you as soon as possible!"
    )
    .setColor("#FFFFFF")
    .setThumbnail(EMOJI_URL)
    .setFooter({
      text: ".gg/chuppys | Ticket System"
    });
}

// ==================================================
// TICKET DROPDOWN MENU
// ==================================================

function makeTicketMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("chuppy_ticket_select")
    .setPlaceholder("Select a ticket category")
    .setMinValues(1)
    .setMaxValues(1);

  for (const [key, type] of Object.entries(TYPES)) {
    menu.addOptions({
      label: type.label,
      description: type.description,
      value: key,
      emoji: EMOJI_OBJECT
    });
  }

  return new ActionRowBuilder().addComponents(menu);
}

// ==================================================
// POST OR UPDATE TICKET PANEL
// ==================================================

async function sendOrUpdateTicketPanel(client) {
  const channel = await client.channels.fetch(
    PANEL_CHANNEL_ID
  );

  if (!channel?.messages || !channel.send) {
    throw new Error("Ticket panel channel not found.");
  }

  const payload = {
    embeds: [makeTicketPanelEmbed()],
    components: [makeTicketMenu()],
    allowedMentions: { parse: [] }
  };

  let existing = null;
  let before;

  for (let page = 0; page < 10; page++) {
    const options = { limit: 100 };

    if (before) {
      options.before = before;
    }

    const messages = await channel.messages.fetch(options);

    if (!messages.size) break;

    existing = messages.find(message =>
      message.author.id === client.user.id &&
      message.components.some(row =>
        row.components.some(component =>
          component.customId === "chuppy_ticket_select"
        )
      )
    );

    if (existing) break;

    before = messages.last().id;

    if (messages.size < 100) break;
  }

  if (existing) {
    await existing.edit(payload);

    console.log("[TICKETS] Existing panel updated.");
    return existing;
  }

  const sent = await channel.send(payload);

  console.log("[TICKETS] New panel posted.");
  return sent;
}

// ==================================================
// FIND OR CREATE TICKET CATEGORY
// ==================================================

async function getTicketCategory(guild, type) {
  await guild.channels.fetch();

  let category = guild.channels.cache.find(channel =>
    channel.type === ChannelType.GuildCategory &&
    channel.name === type.category
  );

  if (category) return category;

  category = await guild.channels.create({
    name: type.category,
    type: ChannelType.GuildCategory,

    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [
          PermissionsBitField.Flags.ViewChannel
        ]
      },

      ...ticketRolePermissions()
    ]
  });

  console.log(
    `[TICKETS] Category created: ${type.category}`
  );

  return category;
}

// ==================================================
// TICKET CONTROL BUTTONS
// ==================================================

function makeTicketButtons(status = "open") {
  if (status === "closed") {
    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("chuppy_ticket_reopen")
          .setLabel("Reopen")
          .setEmoji(EMOJI_OBJECT)
          .setStyle(ButtonStyle.Success),

        new ButtonBuilder()
          .setCustomId("chuppy_ticket_delete")
          .setLabel("Delete")
          .setEmoji(EMOJI_OBJECT)
          .setStyle(ButtonStyle.Danger)
      )
    ];
  }

  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("chuppy_ticket_claim")
        .setLabel("Claim")
        .setEmoji(EMOJI_OBJECT)
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("chuppy_ticket_close")
        .setLabel("Close")
        .setEmoji(EMOJI_OBJECT)
        .setStyle(ButtonStyle.Danger)
    )
  ];
}

// ==================================================
// TICKET WELCOME EMBED
// ==================================================

function makeTicketWelcomeEmbed(type, user) {
  return new EmbedBuilder()
    .setTitle(`${type.label} Ticket`)
    .setDescription(
      `${EMOJI} **Welcome to .gg/chuppys!**\n\n` +

      `Hello <@${user.id}>!\n\n` +

      `You opened a **${type.label}** ticket.\n\n` +

      "Please explain what you need assistance with " +
      "and wait patiently for a member of our team.\n\n" +

      "**Ticket Rules**\n\n" +

      `${EMOJI} Be respectful to staff.\n` +
      `${EMOJI} Do not spam or repeatedly ping.\n` +
      `${EMOJI} Provide necessary information.\n` +
      `${EMOJI} Keep transactions inside your ticket.\n\n` +

      `**Ticket Support:** <@&${STAFF_ROLE_ID}>`
    )
    .setColor("#FFFFFF")
    .setThumbnail(EMOJI_URL)
    .setFooter({ text: ".gg/chuppys" })
    .setTimestamp();
}

// ==================================================
// CREATE PRIVATE TICKET
// ==================================================

async function createTicket(interaction, typeKey) {
  const type = TYPES[typeKey];

  if (!type || !interaction.guild) {
    await interaction.reply({
      content: "Invalid ticket category.",
      ephemeral: true
    });

    return;
  }

  if (interaction.channelId !== PANEL_CHANNEL_ID) {
    await interaction.reply({
      content:
        `Please open tickets in <#${PANEL_CHANNEL_ID}>.`,
      ephemeral: true
    });

    return;
  }

  const lockKey =
    `${interaction.guild.id}:${interaction.user.id}:${typeKey}`;

  if (creationLocks.has(lockKey)) {
    await interaction.reply({
      content: "Your ticket is already being created.",
      ephemeral: true
    });

    return;
  }

  creationLocks.add(lockKey);

  try {
    await interaction.deferReply({ ephemeral: true });

    // Check for an existing open ticket of the same type.
    for (const [channelId, ticket] of Object.entries(
      db.tickets
    )) {
      if (
        ticket.guildId !== interaction.guild.id ||
        ticket.userId !== interaction.user.id ||
        ticket.type !== typeKey ||
        ticket.status !== "open"
      ) {
        continue;
      }

      const existingChannel =
        await interaction.guild.channels.fetch(channelId)
          .catch(() => null);

      if (existingChannel) {
        await interaction.editReply({
          content:
            `${EMOJI} You already have an open ticket: ` +
            `${existingChannel}`
        });

        return;
      }

      delete db.tickets[channelId];
      saveDatabase();
    }

    const category = await getTicketCategory(
      interaction.guild,
      type
    );

    const number = db.counter + 1;

    const channelName =
      `${type.prefix}-${String(number).padStart(3, "0")}`;

    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: category.id,

      topic:
        `Chuppys Ticket | User: ${interaction.user.id} | ` +
        `Type: ${typeKey}`,

      permissionOverwrites: [
        {
          id: interaction.guild.roles.everyone.id,
          deny: [
            PermissionsBitField.Flags.ViewChannel
          ]
        },

        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.AttachFiles
          ]
        },

        ...ticketRolePermissions(),

        {
          id: interaction.client.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ManageChannels
          ]
        }
      ]
    });

    db.counter = number;

    db.tickets[channel.id] = {
      guildId: interaction.guild.id,
      userId: interaction.user.id,
      type: typeKey,
      number,
      status: "open",
      claimedBy: null,
      createdAt: Date.now()
    };

    saveDatabase();

    await channel.send({
      content:
        `<@${interaction.user.id}> ` +
        `<@&${STAFF_ROLE_ID}>`,

      embeds: [
        makeTicketWelcomeEmbed(type, interaction.user)
      ],

      components: makeTicketButtons("open"),

      allowedMentions: {
        users: [interaction.user.id],
        roles: [STAFF_ROLE_ID]
      }
    });

    await interaction.editReply({
      content:
        `${EMOJI} Your ticket has been created!\n\n` +
        `**Ticket:** ${channel}`
    });

    console.log(
      `[TICKETS] ${interaction.user.tag} opened ${channelName}`
    );

  } catch (error) {
    console.error("[TICKETS] Creation failed:", error);

    if (interaction.deferred) {
      await interaction.editReply({
        content:
          "I couldn't create your ticket. " +
          "Please contact staff."
      }).catch(() => {});
    }

  } finally {
    creationLocks.delete(lockKey);
  }
}

// ==================================================
// GENERATE TICKET TRANSCRIPT
// ==================================================

async function generateTranscript(channel) {
  const messages = [];
  let before;

  while (true) {
    const options = { limit: 100 };

    if (before) {
      options.before = before;
    }

    const batch = await channel.messages.fetch(options);

    if (!batch.size) break;

    messages.push(...batch.values());

    before = batch.last().id;

    if (batch.size < 100) break;
  }

  messages.sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp
  );

  const lines = [
    "CHUPPYS TICKET TRANSCRIPT",
    `Channel: ${channel.name}`,
    `Channel ID: ${channel.id}`,
    `Generated: ${new Date().toISOString()}`,
    "========================================",
    ""
  ];

  for (const message of messages) {
    lines.push(
      `[${new Date(message.createdTimestamp).toISOString()}] ` +
      `${message.author.tag} (${message.author.id})`
    );

    if (message.content) {
      lines.push(message.content);
    }

    for (const attachment of message.attachments.values()) {
      lines.push(`Attachment: ${attachment.url}`);
    }

    for (const embed of message.embeds) {
      if (embed.title) {
        lines.push(`Embed title: ${embed.title}`);
      }

      if (embed.description) {
        lines.push(embed.description);
      }

      for (const field of embed.fields || []) {
        lines.push(`${field.name}: ${field.value}`);
      }
    }

    lines.push("");
  }

  return Buffer.from(lines.join("\n"), "utf8");
}

// ==================================================
// SEND TICKET TRANSCRIPT TO LOG CHANNEL
// ==================================================

async function sendTranscriptLog(interaction, ticket) {
  if (!LOG_CHANNEL_ID) {
    throw new Error(
      "TICKET_LOG_CHANNEL_ID is not configured."
    );
  }

  const logChannel =
    await interaction.client.channels.fetch(LOG_CHANNEL_ID);

  if (!logChannel?.send) {
    throw new Error("Ticket log channel unavailable.");
  }

  const transcript = await generateTranscript(
    interaction.channel
  );

  const type = TYPES[ticket.type];

  const embed = new EmbedBuilder()
    .setTitle("Ticket Transcript")
    .setDescription(
      `${EMOJI} **Chuppys Ticket Log**\n\n` +
      `**Ticket:** ${interaction.channel.name}\n` +
      `**Type:** ${type?.label || ticket.type}\n` +
      `**Opened by:** <@${ticket.userId}>\n` +
      `**Claimed by:** ${
        ticket.claimedBy
          ? `<@${ticket.claimedBy}>`
          : "Unclaimed"
      }\n` +
      `**Deleted by:** <@${interaction.user.id}>`
    )
    .setColor("#FFFFFF")
    .setThumbnail(EMOJI_URL)
    .setTimestamp();

  const attachment = new AttachmentBuilder(
    transcript,
    {
      name: `chuppys-ticket-${interaction.channelId}.txt`
    }
  );

  await logChannel.send({
    embeds: [embed],
    files: [attachment],
    allowedMentions: { parse: [] }
  });
}

// ==================================================
// HANDLE TICKET BUTTONS
// ==================================================

async function handleTicketButton(interaction) {
  const ticket = db.tickets[interaction.channelId];

  if (!ticket || ticket.guildId !== interaction.guildId) {
    await interaction.reply({
      content: "This is not a registered Chuppys ticket.",
      ephemeral: true
    });

    return;
  }

  const lockKey = interaction.channelId;

  if (actionLocks.has(lockKey)) {
    await interaction.reply({
      content: "Another ticket action is processing.",
      ephemeral: true
    });

    return;
  }

  actionLocks.add(lockKey);

  try {
    const action = interaction.customId;

    // ==============================================
    // CLAIM TICKET
    // ==============================================

    if (action === "chuppy_ticket_claim") {
      if (!isTicketManager(interaction)) {
        await interaction.reply({
          content:
            "Only Owner and Ticket Support can claim tickets.",
          ephemeral: true
        });

        return;
      }

      if (ticket.status !== "open") {
        await interaction.reply({
          content: "This ticket is closed.",
          ephemeral: true
        });

        return;
      }

      if (ticket.claimedBy) {
        await interaction.reply({
          content:
            `This ticket is already claimed by ` +
            `<@${ticket.claimedBy}>.`,
          ephemeral: true
        });

        return;
      }

      ticket.claimedBy = interaction.user.id;
      saveDatabase();

      await interaction.reply({
        content:
          `${EMOJI} Ticket claimed by ` +
          `<@${interaction.user.id}>.`,
        allowedMentions: { parse: [] }
      });

      return;
    }

    // ==============================================
    // CLOSE TICKET
    // ==============================================

    if (action === "chuppy_ticket_close") {
      if (!canCloseTicket(interaction, ticket)) {
        await interaction.reply({
          content: "You cannot close this ticket.",
          ephemeral: true
        });

        return;
      }

      if (ticket.status === "closed") {
        await interaction.reply({
          content: "This ticket is already closed.",
          ephemeral: true
        });

        return;
      }

      await interaction.deferReply({ ephemeral: true });

      await interaction.channel.permissionOverwrites.edit(
        ticket.userId,
        {
          ViewChannel: false,
          SendMessages: false
        }
      );

      ticket.status = "closed";
      ticket.closedAt = Date.now();

      saveDatabase();

      await interaction.message.edit({
        components: makeTicketButtons("closed")
      });

      const embed = new EmbedBuilder()
        .setTitle("Ticket Closed")
        .setDescription(
          `${EMOJI} This ticket has been closed by ` +
          `<@${interaction.user.id}>.\n\n` +
          "An authorized team member may reopen " +
          "or delete this ticket."
        )
        .setColor("#FFFFFF")
        .setThumbnail(EMOJI_URL);

      await interaction.channel.send({
        embeds: [embed],
        allowedMentions: { parse: [] }
      });

      await interaction.editReply({
        content: "Ticket closed successfully."
      });

      return;
    }

    // ==============================================
    // REOPEN TICKET
    // ==============================================

    if (action === "chuppy_ticket_reopen") {
      if (!isTicketManager(interaction)) {
        await interaction.reply({
          content:
            "Only Owner and Ticket Support can reopen tickets.",
          ephemeral: true
        });

        return;
      }

      if (ticket.status !== "closed") {
        await interaction.reply({
          content: "This ticket is already open.",
          ephemeral: true
        });

        return;
      }

      await interaction.deferReply({ ephemeral: true });

      await interaction.channel.permissionOverwrites.edit(
        ticket.userId,
        {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true
        }
      );

      ticket.status = "open";
      delete ticket.closedAt;

      saveDatabase();

      await interaction.message.edit({
        components: makeTicketButtons("open")
      });

      await interaction.channel.send({
        content:
          `${EMOJI} Ticket reopened by ` +
          `<@${interaction.user.id}>.`,
        allowedMentions: { parse: [] }
      });

      await interaction.editReply({
        content: "Ticket reopened successfully."
      });

      return;
    }

    // ==============================================
    // DELETE TICKET
    // ==============================================

    if (action === "chuppy_ticket_delete") {
      if (!isTicketManager(interaction)) {
        await interaction.reply({
          content:
            "Only Owner and Ticket Support can delete tickets.",
          ephemeral: true
        });

        return;
      }

      if (ticket.status !== "closed") {
        await interaction.reply({
          content:
            "Please close the ticket before deleting it.",
          ephemeral: true
        });

        return;
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        await sendTranscriptLog(interaction, ticket);
      } catch (error) {
        console.error(
          "[TICKETS] Transcript logging failed:",
          error
        );

        await interaction.editReply({
          content:
            "The transcript couldn't be saved, " +
            "so the ticket was not deleted. " +
            "Check TICKET_LOG_CHANNEL_ID and bot permissions."
        });

        return;
      }

      await interaction.editReply({
        content:
          `${EMOJI} Transcript saved. Deleting ticket...`
      });

      await interaction.channel.delete(
        `Chuppys ticket deleted by ${interaction.user.tag}`
      );

      delete db.tickets[interaction.channelId];
      saveDatabase();

      console.log(
        `[TICKETS] Ticket ${interaction.channelId} deleted.`
      );

      return;
    }

  } finally {
    actionLocks.delete(lockKey);
  }
}

// ==================================================
// OPTIONAL /TICKETPANEL COMMAND
// ==================================================

const TICKET_PANEL_COMMAND = new SlashCommandBuilder()
  .setName("ticketpanel")
  .setDescription("Post or update the Chuppys ticket panel.")
  .setDefaultMemberPermissions(
    PermissionsBitField.Flags.ManageGuild
  );

// ==================================================
// CONNECT TO YOUR EXISTING INDEX.JS
// ==================================================

module.exports = function setupChuppyTickets(client) {
  client.once(Events.ClientReady, async () => {
    try {
      await sendOrUpdateTicketPanel(client);
    } catch (error) {
      console.error(
        "[TICKETS] Startup panel error:",
        error
      );
    }
  });

  client.on(Events.InteractionCreate, async interaction => {
    try {
      // ============================================
      // /TICKETPANEL COMMAND
      // ============================================

      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "ticketpanel"
      ) {
        if (!isTicketManager(interaction)) {
          await interaction.reply({
            content:
              "You don't have permission to update the ticket panel.",
            ephemeral: true
          });

          return;
        }

        await interaction.deferReply({
          ephemeral: true
        });

        await sendOrUpdateTicketPanel(client);

        await interaction.editReply({
          content:
            `${EMOJI} Ticket panel updated in ` +
            `<#${PANEL_CHANNEL_ID}>.`
        });

        return;
      }

      // ============================================
      // TICKET DROPDOWN
      // ============================================

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId === "chuppy_ticket_select"
      ) {
        await createTicket(
          interaction,
          interaction.values[0]
        );

        return;
      }

      // ============================================
      // TICKET BUTTONS
      // ============================================

      if (
        interaction.isButton() &&
        [
          "chuppy_ticket_claim",
          "chuppy_ticket_close",
          "chuppy_ticket_reopen",
          "chuppy_ticket_delete"
        ].includes(interaction.customId)
      ) {
        await handleTicketButton(interaction);
        return;
      }

    } catch (error) {
      console.error(
        "[TICKETS] Interaction error:",
        error
      );

      if (!interaction.isRepliable()) return;

      const content =
        "Something went wrong with the ticket system.";

      if (interaction.deferred && !interaction.replied) {
        await interaction.editReply({
          content
        }).catch(() => {});
      } else if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content,
          ephemeral: true
        }).catch(() => {});
      }
    }
  });

  console.log(
    "[TICKETS] Chuppys ticket system loaded successfully."
  );
};

module.exports.command = TICKET_PANEL_COMMAND;
