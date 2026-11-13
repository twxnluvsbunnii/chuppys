// ==================================================
// .GG/CHUPPYS TICKET SYSTEM
// DISCORD.JS V14
// ==================================================

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
  SlashCommandBuilder,
  MessageFlags
} = require("discord.js");

// ==================================================
// CONFIGURATION
// ==================================================

const TICKET_PANEL_CHANNEL_ID = "1530811385678790716";

const TICKET_EMOJI_ID = "1561103471325745242";
const TICKET_EMOJI = "<:chuppyhi:1561103471325745242>";

const OWNER_ROLE_ID = "1530988662970650865";
const TICKET_SUPPORT_ROLE_ID = "1563003884656398406";
const SELLER_ROLE_ID = "1550322075208646766";
const CONVERTER_ROLE_ID = "1569334149695668287";
const MIDDLEMAN_ROLE_ID = "1569334076224053268";

const TICKET_ACCESS_ROLE_IDS = [
  OWNER_ROLE_ID,
  TICKET_SUPPORT_ROLE_ID,
  SELLER_ROLE_ID,
  CONVERTER_ROLE_ID,
  MIDDLEMAN_ROLE_ID
];

const TICKET_LOG_CHANNEL_ID =
  process.env.TICKET_LOG_CHANNEL_ID || "";

const TICKET_DATA_PATH =
  process.env.TICKET_DATA_PATH ||
  path.join(__dirname, "chuppys-tickets.json");

const TICKET_COLOR = "#FFFFFF";

const TICKET_CATEGORIES = {
  purchase: {
    label: "Purchase",
    description: "Open a ticket to purchase something.",
    channelPrefix: "purchase"
  },

  cashout: {
    label: "Cashout",
    description: "Open a ticket to cash out.",
    channelPrefix: "cashout"
  },

  giveaway: {
    label: "Giveaway",
    description: "Open a ticket to claim a giveaway.",
    channelPrefix: "giveaway"
  },

  partnership: {
    label: "Partnership",
    description: "Open a ticket for a partnership.",
    channelPrefix: "partnership"
  },

  support: {
    label: "Support",
    description: "Open a ticket if you need assistance.",
    channelPrefix: "support"
  }
};

// ==================================================
// SLASH COMMAND
// ==================================================

const TICKET_PANEL_COMMAND = new SlashCommandBuilder()
  .setName("ticketpanel")
  .setDescription("Post or update the Chuppys ticket panel.")
  .setDefaultMemberPermissions(
    PermissionsBitField.Flags.ManageGuild
  );

// ==================================================
// DATA STORAGE
// ==================================================

function defaultData() {
  return {
    panelMessageId: null,
    ticketCounter: 0,
    tickets: {}
  };
}

function loadData() {
  try {
    if (!fs.existsSync(TICKET_DATA_PATH)) {
      return defaultData();
    }

    const raw = fs.readFileSync(
      TICKET_DATA_PATH,
      "utf8"
    );

    const parsed = JSON.parse(raw);

    return {
      panelMessageId: parsed.panelMessageId || null,
      ticketCounter: Number(parsed.ticketCounter) || 0,
      tickets: parsed.tickets || {}
    };
  } catch (error) {
    console.error(
      "[TICKETS] Failed to load ticket data:",
      error
    );

    return defaultData();
  }
}

let ticketData = loadData();

function saveData() {
  try {
    const directory = path.dirname(TICKET_DATA_PATH);

    fs.mkdirSync(directory, {
      recursive: true
    });

    const temporaryPath = `${TICKET_DATA_PATH}.tmp`;

    fs.writeFileSync(
      temporaryPath,
      JSON.stringify(ticketData, null, 2),
      "utf8"
    );

    fs.renameSync(
      temporaryPath,
      TICKET_DATA_PATH
    );
  } catch (error) {
    console.error(
      "[TICKETS] Failed to save ticket data:",
      error
    );

    throw error;
  }
}

// ==================================================
// HELPERS
// ==================================================

function hasTicketAccess(member) {
  if (!member) return false;

  if (
    member.permissions.has(
      PermissionsBitField.Flags.Administrator
    )
  ) {
    return true;
  }

  return TICKET_ACCESS_ROLE_IDS.some(roleId =>
    member.roles.cache.has(roleId)
  );
}

function canManageTicket(member, ticket) {
  if (!member || !ticket) return false;

  return (
    hasTicketAccess(member) ||
    member.id === ticket.userId
  );
}

function staffPermissionOverwrites(guild) {
  return TICKET_ACCESS_ROLE_IDS
    .filter(roleId => guild.roles.cache.has(roleId))
    .map(roleId => ({
      id: roleId,
      allow: [
        PermissionsBitField.Flags.ViewChannel,
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.ReadMessageHistory,
        PermissionsBitField.Flags.AttachFiles,
        PermissionsBitField.Flags.EmbedLinks
      ]
    }));
}

function makeEmbed(title, description) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(TICKET_COLOR)
    .setFooter({
      text: ".gg/chuppys | Ticket System"
    })
    .setTimestamp();
}

function safeChannelName(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 35);
}

function getTicket(channelId) {
  return ticketData.tickets[channelId] || null;
}

async function getMember(interaction) {
  if (!interaction.guild) return null;

  return interaction.guild.members
    .fetch(interaction.user.id)
    .catch(() => null);
}

async function respond(interaction, content) {
  const payload = {
    content,
    flags: MessageFlags.Ephemeral
  };

  if (interaction.deferred) {
    return interaction.editReply({
      content
    });
  }

  if (interaction.replied) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
}

// ==================================================
// TICKET PANEL EMBED
// ==================================================

function makeTicketPanelEmbed() {
  return new EmbedBuilder()
    .setTitle("Open a ticket with .gg/chuppys")
    .setDescription(
      "Please click the on the drop down menu and pick " +
      "what you would like to do today " +
      TICKET_EMOJI
    )
    .setColor(TICKET_COLOR)
    .setFooter({
      text: ".gg/chuppys | Ticket System"
    });
}

// ==================================================
// TICKET PANEL DROPDOWN
// ==================================================

function makeTicketPanelMenu() {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("chuppys_ticket_select")
    .setPlaceholder("Select a ticket category")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(
      Object.entries(TICKET_CATEGORIES).map(
        ([value, category]) => ({
          label: category.label,
          description: category.description,
          value,
          emoji: {
            id: TICKET_EMOJI_ID
          }
        })
      )
    );

  return new ActionRowBuilder()
    .addComponents(menu);
}

// ==================================================
// SEND OR UPDATE TICKET PANEL
// ==================================================

async function sendOrUpdateTicketPanel(client) {
  try {
    const channel = await client.channels.fetch(
      TICKET_PANEL_CHANNEL_ID
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

    const payload = {
      embeds: [makeTicketPanelEmbed()],
      components: [makeTicketPanelMenu()],
      allowedMentions: {
        parse: []
      }
    };

    let existing = null;

    if (ticketData.panelMessageId) {
      existing = await channel.messages
        .fetch(ticketData.panelMessageId)
        .catch(() => null);
    }

    const recentMessages = await channel.messages.fetch({
      limit: 100
    });

    const matchingMessages = recentMessages.filter(
      message =>
        message.author.id === client.user.id &&
        (
          message.components.some(row =>
            row.components.some(component =>
              component.customId ===
                "chuppys_ticket_select"
            )
          ) ||
          message.embeds.some(embed =>
            embed.title ===
              "Open a Ticket" ||
            embed.title ===
              "Open a ticket with .gg/chuppys"
          )
        )
    );

    if (!existing) {
      existing = matchingMessages.first() || null;
    }

    if (existing) {
      await existing.edit(payload);

      ticketData.panelMessageId = existing.id;
      saveData();

      for (const duplicate of matchingMessages.values()) {
        if (duplicate.id !== existing.id) {
          await duplicate.delete().catch(error => {
            console.error(
              "[TICKETS] Failed to delete duplicate panel:",
              error
            );
          });
        }
      }

      console.log(
        "[TICKETS] Ticket panel updated."
      );

      return existing;
    }

    const sent = await channel.send(payload);

    ticketData.panelMessageId = sent.id;
    saveData();

    console.log(
      "[TICKETS] Ticket panel created."
    );

    return sent;
  } catch (error) {
    console.error(
      "[TICKETS] Ticket panel error:",
      error
    );

    throw error;
  }
}

// ==================================================
// TICKET CATEGORY FOLDERS
// ==================================================

async function getOrCreateTicketCategory(guild, categoryKey) {
  const category = TICKET_CATEGORIES[categoryKey];

  if (!category) {
    throw new Error("Invalid ticket category.");
  }

  const categoryName =
    `CHUPPYS ${category.label.toUpperCase()} TICKETS`;

  let existing = guild.channels.cache.find(
    channel =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === categoryName
  );

  if (existing) return existing;

  const channels = await guild.channels.fetch();

  existing = channels.find(
    channel =>
      channel.type === ChannelType.GuildCategory &&
      channel.name === categoryName
  );

  if (existing) return existing;

  return guild.channels.create({
    name: categoryName,
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        deny: [
          PermissionsBitField.Flags.ViewChannel
        ]
      },
      ...staffPermissionOverwrites(guild),
      {
        id: guild.members.me.id,
        allow: [
          PermissionsBitField.Flags.ViewChannel,
          PermissionsBitField.Flags.SendMessages,
          PermissionsBitField.Flags.ManageChannels,
          PermissionsBitField.Flags.ReadMessageHistory
        ]
      }
    ]
  });
}

// ==================================================
// TICKET BUTTONS
// ==================================================

function makeOpenTicketButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("chuppys_ticket_claim")
      .setLabel("Claim")
      .setEmoji({
        id: TICKET_EMOJI_ID
      })
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("chuppys_ticket_close")
      .setLabel("Close")
      .setEmoji({
        id: TICKET_EMOJI_ID
      })
      .setStyle(ButtonStyle.Secondary)
  );
}

function makeClosedTicketButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("chuppys_ticket_reopen")
      .setLabel("Reopen")
      .setEmoji({
        id: TICKET_EMOJI_ID
      })
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("chuppys_ticket_delete")
      .setLabel("Delete")
      .setEmoji({
        id: TICKET_EMOJI_ID
      })
      .setStyle(ButtonStyle.Danger)
  );
}

// ==================================================
// CREATE TICKET
// ==================================================

const openingTickets = new Set();

async function openTicket(interaction, categoryKey) {
  const category = TICKET_CATEGORIES[categoryKey];

  if (!category) {
    await respond(
      interaction,
      "That ticket category is invalid."
    );
    return;
  }

  if (!interaction.guild) {
    await respond(
      interaction,
      "Tickets can only be opened inside .gg/chuppys."
    );
    return;
  }

  const lockKey =
    `${interaction.guild.id}:${interaction.user.id}`;

  if (openingTickets.has(lockKey)) {
    await respond(
      interaction,
      "Your ticket is already being created."
    );
    return;
  }

  openingTickets.add(lockKey);

  try {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral
    });

    const existingTicket = Object.entries(
      ticketData.tickets
    ).find(
      ([channelId, ticket]) =>
        ticket.guildId === interaction.guild.id &&
        ticket.userId === interaction.user.id &&
        ticket.category === categoryKey &&
        ticket.status !== "deleted" &&
        interaction.guild.channels.cache.has(channelId)
    );

    if (existingTicket) {
      await interaction.editReply({
        content:
          `You already have a ${category.label} ticket open: ` +
          `<#${existingTicket[0]}>`
      });

      return;
    }

    const parentCategory =
      await getOrCreateTicketCategory(
        interaction.guild,
        categoryKey
      );

    const nextNumber =
      ticketData.ticketCounter + 1;

    const ticketNumber =
      String(nextNumber).padStart(4, "0");

    const username =
      safeChannelName(interaction.user.username);

    const channelName =
      `${category.channelPrefix}-${username}-${ticketNumber}`
        .slice(0, 100);

    const channel =
      await interaction.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: parentCategory.id,
        topic:
          `Chuppys Ticket | User: ${interaction.user.id} | ` +
          `Category: ${category.label} | Ticket: ${ticketNumber}`,
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
              PermissionsBitField.Flags.AttachFiles,
              PermissionsBitField.Flags.EmbedLinks
            ]
          },
          ...staffPermissionOverwrites(interaction.guild),
          {
            id: interaction.client.user.id,
            allow: [
              PermissionsBitField.Flags.ViewChannel,
              PermissionsBitField.Flags.SendMessages,
              PermissionsBitField.Flags.ReadMessageHistory,
              PermissionsBitField.Flags.ManageChannels,
              PermissionsBitField.Flags.AttachFiles
            ]
          }
        ]
      });

    ticketData.ticketCounter = nextNumber;

    ticketData.tickets[channel.id] = {
      guildId: interaction.guild.id,
      channelId: channel.id,
      userId: interaction.user.id,
      username: interaction.user.username,
      category: categoryKey,
      number: ticketNumber,
      status: "open",
      claimedBy: null,
      createdAt: Date.now(),
      closedAt: null
    };

    saveData();

    const ticketEmbed = makeEmbed(
      `${TICKET_EMOJI} ${category.label} Ticket`,
      `Welcome <@${interaction.user.id}>!\n\n` +
      `Thank you for opening a **${category.label}** ticket ` +
      `with **.gg/chuppys**.\n\n` +
      "Please explain what you need help with and " +
      "a member of our team will assist you shortly.\n\n" +
      `**Ticket Number:** ${ticketNumber}\n` +
      `**Category:** ${category.label}\n` +
      `**Opened By:** <@${interaction.user.id}>`
    );

    await channel.send({
      content: `<@${interaction.user.id}>`,
      embeds: [ticketEmbed],
      components: [makeOpenTicketButtons()],
      allowedMentions: {
        users: [interaction.user.id]
      }
    });

    await interaction.editReply({
      content:
        `${TICKET_EMOJI} Your **${category.label}** ` +
        `ticket has been created: <#${channel.id}>`
    });

    console.log(
      `[TICKETS] ${interaction.user.tag} opened ` +
      `${category.label} ticket ${channel.id}.`
    );
  } catch (error) {
    console.error(
      "[TICKETS] Ticket creation failed:",
      error
    );

    await respond(
      interaction,
      "I couldn't create your ticket. Please make sure " +
      "the bot has Manage Channels, View Channels, " +
      "Send Messages, and Manage Permissions."
    );
  } finally {
    openingTickets.delete(lockKey);
  }
}

// ==================================================
// CLAIM TICKET
// ==================================================

async function claimTicket(interaction) {
  const ticket = getTicket(interaction.channelId);

  if (!ticket) {
    await respond(
      interaction,
      "This channel is not a registered ticket."
    );
    return;
  }

  const member = await getMember(interaction);

  if (!hasTicketAccess(member)) {
    await respond(
      interaction,
      "Only authorized Chuppys staff can claim tickets."
    );
    return;
  }

  if (ticket.status === "closed") {
    await respond(
      interaction,
      "You cannot claim a closed ticket."
    );
    return;
  }

  if (ticket.claimedBy) {
    await respond(
      interaction,
      `This ticket has already been claimed by ` +
      `<@${ticket.claimedBy}>.`
    );
    return;
  }

  ticket.claimedBy = interaction.user.id;
  saveData();

  await interaction.reply({
    embeds: [
      makeEmbed(
        `${TICKET_EMOJI} Ticket Claimed`,
        `This ticket has been claimed by ` +
        `<@${interaction.user.id}>.\n\n` +
        "They will assist you shortly."
      )
    ]
  });

  console.log(
    `[TICKETS] Ticket ${interaction.channelId} ` +
    `claimed by ${interaction.user.tag}.`
  );
}

// ==================================================
// CLOSE TICKET
// ==================================================

async function closeTicket(interaction) {
  const ticket = getTicket(interaction.channelId);

  if (!ticket) {
    await respond(
      interaction,
      "This channel is not a registered ticket."
    );
    return;
  }

  const member = await getMember(interaction);

  if (!canManageTicket(member, ticket)) {
    await respond(
      interaction,
      "You don't have permission to close this ticket."
    );
    return;
  }

  if (ticket.status === "closed") {
    await respond(
      interaction,
      "This ticket is already closed."
    );
    return;
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  ticket.status = "closed";
  ticket.closedAt = Date.now();
  saveData();

  const channel = interaction.channel;

  await channel.permissionOverwrites.edit(
    ticket.userId,
    {
      ViewChannel: false,
      SendMessages: false
    }
  );

  await channel.setName(
    `closed-${ticket.category}-${ticket.number}`
      .slice(0, 100)
  );

  await channel.send({
    embeds: [
      makeEmbed(
        `${TICKET_EMOJI} Ticket Closed`,
        `This ticket was closed by ` +
        `<@${interaction.user.id}>.\n\n` +
        "Authorized staff can reopen or delete it."
      )
    ],
    components: [makeClosedTicketButtons()]
  });

  await interaction.editReply({
    content: "The ticket has been closed successfully."
  });

  console.log(
    `[TICKETS] Ticket ${channel.id} closed.`
  );
}

// ==================================================
// REOPEN TICKET
// ==================================================

async function reopenTicket(interaction) {
  const ticket = getTicket(interaction.channelId);

  if (!ticket) {
    await respond(
      interaction,
      "This channel is not a registered ticket."
    );
    return;
  }

  const member = await getMember(interaction);

  if (!hasTicketAccess(member)) {
    await respond(
      interaction,
      "Only authorized Chuppys staff can reopen tickets."
    );
    return;
  }

  if (ticket.status !== "closed") {
    await respond(
      interaction,
      "This ticket is already open."
    );
    return;
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const channel = interaction.channel;

  await channel.permissionOverwrites.edit(
    ticket.userId,
    {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
      AttachFiles: true,
      EmbedLinks: true
    }
  );

  await channel.setName(
    `${ticket.category}-${safeChannelName(ticket.username)}-${ticket.number}`
      .slice(0, 100)
  );

  ticket.status = "open";
  ticket.closedAt = null;

  saveData();

  await channel.send({
    content: `<@${ticket.userId}>`,
    embeds: [
      makeEmbed(
        `${TICKET_EMOJI} Ticket Reopened`,
        `This ticket was reopened by ` +
        `<@${interaction.user.id}>.\n\n` +
        "You can continue your conversation here."
      )
    ],
    components: [makeOpenTicketButtons()],
    allowedMentions: {
      users: [ticket.userId]
    }
  });

  await interaction.editReply({
    content: "The ticket has been reopened successfully."
  });

  console.log(
    `[TICKETS] Ticket ${channel.id} reopened.`
  );
}

// ==================================================
// FETCH TICKET MESSAGES FOR TRANSCRIPT
// ==================================================

async function fetchAllTicketMessages(channel) {
  const allMessages = [];

  let before;

  while (true) {
    const options = {
      limit: 100
    };

    if (before) {
      options.before = before;
    }

    const messages =
      await channel.messages.fetch(options);

    if (messages.size === 0) {
      break;
    }

    allMessages.push(...messages.values());

    before = messages.last().id;

    if (messages.size < 100) {
      break;
    }
  }

  return allMessages.sort(
    (a, b) =>
      a.createdTimestamp - b.createdTimestamp
  );
}

// ==================================================
// GENERATE TRANSCRIPT
// ==================================================

async function createTicketTranscript(channel, ticket) {
  const messages =
    await fetchAllTicketMessages(channel);

  const lines = [
    "========================================",
    ".GG/CHUPPYS TICKET TRANSCRIPT",
    "========================================",
    "",
    `Ticket Number: ${ticket.number}`,
    `Ticket Channel: ${channel.name}`,
    `Ticket Channel ID: ${channel.id}`,
    `Ticket Category: ${ticket.category}`,
    `Opened By: ${ticket.username}`,
    `Opened By ID: ${ticket.userId}`,
    `Claimed By: ${ticket.claimedBy || "Nobody"}`,
    `Created At: ${new Date(ticket.createdAt).toISOString()}`,
    `Closed At: ${
      ticket.closedAt
        ? new Date(ticket.closedAt).toISOString()
        : "Not recorded"
    }`,
    "",
    "========================================",
    "MESSAGES",
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

    for (const embed of message.embeds) {
      lines.push(
        `[EMBED] ${embed.title || "Untitled"}`
      );

      if (embed.description) {
        lines.push(embed.description);
      }
    }

    for (const attachment of message.attachments.values()) {
      lines.push(
        `[ATTACHMENT] ${attachment.url}`
      );
    }

    lines.push("");
  }

  return Buffer.from(
    lines.join("\n"),
    "utf8"
  );
}

// ==================================================
// DELETE TICKET
// ==================================================

async function deleteTicket(interaction) {
  const ticket = getTicket(interaction.channelId);

  if (!ticket) {
    await respond(
      interaction,
      "This channel is not a registered ticket."
    );
    return;
  }

  const member = await getMember(interaction);

  if (!hasTicketAccess(member)) {
    await respond(
      interaction,
      "Only authorized Chuppys staff can delete tickets."
    );
    return;
  }

  if (ticket.status !== "closed") {
    await respond(
      interaction,
      "Please close the ticket before deleting it."
    );
    return;
  }

  await interaction.deferReply({
    flags: MessageFlags.Ephemeral
  });

  const channel = interaction.channel;

  try {
    const transcriptBuffer =
      await createTicketTranscript(
        channel,
        ticket
      );

    const transcriptFile =
      new AttachmentBuilder(
        transcriptBuffer,
        {
          name:
            `chuppys-ticket-${ticket.number}.txt`
        }
      );

    if (TICKET_LOG_CHANNEL_ID) {
      const logChannel =
        await interaction.guild.channels
          .fetch(TICKET_LOG_CHANNEL_ID)
          .catch(() => null);

      if (
        !logChannel ||
        !logChannel.isTextBased() ||
        !logChannel.send
      ) {
        throw new Error(
          "Ticket log channel is unavailable."
        );
      }

      await logChannel.send({
        embeds: [
          makeEmbed(
            `${TICKET_EMOJI} Ticket Deleted`,
            `**Ticket:** ${ticket.number}\n` +
            `**Category:** ${ticket.category}\n` +
            `**Opened By:** <@${ticket.userId}>\n` +
            `**Claimed By:** ${
              ticket.claimedBy
                ? `<@${ticket.claimedBy}>`
                : "Nobody"
            }\n` +
            `**Deleted By:** <@${interaction.user.id}>`
          )
        ],
        files: [transcriptFile],
        allowedMentions: {
          parse: []
        }
      });
    } else {
      await interaction.followUp({
        content:
          "No ticket log channel is configured. " +
          "Download and save this transcript before proceeding.",
        files: [transcriptFile],
        flags: MessageFlags.Ephemeral
      });

      return;
    }

    await interaction.editReply({
      content:
        "Ticket transcript saved. Deleting ticket..."
    });

    await channel.delete(
      `Ticket deleted by ${interaction.user.tag}`
    );

    delete ticketData.tickets[channel.id];

    saveData();

    console.log(
      `[TICKETS] Ticket ${channel.id} deleted.`
    );
  } catch (error) {
    console.error(
      "[TICKETS] Ticket deletion failed:",
      error
    );

    await interaction.editReply({
      content:
        "The ticket could not be deleted. " +
        "Please check the bot permissions and transcript log channel."
    });
  }
}

// ==================================================
// TICKET INTERACTION HANDLER
// ==================================================

function setupChuppyTickets(client) {
  // ==================================================
  // READY EVENT
  // ==================================================

  client.once(Events.ClientReady, async () => {
    console.log(
      "[TICKETS] Chuppys ticket system is ready."
    );

    try {
      await sendOrUpdateTicketPanel(client);
    } catch (error) {
      console.error(
        "[TICKETS] Failed to initialize panel:",
        error
      );
    }
  });

  // ==================================================
  // INTERACTIONS
  // ==================================================

  client.on(
    Events.InteractionCreate,
    async interaction => {
      try {
        // ==========================================
        // /TICKETPANEL COMMAND
        // ==========================================

        if (
          interaction.isChatInputCommand() &&
          interaction.commandName === "ticketpanel"
        ) {
          if (
            !interaction.memberPermissions?.has(
              PermissionsBitField.Flags.ManageGuild
            )
          ) {
            await respond(
              interaction,
              "You need Manage Server permission to use this command."
            );

            return;
          }

          await interaction.deferReply({
            flags: MessageFlags.Ephemeral
          });

          await sendOrUpdateTicketPanel(client);

          await interaction.editReply({
            content:
              `${TICKET_EMOJI} Ticket panel updated in ` +
              `<#${TICKET_PANEL_CHANNEL_ID}>.`
          });

          return;
        }

        // ==========================================
        // TICKET DROPDOWN
        // ==========================================

        if (
          interaction.isStringSelectMenu() &&
          interaction.customId ===
            "chuppys_ticket_select"
        ) {
          const selectedCategory =
            interaction.values[0];

          await openTicket(
            interaction,
            selectedCategory
          );

          return;
        }

        // ==========================================
        // CLAIM BUTTON
        // ==========================================

        if (
          interaction.isButton() &&
          interaction.customId ===
            "chuppys_ticket_claim"
        ) {
          await claimTicket(interaction);
          return;
        }

        // ==========================================
        // CLOSE BUTTON
        // ==========================================

        if (
          interaction.isButton() &&
          interaction.customId ===
            "chuppys_ticket_close"
        ) {
          await closeTicket(interaction);
          return;
        }

        // ==========================================
        // REOPEN BUTTON
        // ==========================================

        if (
          interaction.isButton() &&
          interaction.customId ===
            "chuppys_ticket_reopen"
        ) {
          await reopenTicket(interaction);
          return;
        }

        // ==========================================
        // DELETE BUTTON
        // ==========================================

        if (
          interaction.isButton() &&
          interaction.customId ===
            "chuppys_ticket_delete"
        ) {
          await deleteTicket(interaction);
          return;
        }
      } catch (error) {
        console.error(
          "[TICKETS] Interaction error:",
          error
        );

        if (interaction.isRepliable()) {
          await respond(
            interaction,
            "Something went wrong while processing your ticket. " +
            "Please try again."
          ).catch(() => {});
        }
      }
    }
  );

  // ==================================================
  // REMOVE DATA FOR MANUALLY DELETED CHANNELS
  // ==================================================

  client.on(
    Events.ChannelDelete,
    channel => {
      if (!ticketData.tickets[channel.id]) {
        return;
      }

      delete ticketData.tickets[channel.id];

      try {
        saveData();
      } catch (error) {
        console.error(
          "[TICKETS] Failed to update deleted channel data:",
          error
        );
      }
    }
  );
}

// ==================================================
// EXPORTS
// ==================================================

module.exports = setupChuppyTickets;

module.exports.command = TICKET_PANEL_COMMAND;
